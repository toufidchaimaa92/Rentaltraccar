import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';

// ✅ Reusable uploader with progress
import FileUpload from '@/components/FileUpload';

type Client = {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  identity_card_number?: string | null;
  license_number?: string | null;
  license_date?: string | null;
  license_expiration_date?: string | null;
  license_front_image?: string | null; // stored path like 'clients/xyz.jpg' OR '/storage/...'
  license_back_image?: string | null;
  cin_front_image?: string | null;
  cin_back_image?: string | null;
};

export default function EditClient({ auth, client }: { auth: { user: any }, client: Client }) {
  const { data, setData, put, processing, errors, clearErrors, setError } = useForm({
    name: client.name || '',
    phone: client.phone || '',
    address: client.address || '',
    identity_card_number: client.identity_card_number || '',
    license_number: client.license_number || '',
    license_date: client.license_date || '',
    license_expiration_date: client.license_expiration_date || '',

    // 👇 we now send STRINGS for image paths (not files)
    license_front_image: client.license_front_image || '',
    license_back_image: client.license_back_image || '',
    cin_front_image: client.cin_front_image || '',
    cin_back_image: client.cin_back_image || '',
  });

  const [licenseDateOpen, setLicenseDateOpen] = useState(false);
  const [licenseExpirationDateOpen, setLicenseExpirationDateOpen] = useState(false);
  const [captionLayout] = useState<'dropdown' | 'buttons' | undefined>('dropdown');

  const licenseDate = data.license_date ? new Date(data.license_date) : undefined;
  const licenseExpirationDate = data.license_expiration_date ? new Date(data.license_expiration_date) : undefined;

  // Normalize any stored path to a usable preview URL
  const previewUrl = (path?: string | null) => {
    if (!path) return null;
    // if backend gave '/storage/...' keep it; else assume it's a disk path like 'clients/..'
    return path.startsWith('/storage/') ? path : `/storage/${path}`;
    // adjust if you store absolute URLs
  };

  // Helper to grab returned temp path from FileUpload items
  const firstPath = (items: any[]) => {
    const r = items?.[0]?.response;
    return r?.path || r?.url || '';
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // we’re sending only strings, so no need for forceFormData
    put(route('clients.update', client.id), {
      preserveScroll: true,
      onSuccess: () => {
        window.location.href = route('clients.index');
      },
      onError: (errs) => setError(errs as any),
    });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Modifier le client" />
      <div className="w-full px-1 sm:px-4 py-6 max-w-7xl mx-auto">
        <Card className="rounded-lg shadow">
          <CardHeader>
            <CardTitle className="text-left text-2xl font-bold">Modifier le client</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  <div>
                    <label className="block mb-1 font-medium">Nom complet</label>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Téléphone</label>
                    <PhoneInput
                      value={data.phone}
                      onChange={(value) => setData('phone', value || '')}
                      defaultCountry="MA"
                      required
                    />
                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Adresse</label>
                    <Input value={data.address ?? ''} onChange={(e) => setData('address', e.target.value)} />
                    {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Numéro de carte d'identité</label>
                    <Input
                      value={data.identity_card_number ?? ''}
                      onChange={(e) => setData('identity_card_number', e.target.value)}
                    />
                    {errors.identity_card_number && <p className="text-red-500 text-sm">{errors.identity_card_number}</p>}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Numéro de permis</label>
                    <Input value={data.license_number ?? ''} onChange={(e) => setData('license_number', e.target.value)} />
                    {errors.license_number && <p className="text-red-500 text-sm">{errors.license_number}</p>}
                  </div>

                  {/* DATE PICKERS */}
                  <div>
                    <label className="block mb-1 font-medium">Date du permis</label>
                    <Popover open={licenseDateOpen} onOpenChange={setLicenseDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" type="button" className="justify-between w-full">
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
                          onSelect={(date) => {
                            if (date) setData('license_date', date.toISOString().split('T')[0]);
                            setLicenseDateOpen(false);
                          }}
                          captionLayout={captionLayout}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.license_date && <p className="text-red-500 text-sm">{errors.license_date}</p>}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">Date d'expiration du permis</label>
                    <Popover open={licenseExpirationDateOpen} onOpenChange={setLicenseExpirationDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" type="button" className="justify-between w-full">
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
                          onSelect={(date) => {
                            if (date) setData('license_expiration_date', date.toISOString().split('T')[0]);
                            setLicenseExpirationDateOpen(false);
                          }}
                          captionLayout="dropdown"
                          fromYear={2024}
                          toYear={2035}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.license_expiration_date && (
                      <p className="text-red-500 text-sm">{errors.license_expiration_date}</p>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN - UPLOADS + PREVIEWS */}
                <div className="space-y-6">
                  {/* License front */}
                  <div>
                    <label className="block mb-1 font-medium">Photo avant du permis</label>
                    <FileUpload
                      action={route('clients.uploadTempImage')}
                      fieldName="image"
                      accept="image/*"
                      maxSizeMB={5}
                      multiple={false}
                      label="Cliquez ou glissez l'image"
                      onComplete={(items) => {
                        const p = firstPath(items);
                        if (p) setData('license_front_image', p);
                      }}
                    />
                    {(data.license_front_image || previewUrl(client.license_front_image)) && (
                      <div className="mt-2">
                        <img
                          src={previewUrl(data.license_front_image) || previewUrl(client.license_front_image)!}
                          alt="License front"
                          className="h-28 w-44 object-cover rounded border"
                        />
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {data.license_front_image || client.license_front_image}
                        </p>
                      </div>
                    )}
                    {errors.license_front_image && (
                      <p className="text-red-500 text-sm mt-1">{errors.license_front_image}</p>
                    )}
                  </div>

                  {/* License back */}
                  <div>
                    <label className="block mb-1 font-medium">Photo arrière du permis</label>
                    <FileUpload
                      action={route('clients.uploadTempImage')}
                      fieldName="image"
                      accept="image/*"
                      maxSizeMB={5}
                      multiple={false}
                      label="Cliquez ou glissez l'image"
                      onComplete={(items) => {
                        const p = firstPath(items);
                        if (p) setData('license_back_image', p);
                      }}
                    />
                    {(data.license_back_image || previewUrl(client.license_back_image)) && (
                      <div className="mt-2">
                        <img
                          src={previewUrl(data.license_back_image) || previewUrl(client.license_back_image)!}
                          alt="License back"
                          className="h-28 w-44 object-cover rounded border"
                        />
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {data.license_back_image || client.license_back_image}
                        </p>
                      </div>
                    )}
                    {errors.license_back_image && (
                      <p className="text-red-500 text-sm mt-1">{errors.license_back_image}</p>
                    )}
                  </div>

                  {/* CIN front */}
                  <div>
                    <label className="block mb-1 font-medium">Photo avant de la carte d'identité</label>
                    <FileUpload
                      action={route('clients.uploadTempImage')}
                      fieldName="image"
                      accept="image/*"
                      maxSizeMB={5}
                      multiple={false}
                      label="Cliquez ou glissez l'image"
                      onComplete={(items) => {
                        const p = firstPath(items);
                        if (p) setData('cin_front_image', p);
                      }}
                    />
                    {(data.cin_front_image || previewUrl(client.cin_front_image)) && (
                      <div className="mt-2">
                        <img
                          src={previewUrl(data.cin_front_image) || previewUrl(client.cin_front_image)!}
                          alt="CIN front"
                          className="h-28 w-44 object-cover rounded border"
                        />
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {data.cin_front_image || client.cin_front_image}
                        </p>
                      </div>
                    )}
                    {errors.cin_front_image && (
                      <p className="text-red-500 text-sm mt-1">{errors.cin_front_image}</p>
                    )}
                  </div>

                  {/* CIN back */}
                  <div>
                    <label className="block mb-1 font-medium">Photo arrière de la carte d'identité</label>
                    <FileUpload
                      action={route('clients.uploadTempImage')}
                      fieldName="image"
                      accept="image/*"
                      maxSizeMB={5}
                      multiple={false}
                      label="Cliquez ou glissez l'image"
                      onComplete={(items) => {
                        const p = firstPath(items);
                        if (p) setData('cin_back_image', p);
                      }}
                    />
                    {(data.cin_back_image || previewUrl(client.cin_back_image)) && (
                      <div className="mt-2">
                        <img
                          src={previewUrl(data.cin_back_image) || previewUrl(client.cin_back_image)!}
                          alt="CIN back"
                          className="h-28 w-44 object-cover rounded border"
                        />
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {data.cin_back_image || client.cin_back_image}
                        </p>
                      </div>
                    )}
                    {errors.cin_back_image && (
                      <p className="text-red-500 text-sm mt-1">{errors.cin_back_image}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
