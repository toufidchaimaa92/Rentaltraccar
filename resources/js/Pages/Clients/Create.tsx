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

interface FormData {
  name: string;
  phone: string;
  address: string;
  identity_card_number: string;
  license_number: string;
  license_date: string;
  license_expiration_date: string;

  license_front_image: string;
  license_back_image: string;
  cin_front_image: string;
  cin_back_image: string;
}

interface FormErrors {
  [key: string]: string | undefined;
  general?: string;
}

/* ================= PAGE ================= */

export default function CreateClient({ auth }: { auth: { user: any } }) {
  const { data, setData, post, processing, errors, setError, clearErrors } =
    useForm<FormData, FormErrors>({
      name: '',
      phone: '',
      address: '',
      identity_card_number: '',
      license_number: '',
      license_date: '',
      license_expiration_date: '',
      license_front_image: '',
      license_back_image: '',
      cin_front_image: '',
      cin_back_image: '',
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

  /* ================= UPLOAD ================= */

  const getCsrfToken = () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

  const uploadTempImage = async (file: File) => {
    const form = new FormData();
    form.append('image', file);

    const res = await fetch(route('clients.uploadTempImage'), {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken() || '',
      },
      body: form,
    });

    if (!res.ok) throw new Error('Upload failed');

    const json = await res.json();
    return json?.path || json?.url || '';
  };

  const handleFileChange =
    (field: keyof FormData) => async (file: File | null) => {
      setUploads((prev) => ({ ...prev, [field]: file }));

      if (!file) {
        setData(field, '');
        setUploadErrors((e) => ({ ...e, [field]: undefined }));
        return;
      }

      try {
        const path = await uploadTempImage(file);
        setData(field, path);
      } catch {
        setUploadErrors((e) => ({
          ...e,
          [field]: "Échec du téléversement de l'image.",
        }));
        setData(field, '');
      }
    };

  /* ================= SUBMIT ================= */

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    post(route('clients.store'), {
      preserveScroll: true,
      onSuccess: () => (window.location.href = route('clients.index')),
      onError: (errs) => setError(errs),
    });
  };

  /* ================= RENDER ================= */

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Créer un client" />

      <form onSubmit={submit}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ================= HEADER ================= */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={route('clients.index')}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>

              <h1 className="text-2xl font-bold tracking-tight truncate">
                Créer un client
              </h1>
            </div>

            <Button type="submit" disabled={processing} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Enregistrer</span>
            </Button>
          </div>

          {errors.general && (
            <p className="text-red-500 text-sm text-center">{errors.general}</p>
          )}

          {/* ================= INFOS ================= */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Informations personnelles
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputWithIcon icon={<User className="h-4 w-4" />}>
                <Input
                  placeholder="Nom complet"
                  className="pl-10"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                />
              </InputWithIcon>

              {/* PHONE — no icon */}
              <PhoneInput
                placeholder="Téléphone"
                defaultCountry="MA"
                value={data.phone}
                onChange={(v) => setData('phone', v || '')}
              />

              <InputWithIcon icon={<Home className="h-4 w-4" />}>
                <Input
                  placeholder="Adresse"
                  className="pl-10"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                />
              </InputWithIcon>

              <InputWithIcon icon={<CreditCard className="h-4 w-4" />}>
                <Input
                  placeholder="CIN"
                  className="pl-10"
                  value={data.identity_card_number}
                  onChange={(e) => setData('identity_card_number', e.target.value)}
                />
              </InputWithIcon>
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
              <InputWithIcon icon={<ScrollText className="h-4 w-4" />}>
                <Input
                  placeholder="Numéro de permis"
                  className="pl-10"
                  value={data.license_number}
                  onChange={(e) => setData('license_number', e.target.value)}
                />
              </InputWithIcon>

              <Popover open={licenseDateOpen} onOpenChange={setLicenseDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {data.license_date
                      ? new Date(data.license_date).toLocaleDateString('fr-FR')
                      : 'Date délivrance'}
                    <CalendarIcon className="h-4 w-4 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
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

              <Popover
                open={licenseExpirationDateOpen}
                onOpenChange={setLicenseExpirationDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {data.license_expiration_date
                      ? new Date(data.license_expiration_date).toLocaleDateString('fr-FR')
                      : 'Expiration'}
                    <CalendarIcon className="h-4 w-4 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
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
              <ProgressUpload
                file={uploads.license_front_image}
                onFileChange={handleFileChange('license_front_image')}
                error={uploadErrors.license_front_image}
              />
              <ProgressUpload
                file={uploads.license_back_image}
                onFileChange={handleFileChange('license_back_image')}
                error={uploadErrors.license_back_image}
              />
              <ProgressUpload
                file={uploads.cin_front_image}
                onFileChange={handleFileChange('cin_front_image')}
                error={uploadErrors.cin_front_image}
              />
              <ProgressUpload
                file={uploads.cin_back_image}
                onFileChange={handleFileChange('cin_back_image')}
                error={uploadErrors.cin_back_image}
              />
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
              Enregistrer
            </Button>
          </div>

        </div>
      </form>
    </AuthenticatedLayout>
  );
}
