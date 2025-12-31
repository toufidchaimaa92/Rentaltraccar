<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentBackground;
use App\Services\DocumentBackgroundService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentBackgroundController extends Controller
{
    public function index()
    {
        $backgrounds = DocumentBackground::orderByDesc('created_at')->get()
            ->groupBy('type')
            ->map->values();

        $withUrls = $backgrounds->map(function ($items) {
            return $items->map(function (DocumentBackground $bg) {
                return [
                    'id' => $bg->id,
                    'type' => $bg->type,
                    'name' => $bg->name,
                    'file_path' => $bg->file_path,
                    'is_active' => $bg->is_active,
                    'created_at' => $bg->created_at,
                    'url' => Storage::disk('public')->url($bg->file_path),
                ];
            });
        });

        return Inertia::render('Admin/PdfTemplates/Index', [
            'backgrounds' => $withUrls,
            'types' => [
                ['value' => DocumentBackgroundService::TYPE_FACTURE, 'label' => 'Factures'],
                ['value' => DocumentBackgroundService::TYPE_CONTRAT, 'label' => 'Contrats'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:' . implode(',', [DocumentBackgroundService::TYPE_FACTURE, DocumentBackgroundService::TYPE_CONTRAT]),
            'name' => 'nullable|string|max:255',
            'file' => 'required|image|mimes:png,jpg,jpeg',
        ]);

        $count = DocumentBackground::where('type', $data['type'])->count();
        if ($count >= 2) {
            return back()->withErrors(['file' => 'Maximum 2 arrière-plans par type. Veuillez en supprimer un avant d\'en ajouter un nouveau.']);
        }

        $path = $request->file('file')->store('document_backgrounds', 'public');

        $background = DocumentBackground::create([
            'type' => $data['type'],
            'name' => $data['name'] ?? null,
            'file_path' => $path,
            'is_active' => false,
        ]);

        if (!DocumentBackgroundService::getActiveBackground($data['type'])) {
            $this->setActive($background);
        }

        return back()->with('success', 'Arrière-plan ajouté.');
    }

    public function activate(DocumentBackground $documentBackground)
    {
        $this->setActive($documentBackground);

        return back()->with('success', 'Arrière-plan défini comme actif.');
    }

    public function destroy(DocumentBackground $documentBackground)
    {
        $type = $documentBackground->type;
        $wasActive = $documentBackground->is_active;

        Storage::disk('public')->delete($documentBackground->file_path);
        $documentBackground->delete();

        if ($wasActive) {
            $next = DocumentBackground::where('type', $type)->latest()->first();
            if ($next) {
                $this->setActive($next);
            }
        }

        return back()->with('success', 'Arrière-plan supprimé.');
    }

    protected function setActive(DocumentBackground $background): void
    {
        DB::transaction(function () use ($background) {
            DocumentBackground::where('type', $background->type)
                ->where('id', '!=', $background->id)
                ->update(['is_active' => false]);

            $background->is_active = true;
            $background->save();
        });
    }
}
