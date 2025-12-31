/* 
  🔥 Redesigned StepSelectOrCreateClient Component (WITH SWITCH)
  - Tabs removed
  - Switch toggle on header right
  - Cleaner UI
  - Less visual noise
  - Shared Field Blocks
  - Softer cards, spacing, borders
  - Compact selected-info panels
*/

import { useState, ReactNode, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Search,
  Trash,
  UserSearch,
  UserPlus,
  User,
  Phone,
  MapPin,
  IdCard,
  FileCheck,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "@/components/PhoneInput";

/* ======================== SCHEMAS ======================== */
const baseDriverSchema = {
  name: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || isValidPhoneNumber(value), {
      message: "Numéro de téléphone invalide.",
    }),
  address: z.string().optional(),
  identity_card_number: z.string().optional(),
  license_number: z.string().optional(),
  license_date: z.string().optional(),
  license_expiration_date: z.string().optional(),
};

const clientSchema = z.object({
  ...baseDriverSchema,
  name: z.string().min(1, "Le nom complet est requis."),
});

const secondDriverSchema = z.object({ ...baseDriverSchema });

/* ======================== PROPS ======================== */
interface Props {
  clients: any[];
  formData: any;
  setFormData: (key: string, value: any) => void;
  errors: any;
}

/* ---------- FIELD BLOCK ---------- */
const FieldBlock = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
);

const InputWithIcon = ({
  icon,
  children,
  className = "",
  iconClassName = "left-3",
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}) => (
  <div className={`relative ${className}`}>
    <span
      className={`pointer-events-none absolute ${iconClassName} top-1/2 -translate-y-1/2 text-muted-foreground`}
    >
      {icon}
    </span>
    {children}
  </div>
);

const DateInput = ({ form, name, placeholder, onBlurSync }: any) => {
  const [open, setOpen] = useState(false);
  const isLicenseExpiration = name === "license_expiration_date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const maxLicenseDate = new Date(currentYear + 20, 11, 31);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal">
              {field.value ? format(parseISO(field.value), "yyyy-MM-dd") : placeholder}
              <CalendarIcon className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={field.value ? parseISO(field.value) : undefined}
              fromYear={isLicenseExpiration ? currentYear : undefined}
              toYear={isLicenseExpiration ? currentYear + 20 : undefined}
              fromDate={isLicenseExpiration ? today : undefined}
              toDate={isLicenseExpiration ? maxLicenseDate : undefined}
              onSelect={(date) => {
                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                setOpen(false);
                onBlurSync?.();
              }}
              disabled={
                isLicenseExpiration
                  ? (date) => date < today || date > maxLicenseDate
                  : undefined
              }
            />
          </PopoverContent>
        </Popover>
      )}
    />
  );
};

/* ---------- RENDER LIST ---------- */
const List = ({ items, onSelect, disabledId }: any) => (
  <div className="border rounded-xl max-h-64 overflow-y-auto divide-y bg-muted/10">
    {items.length ? (
      items.map((c: any) => (
        <button
          key={c.id}
          disabled={c.id?.toString() === disabledId}
          onClick={() => onSelect(c.id.toString())}
          className="w-full text-left p-3 hover:bg-muted/40 disabled:opacity-40"
        >
          <div className="font-medium">{c.name}</div>
          <div className="text-xs opacity-70">
            {c.phone} {c.identity_card_number && `• CIN: ${c.identity_card_number}`}
            {c.license_number && ` • Permis: ${c.license_number}`}
            {c.address && ` • ${c.address}`}
          </div>
        </button>
      ))
    ) : (
      <div className="p-3 text-sm opacity-70">Aucun résultat.</div>
    )}
  </div>
);

/* ---------- PREMIUM SELECTED CARD ---------- */
const getRatingTone = (rating?: number | null) => {
  if (!rating) {
    return {
      border: "border-border",
      ring: "ring-border/40",
      text: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground",
    };
  }

  if (rating <= 2) {
    return {
      border: "border-red-500/50",
      ring: "ring-red-300/40",
      text: "text-red-600",
      badge: "bg-red-100 text-red-700",
    };
  }

  if (rating === 3) {
    return {
      border: "border-amber-500/50",
      ring: "ring-amber-300/40",
      text: "text-amber-600",
      badge: "bg-amber-100 text-amber-700",
    };
  }

  return {
    border: "border-emerald-500/50",
    ring: "ring-emerald-300/40",
    text: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  };
};

const RenderYellowRating = ({ value }: { value: number }) => (
  <Rating value={value} readOnly>
    {Array.from({ length: 5 }).map((_, index) => (
      <RatingButton key={index} className="text-yellow-500 fill-yellow-500" />
    ))}
  </Rating>
);

