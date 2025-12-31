<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ClientController extends Controller
{
    // 🔎 Affiche la liste des clients avec recherche backend
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'sort'   => ['nullable', 'string', 'max:50'],
        ]);

        $sortParam = $validated['sort'] ?? null;
        $sortBy = 'name';
        $sortDir = 'asc';

        if (is_string($sortParam)) {
            [$by, $dir] = array_pad(explode('_', $sortParam), 2, null);
            $allowed = [
                'name'    => 'name',
                'phone'   => 'phone',
                'rating'  => 'rating',
            ];

            if (isset($allowed[$by])) {
                $sortBy = $allowed[$by];
                $sortDir = $dir === 'asc' ? 'asc' : 'desc';
            }
        }

        $search = $validated['search'] ?? null;

        $clients = Client::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('license_number', 'like', "%{$search}%")
                        ->orWhere('identity_card_number', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortBy, $sortDir)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => [
                'search' => $search,
                'sort'   => $validated['sort'] ?? 'name_asc',
            ],
        ]);
    }

    // ➕ Formulaire de création
    public function create()
    {
        return Inertia::render('Clients/Create');
    }

    // 💾 Enregistre un nouveau client
    public function store(Request $request)
    {
        Log::debug('Client request data:', $request->all());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'identity_card_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'license_number' => 'nullable|string|max:50',
            'license_date' => 'nullable|date',
            'license_expiration_date' => 'nullable|date',
            'license_front_image' => 'nullable|string',
            'license_back_image' => 'nullable|string',
            'cin_front_image' => 'nullable|string',
            'cin_back_image' => 'nullable|string',
        ]);

        foreach (['license_front_image', 'license_back_image', 'cin_front_image', 'cin_back_image'] as $field) {
            if (!empty($validated[$field])) {
                $urlPath = parse_url($validated[$field], PHP_URL_PATH);
                $relativePath = ltrim(str_replace('/storage/', '', $urlPath), '/');

                if (Storage::disk('public')->exists($relativePath)) {
                    $filename = basename($relativePath);
                    $newPath = 'clients/' . $filename;

                    if (!Storage::disk('public')->exists('clients')) {
                        Storage::disk('public')->makeDirectory('clients');
                    }

                    Storage::disk('public')->move($relativePath, $newPath);
                    $validated[$field] = $newPath;
                }
            }
        }

        $client = Client::create($validated);

        return redirect()->route('clients.index')->with('success', 'Client créé avec succès.');
    }

    // 📷 Upload temporaire d'une image (AJAX)
    public function uploadTempImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('image')->store('temp_uploads', 'public');
        return response()->json(['path' => '/storage/' . $path]);
    }

    // 👁️ Affiche un client
    public function show(Client $client)
    {
        $client->load([
            'rentals' => fn($query) => $query->orderBy('created_at', 'desc')->with(['carModel', 'payments'])
        ]);
        return Inertia::render('Clients/Show', ['client' => $client]);
    }

    // ✏️ Formulaire d'édition
    public function edit(Client $client)
    {
        return Inertia::render('Clients/Edit', ['client' => $client]);
    }

    // 🔄 Mise à jour
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'identity_card_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'license_number' => 'nullable|string|max:50',
            'license_date' => 'nullable|date',
            'license_expiration_date' => 'nullable|date',
            'license_front_image' => 'nullable|string',
            'license_back_image' => 'nullable|string',
            'cin_front_image' => 'nullable|string',
            'cin_back_image' => 'nullable|string',
        ]);

        foreach (['license_front_image', 'license_back_image', 'cin_front_image', 'cin_back_image'] as $field) {
            if (!empty($validated[$field])) {
                $urlPath = parse_url($validated[$field], PHP_URL_PATH);
                $relativePath = ltrim(str_replace('/storage/', '', $urlPath), '/');

                if (str_contains($relativePath, 'temp_uploads') && Storage::disk('public')->exists($relativePath)) {
                    $filename = basename($relativePath);
                    $newPath = 'clients/' . $filename;

                    if (!Storage::disk('public')->exists('clients')) {
                        Storage::disk('public')->makeDirectory('clients');
                    }

                    Storage::disk('public')->move($relativePath, $newPath);
                    $validated[$field] = $newPath;
                }
            }
        }

        $client->update($validated);

        return redirect()->route('clients.index')->with('success', 'Client mis à jour avec succès.');
    }

    // 🗑️ Suppression
    public function destroy(Client $client)
    {
        foreach (['license_front_image', 'license_back_image', 'cin_front_image', 'cin_back_image'] as $field) {
            if (!empty($client->{$field}) && Storage::disk('public')->exists($client->{$field})) {
                Storage::disk('public')->delete($client->{$field});
            }
        }

        $client->delete();
        return redirect()->route('clients.index')->with('success', 'Client supprimé avec succès.');
    }

    // 👁️ Affiche toutes les locations d'un client
    public function rentals(Client $client)
    {
        $client->load([
            'client' => fn($query) => $query->orderBy('created_at', 'desc')->with(['carModel', 'payments'])
        ]);

        return Inertia::render('Clients/Rentals', ['client' => $client]);
    }
}