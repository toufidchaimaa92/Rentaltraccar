<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CarBenefitsBackfillCommand extends Command
{
    protected $signature = 'car-benefits:backfill {--safe-only : Backfill only SAFE rentals}';
    protected $description = 'Backfill car_benefits for SAFE short-term rentals only';

    public function handle(): int
    {
        if (!$this->option('safe-only')) {
            $this->error('You must use --safe-only to run this command.');
            return Command::FAILURE;
        }

        $windowStart = Carbon::now()->subMonths(10)->startOfDay()->toDateString();

        $this->info('Starting SAFE car benefits backfill (last 10 months)...');

        DB::beginTransaction();

        try {
            $safeRentals = DB::table('rentals')
                ->where('rental_type', '!=', 'long_term')
                ->where('status', 'completed')
                ->whereNotNull('car_id')
                ->whereNotNull('start_date')
                ->whereNotNull('end_date')
                ->whereNotNull('pickup_time')
                ->whereNotNull('return_time')
                ->whereNotNull('days')
                ->whereDate('start_date', '>=', $windowStart)

                // ❌ no car changes
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('rental_car_changes as c')
                        ->whereColumn('c.rental_id', 'rentals.id');
                })

                // ❌ no extensions
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('rental_extensions as e')
                        ->whereColumn('e.rental_id', 'rentals.id');
                })

                // ✅ correct 24h-based days
                ->whereRaw("
                    CEILING(
                        TIMESTAMPDIFF(
                            MINUTE,
                            CONCAT(start_date, ' ', pickup_time),
                            CONCAT(end_date, ' ', return_time)
                        ) / 1440
                    ) = days
                ")

                ->select([
                    'id',
                    'car_id',
                    'start_date',
                    'end_date',
                    'days',
                    'total_price',
                    'manual_total',
                ])
                ->orderBy('id')
                ->get();

            $count = 0;

            foreach ($safeRentals as $rental) {
                $amount = $rental->manual_total ?? $rental->total_price;

                if ($amount <= 0) {
                    continue; // safety guard
                }

                // Idempotent: remove existing benefit
                DB::table('car_benefits')
                    ->where('rental_id', $rental->id)
                    ->delete();

                DB::table('car_benefits')->insert([
                    'car_id'     => $rental->car_id,
                    'rental_id'  => $rental->id,
                    'amount'     => $amount,
                    'start_date' => $rental->start_date,
                    'end_date'   => $rental->end_date,
                    'days'       => $rental->days,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $count++;
            }

            DB::commit();

            $this->info("✅ Backfill completed successfully.");
            $this->info("✔ car_benefits created: {$count}");

            return Command::SUCCESS;

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('❌ Backfill failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
