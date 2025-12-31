import React, { useMemo, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import RentalWizardLayout from "./Partials/RentalWizardLayout";
import { Car, Calendar, CheckCircle2, User } from "lucide-react";
import StepSelectCarsLongTerm from "./Partials/StepSelectCarsLongTerm";
import StepLongTermTerms from "./Partials/StepLongTermTerms";
import StepSelectOrCreateClientLongTerm from "./Partials/StepSelectOrCreateClientLongTerm";
import StepLongTermRecap from "./Partials/StepLongTermRecap";

interface CarModelOption {
  id: number | string;
  brand?: string;
  model?: string;
  price_per_day?: number;
  photos?: { photo_path: string }[];
}

interface CarOption {
  id: number | string;
  license_plate?: string;
  car_model_id?: number | string;
}

interface ClientOption {
  id: number | string;
  name: string;
  phone?: string;
}

interface Props {
  auth: { user: any };
  carModels: CarModelOption[];
  cars: CarOption[];
  clients: ClientOption[];
}

const steps = [
  { id: 1, title: "Voiture", icon: Car },
  { id: 2, title: "Conditions", icon: Calendar },
  { id: 3, title: "Client", icon: User },
  { id: 4, title: "Confirmation", icon: CheckCircle2 },
];

const initialClient = {
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

const initialDriver = {
  client_type: "individual",
  name: "",
  company_name: "",
  rc: "",
  ice: "",
  company_address: "",
  contact_person: "",
  contact_phone: "",
  phone: "",
  driver_name: "",
  identity_card_number: "",
  address: "",
  license_number: "",
  license_date: "",
};

export default function CreateLongTerm({ auth, carModels, cars, clients }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    vehicles: [] as {
      car_id: string | number;
      car_model_id: string | number;
      monthly_price: string | number;
      price_input_type?: "ht" | "ttc";
    }[],
    start_date: "",
    deposit: "",
    payment_cycle: "monthly",
    custom_cycle_days: "",
    pro_rata_first_month: true,
    client_mode: "create",
    client_id: "",
    client_type: "individual",
    client: initialClient,
    driver_enabled: false,
    driver_mode: "create",
    driver_id: "",
    driver_type: "individual",
    driver: initialDriver,
    rental_type: "long_term",
  });

  const [step, setStep] = useState(1);

  const carModelsWithCars = useMemo(
    () => carModels.map((model) => ({
      ...model,
      cars: cars.filter((car) => String(car.car_model_id) === String(model.id)),
    })),
    [carModels, cars]
  );

  const validateStep = (stepId: number) => {
    switch (stepId) {
      case 1:
        return Array.isArray(data.vehicles) && data.vehicles.length > 0;
      case 2:
        return (
          Array.isArray(data.vehicles) &&
          data.vehicles.length > 0 &&
          data.vehicles.every((v) => Number(v.monthly_price) > 0) &&
          data.vehicles.every((v) => Boolean(v.price_input_type)) &&
          Boolean(data.start_date) &&
          (data.payment_cycle !== "custom" || Number(data.custom_cycle_days) > 0)
        );
      case 3:
        if (data.client_mode === "existing" || data.client_id) return Boolean(data.client_id);
        if (data.client_type === "company") {
          return Boolean(data.client.name) && Boolean(data.client.phone) && Boolean(data.client.rc);
        }
        return Boolean(data.client.name) && Boolean(data.client.phone) && Boolean(data.client.identity_card_number);
      default:
        return true;
    }
  };

  const canNavigateToStep = (target: number) => {
    if (target <= step) return true;
    for (let i = 1; i <= target; i++) {
      if (!validateStep(i)) return false;
    }
    return true;
  };

  const nextDisabled = () => !validateStep(step);

  const nextStep = () => {
    if (step < steps.length && !nextDisabled()) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const logValidationSnapshot = (action: string) => {
    const validationResults = steps.map((s) => ({ id: s.id, title: s.title, valid: validateStep(s.id) }));
    console.debug("LLD submit debug", {
      action,
      currentStep: step,
      validationResults,
      client_mode: data.client_mode,
      client_id: data.client_id,
      client_type: data.client_type,
      hasClientData: !!data.client?.name || !!data.client?.phone,
      errors,
      payload: data,
    });
  };

  const submit = () => {
    const isValid = validateStep(step);
    if (!isValid) {
      logValidationSnapshot("blocked_submit");
      return;
    }
    logValidationSnapshot("submit");
    if (data.client_id) {
      setData("client_mode", "existing");
    }
    post(route("rentals.storeLongTerm"));
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Nouvelle Location LLD" />
      <RentalWizardLayout
        steps={steps}
        currentStep={step}
        canNavigateToStep={canNavigateToStep}
        onStepChange={setStep}
        onPrev={prevStep}
        onNext={nextStep}
        onSubmit={submit}
        isFirstStep={step === 1}
        isLastStep={step === steps.length}
        nextDisabled={nextDisabled()}
        submitDisabled={processing}
        nextLabel="Suivant →"
        submitLabel="Créer la location LLD"
      >
        <form onSubmit={(e) => e.preventDefault()} className="pb-20 space-y-8">
          <input type="hidden" name="rental_type" value={data.rental_type} />

          {step === 1 && (
            <StepSelectCarsLongTerm
              carModels={carModelsWithCars as any}
              vehicles={data.vehicles}
              setVehicles={(vehicles) => setData("vehicles", vehicles)}
            />
          )}

          {step === 2 && (
            <StepLongTermTerms
              vehicles={data.vehicles}
              setVehicles={(vehicles) => setData("vehicles", vehicles)}
              carModels={carModels}
              cars={cars}
              start_date={data.start_date}
              deposit={data.deposit}
              payment_cycle={data.payment_cycle}
              custom_cycle_days={data.custom_cycle_days}
              pro_rata_first_month={Boolean(data.pro_rata_first_month)}
              updateData={setData}
              errors={errors}
            />
          )}

          {step === 3 && (
            <StepSelectOrCreateClientLongTerm
              clients={clients}
              formData={data}
              setFormData={setData}
              errors={errors}
            />
          )}

          {step === 4 && <StepLongTermRecap data={data} carModels={carModels} cars={cars} />}
        </form>
      </RentalWizardLayout>
    </AuthenticatedLayout>
  );
}
