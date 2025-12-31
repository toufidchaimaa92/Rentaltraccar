import React, { useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, User, Phone, CreditCard, Home, ScrollText } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';

// ✅ use your reusable uploader
import FileUpload from '@/components/FileUpload';

interface FormData {
  name: string;
  phone: string;
  address: string;
  identity_card_number: string;
  license_number: string;
  license_date: string;
  license_expiration_date: string;

  // 👇 match controller fields
  license_front_image: string;
  license_back_image: string;
  cin_front_image: string;
  cin_back_image: string;
}

interface FormErrors {
  [key: string]: string | undefined;
  name?: string;
  phone?: string;
  address?: string;
  identity_card_number?: string;
  license_number?: string;
  license_date?: string;
  license_expiration_date?: string;
  license_front_image?: string;
  license_back_image?: string;
  cin_front_image?: string;
  cin_back_image?: string;
  general?: string;
}

export default function CreateClient({ auth }: { auth: { user: any } }) {
  const { data, setData, post, processing, errors, setError, clearErrors } = useForm<FormData, FormErrors>({
    name: '',
    phone: '',
    address: '',
    identity_card_number: '',
    license_number: '',
    license_date: '',
    license_expiration_date: '',

    // paths returned from temp uploader
    license_front_image: '',
    license_back_image: '',
    cin_front_image: '',
    cin_back_image: '',
  });

  const [licenseDateOpen, setLicenseDateOpen] = useState(false);
  const [licenseExpirationDateOpen, setLicenseExpirationDateOpen] = useState(false);
  const [captionLayout] = useState<'dropdown' | 'buttons' | undefined>('dropdown');

  const licenseDate = data.license_date ? new Date(data.license_date) : undefined;
  const licenseExpirationDate = data.license_expiration_date ? new Date(data.license_expiration_date) : undefined;

  // small helper to safely pull the path from FileUpload result
  const firstPath = (items: any[]) => {
    // Your FileUpload stores server JSON in items[i].response
    // uploadTempImage returns: { path: '/storage/...'}
    const r = items?.[0]?.response;
    return r?.path || r?.url || '';
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();

    // Optional: simple guard to ensure images are uploaded first
    // (not required if images are optional)
    // if (!data.license_front_image || !data.license_back_image) {
    //   setError('general', 'Veuillez téléverser les photos du permis.');
    //   return;
    // }

    post(route('clients.store'), {
      preserveScroll: true,
      onSuccess: () => {
        window.location.href = route('clients.index');
      },
      onError: (inertiaErrors: FormErrors) => {
        setError(inertiaErrors);
      },
    });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Créer un client" />

      <div className="w-full px-1 sm:px-4 py-6 max-w-7xl mx-auto">
        <Card className="rounded-lg shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-center text-2xl font-bold w-full">Créer un client</CardTitle>
            <Button asChild variant="outline">
              <a href={route('clients.index')}>Retour</a>
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 mt-6">
                {errors.general && <p className="text-red-500 text-sm mt-1 text-center">{errors.general}</p>}

                {/* Ligne 1 : Nom + Téléphone */}
                <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
                  <div className="w-full lg:w-1/2">
                    <label className="block mb-1 font-medium flex items-center">
                      <User className="mr-2 h-4 w-4" />Nom complet
                    </label>
                    <Input
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      required
                      className="w-full"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div className="w-full lg:w-1/2">
                    <label className="block mb-1 font-medium flex items-center">
                      <Phone className="mr-2 h-4 w-4" />Téléphone
                    </label>
                    <PhoneInput
                      value={data.phone}
                      onChange={(value: string) => setData('phone', value || '')}
                      placeholder="Téléphone"
                      defaultCountry="MA"
                      required
                      className="w-full"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Ligne 2 : CIN + Adresse */}
                <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
                  <div className="w-full lg:w-1/2">
                    <label className="block mb-1 font-medium flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />Numéro de carte d'identité
                    </label>
                    <Input
                      value={data.identity_card_number}
                      onChange={(e) => setData('identity_card_number', e.target.value)}
                      className="w-full"
                    />
                    {errors.identity_card_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.identity_card_number}</p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/2">
                    <label className="block mb-1 font-medium flex items-center">
                      <Home className="mr-2 h-4 w-4" />Adresse
                    </label>
                    <Input
                      value={data.address}
                      onChange={(e) => setData('address', e.target.value)}
                      className="w-full"
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>
                </div>

                {/* Ligne 3: N° permis + Date délivrance + Date expiration */}
                <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
                  <div className="w-full lg:w-1/3">
                    <label className="block mb-1 font-medium flex items-center">
                      <ScrollText className="mr-2 h-4 w-4" />Numéro de permis
                    </label>
                    <Input
                      value={data.license_number}
                      onChange={(e) => setData('license_number', e.target.value)}
                      className="w-full"
                    />
                    {errors.license_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.license_number}</p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/3">
                    <label className="block mb-1 font-medium flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />Date de délivrance du permis
                    </label>
                    <Popover open={licenseDateOpen} onOpenChange={setLicenseDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" type="button">
                          {data.license_date
                            ? new Date(data.license_date).toLocaleDateString('fr-FR')
                            : 'Sélectionnez une date'}
                          <CalendarIcon className="ml-2 h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          defaultMonth={licenseDate}
                          selected={licenseDate}
                          onSelect={(date: Date | undefined) => {
                            if (date) setData('license_date', date.toISOString().split('T')[0]);
                            setLicenseDateOpen(false);
                          }}
                          captionLayout={captionLayout}
                          className="rounded-lg border shadow-sm"
                          disabled={(date: Date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.license_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.license_date}</p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/3">
                    <label className="block mb-1 font-medium flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />Date d'expiration du permis
                    </label>
                    <Popover open={licenseExpirationDateOpen} onOpenChange={setLicenseExpirationDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" type="button">
                          {data.license_expiration_date
                            ? new Date(data.license_expiration_date).toLocaleDateString('fr-FR')
                            : 'Sélectionnez une date'}
                          <CalendarIcon className="ml-2 h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          defaultMonth={licenseExpirationDate}
                          selected={licenseExpirationDate}
                          onSelect={(date: Date | undefined) => {
                            if (date) setData('license_expiration_date', date.toISOString().split('T')[0]);
                            setLicenseExpirationDateOpen(false);
                          }}
                          captionLayout="dropdown"
                          fromYear={2024}
                          toYear={2035}
                          className="rounded-lg border shadow-sm"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.license_expiration_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.license_expiration_date}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaders (Shadcn + progress) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Permis recto */}
                <div>
                  <label className="block mb-1 font-medium">Photo avant du permis</label>
                  <FileUpload
                    action={route('clients.uploadTempImage')}
                    fieldName="image"
                    multiple={false}
                    accept="image/*"
                    maxSizeMB={5}
                    label="Cliquez ou glissez l'image (JPEG/PNG/WebP)"
                    onComplete={(items) => {
                      const p = firstPath(items);
                      if (p) setData('license_front_image', p);
                    }}
                  />
                  {data.license_front_image && (
                    <p className="text-xs text-muted-foreground mt-1">Fichier: {data.license_front_image}</p>
                  )}
                  {errors.license_front_image && (
                    <p className="text-red-500 text-sm mt-1">{errors.license_front_image}</p>
                  )}
                </div>

                {/* Permis verso */}
                <div>
                  <label className="block mb-1 font-medium">Photo arrière du permis</label>
                  <FileUpload
                    action={route('clients.uploadTempImage')}
                    fieldName="image"
                    multiple={false}
                    accept="image/*"
                    maxSizeMB={5}
                    label="Cliquez ou glissez l'image (JPEG/PNG/WebP)"
                    onComplete={(items) => {
                      const p = firstPath(items);
                      if (p) setData('license_back_image', p);
                    }}
                  />
                  {data.license_back_image && (
                    <p className="text-xs text-muted-foreground mt-1">Fichier: {data.license_back_image}</p>
                  )}
                  {errors.license_back_image && (
                    <p className="text-red-500 text-sm mt-1">{errors.license_back_image}</p>
                  )}
                </div>

                {/* CIN recto */}
                <div>
                  <label className="block mb-1 font-medium">Photo avant de la carte d'identité</label>
                  <FileUpload
                    action={route('clients.uploadTempImage')}
                    fieldName="image"
                    multiple={false}
                    accept="image/*"
                    maxSizeMB={5}
                    label="Cliquez ou glissez l'image (JPEG/PNG/WebP)"
                    onComplete={(items) => {
                      const p = firstPath(items);
                      if (p) setData('cin_front_image', p);
                    }}
                  />
                  {data.cin_front_image && (
                    <p className="text-xs text-muted-foreground mt-1">Fichier: {data.cin_front_image}</p>
                  )}
                  {errors.cin_front_image && (
                    <p className="text-red-500 text-sm mt-1">{errors.cin_front_image}</p>
                  )}
                </div>

                {/* CIN verso */}
                <div>
                  <label className="block mb-1 font-medium">Photo arrière de la carte d'identité</label>
                  <FileUpload
                    action={route('clients.uploadTempImage')}
                    fieldName="image"
                    multiple={false}
                    accept="image/*"
                    maxSizeMB={5}
                    label="Cliquez ou glissez l'image (JPEG/PNG/WebP)"
                    onComplete={(items) => {
                      const p = firstPath(items);
                      if (p) setData('cin_back_image', p);
                    }}
                  />
                  {data.cin_back_image && (
                    <p className="text-xs text-muted-foreground mt-1">Fichier: {data.cin_back_image}</p>
                  )}
                  {errors.cin_back_image && (
                    <p className="text-red-500 text-sm mt-1">{errors.cin_back_image}</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={processing}
                  className="max-w-md"
                >
                  Créer le client
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