const Selected = ({ data, onRemove }: any) => {
  const ratingValue = typeof data?.rating === "number" ? data.rating : Number(data?.rating || 0);
  const tone = getRatingTone(Number.isFinite(ratingValue) ? ratingValue : null);

  return (
    <div
      className={`
        relative rounded-xl border bg-white dark:bg-muted/30 
        shadow-sm p-5 
        transition-all 
        ${tone.border} ring-1 ${tone.ring}
      `}
    >
      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="absolute top-3 right-3 text-red-500 hover:bg-red-200/30"
      >
        <Trash className="h-4 w-4" />
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-8 text-sm items-start">
        {/* LEFT SIDE */}
        <div className="space-y-4 sm:col-span-1">
          {/* Name */}
          {data.name && (
            <div className="space-y-1">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <UserSearch size={13} /> Nom complet
              </p>
              <p className="text-lg font-semibold text-foreground">{data.name}</p>
            </div>
          )}

          {/* Phone */}
          {data.phone && (
            <div className="space-y-1">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <Phone size={13} /> Téléphone
              </p>
              <p className="text-foreground text-sm">{data.phone}</p>
            </div>
          )}

          {/* Address */}
          {data.address && (
            <div className="space-y-1">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <MapPin size={13} /> Adresse
              </p>
              <p className="text-foreground text-sm">{data.address}</p>
            </div>
          )}

          {(ratingValue || data?.note) && (
            <div className="space-y-2">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <User size={13} /> Note client
              </p>
              {ratingValue ? (
                <div className="inline-flex items-center gap-2">
                  <RenderYellowRating value={ratingValue} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {ratingValue}/5
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Aucune note</span>
              )}
              {data?.note && <p className="text-sm text-foreground">{data.note}</p>}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:flex justify-center">
          <div className="border-r h-full opacity-20"></div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4 sm:col-span-1">
          {/* CIN */}
          {data.identity_card_number && (
            <div className="space-y-1">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <IdCard size={13} /> CIN
              </p>

              <div className="flex items-center gap-2">
                <span className="py-0.5 px-2 rounded-md bg-black/5 dark:bg-white/10 text-xs font-medium">
                  {data.identity_card_number}
                </span>
              </div>
            </div>
          )}

          {/* License */}
          {data.license_number && (
            <div className="space-y-1">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <FileCheck size={13} /> Permis
              </p>

              <span className="py-0.5 px-2 rounded-md bg-black/5 dark:bg-white/10 text-xs font-medium">
                {data.license_number}
              </span>
            </div>
          )}

          {/* Expiration date */}
          {data.license_expiration_date && (
            <div className="space-y-1">
              <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                <CalendarIcon size={13} /> Expiration
              </p>

              <span className="text-foreground text-sm">{data.license_expiration_date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================== MAIN ======================== */
export default function StepSelectOrCreateClient({ clients, formData = {}, setFormData }: Props) {
  /* ---------- SHARED HOOK ---------- */
  const useDriverForm = (schema: any, key: string) => {
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: formData[key] || {},
      mode: "onChange",
    });

    return form;
  };

  const mainForm = useDriverForm(clientSchema, "client");
  const secondForm = useDriverForm(secondDriverSchema, "second_driver");

  const syncClientToParent = useCallback(() => {
    setFormData("client", mainForm.getValues());
  }, [mainForm, setFormData]);

  const syncSecondDriverToParent = useCallback(() => {
    setFormData("second_driver", secondForm.getValues());
  }, [secondForm, setFormData]);

  const [mSearch, setMSearch] = useState("");
  const [sSearch, setSSearch] = useState("");

  const [mMode, setMMode] = useState<"select" | "create">(() =>
    formData.client_id ? "select" : "create"
  );
  const [sMode, setSMode] = useState<"select" | "create">(() =>
    formData.second_driver_id ? "select" : "create"
  );

  const getText = (c: any) =>
    [c.name, c.phone, c.identity_card_number, c.license_number, c.address]
      .join(" ")
      .toLowerCase();

  const mFiltered = clients.filter((c) => getText(c).includes(mSearch.toLowerCase()));
  const sFiltered = clients
    .filter((c) => c.id?.toString() !== (formData.client_id ?? "").toString())
    .filter((c) => getText(c).includes(sSearch.toLowerCase()));

  /* ---------- SELECT ---------- */
  const selectClient = (id: string, key: string, form: any) => {
    const c = clients.find((x) => x.id.toString() === id);
    if (!c) return;
    setFormData(key + "_id", id);
    setFormData(key, c);
    form.reset({ ...c });
  };

  const removeClient = (key: string, form: any) => {
    setFormData(key + "_id", "");
    setFormData(key, {});
    form.reset({});
    key === "client" ? setMMode("create") : setSMode("create");
  };

  /* ======================== UI RENDER ======================== */
  return (
    <div className="space-y-4">
      {/* ================================================= MAIN CLIENT ================================================= */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Client principal</CardTitle>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {mMode === "select" ? (
                <>
                  <UserSearch size={14} /> Sélectionner
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Nouveau
                </>
              )}
            </span>

            <Switch
              checked={mMode === "create"}
              onCheckedChange={(val) => setMMode(val ? "create" : "select")}
            />
          </div>
        </CardHeader>

        <CardContent>
          {mMode === "select" && (
            <>
              <InputWithIcon
                icon={<Search className="h-4 w-4" />}
                className="mb-4"
              >
                <Input
                  placeholder="Nom, téléphone, CIN, permis…"
                  value={mSearch}
                  onChange={(e) => setMSearch(e.target.value)}
                  className="pl-10 pr-10"
                />

                {mSearch && (
                  <button
                    type="button"
                    onClick={() => setMSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-full p-1 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </InputWithIcon>

              {formData.client_id ? (
                <Selected data={formData.client} onRemove={() => removeClient("client", mainForm)} />
              ) : (
                <List
                  items={mFiltered}
                  disabledId={formData.second_driver_id}
                  onSelect={(id: string) => selectClient(id, "client", mainForm)}
                />
              )}
            </>
          )}

          {mMode === "create" && (
            <div className="space-y-4">
              <FieldBlock>
                <Controller
                  name="name"
                  control={mainForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<User className="h-4 w-4" />}>
                      <Input
                        placeholder="Nom complet"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncClientToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
                <Controller
                  name="phone"
                  control={mainForm.control}
                  render={({ field }) => (
                    <PhoneInput
                      placeholder="Téléphone"
                      defaultCountry="MA"
                      {...field}
                      onBlur={(event) => {
                        field.onBlur();
                        syncClientToParent();
                      }}
                    />
                  )}
                />
              </FieldBlock>

              <FieldBlock>
                <Controller
                  name="address"
                  control={mainForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<MapPin className="h-4 w-4" />}>
                      <Input
                        placeholder="Adresse"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncClientToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
                <Controller
                  name="identity_card_number"
                  control={mainForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<IdCard className="h-4 w-4" />}>
                      <Input
                        placeholder="CIN"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncClientToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
              </FieldBlock>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Controller
                  name="license_number"
                  control={mainForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<FileCheck className="h-4 w-4" />}>
                      <Input
                        placeholder="Numéro de permis"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncClientToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
                <DateInput
                  form={mainForm}
                  name="license_date"
                  placeholder="Date du permis"
                  onBlurSync={syncClientToParent}
                />
                <DateInput
                  form={mainForm}
                  name="license_expiration_date"
                  placeholder="Expiration"
                  onBlurSync={syncClientToParent}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ================================================= SECOND DRIVER ================================================= */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Deuxième conducteur</CardTitle>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {sMode === "select" ? (
                <>
                  <UserSearch size={14} /> Sélectionner
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Nouveau
                </>
              )}
            </span>

            <Switch
              checked={sMode === "create"}
              onCheckedChange={(val) => setSMode(val ? "create" : "select")}
            />
          </div>
        </CardHeader>

        <CardContent>
          {sMode === "select" && (
            <>
              <InputWithIcon
                icon={<Search className="h-4 w-4" />}
                className="mb-4"
              >
                <Input
                  placeholder="Rechercher…"
                  value={sSearch}
                  onChange={(e) => setSSearch(e.target.value)}
                  className="pl-10 pr-10"
                />

                {sSearch && (
                  <button
                    type="button"
                    onClick={() => setSSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-full p-1 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </InputWithIcon>

              {formData.second_driver_id ? (
                <Selected
                  data={formData.second_driver}
                  onRemove={() => removeClient("second_driver", secondForm)}
                />
              ) : (
                <List
                  items={sFiltered}
                  disabledId={formData.client_id}
                  onSelect={(id: string) => selectClient(id, "second_driver", secondForm)}
                />
              )}
            </>
          )}

          {sMode === "create" && (
            <div className="space-y-4">
              <FieldBlock>
                <Controller
                  name="name"
                  control={secondForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<User className="h-4 w-4" />}>
                      <Input
                        placeholder="Nom complet"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncSecondDriverToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
                <Controller
                  name="phone"
                  control={secondForm.control}
                  render={({ field }) => (
                    <PhoneInput
                      placeholder="Téléphone"
                      defaultCountry="MA"
                      {...field}
                      onBlur={(event) => {
                        field.onBlur();
                        syncSecondDriverToParent();
                      }}
                    />
                  )}
                />
              </FieldBlock>

              <FieldBlock>
                <Controller
                  name="address"
                  control={secondForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<MapPin className="h-4 w-4" />}>
                      <Input
                        placeholder="Adresse"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncSecondDriverToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
                <Controller
                  name="identity_card_number"
                  control={secondForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<IdCard className="h-4 w-4" />}>
                      <Input
                        placeholder="CIN"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncSecondDriverToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
              </FieldBlock>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Controller
                  name="license_number"
                  control={secondForm.control}
                  render={({ field }) => (
                    <InputWithIcon icon={<FileCheck className="h-4 w-4" />}>
                      <Input
                        placeholder="Numéro de permis"
                        {...field}
                        className="pl-10"
                        onBlur={(event) => {
                          field.onBlur();
                          syncSecondDriverToParent();
                        }}
                      />
                    </InputWithIcon>
                  )}
                />
                <DateInput
                  form={secondForm}
                  name="license_date"
                  placeholder="Date du permis"
                  onBlurSync={syncSecondDriverToParent}
                />
                <DateInput
                  form={secondForm}
                  name="license_expiration_date"
                  placeholder="Expiration"
                  onBlurSync={syncSecondDriverToParent}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}