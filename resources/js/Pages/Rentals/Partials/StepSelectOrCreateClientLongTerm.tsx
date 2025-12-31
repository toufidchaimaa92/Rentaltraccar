import { ReactNode, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/PhoneInput";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  FileCheck,
  FileText,
  IdCard,
  MapPin,
  Search,
  Trash,
  User,
  Phone,
  UserPlus,
  UserSearch,
  X,
} from "lucide-react";

interface ClientOption {
  id: number | string;
  name: string;
  phone?: string;
  address?: string;
  identity_card_number?: string;
  license_number?: string;
  license_date?: string;
  license_expiration_date?: string;
  company_name?: string;
  rc?: string;
  ice?: string;
  company_address?: string;
  contact_person?: string;
  contact_phone?: string;
  client_type?: "company" | "individual";
}

interface ClientFields {
  name: string;
  phone: string;
  address: string;
  identity_card_number: string;
  license_number?: string;
  license_date?: string;
  license_expiration_date?: string;
  company_name?: string;
  rc?: string;
  ice?: string;
  company_address?: string;
  contact_person?: string;
  contact_phone?: string;
}

interface DriverFields extends ClientFields {
  client_type?: "company" | "individual";
  driver_name?: string;
}

interface Props {
  clients: ClientOption[];
  formData: any;
  setFormData: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

const blankClient: ClientFields = {
  name: "",
  phone: "",
  address: "",
  identity_card_number: "",
  license_number: "",
  license_date: "",
  license_expiration_date: "",
  company_name: "",
  rc: "",
  ice: "",
  company_address: "",
  contact_person: "",
  contact_phone: "",
};

const blankDriver: DriverFields = {
  ...blankClient,
  client_type: "individual",
  driver_name: "",
};

const FieldBlock = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
);

const InputWithIcon = ({
  icon,
  children,
  iconClassName = "left-3",
}: {
  icon: ReactNode;
  children: ReactNode;
  iconClassName?: string;
}) => (
  <div className="relative">
    <span
      className={`pointer-events-none absolute ${iconClassName} top-1/2 -translate-y-1/2 text-muted-foreground`}
    >
      {icon}
    </span>
    {children}
  </div>
);

const DateInput = ({ value, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {value ? format(parseISO(value), "yyyy-MM-dd") : placeholder}
          <CalendarIcon className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

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
          <div className="text-xs opacity-70 space-y-1">
            <div>
              {c.phone}
              {c.identity_card_number && ` • CIN: ${c.identity_card_number}`}
              {c.license_number && ` • Permis: ${c.license_number}`}
              {c.address && ` • ${c.address}`}
            </div>
            {(c.rc || c.ice || c.company_address) && (
              <div>
                {c.rc && `RC: ${c.rc}`}
                {c.ice && ` • ICE: ${c.ice}`}
                {c.company_address && ` • ${c.company_address}`}
              </div>
            )}
          </div>
        </button>
      ))
    ) : (
      <div className="p-3 text-sm opacity-70">Aucun résultat.</div>
    )}
  </div>
);

