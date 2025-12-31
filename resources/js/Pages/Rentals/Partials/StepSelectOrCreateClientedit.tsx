import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Search, Trash, UserSearch, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { PhoneInput } from '@/components/PhoneInput';



// --- SCHÉMAS ZOD POUR LE CLIENT ET LE DEUXIÈME CONDUCTEUR ---
const clientSchema = z.object({
  name: z.string().min(1, "Le nom complet est requis."),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || isValidPhoneNumber(value), {
      message: "Numéro de téléphone invalide.",
    }),
  address: z.string().optional(), // Added address field
  identity_card_number: z.string().optional(),
  license_number: z.string().optional(),
  license_date: z.string().optional(),
  license_expiration_date: z.string().optional(),
});

const secondDriverSchema = z.object({
  name: z.string().min(1, "Le nom complet est requis pour le deuxième conducteur.").optional(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || value.length === 0 || value.length >= 7, { // Simple validation
      message: "Numéro de téléphone invalide ou trop court.",
    }),
  identity_card_number: z.string().optional(),
  license_number: z.string().optional(),
  license_date: z.string().optional(),
  license_expiration_date: z.string().optional(),
});

interface Props {
  clients: any[];
  formData: any;
  setFormData: (key: string, value: any) => void;
  errors: any;
}

