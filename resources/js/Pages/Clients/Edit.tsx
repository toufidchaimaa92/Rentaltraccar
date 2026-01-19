import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import {
  Calendar as CalendarIcon,
  User,
  CreditCard,
  Home,
  ScrollText,
  FileText,
  ChevronLeft,
  Save,
} from 'lucide-react';

import { PhoneInput } from '@/components/PhoneInput';
import { ProgressUpload } from '@/components/pdf/ProgressUpload';

/* ================= INPUT WITH ICON ================= */

const InputWithIcon = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      {icon}
    </span>
    {children}
  </div>
);

/* ================= TYPES ================= */

type Client = {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  identity_card_number?: string | null;
  license_number?: string | null;
  license_date?: string | null;
  license_expiration_date?: string | null;
  license_front_image?: string | null;
  license_back_image?: string | null;
  cin_front_image?: string | null;
  cin_back_image?: string | null;
};

/* ================= PAGE ================= */

export default function EditClient({
  auth,
  client,
}: {
  auth: { user: any };
  client: Client;
}) {
  const { data, setData, put, processing, errors, clearErrors, setError } =
    useForm({
      name: client.name || '',
      phone: client.phone || '',
      address: client.address || '',
      identity_card_number: client.identity_card_number || '',
      license_number: client.license_number || '',
      license_date: client.license_date || '',
      license_expiration_date: client.license_expiration_date || '',
      license_front_image: client.license_front_image || '',
      license_back_image: client.license_back_image || '',
      cin_front_image: client.cin_front_image || '',
      cin_back_image: client.cin_back_image || '',
    });

  const [licenseDateOpen, setLicenseDateOpen] = useState(false);
  const [licenseExpirationDateOpen, setLicenseExpirationDateOpen] = useState(false);

  const [uploads, setUploads] = useState<Record<string, File | null>>({
    license_front_image: null,
    license_back_image: null,
    cin_front_image: null,
    cin_back_image: null,
  });
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | undefined>>({});

  const licenseDate = data.license_date ? new Date(data.license_date) : undefined;
  const licenseExpirationDate = data.license_expiration_date
    ? new Date(data.license_expiration_date)
    : undefined;

  const previewUrl = (path?: string | null) => {
    if (!path) return null;
    return path.startsWith('/storage/') ? path : `/storage/${path}`;
  };

  const getCsrfToken = () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

  const uploadTempImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(route('clients.uploadTempImage'), {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken() || '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const payload = await response.json();
    return payload?.path || payload?.url || '';
  };

  const handleFileChange =
    (field: keyof Client) => async (file: File | null) => {
      setUploads((prev) => ({ ...prev, [field]: file }));
      if (!file) {
        setData(field as any, '');
        setUploadErrors((prev) => ({ ...prev, [field]: undefined }));
        return;
      }

      setUploadErrors((prev) => ({ ...prev, [field]: undefined }));
      try {
        const path = await uploadTempImage(file);
        if (!path) throw new Error('Missing upload path');
        setData(field as any, path);
      } catch (error) {
        setUploadErrors((prev) => ({
          ...prev,
          [field]: "Échec du téléversement de l'image.",
        }));
        setData(field as any, '');
      }
    };

  const clearImage = (field: keyof Client) => {
    setUploads((prev) => ({ ...prev, [field]: null }));
    setData(field as any, '');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    put(route('clients.update', client.id), {
      preserveScroll: true,
      onSuccess: () => (window.location.href = route('clients.show', client.id)),
      onError: (errs) => setError(errs as any),
    });
  };

  const renderUpload = (field: keyof Client, label: string) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <ProgressUpload
        file={uploads[field] || null}
        onFileChange={handleFileChange(field)}
        accept={["image/png", "image/jpg", "image/jpeg", "image/webp"]}
        error={(errors as any)[field] || uploadErrors[field]}
        existingImage={previewUrl((data as any)[field]) || previewUrl((client as any)[field])}
        onClearExisting={() => clearImage(field)}
      />
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Modifier le client" />

      <form onSubmit={submit}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ================= HEADER ================= */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={route('clients.show', client.id)}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>

              <h1 className="text-2xl font-bold tracking-tight truncate">
                Modifier le client
              </h1>
            </div>

            <Button
              type="submit"
              disabled={processing}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Enregistrer</span>
            </Button>
          </div>

          {/* ================= INFOS ================= */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Informations personnelles
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <InputWithIcon icon={<User className="h-4 w-4" />}>
                  <Input
                    className="pl-10"
                    placeholder="Nom complet"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                  />
                </InputWithIcon>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <PhoneInput
                  placeholder="Téléphone"
                  defaultCountry="MA"
                  value={data.phone}
                  onChange={(v) => setData('phone', v || '')}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <InputWithIcon icon={<CreditCard className="h-4 w-4" />}>
                  <Input
                    className="pl-10"
                    placeholder="CIN"
                    value={data.identity_card_number}
                    onChange={(e) => setData('identity_card_number', e.target.value)}
                  />
                </InputWithIcon>
                {errors.identity_card_number && (
                  <p className="text-xs text-destructive">{errors.identity_card_number}</p>
                )}
              </div>

              <div className="space-y-1">
                <InputWithIcon icon={<Home className="h-4 w-4" />}>
                  <Input
                    className="pl-10"
                    placeholder="Adresse"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                  />
                </InputWithIcon>
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
            </CardContent>
          </Card>

          {/* ================= PERMIS ================= */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="h-4 w-4 text-primary" />
                Permis de conduire
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <InputWithIcon icon={<ScrollText className="h-4 w-4" />}>
                  <Input
                    className="pl-10"
                    placeholder="Numéro de permis"
                    value={data.license_number}
                    onChange={(e) => setData('license_number', e.target.value)}
                  />
                </InputWithIcon>
                {errors.license_number && (
                  <p className="text-xs text-destructive">{errors.license_number}</p>
                )}
              </div>

              <div className="space-y-1">
                <Popover open={licenseDateOpen} onOpenChange={setLicenseDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between w-full">
                      {data.license_date
                        ? new Date(data.license_date).toLocaleDateString('fr-FR')
                        : 'Date délivrance'}
                      <CalendarIcon className="h-4 w-4 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={licenseDate}
                      onSelect={(d) => {
                        if (d) setData('license_date', d.toISOString().split('T')[0]);
                        setLicenseDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {errors.license_date && (
                  <p className="text-xs text-destructive">{errors.license_date}</p>
                )}
              </div>

              <div className="space-y-1">
                <Popover
                  open={licenseExpirationDateOpen}
                  onOpenChange={setLicenseExpirationDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between w-full">
                      {data.license_expiration_date
                        ? new Date(data.license_expiration_date).toLocaleDateString('fr-FR')
                        : 'Expiration'}
                      <CalendarIcon className="h-4 w-4 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={licenseExpirationDate}
                      onSelect={(d) => {
                        if (d)
                          setData('license_expiration_date', d.toISOString().split('T')[0]);
                        setLicenseExpirationDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {errors.license_expiration_date && (
                  <p className="text-xs text-destructive">{errors.license_expiration_date}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ================= DOCUMENTS ================= */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderUpload('license_front_image', 'Permis (recto)')}
              {renderUpload('license_back_image', 'Permis (verso)')}
              {renderUpload('cin_front_image', "CIN (recto)")}
              {renderUpload('cin_back_image', "CIN (verso)")}
            </CardContent>
          </Card>

          {/* ================= BOTTOM SAVE ================= */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={processing}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}