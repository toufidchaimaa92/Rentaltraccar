<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Artisan;

Artisan::command('schedule:debug', function (Schedule $schedule): void {
    $events = collect($schedule->events());

    if ($events->isEmpty()) {
        $this->info('No scheduled events have been registered.');

        return;
    }

    $this->table(['Command', 'Expression'], $events->map(fn ($event) => [
        $event->command ?? $event->description ?? 'closure',
        $event->expression,
    ]));
})->purpose('List the currently registered schedule entries');