export default function StepSelectOrCreateClient({ clients, formData = {}, setFormData, errors }: Props) {
  // --- CONFIGURATION REACT-HOOK-FORM POUR LE CLIENT PRINCIPAL ---
  const mainClientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: formData.client?.name || "",
      phone: formData.client?.phone || "",
      address: formData.client?.address || "", // Default value for address
      identity_card_number: formData.client?.identity_card_number || "",
      license_number: formData.client?.license_number || "",
      license_date: formData.client?.license_date || "",
      license_expiration_date: formData.client?.license_expiration_date || "",
    },
    mode: "onChange"
  });

  // Synchronise les données du formulaire vers l'état parent formData.client
  useEffect(() => {
    const subscription = mainClientForm.watch((value) => {
      setFormData("client", value);
    });
    return () => subscription.unsubscribe();
  }, [mainClientForm.watch, setFormData]);

  // --- CONFIGURATION REACT-HOOK-FORM POUR LE DEUXIÈME CONDUCTEUR ---
  const secondDriverForm = useForm<z.infer<typeof secondDriverSchema>>({
    resolver: zodResolver(secondDriverSchema),
    defaultValues: {
      name: formData.second_driver?.name || "",
      phone: formData.second_driver?.phone || "",
      address: formData.second_driver?.address || "", // Default value for address
      identity_card_number: formData.second_driver?.identity_card_number || "",
      license_number: formData.second_driver?.license_number || "",
      license_date: formData.second_driver?.license_date || "",
      license_expiration_date: formData.second_driver?.license_expiration_date || "",
    },
    mode: "onChange"
  });

  // Synchronise les données du formulaire vers l'état parent formData.second_driver
  useEffect(() => {
    const subscription = secondDriverForm.watch((value) => {
      setFormData("second_driver", value);
    });
    return () => subscription.unsubscribe();
  }, [secondDriverForm.watch, setFormData]);

  // === État du client principal pour le mode et la recherche ===
  const [mainSearch, setMainSearch] = useState("");
  const [mainMode, setMainMode] = useState<"select" | "create">(() =>
    formData.client_id ? "select" : "create"
  );

  // === État du deuxième conducteur pour le mode et la recherche ===
  const [secondSearch, setSecondSearch] = useState("");
  const [secondMode, setSecondMode] = useState<"select" | "create">(() =>
    formData.second_driver_id ? "select" : "create"
  );

  // === Fonctions utilitaires ===
  const getSearchableText = (client: any) =>
    [
      client.name || "",
      client.phone || "",
      client.identity_card_number || "",
      client.license_number || "",
      client.address || "", // Include address in searchable text
    ]
      .join(" ")
      .toLowerCase();

  const filteredMainClients = clients.filter((c) =>
    getSearchableText(c).includes(mainSearch.toLowerCase())
  );

  const filteredSecondClients = clients
    .filter((c) => c.id?.toString() !== (formData.client_id ?? "").toString())
    .filter((c) => getSearchableText(c).includes(secondSearch.toLowerCase()));

  // === Gestionnaires de sélection ===
  const handleSelectClient = (clientId: string) => {
    const selected = clients.find((c) => c.id.toString() === clientId);
    if (!selected) return;
    setFormData("client_id", clientId);
    mainClientForm.reset({
      name: selected.name || "",
      phone: selected.phone || "",
      address: selected.address || "", // Set address on selection
      identity_card_number: selected.identity_card_number || "",
      license_number: selected.license_number || "",
      license_date: selected.license_date || "",
      license_expiration_date: selected.license_expiration_date || "",
    });
  };

  const handleSelectSecondDriver = (clientId: string) => {
    if (clientId.toString() === (formData.client_id ?? "").toString()) return;
    const selected = clients.find((c) => c.id.toString() === clientId);
    if (!selected) return;
    setFormData("second_driver_id", clientId);
    secondDriverForm.reset({
      name: selected.name || "",
      phone: selected.phone || "",
      address: selected.address || "", // Set address on selection
      identity_card_number: selected.identity_card_number || "",
      license_number: selected.license_number || "",
      license_date: selected.license_date || "",
      license_expiration_date: selected.license_expiration_date || "",
    });
  };

  // === Gestionnaires de suppression ===
  const handleRemoveMainClient = () => {
    setFormData("client_id", "");
    setFormData("client", {});
    mainClientForm.reset();
    setMainMode("create");
    setMainSearch("");
  };

  const handleRemoveSecondDriver = () => {
    setFormData("second_driver_id", "");
    setFormData("second_driver", {});
    secondDriverForm.reset();
    setSecondMode("create");
    setSecondSearch("");
  };

  const handleMainModeChange = (value: "select" | "create") => {
    setMainMode(value);
    if (value === "create") {
      mainClientForm.reset({ // Réinitialise explicitement les champs à vide
        name: "",
        phone: "",
        address: "", // Clear address field
        identity_card_number: "",
        license_number: "",
        license_date: "",
        license_expiration_date: "",
      });
      setFormData("client_id", ""); // Vide l'ID client dans l'état parent
      setFormData("client", {}); // Vide les données client dans l'état parent
    }
  };

  const handleSecondModeChange = (value: "select" | "create") => {
    setSecondMode(value);
    if (value === "create") {
      secondDriverForm.reset({ // Réinitialise explicitement les champs à vide
        name: "",
        phone: "",
        address: "", // Clear address field
        identity_card_number: "",
        license_number: "",
        license_date: "",
        license_expiration_date: "",
      });
      setFormData("second_driver_id", ""); // Vide l'ID du deuxième conducteur dans l'état parent
      setFormData("second_driver", {}); // Vide les données du deuxième conducteur dans l'état parent
    }
  };

  // State to manage popover open/close for each date field
  const [isMainLicenseDateOpen, setIsMainLicenseDateOpen] = useState(false);
  const [isMainLicenseExpirationDateOpen, setIsMainLicenseExpirationDateOpen] = useState(false);
  const [isSecondDriverLicenseDateOpen, setIsSecondDriverLicenseDateOpen] = useState(false);
  const [isSecondDriverLicenseExpirationDateOpen, setIsSecondDriverLicenseExpirationDateOpen] = useState(false);


  return (
    <div className="space-y-8">
      {/* ======================= CLIENT PRINCIPAL ======================= */}
      <Card>
        <CardHeader>
          <CardTitle>Client principal</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mainMode} onValueChange={handleMainModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select" className="flex items-center gap-1">
                <UserSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Sélectionner un client</span>
              </TabsTrigger>

              <TabsTrigger value="create" className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Créer un nouveau client</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="select" className="mt-4">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Rechercher par nom, téléphone, CIN, permis…"
                    value={mainSearch}
                    onChange={(e) => setMainSearch(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                </div>
                {formData.client_id && (
                  <div className="relative rounded-lg bg-secondary/30 p-4">
                    {/* Delete button top-right */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveMainClient}
                      className="absolute top-2 right-2 flex items-center gap-1"
                    >
                      {/* Icon always visible */}
                      <Trash className="h-4 w-4" />
                      {/* Text hidden on small screens */}
                      <span className="hidden sm:inline">Supprimer</span>
                    </Button>

                    {/* Client info */}
                    <p className="font-semibold">{formData.client.name}</p>
                    {formData.client.phone && <p className="text-sm opacity-90">Téléphone: {formData.client.phone}</p>}
                    {formData.client.license_number && <p className="text-sm opacity-90">Permis: {formData.client.license_number}</p>}
                    {formData.client.address && <p className="text-sm opacity-90">Adresse: {formData.client.address}</p>}
                  </div>
                )}


                {!formData.client_id && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                    {filteredMainClients.length > 0 ? (
                      filteredMainClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-muted/50 focus:bg-muted/70"
                          onClick={() => handleSelectClient(client.id.toString())}
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs opacity-70">
                            {client.phone} {client.identity_card_number ? `• CIN: ${client.identity_card_number}` : ""}
                            {client.license_number ? ` • Permis: ${client.license_number}` : ""}
                            {client.address && ` • Adresse: ${client.address}`} {/* Display address in search results */}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm opacity-70">Aucun résultat.</div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="create" className="mt-4">
              <div className="space-y-4">
                {/* Nom complet et Téléphone sur la même ligne pour les grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <Controller
                      name="name"
                      control={mainClientForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Nom complet"
                          {...field}
                        />
                      )}
                    />
                    {mainClientForm.formState.errors.name && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      name="phone"
                      control={mainClientForm.control}
                      render={({ field }) => (
                        <PhoneInput
                          placeholder="Téléphone"
                          defaultCountry="MA"
                          required
                          className="w-full"
                          {...field}
                        />
                      )}
                    />
                    {mainClientForm.formState.errors.phone && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.phone.message}</p>}
                  </div>
                </div>

                {/* Adresse et CIN sur la même ligne pour les grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <Controller
                      name="address"
                      control={mainClientForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Adresse"
                          {...field}
                        />
                      )}
                    />
                    {mainClientForm.formState.errors.address && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.address.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      name="identity_card_number"
                      control={mainClientForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Numéro de carte d'identité (CIN)"
                          {...field}
                        />
                      )}
                    />
                    {mainClientForm.formState.errors.identity_card_number && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.identity_card_number.message}</p>}
                  </div>
                </div>

                {/* Permis et Dates sur la même ligne pour les grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <Controller
                      name="license_number"
                      control={mainClientForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Numéro de permis"
                          {...field}
                        />
                      )}
                    />
                    {mainClientForm.formState.errors.license_number && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.license_number.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      control={mainClientForm.control}
                      name="license_date"
                      render={({ field }) => (
                        <Popover open={isMainLicenseDateOpen} onOpenChange={setIsMainLicenseDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal" // Changed from justify-start to justify-between
                            >
                              {field.value ? format(parseISO(field.value), "yyyy-MM-dd") : "Date de délivrance du permis"}
                              <CalendarIcon className="h-4 w-4 opacity-60" /> {/* Added CalendarIcon */}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={field.value ? parseISO(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                setIsMainLicenseDateOpen(false); // Close popover on select
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {mainClientForm.formState.errors.license_date && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.license_date.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      control={mainClientForm.control}
                      name="license_expiration_date"
                      render={({ field }) => (
                        <Popover open={isMainLicenseExpirationDateOpen} onOpenChange={setIsMainLicenseExpirationDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal" // Changed from justify-start to justify-between
                            >
                              {field.value ? format(parseISO(field.value), "yyyy-MM-dd") : "Expiration du permis"}
                              <CalendarIcon className="h-4 w-4 opacity-60" /> {/* Added CalendarIcon */}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              fromYear={new Date().getFullYear()}
                              toYear={new Date().getFullYear() + 15}  // Restrict to 15 years from now
                              selected={field.value ? parseISO(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                setIsMainLicenseExpirationDateOpen(false); // Close popover on select
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {mainClientForm.formState.errors.license_expiration_date && <p className="text-red-500 text-sm">{mainClientForm.formState.errors.license_expiration_date.message}</p>}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Separator />
      {/* ======================= DEUXIÈME CONDUCTEUR ======================= */}
      <Card>
        <CardHeader>
          <CardTitle>Deuxième conducteur</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={secondMode} onValueChange={handleSecondModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select" className="flex items-center gap-1">
                <UserSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Sélectionner un client</span>
              </TabsTrigger>

              <TabsTrigger value="create" className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Créer un nouveau client</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="select" className="mt-4">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Rechercher un deuxième conducteur…"
                    value={secondSearch}
                    onChange={(e) => setSecondSearch(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                </div>

                {formData.second_driver_id && (
                  <div className="relative rounded-lg bg-secondary/30 p-4">
                    {/* Delete button top-right */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveSecondDriver}
                      className="absolute top-2 right-2 flex items-center gap-1"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </Button>

                    {/* Second driver info */}
                    <p className="font-semibold">{formData.second_driver.name}</p>
                    {formData.second_driver.phone && <p className="text-sm opacity-90">Téléphone: {formData.second_driver.phone}</p>}
                    {formData.second_driver.license_number && <p className="text-sm opacity-90">Permis: {formData.second_driver.license_number}</p>}
                    {formData.second_driver.address && <p className="text-sm opacity-90">Adresse: {formData.second_driver.address}</p>}
                  </div>
                )}

                {!formData.second_driver_id && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                    {filteredSecondClients.length > 0 ? (
                      filteredSecondClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-muted/50 focus:bg-muted/70 disabled:opacity-50"
                          disabled={client.id?.toString() === (formData.client_id ?? "").toString()}
                          onClick={() => handleSelectSecondDriver(client.id.toString())}
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs opacity-70">
                            {client.phone} {client.identity_card_number ? `• CIN: ${client.identity_card_number}` : ""}
                            {client.license_number ? ` • Permis: ${client.license_number}` : ""}
                            {client.address && ` • Adresse: ${client.address}`} {/* Display address in search results */}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm opacity-70">Aucun résultat.</div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="create" className="mt-4">
              <div className="space-y-4">
                {/* Nom complet et Téléphone sur la même ligne pour les grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <Controller
                      name="name"
                      control={secondDriverForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Nom complet"
                          {...field}
                        />
                      )}
                    />
                    {secondDriverForm.formState.errors.name && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      name="phone"
                      control={secondDriverForm.control}
                      render={({ field }) => (
                        <PhoneInput
                          placeholder="Téléphone"
                          defaultCountry="MA"
                          required
                          className="w-full"
                          {...field}
                        />
                      )}
                    />
                    {secondDriverForm.formState.errors.phone && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.phone.message}</p>}
                  </div>
                </div>

                {/* Adresse et CIN sur la même ligne pour les grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <Controller
                      name="address"
                      control={secondDriverForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Adresse"
                          {...field}
                        />
                      )}
                    />
                    {secondDriverForm.formState.errors.address && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.address.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      name="identity_card_number"
                      control={secondDriverForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Numéro de carte d'identité (CIN)"
                          {...field}
                        />
                      )}
                    />
                    {secondDriverForm.formState.errors.identity_card_number && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.identity_card_number.message}</p>}
                  </div>
                </div>

                {/* Permis et Dates sur la même ligne pour les grands écrans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <Controller
                      name="license_number"
                      control={secondDriverForm.control}
                      render={({ field }) => (
                        <Input
                          placeholder="Numéro de permis"
                          {...field}
                        />
                      )}
                    />
                    {secondDriverForm.formState.errors.license_number && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.license_number.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      control={secondDriverForm.control}
                      name="license_date"
                      render={({ field }) => (
                        <Popover open={isSecondDriverLicenseDateOpen} onOpenChange={setIsSecondDriverLicenseDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? format(parseISO(field.value), "yyyy-MM-dd") : "Date de délivrance du permis"}
                              <CalendarIcon className="h-4 w-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={field.value ? parseISO(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                setIsSecondDriverLicenseDateOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {secondDriverForm.formState.errors.license_date && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.license_date.message}</p>}
                  </div>
                  <div className="flex flex-col">
                    <Controller
                      control={secondDriverForm.control}
                      name="license_expiration_date"
                      render={({ field }) => (
                        <Popover open={isSecondDriverLicenseExpirationDateOpen} onOpenChange={setIsSecondDriverLicenseExpirationDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? format(parseISO(field.value), "yyyy-MM-dd") : "Expiration du permis"}
                              <CalendarIcon className="h-4 w-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              fromYear={new Date().getFullYear()}
toYear={new Date().getFullYear() + 15}
                              selected={field.value ? parseISO(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                setIsSecondDriverLicenseExpirationDateOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {secondDriverForm.formState.errors.license_expiration_date && <p className="text-red-500 text-sm">{secondDriverForm.formState.errors.license_expiration_date.message}</p>}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
