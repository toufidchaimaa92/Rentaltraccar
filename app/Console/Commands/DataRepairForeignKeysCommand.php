<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DataRepairForeignKeysCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:repair-fk
        {--mode=placeholder : How orphans should be handled: placeholder|delete}
        {--dry-run : Show the actions that would be performed without making changes}
    ';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Repair missing foreign key references after importing data dumps.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $mode = strtolower((string) $this->option('mode'));

        if (! in_array($mode, ['placeholder', 'delete'], true)) {
            $this->error('Invalid mode provided. Use "placeholder" (default) or "delete".');

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $relationships = $this->foreignKeyRelations();

        if ($relationships->isEmpty()) {
            $this->info('No foreign key relationships were detected for the current database.');

            return self::SUCCESS;
        }

        $this->info(sprintf('Scanning %d foreign key relationship(s)...', $relationships->count()));

        $rows = [];

        foreach ($relationships as $relation) {
            $missingParentIds = $this->findMissingParentIds($relation);
            $row = [
                'child' => sprintf('%s.%s', $relation['child_table'], $relation['child_column']),
                'parent' => sprintf('%s.%s', $relation['parent_table'], $relation['parent_column']),
                'action' => 'None',
                'details' => 'No missing references',
            ];

            if ($missingParentIds->isEmpty()) {
                $rows[] = $row;

                continue;
            }

            if ($mode === 'delete') {
                $deleted = $this->deleteOrphans($relation, $dryRun);
                $row['action'] = $dryRun ? 'Would delete' : 'Deleted';
                $row['details'] = sprintf('%d orphan row(s) removed', $deleted);
            } else {
                $inserted = $this->createPlaceholders($relation, $missingParentIds, $dryRun);
                $row['action'] = $dryRun ? 'Would insert' : 'Inserted';
                $row['details'] = sprintf('%d placeholder parent row(s) added', $inserted);
            }

            $rows[] = $row;
        }

        $this->table(['Child FK', 'Parent PK', 'Action', 'Details'], $rows);

        if ($dryRun) {
            $this->info('Dry run complete — no database changes were made.');
        }

        return self::SUCCESS;
    }

    private function foreignKeyRelations(): Collection
    {
        $rawRelations = DB::select(
            'SELECT
                kcu.TABLE_NAME as child_table,
                kcu.COLUMN_NAME as child_column,
                kcu.REFERENCED_TABLE_NAME as parent_table,
                kcu.REFERENCED_COLUMN_NAME as parent_column
            FROM information_schema.KEY_COLUMN_USAGE kcu
            WHERE kcu.CONSTRAINT_SCHEMA = DATABASE()
                AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME'
        );

        return collect($rawRelations)->map(fn ($relation) => [
            'child_table' => $relation->child_table,
            'child_column' => $relation->child_column,
            'parent_table' => $relation->parent_table,
            'parent_column' => $relation->parent_column,
        ]);
    }

    private function findMissingParentIds(array $relation): Collection
    {
        return DB::table($relation['child_table'])
            ->select($relation['child_column'])
            ->whereNotNull($relation['child_column'])
            ->whereNotExists(function ($query) use ($relation) {
                $query->select(DB::raw(1))
                    ->from($relation['parent_table'])
                    ->whereColumn(
                        $relation['parent_table'].'.'.$relation['parent_column'],
                        $relation['child_table'].'.'.$relation['child_column']
                    );
            })
            ->distinct()
            ->pluck($relation['child_column']);
    }

    private function deleteOrphans(array $relation, bool $dryRun): int
    {
        if ($dryRun) {
            return DB::table($relation['child_table'])
                ->whereNotNull($relation['child_column'])
                ->whereNotExists(function ($query) use ($relation) {
                    $query->select(DB::raw(1))
                        ->from($relation['parent_table'])
                        ->whereColumn(
                            $relation['parent_table'].'.'.$relation['parent_column'],
                            $relation['child_table'].'.'.$relation['child_column']
                        );
                })
                ->count();
        }

        return DB::table($relation['child_table'])
            ->whereNotNull($relation['child_column'])
            ->whereNotExists(function ($query) use ($relation) {
                $query->select(DB::raw(1))
                    ->from($relation['parent_table'])
                    ->whereColumn(
                        $relation['parent_table'].'.'.$relation['parent_column'],
                        $relation['child_table'].'.'.$relation['child_column']
                    );
            })
            ->delete();
    }

    private function createPlaceholders(array $relation, Collection $missingParentIds, bool $dryRun): int
    {
        $inserted = 0;

        foreach ($missingParentIds as $parentId) {
            $columns = $this->columnsForTable($relation['parent_table']);
            $payload = $this->placeholderPayload($columns, $relation['parent_column'], $parentId);

            if ($dryRun) {
                $inserted++;

                continue;
            }

            $alreadyExists = DB::table($relation['parent_table'])
                ->where($relation['parent_column'], $parentId)
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            DB::table($relation['parent_table'])->insert($payload);
            $inserted++;
        }

        return $inserted;
    }

    private function columnsForTable(string $table): Collection
    {
        $columns = DB::select(
            'SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION',
            [$table]
        );

        return collect($columns)->map(fn ($column) => [
            'name' => $column->COLUMN_NAME,
            'type' => $column->DATA_TYPE,
            'default' => $column->COLUMN_DEFAULT,
            'nullable' => $column->IS_NULLABLE === 'YES',
        ]);
    }

    private function placeholderPayload(Collection $columns, string $parentColumn, string|int $parentId): array
    {
        $payload = [
            $parentColumn => $parentId,
        ];

        foreach ($columns as $column) {
            if ($column['name'] === $parentColumn) {
                continue;
            }

            if ($column['default'] !== null || $column['nullable']) {
                continue;
            }

            $payload[$column['name']] = $this->placeholderValue($column['type']);
        }

        return $payload;
    }

    private function placeholderValue(string $dataType): mixed
    {
        return match (true) {
            Str::contains($dataType, ['int', 'decimal', 'double', 'float']) => 0,
            Str::contains($dataType, ['json']) => '[]',
            Str::contains($dataType, ['date', 'time']) => Carbon::now(),
            default => 'Placeholder',
        };
    }
}
