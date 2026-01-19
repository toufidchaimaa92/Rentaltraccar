// EditCar.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";

import {
  CalendarIcon,
  Car as CarIcon,
  CreditCard,
  CheckCircle2,
  Gauge,
  DollarSign,
} from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function formatDate(date: Date | undefined) {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDate(value: string | null | undefined) {
  if (!value) return undefined;
  const p = value.split("/");
  if (p.length !== 3) return undefined;
  return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
}

function convertDateToISO(str: string) {
  if (!str) return "";
  const p = str.split("/");
  return `${p[2]}-${p[1]}-${p[0]}`;
}

const LabelWithIcon = ({ icon: Icon, text, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className="flex items-center gap-2 mb-1 font-medium text-sm"
  >
    <Icon className="h-4 w-4 text-primary" />
    {text}
  </label>
);

export default function EditCar({ auth, car, carModels }) {
  const { data, setData, patch, processing, errors } = useForm({
    car_model_id: String(car.car_model_id),
    license_plate: car.license_plate || "",
    wwlicense_plate: car.wwlicense_plate || "",
    mileage: car.mileage || "",
    traccar_device_id: car.traccar_device_id ?? "",
    status: car.status || "available",
    insurance_expiry_date: car.insurance_expiry_date
      ? formatDate(new Date(car.insurance_expiry_date))
      : "",
    technical_check_expiry_date: car.technical_check_expiry_date
      ? formatDate(new Date(car.technical_check_expiry_date))
      : "",
    purchase_price: car.purchase_price ?? "",
    monthly_credit: car.monthly_credit ?? "",
    credit_start_date: car.credit_start_date || "",
    credit_end_date: car.credit_end_date || "",
    assurance_prix_annuel: car.assurance_prix_annuel ?? "",
  });

  // --- Date States ---
  const [insuranceDate, setInsuranceDate] = useState(parseDate(data.insurance_expiry_date));
  const [technicalCheckDate, setTechnicalCheckDate] = useState(parseDate(data.technical_check_expiry_date));
  const [creditStartDate, setCreditStartDate] = useState(parseDate(data.credit_start_date));
  const [creditEndDate, setCreditEndDate] = useState(parseDate(data.credit_end_date));

  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [creditStartOpen, setCreditStartOpen] = useState(false);
  const [creditEndOpen, setCreditEndOpen] = useState(false);

  // --- Insurance Monthly ---
  const insuranceMonthly = useMemo(() => {
    const a = parseFloat(data.assurance_prix_annuel || 0);
    return a > 0 ? (a / 12).toFixed(2) : "0.00";
  }, [data.assurance_prix_annuel]);

  // Sync dates back to form data
  useEffect(() => {
    setData("insurance_expiry_date", insuranceDate ? formatDate(insuranceDate) : "");
    setData("technical_check_expiry_date", technicalCheckDate ? formatDate(technicalCheckDate) : "");
    setData("credit_start_date", creditStartDate ? formatDate(creditStartDate) : "");
    setData("credit_end_date", creditEndDate ? formatDate(creditEndDate) : "");
  }, [insuranceDate, technicalCheckDate, creditStartDate, creditEndDate]);

  // Submit
  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...data,
      insurance_expiry_date: data.insurance_expiry_date
        ? convertDateToISO(data.insurance_expiry_date)
        : null,
      technical_check_expiry_date: data.technical_check_expiry_date
        ? convertDateToISO(data.technical_check_expiry_date)
        : null,
    };
    patch(route("cars.update", car.id), { data: payload });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Modifier une voiture" />

      {/* ================= CARD 1: INFO VÉHICULE ================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CarIcon className="h-5 w-5 text-primary" />
            Informations du véhicule
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {/* ROW 1: MODEL + STATUS */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <LabelWithIcon icon={CarIcon} text="Modèle" />
                <Select
                  value={data.car_model_id}
                  onValueChange={(v) => setData("car_model_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {carModels.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.brand} {m.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <LabelWithIcon icon={CheckCircle2} text="Statut" />
                <Select
                  value={data.status}
                  onValueChange={(v) => setData("status", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="rented">Louée</SelectItem>
                    <SelectItem value="reserved">Réservée</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ROW 2: PLAQUE + WW + KM */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <LabelWithIcon icon={CreditCard} text="Plaque d'immatriculation" />
                <Input
                  value={data.license_plate}
                  onChange={(e) => setData("license_plate", e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <LabelWithIcon icon={CreditCard} text="Plaque WW" />
                <Input
                  value={data.wwlicense_plate}
                  onChange={(e) => setData("wwlicense_plate", e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <LabelWithIcon icon={Gauge} text="Kilométrage" />
                <Input
                  type="number"
                  min="0"
                  value={data.mileage}
                  onChange={(e) => setData("mileage", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* ROW 3: TRACCAR DEVICE */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <LabelWithIcon icon={CarIcon} text="Traccar Device ID" />
                <Input
                  type="number"
                  min="1"
                  value={data.traccar_device_id}
                  onChange={(e) => setData("traccar_device_id", e.target.value)}
                  placeholder="123"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID from Traccar (read-only link)
                </p>
              </div>
            </div>

            {/* ROW 4: DATES */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Insurance date */}
              <div>
                <LabelWithIcon icon={CalendarIcon} text="Expiration assurance" />
                <Popover open={insuranceOpen} onOpenChange={setInsuranceOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      readOnly
                      value={insuranceDate ? formatDate(insuranceDate) : ""}
                      className="cursor-pointer"
                      onClick={() => setInsuranceOpen(true)}
                    />
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={insuranceDate}
                      onSelect={(d) => {
                        setInsuranceDate(d);
                        setInsuranceOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Technical date */}
              <div>
                <LabelWithIcon icon={CalendarIcon} text="Expiration contrôle technique" />
                <Popover open={techOpen} onOpenChange={setTechOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      readOnly
                      value={technicalCheckDate ? formatDate(technicalCheckDate) : ""}
                      className="cursor-pointer"
                      onClick={() => setTechOpen(true)}
                    />
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={technicalCheckDate}
                      onSelect={(d) => {
                        setTechnicalCheckDate(d);
                        setTechOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ================= CARD 2: FINANCEMENT ================= */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Financement & Coûts
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Row 1 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <LabelWithIcon icon={DollarSign} text="Prix d'achat" />
              <Input
                type="number"
                value={data.purchase_price}
                onChange={(e) => setData("purchase_price", e.target.value)}
              />
            </div>

            <div>
              <LabelWithIcon icon={DollarSign} text="Assurance (annuel)" />
              <Input
                type="number"
                value={data.assurance_prix_annuel}
                onChange={(e) => setData("assurance_prix_annuel", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {insuranceMonthly} MAD / mois
              </p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <div>
              <LabelWithIcon icon={DollarSign} text="Crédit mensuel" />
              <Input
                type="number"
                value={data.monthly_credit}
                onChange={(e) => setData("monthly_credit", e.target.value)}
              />
            </div>

            <div>
              <LabelWithIcon icon={CalendarIcon} text="Début crédit" />
              <Popover open={creditStartOpen} onOpenChange={setCreditStartOpen}>
                <PopoverTrigger asChild>
                  <Input
                    readOnly
                    value={creditStartDate ? formatDate(creditStartDate) : ""}
                    className="cursor-pointer"
                    onClick={() => setCreditStartOpen(true)}
                  />
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={creditStartDate}
                    onSelect={(d) => {
                      setCreditStartDate(d);
                      setCreditStartOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <LabelWithIcon icon={CalendarIcon} text="Fin crédit" />
              <Popover open={creditEndOpen} onOpenChange={setCreditEndOpen}>
                <PopoverTrigger asChild>
                  <Input
                    readOnly
                    value={creditEndDate ? formatDate(creditEndDate) : ""}
                    className="cursor-pointer"
                    onClick={() => setCreditEndOpen(true)}
                  />
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={creditEndDate}
                    onSelect={(d) => {
                      setCreditEndDate(d);
                      setCreditEndOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-center mt-8">
            <Button
              type="submit"
              form="editCarForm"
              disabled={processing}
              className="w-full md:w-auto"
              onClick={submit}
            >
              Mettre à jour le véhicule
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
