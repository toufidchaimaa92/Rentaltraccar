<?php

namespace App\Services;

use App\Models\DocumentBackground;
use Illuminate\Support\Facades\Storage;

class DocumentBackgroundService
{
    public const TYPE_FACTURE = 'facture';
    public const TYPE_CONTRAT = 'contrat';

    public static function getActiveBackground(?string $type): ?DocumentBackground
    {
        if (!$type) {
            return null;
        }

        return DocumentBackground::where('type', $type)
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
    }

    public static function getDataUriFor(?string $type): ?string
    {
        $background = self::getActiveBackground($type);
        if (!$background) {
            return null;
        }

        $disk = Storage::disk('public');
        if (!$disk->exists($background->file_path)) {
            return null;
        }

        $path = $disk->path($background->file_path);
        $mime = mime_content_type($path) ?: 'image/png';
        $data = @file_get_contents($path);

        if ($data === false) {
            return null;
        }

        return 'data:' . $mime . ';base64,' . base64_encode($data);
    }
}
