import React, { useState, useEffect, useMemo } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
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

function formatDate(date) {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function convertDateToISO(str) {
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

export default function CreateCar({ auth, carModels }) {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCarModelId = searchParams.get("car_model_id") || "";

  const { data, setData, post, processing, errors } = useForm({
    car_model_id: initialCarModelId,
    license_plate: "",
    wwlicense_plate: "",
    mileage: "",
    traccar_device_id: "",
    status: "available",
    insurance_expiry_date: "",
    technical_check_expiry_date: "",
    purchase_price: "",
    monthly_credit: "",
    credit_start_date: "",
    credit_end_date: "",
    assurance_prix_annuel: "",
  });

  // date states
  const [insuranceDate, setInsuranceDate] = useState();
  const [technicalCheckDate, setTechnicalCheckDate] = useState();
  const [creditStartDate, setCreditStartDate] = useState();
  const [creditEndDate, setCreditEndDate] = useState();

  // popovers
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [creditStartOpen, setCreditStartOpen] = useState(false);
  const [creditEndOpen, setCreditEndOpen] = useState(false);

  // computed insurance monthly
  const insuranceMonthly = useMemo(() => {
    const a = parseFloat(data.assurance_prix_annuel || 0);
    if (!a || a <= 0) return 0;
    return (a / 12).toFixed(2);
  }, [data.assurance_prix_annuel]);

  useEffect(() => {
    setData("insurance_expiry_date", insuranceDate ? formatDate(insuranceDate) : "");
    setData("technical_check_expiry_date", technicalCheckDate ? formatDate(technicalCheckDate) : "");
    setData("credit_start_date", creditStartDate ? formatDate(creditStartDate) : "");
    setData("credit_end_date", creditEndDate ? formatDate(creditEndDate) : "");
  }, [insuranceDate, technicalCheckDate, creditStartDate, creditEndDate]);

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
    post(route("cars.store"), { data: payload });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Créer une voiture" />

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
            {/* ROW 1 --- MODEL + STATUS */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <LabelWithIcon icon={CarIcon} text="Modèle" htmlFor="car_model_id" />
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
                {errors.car_model_id && (
                  <p className="text-sm text-red-600">{errors.car_model_id}</p>
                )}
              </div>

              <div>
                <LabelWithIcon icon={CheckCircle2} text="Statut" htmlFor="status" />
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

            {/* ROW 2 --- PLAQUE + WW + KM */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <LabelWithIcon icon={CreditCard} text="Plaque d'immatriculation" htmlFor="license_plate" />
                <Input
                  id="license_plate"
                  value={data.license_plate}
                  onChange={(e) => setData("license_plate", e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <LabelWithIcon icon={CreditCard} text="Plaque WW" htmlFor="wwlicense_plate" />
                <Input
                  id="wwlicense_plate"
                  value={data.wwlicense_plate}
                  onChange={(e) => setData("wwlicense_plate", e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <LabelWithIcon icon={Gauge} text="Kilométrage" htmlFor="mileage" />
                <Input
                  id="mileage"
                  type="number"
                  min="0"
                  value={data.mileage}
                  onChange={(e) => setData("mileage", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* ROW 3 --- TRACCAR DEVICE */} 
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <LabelWithIcon icon={CarIcon} text="Traccar Device ID" htmlFor="traccar_device_id" />
                <Input
                  id="traccar_device_id"
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

            {/* ROW 4 --- INSURANCE + TECH CHECK */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Insurance */}
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

              {/* Technical check */}
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

            {/* SUBMIT BUTTON MOVED AFTER FINANCE CARD */}

          </form>
        </CardContent>
      </Card>

      {/* ================= CARD 2 : FINANCEMENT ================= */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Financement & Coûts
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Purchase price + insurance annual */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <LabelWithIcon icon={DollarSign} text="Prix d'achat" htmlFor="purchase_price" />
              <Input
                id="purchase_price"
                type="number"
                value={data.purchase_price}
                onChange={(e) => setData("purchase_price", e.target.value)}
              />
            </div>

            <div>
              <LabelWithIcon icon={DollarSign} text="Assurance (annuel)" htmlFor="assurance" />
              <Input
                id="assurance"
                type="number"
                value={data.assurance_prix_annuel}
                onChange={(e) => setData("assurance_prix_annuel", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {insuranceMonthly} MAD / mois
              </p>
            </div>
          </div>

          {/* Monthly credit + start + end */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <LabelWithIcon icon={DollarSign} text="Crédit mensuel" htmlFor="monthly_credit" />
              <Input
                id="monthly_credit"
                type="number"
                value={data.monthly_credit}
                onChange={(e) => setData("monthly_credit", e.target.value)}
              />
            </div>

            {/* Start credit */}
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

            {/* End credit */}
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

          {/* Submit */}
          <div className="flex justify-center mt-8">
            <Button type="submit" disabled={processing} className="w-full md:w-auto">
              Créer le véhicule
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
