<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CarBenefitsAnalyzeCommand extends Command
{
    protected $signature = 'car-benefits:analyze {--list= : Optional list output (unsafe|partial)}';
    protected $description = 'Analyze short-term rentals for historical car benefits backfill eligibility (read-only).';

    public function handle(): int
    {
        $windowStart = Carbon::now()->subMonths(10)->startOfDay()->toDateString();

        $base = DB::table('rentals')
            ->where('rental_type', '!=', 'long_term')
            ->whereDate('start_date', '>=', $windowStart);

        $total = (clone $base)->count();

        $unsafeIds = $this->unsafeQuery($base)->select('id');
        $unsafeCount = DB::query()->fromSub($unsafeIds, 'u')->count();

        $safeIds = $this->safeQuery($base, $unsafeIds)->select('id');
        $safeCount = DB::query()->fromSub($safeIds, 's')->count();

        $partialIds = $this->partialQuery($base, $unsafeIds, $safeIds)->select('id');
        $partialCount = DB::query()->fromSub($partialIds, 'p')->count();

        $this->line('Car Benefits Historical Analysis (last 10 months)');
        $this->line('');
        $this->line("Total rentals: {$total}");
        $this->line("SAFE: {$safeCount}");
        $this->line("PARTIAL: {$partialCount}");
        $this->line("UNSAFE: {$unsafeCount}");

        $list = $this->option('list');
        if ($list) {
            $this->line('');
            if ($list === 'unsafe') {
                $this->outputList('UNSAFE rentals', $this->loadRentals($unsafeIds), 'unsafe');
            } elseif ($list === 'partial') {
                $this->outputList('PARTIAL rentals', $this->loadRentals($partialIds), 'partial');
            } else {
                $this->warn('Unknown list option. Use --list=unsafe or --list=partial');
            }
        }

        return Command::SUCCESS;
    }

    private function unsafeQuery($base)
    {
        $today = Carbon::today()->toDateString();

        return (clone $base)
            ->where(function ($q) use ($today) {
                $q->whereIn('status', ['active', 'pending', 'confirmed', 'cancelled'])
                    ->orWhereNull('end_date')
                    ->orWhereNull('car_id')
                    ->orWhere(function ($q2) use ($today) {
                        $q2->whereDate('end_date', '<', $today)
                            ->where('status', '!=', 'completed');
                    })
                    ->orWhereExists(function ($q3) {
                        $q3->select(DB::raw(1))
                            ->from('rental_car_changes as c')
                            ->whereColumn('c.rental_id', 'rentals.id')
                            ->where(function ($q4) {
                                $q4->whereColumn('c.change_date', '<', 'rentals.start_date')
                                    ->orWhereColumn('c.change_date', '>', 'rentals.end_date')
                                    ->orWhereNull('rentals.end_date');
                            });
                    });
            });
    }

    private function safeQuery($base, $unsafeIds)
    {
        return (clone $base)
            ->where('status', 'completed')
            ->whereNotNull('car_id')
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->whereNotNull('pickup_time')
            ->whereNotNull('return_time')
            ->whereNotIn('id', $unsafeIds)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('rental_car_changes as c')
                    ->whereColumn('c.rental_id', 'rentals.id');
            })
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('rental_extensions as e')
                    ->whereColumn('e.rental_id', 'rentals.id');
            })
            ->whereNotNull('days')
            ->whereRaw("
                CEILING(
                    TIMESTAMPDIFF(
                        MINUTE,
                        CONCAT(start_date, ' ', pickup_time),
                        CONCAT(end_date, ' ', return_time)
                    ) / 1440
                ) = days
            ");
    }

    private function partialQuery($base, $unsafeIds, $safeIds)
    {
        return (clone $base)
            ->where('status', 'completed')
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->whereNotIn('id', $unsafeIds)
            ->whereNotIn('id', $safeIds)
            ->where(function ($q) {
                $q->whereExists(function ($q2) {
                    $q2->select(DB::raw(1))
                        ->from('rental_car_changes as c')
                        ->whereColumn('c.rental_id', 'rentals.id');
                })
                ->orWhereExists(function ($q2) {
                    $q2->select(DB::raw(1))
                        ->from('rental_extensions as e')
                        ->whereColumn('e.rental_id', 'rentals.id');
                })
                ->orWhereNull('days')
                ->orWhereRaw("
                    CEILING(
                        TIMESTAMPDIFF(
                            MINUTE,
                            CONCAT(start_date, ' ', pickup_time),
                            CONCAT(end_date, ' ', return_time)
                        ) / 1440
                    ) != days
                ");
            });
    }

    private function loadRentals($idQuery): Collection
    {
        return DB::table('rentals')
            ->whereIn('id', $idQuery)
            ->select(
                'id',
                'status',
                'car_id',
                'start_date',
                'pickup_time',
                'end_date',
                'return_time',
                'days'
            )
            ->orderBy('id')
            ->get();
    }

    private function outputList(string $title, Collection $rentals, string $type): void
    {
        $this->line($title . ':');

        foreach ($rentals as $rental) {
            $reasons = $this->classificationReasons($rental, $type);
            $reasonText = $reasons ? ' (' . implode(', ', $reasons) . ')' : '';
            $this->line("- Rental #{$rental->id}{$reasonText}");
        }
    }

    private function classificationReasons($rental, string $type): array
    {
        $reasons = [];
        $today = Carbon::today()->toDateString();

        if ($type === 'unsafe') {
            if (in_array($rental->status, ['active', 'pending', 'confirmed', 'cancelled'], true)) {
                $reasons[] = "status={$rental->status}";
            }
            if (!$rental->car_id) {
                $reasons[] = 'missing car_id';
            }
            if (!$rental->end_date) {
                $reasons[] = 'missing end_date';
            }
            if ($rental->end_date && $rental->status !== 'completed' && $rental->end_date < $today) {
                $reasons[] = 'overdue';
            }
        }

        if ($type === 'partial') {
            if (DB::table('rental_car_changes')->where('rental_id', $rental->id)->exists()) {
                $reasons[] = 'car change';
            }
            if (DB::table('rental_extensions')->where('rental_id', $rental->id)->exists()) {
                $reasons[] = 'extension';
            }

            if ($rental->days === null) {
                $reasons[] = 'missing days';
            } else {
                $start = Carbon::parse($rental->start_date.' '.$rental->pickup_time);
                $end   = Carbon::parse($rental->end_date.' '.$rental->return_time);

                $expected = max(1, (int) ceil($start->diffInMinutes($end) / 1440));

                if ((int) $rental->days !== $expected) {
                    $reasons[] = 'days mismatch';
                }
            }
        }

        return $reasons;
    }
}
