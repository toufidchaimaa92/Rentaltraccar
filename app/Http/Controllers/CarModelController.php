<?php

namespace App\Http\Controllers;

use App\Models\CarModel;
use App\Models\CarModelPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CarModelController extends Controller
{
    public function index(Request $request)
    {
        $query = CarModel::query();

        if ($search = $request->string('search')->trim()) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('fuel_type', 'like', "%{$search}%")
                    ->orWhere('finish', 'like', "%{$search}%");
            });
        }

        if ($fuelType = $request->string('fuel_type')->trim()) {
            $query->where('fuel_type', 'like', "%{$fuelType}%");
        }

        if ($transmission = $request->string('transmission')->trim()) {
            $query->where('transmission', 'like', "%{$transmission}%");
        }

        $sort = $request->string('sort')->toString();
        $sortColumn = 'brand';
        $sortDirection = 'asc';

        if (preg_match('/^(brand|model|fuel_type|price_per_day|id)_(asc|desc)$/', $sort, $matches)) {
            $sortColumn = $matches[1];
            $sortDirection = $matches[2];
        }

        $carModels = $query
            ->with('photos')
            ->orderBy($sortColumn, $sortDirection)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('CarModels/IndexCarModels', [
            'carModels' => $carModels,
            'filters' => [
                'search' => $search,
                'fuel_type' => $fuelType,
                'transmission' => $transmission,
                'sort' => $sort,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('CarModels/CreateCarModel');
    }

    public function edit($id)
    {
        $carModel = CarModel::with('photos')->findOrFail($id);
        return Inertia::render('CarModels/EditCarModel', [
            'carModel' => $carModel
        ]);
    }

    public function show($id)
    {
        $carModel = CarModel::with(['photos', 'cars'])->findOrFail($id);
        return Inertia::render('CarModels/Show', [
            'carModel' => $carModel
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'fuel_type' => 'required|string|max:255',
            'price_per_day' => 'required|numeric',
            'transmission' => 'nullable|string|max:255',
            'finish' => 'nullable|string|max:255',
            'photos.*' => 'nullable|image|max:5120',
        ]);

        $carModel = CarModel::create($validated);

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $index => $photo) {
                $path = $photo->store('car_model_photos', 'public');

                CarModelPhoto::create([
                    'car_model_id' => $carModel->id,
                    'photo_path' => $path,
                    'order' => $index,
                ]);
            }
        }

        return redirect()->route('car-models.index')->with('success', 'Modèle créé avec succès');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'fuel_type' => 'required|string|max:255',
            'price_per_day' => 'required|numeric',
            'transmission' => 'nullable|string|max:255',
            'finish' => 'nullable|string|max:255',
            'photos.*' => 'nullable|image|max:5120',
            'existing_images.*' => 'nullable|integer|exists:car_model_photos,id',
        ]);

        $carModel = CarModel::with('photos')->findOrFail($id);
        $carModel->update(collect($validated)->except(['photos', 'existing_images'])->toArray());

        // Delete removed photos
        $existingImageIds = $request->input('existing_images', []);
        $imagesToDelete = $carModel->photos->whereNotIn('id', $existingImageIds);
        foreach ($imagesToDelete as $photo) {
            if (Storage::disk('public')->exists($photo->photo_path)) {
                Storage::disk('public')->delete($photo->photo_path);
            }
            $photo->delete();
        }

        // Update order of remaining photos
        foreach ($existingImageIds as $order => $photoId) {
            CarModelPhoto::where('id', $photoId)->update(['order' => $order]);
        }

        // Handle new uploads
        if ($request->hasFile('photos')) {
            $startingOrder = count($existingImageIds);
            foreach ($request->file('photos') as $index => $image) {
                $path = $image->store('car_model_photos', 'public');
                CarModelPhoto::create([
                    'car_model_id' => $carModel->id,
                    'photo_path' => $path,
                    'order' => $startingOrder + $index,
                ]);
            }
        }

        return redirect()->route('car-models.index')->with('success', 'Modèle mis à jour avec succès ✅');
    }

    public function destroy($id)
    {
        $carModel = CarModel::findOrFail($id);

        foreach ($carModel->photos as $photo) {
            Storage::disk('public')->delete($photo->photo_path);
            $photo->delete();
        }

        $carModel->delete();

        return redirect()->route('car-models.index')->with('success', 'Modèle supprimé avec succès');
    }

    public function storePhotos(Request $request, $id)
    {
        $carModel = CarModel::findOrFail($id);

        $request->validate([
            'photos.*' => 'required|image|max:5120',
            'orders' => 'array',
            'orders.*' => 'integer',
        ]);

        $photos = $request->file('photos');
        $orders = $request->input('orders', []);

        foreach ($photos as $index => $photo) {
            $path = $photo->store('car_model_photos', 'public');

            CarModelPhoto::create([
                'car_model_id' => $carModel->id,
                'photo_path' => $path,
                'order' => $orders[$index] ?? $index,
            ]);
        }

        return response()->json(['message' => 'Photos enregistrées avec succès ✅']);
    }
}
