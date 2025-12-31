import React from 'react';
import { Head, useForm } from '@inertiajs/react';
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

import {
  Car,
  Settings,
  Fuel,
  DollarSign,
  Sliders,
  Star,
  PlusCircle,
} from 'lucide-react';

import FileUploadDropzone from './Partials/FileUploadDropzone';

export default function CreateCarModel({ auth, errors }) {
  const { data, setData, post, processing, reset } = useForm({
    brand: '',
    model: '',
    fuel_type: '',
    price_per_day: '',
    transmission: '',
    finish: '',
    photos: [],
  });

  const submit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key !== 'photos') formData.append(key, data[key]);
    });
    data.photos.forEach((p) => formData.append('photos[]', p));

    post(route('car-models.store'), {
      data: formData,
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        toast.success('Modèle créé avec succès !');
      },
      onError: () => toast.error('Erreur lors de la création du modèle'),
    });
  };

  const LabelWithIcon = ({ icon: Icon, text, htmlFor }) => (
    <label htmlFor={htmlFor} className="flex items-center gap-2 mb-1 font-medium">
      <Icon className="h-4 w-4 text-primary" />
      {text}
    </label>
  );

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Créer un modèle de voiture" />


      {/* ========= FORM CARD ========= */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Informations du modèle
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
                  onChange={(e) => setData("brand", e.target.value)}
                  placeholder="ex. Toyota"
                />
                {errors.brand && <p className="text-red-600 text-sm">{errors.brand}</p>}
              </div>

              <div className="w-full">
                <LabelWithIcon icon={Settings} text="Modèle" htmlFor="model" />
                <Input
                  id="model"
                  value={data.model}
                  onChange={(e) => setData("model", e.target.value)}
                  placeholder="ex. Corolla"
                />
                {errors.model && <p className="text-red-600 text-sm">{errors.model}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="w-full">
                <LabelWithIcon icon={Fuel} text="Carburant" htmlFor="fuel_type" />
                <Select value={data.fuel_type} onValueChange={(v) => setData("fuel_type", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Essence">Essence</SelectItem>
                    <SelectItem value="Hybride">Hybride</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fuel_type && <p className="text-red-600 text-sm">{errors.fuel_type}</p>}
              </div>

              <div className="w-full">
                <LabelWithIcon icon={Sliders} text="Transmission" htmlFor="transmission" />
                <Select value={data.transmission} onValueChange={(v) => setData("transmission", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automatique">Automatique</SelectItem>
                    <SelectItem value="Manuelle">Manuelle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transmission && (
                  <p className="text-red-600 text-sm">{errors.transmission}</p>
                )}
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="w-full">
                <LabelWithIcon icon={Star} text="Finition" htmlFor="finish" />
                <Input
                  id="finish"
                  value={data.finish}
                  onChange={(e) => setData("finish", e.target.value)}
                  placeholder="ex. Luxe, Sport"
                />
                {errors.finish && <p className="text-red-600 text-sm">{errors.finish}</p>}
              </div>

              <div className="w-full">
                <LabelWithIcon icon={DollarSign} text="Prix / jour (MAD)" htmlFor="price_per_day" />
                <Input
                  id="price_per_day"
                  type="number"
                  value={data.price_per_day}
                  onChange={(e) => setData("price_per_day", e.target.value)}
                  placeholder="ex. 300"
                />
                {errors.price_per_day && (
                  <p className="text-red-600 text-sm">{errors.price_per_day}</p>
                )}
              </div>
            </div>

            {/* Photos */}
            <div className="w-full">
              <LabelWithIcon icon={Car} text="Photos du modèle" htmlFor="photos" />
              <FileUploadDropzone
                files={data.photos}
                setFiles={(files) => setData("photos", files)}
              />
              {errors.photos && (
                <p className="text-red-600 text-sm mt-1">{errors.photos}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <Button type="submit" disabled={processing} className="w-full md:w-auto">
                Créer le modèle
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>

    </AuthenticatedLayout>
  );
}
