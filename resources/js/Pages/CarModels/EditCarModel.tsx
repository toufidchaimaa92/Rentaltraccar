import React from 'react';
import axios from 'axios';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Car, Settings, Fuel, DollarSign, Sliders, Star } from 'lucide-react';
import FileUploadDropzone from './Partials/FileUploadDropzone';

// ---------------- TYPES ----------------
interface CarModel {
  id: number;
  brand: string;
  model: string;
  fuel_type: string;
  price_per_day: number;
  transmission: string;
  finish: string;
  photos: { id: number; photo_path: string; order: number }[];
}

interface EditCarModelProps {
  auth: { user: any };
  errors: any;
  carModel: CarModel;
}

export default function EditCarModel({ auth, errors, carModel }: EditCarModelProps) {
  const { data, setData, processing } = useForm({
    brand: carModel.brand || '',
    model: carModel.model || '',
    fuel_type: ['Diesel', 'Essence', 'Hybride'].includes(carModel.fuel_type)
      ? carModel.fuel_type
      : 'Diesel',
    price_per_day: carModel.price_per_day || '',
    transmission: ['Automatique', 'Manuelle'].includes(carModel.transmission)
      ? carModel.transmission
      : 'Automatique',
    finish: carModel.finish || '',
    existingFiles: carModel.photos
      ? carModel.photos
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ id: p.id, url: `/storage/${p.photo_path}` }))
      : [],
    newFiles: [],
  });

  // -------- LABEL COMPONENT --------
  const LabelWithIcon = ({ icon: Icon, text, htmlFor }) => (
    <label htmlFor={htmlFor} className="flex items-center gap-2 mb-1 font-medium">
      <Icon className="h-4 w-4 text-primary" />
      {text}
    </label>
  );

  // -------- FILE HANDLERS --------
  const removeExisting = (id: number) =>
    setData('existingFiles', data.existingFiles.filter((f) => f.id !== id));

  const reorderExisting = (order) => setData('existingFiles', order);
  const reorderNew = (order) => setData('newFiles', order);

  // -------- SUBMIT --------
  const submit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append('_method', 'PATCH');
    formData.append('brand', data.brand);
    formData.append('model', data.model);
    formData.append('fuel_type', data.fuel_type);
    formData.append('price_per_day', String(data.price_per_day));
    formData.append('transmission', data.transmission);
    formData.append('finish', data.finish);

    data.existingFiles.forEach((file, idx) => {
      formData.append(`existing_images[${idx}]`, String(file.id));
    });

    data.newFiles.forEach((file, idx) => {
      formData.append(`photos[${idx}]`, file);
    });

    try {
      await axios.post(route('car-models.update', carModel.id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Modèle mis à jour avec succès !');
      router.visit(route('car-models.index'));
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Modifier ${carModel.brand} ${carModel.model}`} />

      {/* CARD */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Modifier le modèle
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">

            {/* Row 1 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="w-full">
                <LabelWithIcon icon={Car} text="Marque" htmlFor="brand" />
                <Input
                  id="brand"
                  value={data.brand}
                  onChange={(e) => setData('brand', e.target.value)}
                />
              </div>

              <div className="w-full">
                <LabelWithIcon icon={Settings} text="Modèle" htmlFor="model" />
                <Input
                  id="model"
                  value={data.model}
                  onChange={(e) => setData('model', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="w-full">
                <LabelWithIcon icon={Fuel} text="Carburant" htmlFor="fuel_type" />
                <Select
                  value={data.fuel_type}
                  onValueChange={(v) => setData('fuel_type', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Carburant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Essence">Essence</SelectItem>
                    <SelectItem value="Hybride">Hybride</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <LabelWithIcon icon={Sliders} text="Transmission" htmlFor="transmission" />
                <Select
                  value={data.transmission}
                  onValueChange={(v) => setData('transmission', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automatique">Automatique</SelectItem>
                    <SelectItem value="Manuelle">Manuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="w-full">
                <LabelWithIcon icon={Star} text="Finition" htmlFor="finish" />
                <Input
                  id="finish"
                  value={data.finish}
                  onChange={(e) => setData('finish', e.target.value)}
                />
              </div>

              <div className="w-full">
                <LabelWithIcon
                  icon={DollarSign}
                  text="Prix / jour (MAD)"
                  htmlFor="price_per_day"
                />
                <Input
                  id="price_per_day"
                  type="number"
                  value={data.price_per_day}
                  onChange={(e) => setData('price_per_day', e.target.value)}
                />
              </div>
            </div>

            {/* Photos */}
            <div className="w-full">
              <LabelWithIcon icon={Car} text="Photos du modèle" htmlFor="images" />
              <FileUploadDropzone
                existingFiles={data.existingFiles}
                onRemoveInitialFile={removeExisting}
                onReorderExisting={reorderExisting}
                files={data.newFiles}
                setFiles={(files) => setData('newFiles', files)}
                onReorderNew={reorderNew}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <Button type="submit" disabled={processing} className="w-full md:w-auto">
                Enregistrer les modifications
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