const Selected = ({ data, onRemove }: any) => (
  <div
    className="relative rounded-xl border bg-white dark:bg-muted/30 shadow-sm p-5 transition-all border-green-500/40 ring-1 ring-green-300/40"
  >
    <Button
      variant="ghost"
      size="icon"
      onClick={onRemove}
      className="absolute top-3 right-3 text-red-500 hover:bg-red-200/30"
    >
      <Trash className="h-4 w-4" />
    </Button>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-8 text-sm items-start">
      <div className="space-y-4 sm:col-span-1">
        {data.name && (
          <div className="space-y-1">
            <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
              <UserSearch size={13} /> Nom / Raison sociale
            </p>
            <p className="text-lg font-semibold text-foreground">{data.name}</p>
          </div>
        )}

        {data.phone && (
          <div className="space-y-1">
            <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
              <Phone size={13} /> Téléphone
            </p>
            <p className="text-foreground text-sm">{data.phone}</p>
          </div>
        )}

        {data.address && (
          <div className="space-y-1">
            <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
              <MapPin size={13} /> Adresse
            </p>
            <p className="text-foreground text-sm">{data.address}</p>
          </div>
        )}
      </div>

      <div className="hidden sm:flex justify-center">
        <div className="border-r h-full opacity-20"></div>
      </div>

      <div className="space-y-4 sm:col-span-1">
        {data.identity_card_number && (
          <div className="space-y-1">
            <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
              <IdCard size={13} /> CIN
            </p>
            <span className="py-0.5 px-2 rounded-md bg-black/5 dark:bg-white/10 text-xs font-medium">
              {data.identity_card_number}
            </span>
          </div>
        )}

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

        {(data.rc || data.ice || data.company_address) && (
          <div className="space-y-1">
            <p className="uppercase text-[11px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
              <FileCheck size={13} /> Société
            </p>
            <div className="space-y-1 text-sm">
              {data.rc && <span className="block">RC: {data.rc}</span>}
              {data.ice && <span className="block">ICE: {data.ice}</span>}
              {data.company_address && <span className="block">{data.company_address}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function StepSelectOrCreateClientLongTerm({ clients, formData, setFormData, errors = {} }: Props) {
  const initialIsCompany = formData.client_type === "company";
  const [mode, setMode] = useState<"select" | "create">(() =>
    formData.client_mode === "existing" || formData.client_id ? "select" : "create"
  );
  const [search, setSearch] = useState("");

  const [driverEnabled, setDriverEnabled] = useState<boolean>(
    () =>
      initialIsCompany &&
      (Boolean(formData.driver_id) || Boolean(formData.driver?.name) || Boolean(formData.driver?.driver_name))
  );
  const [driverMode, setDriverMode] = useState<"select" | "create">(() =>
    formData.driver_id ? "select" : "create"
  );
  const [driverSearch, setDriverSearch] = useState("");

  const currentClient: ClientFields = { ...blankClient, ...(formData.client || {}) };
  const isCompany = formData.client_type === "company";

  const currentDriver: DriverFields = { ...blankDriver, ...(formData.driver || {}) };

  const getText = (c: ClientOption) =>
    [
      c.name,
      c.phone,
      c.identity_card_number,
      c.license_number,
      c.address,
      c.rc,
      c.ice,
      c.company_address,
      c.contact_person,
      c.contact_phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const filtered = useMemo(
    () => clients.filter((c) => getText(c).includes(search.toLowerCase())),
    [clients, search]
  );

  const driverFiltered = useMemo(
    () =>
      clients
        .filter((c) => (c.client_type ?? "individual") === "individual")
        .filter((c) => getText(c).includes(driverSearch.toLowerCase())),
    [clients, driverSearch]
  );

  const updateClient = (payload: Partial<ClientFields>) => {
    setFormData("client", { ...currentClient, ...payload });
  };

  const updateDriver = (payload: Partial<DriverFields>) => {
    setFormData("driver", { ...currentDriver, ...payload, client_type: "individual" });
    setFormData("driver_type", "individual");
  };

  const activateSelect = () => {
    setMode("select");
    setFormData("client_mode", "existing");
  };

  const resetDriver = () => {
    setDriverEnabled(false);
    setDriverMode("create");
    setDriverSearch("");
    setFormData("driver_enabled", false);
    setFormData("driver_id", null);
    setFormData("driver_type", "individual");
    setFormData("driver_mode", "create");
    setFormData("driver", null);
  };

  const activateCreate = () => {
    setMode("create");
    setFormData("client_mode", "create");
    setFormData("client_id", "");
    setFormData("client_type", "individual");
    setFormData("client", blankClient);
    resetDriver();
  };

  const activateDriver = () => {
    if (!isCompany) return;
    setDriverEnabled(true);
    setFormData("driver_enabled", true);
  };

  const deactivateDriver = () => {
    resetDriver();
  };

  const selectClient = (id: string) => {
    const selected = clients.find((c) => c.id.toString() === id);
    if (!selected) return;
    setFormData("client_id", id);
    setFormData("client_mode", "existing");
    setFormData("client_type", selected.client_type || "individual");
    setFormData("client", selected);
    setMode("select");

    if (selected.client_type !== "company") {
      resetDriver();
    }
  };

  const selectDriver = (id: string) => {
    const selected = clients.find((c) => c.id.toString() === id);
    if (!selected) return;
    setFormData("driver_id", id);
    setFormData("driver_mode", "existing");
    setFormData("driver_type", "individual");
    setFormData("driver", { ...selected, client_type: "individual" });
    setDriverMode("select");
    setDriverEnabled(true);
    setFormData("driver_enabled", true);
  };

  const removeClient = () => {
    setFormData("client_id", "");
    setFormData("client", blankClient);
    setFormData("client_type", "individual");
    activateCreate();
  };

  const removeDriver = () => {
    setFormData("driver_id", "");
    setFormData("driver", blankDriver);
    setFormData("driver_type", "individual");
    setFormData("driver_mode", "create");
    setDriverMode("create");
  };

  const selectedClient =
    clients.find((client) => String(client.id) === String(formData.client_id)) || formData.client;
  const selectedDriver =
    clients.find((client) => String(client.id) === String(formData.driver_id)) || formData.driver;

  useEffect(() => {
    if (!isCompany) {
      resetDriver();
    }
  }, [isCompany]);

  useEffect(() => {
    if (formData.driver_id) {
      const driverClient = clients.find((client) => String(client.id) === String(formData.driver_id));
      if (driverClient && driverClient.client_type === "company") {
        resetDriver();
      }
    }
  }, [clients, formData.driver_id]);

  useEffect(() => {
    if (formData.driver_type === "company" || formData.driver?.client_type === "company") {
      setFormData("driver_type", "individual");
      if (formData.driver) {
        setFormData("driver", {
          ...formData.driver,
          client_type: "individual",
          rc: "",
          ice: "",
          company_address: "",
          contact_person: "",
          contact_phone: "",
        });
      }
    }
  }, [formData.driver, formData.driver_type, setFormData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Client</CardTitle>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {mode === "select" ? (
                <>
                  <UserSearch size={14} /> Sélectionner
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Nouveau
                </>
              )}
            </span>

            <Switch checked={mode === "create"} onCheckedChange={(val) => (val ? activateCreate() : activateSelect())} />
          </div>
        </CardHeader>

        <CardContent>
          {mode === "select" && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, téléphone, CIN, RC, ICE…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-full p-1 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {formData.client_id ? (
                <Selected data={selectedClient} onRemove={removeClient} />
              ) : (
                <List items={filtered} onSelect={selectClient} disabledId={undefined} />
              )}
            </>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Particulier</span>
                <Switch
                  id="client-type-switch"
                  checked={isCompany}
                  onCheckedChange={(checked) => {
                    setFormData("client_type", checked ? "company" : "individual");
                    updateClient({ name: currentClient.name });
                    if (!checked) {
                      resetDriver();
                    }
                  }}
                />
                <span className="text-muted-foreground">Entreprise</span>
              </div>

              <FieldBlock>
                <InputWithIcon icon={<User className="h-4 w-4" />}>
                  <Input
                    placeholder={isCompany ? "Raison sociale" : "Nom complet"}
                    name="client.name"
                    value={currentClient.name}
                    onChange={(e) => updateClient({ name: e.target.value })}
                    className="pl-10"
                  />
                </InputWithIcon>
                <PhoneInput
                  placeholder="Téléphone"
                  defaultCountry="MA"
                  name="client.phone"
                  value={currentClient.phone}
                  onChange={(value) => updateClient({ phone: value || "" })}
                />
              </FieldBlock>
              {errors["client.name"] && <p className="text-xs text-destructive">{errors["client.name"]}</p>}
              {errors["client.phone"] && <p className="text-xs text-destructive">{errors["client.phone"]}</p>}

              {isCompany ? (
                <>
                  <FieldBlock>
                    <InputWithIcon icon={<FileText className="h-4 w-4" />}>
                      <Input
                        placeholder="RC"
                        name="client.rc"
                        value={currentClient.rc}
                        onChange={(e) => updateClient({ rc: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <InputWithIcon icon={<FileText className="h-4 w-4" />}>
                      <Input
                        placeholder="ICE"
                        name="client.ice"
                        value={currentClient.ice}
                        onChange={(e) => updateClient({ ice: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                  </FieldBlock>
                  <FieldBlock>
                    <InputWithIcon icon={<MapPin className="h-4 w-4" />}>
                      <Input
                        placeholder="Adresse société"
                        name="client.company_address"
                        value={currentClient.company_address}
                        onChange={(e) => updateClient({ company_address: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <InputWithIcon icon={<User className="h-4 w-4" />}>
                      <Input
                        placeholder="Personne de contact"
                        name="client.contact_person"
                        value={currentClient.contact_person}
                        onChange={(e) => updateClient({ contact_person: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                  </FieldBlock>
                  <FieldBlock>
                    <PhoneInput
                      placeholder="Téléphone contact"
                      defaultCountry="MA"
                      name="client.contact_phone"
                      value={currentClient.contact_phone}
                      onChange={(value) => updateClient({ contact_phone: value || "" })}
                    />
                    <div />
                  </FieldBlock>
                  {errors["client.rc"] && <p className="text-xs text-destructive">{errors["client.rc"]}</p>}
                </>
              ) : (
                <>
                  <FieldBlock>
                    <InputWithIcon icon={<MapPin className="h-4 w-4" />}>
                      <Input
                        placeholder="Adresse"
                        name="client.address"
                        value={currentClient.address}
                        onChange={(e) => updateClient({ address: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <InputWithIcon icon={<IdCard className="h-4 w-4" />}>
                      <Input
                        placeholder="CIN"
                        name="client.identity_card_number"
                        value={currentClient.identity_card_number}
                        onChange={(e) => updateClient({ identity_card_number: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                  </FieldBlock>
                  {errors["client.identity_card_number"] && (
                    <p className="text-xs text-destructive">{errors["client.identity_card_number"]}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputWithIcon icon={<FileCheck className="h-4 w-4" />}>
                      <Input
                        placeholder="Numéro de permis"
                        name="client.license_number"
                        value={currentClient.license_number}
                        onChange={(e) => updateClient({ license_number: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <DateInput
                      placeholder="Date du permis"
                      value={currentClient.license_date}
                      onChange={(license_date: string) => updateClient({ license_date })}
                    />
                    <DateInput
                      placeholder="Expiration"
                      value={currentClient.license_expiration_date}
                      onChange={(license_expiration_date: string) =>
                        updateClient({ license_expiration_date })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isCompany && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Conducteur (optionnel)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Laisser vide si le client conduit lui-même.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Aucun</span>
              <Switch checked={driverEnabled} onCheckedChange={(val) => (val ? activateDriver() : deactivateDriver())} />
              <span className="text-sm text-muted-foreground">Ajouter</span>
            </div>
          </CardHeader>

          {driverEnabled && (
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  {driverMode === "select" ? <UserSearch size={14} /> : <UserPlus size={14} />}
                  {driverMode === "select" ? "Sélectionner" : "Nouveau"}
                </span>
                <Switch
                  checked={driverMode === "create"}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setDriverMode("create");
                      setFormData("driver_mode", "create");
                      setFormData("driver_id", "");
                    } else {
                      setDriverMode("select");
                      setFormData("driver_mode", "existing");
                    }
                  }}
                />
              </div>

              {driverMode === "select" && (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, téléphone, CIN, RC, ICE…"
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="pl-10 pr-10"
                    />

                    {driverSearch && (
                      <button
                        type="button"
                        onClick={() => setDriverSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-full p-1 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {formData.driver_id ? (
                    <Selected data={selectedDriver} onRemove={removeDriver} />
                  ) : (
                    <List items={driverFiltered} onSelect={selectDriver} disabledId={formData.client_id} />
                  )}
                </>
              )}

              {driverMode === "create" && (
                <div className="space-y-4">
                  <FieldBlock>
                    <InputWithIcon icon={<User className="h-4 w-4" />}>
                      <Input
                        placeholder="Nom complet"
                        name="driver.name"
                        value={currentDriver.name}
                        onChange={(e) => updateDriver({ name: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <InputWithIcon icon={<Phone className="h-4 w-4" />} iconClassName="left-14">
                      <PhoneInput
                        placeholder="Téléphone"
                        defaultCountry="MA"
                        name="driver.phone"
                        value={currentDriver.phone}
                        onChange={(value) => updateDriver({ phone: value || "" })}
                        inputClassName="pl-9"
                      />
                    </InputWithIcon>
                  </FieldBlock>

                  <FieldBlock>
                    <InputWithIcon icon={<User className="h-4 w-4" />}>
                      <Input
                        placeholder="Nom du conducteur"
                        name="driver.driver_name"
                        value={currentDriver.driver_name || ""}
                        onChange={(e) => updateDriver({ driver_name: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <InputWithIcon icon={<IdCard className="h-4 w-4" />}>
                      <Input
                        placeholder="CIN"
                        name="driver.identity_card_number"
                        value={currentDriver.identity_card_number}
                        onChange={(e) => updateDriver({ identity_card_number: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                  </FieldBlock>

                  <FieldBlock>
                    <InputWithIcon icon={<MapPin className="h-4 w-4" />}>
                      <Input
                        placeholder="Adresse"
                        name="driver.address"
                        value={currentDriver.address}
                        onChange={(e) => updateDriver({ address: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <div />
                  </FieldBlock>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputWithIcon icon={<FileCheck className="h-4 w-4" />}>
                      <Input
                        placeholder="Numéro de permis"
                        name="driver.license_number"
                        value={currentDriver.license_number}
                        onChange={(e) => updateDriver({ license_number: e.target.value })}
                        className="pl-10"
                      />
                    </InputWithIcon>
                    <DateInput
                      placeholder="Date du permis"
                      value={currentDriver.license_date}
                      onChange={(license_date: string) => updateDriver({ license_date })}
                    />
                    <div />
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}