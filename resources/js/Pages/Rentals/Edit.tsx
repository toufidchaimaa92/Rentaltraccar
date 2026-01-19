import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { Calendar, User, CreditCard, CheckCircle } from "lucide-react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import RentalWizardLayout from "./Partials/RentalWizardLayout";
import StepRecap from "./Partials/StepRecap";

// Keep only the partials we still need
import StepSelectOrCreateClient from './Partials/StepSelectOrCreateClient';
import StepRentalDates from './Partials/StepRentalDates';
import StepPaymentInfo from './Partials/StepPaymentInfo';

// --- Steps: Dates → Client → (Admin) Prices → Confirm
const steps = [
  { id: 1, title: 'Dates', icon: Calendar },
  { id: 2, title: 'Client', icon: User },
  { id: 3, title: 'Prix', icon: CreditCard },
  { id: 4, title: 'Confirmation', icon: CheckCircle },
];

// ---- Types
export type RentalDTO = {
  id: number;
  client?: any;
  secondDriver?: any;
  car?: any;
  carModel?: any;
  car_id?: number | string;
  car_model_id?: number;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  days: number;
  initial_price_per_day: number;
  price_per_day: number;
  global_discount: number;
  total_price: number;
  manual_total?: number | null; // ✅ NEW
  status: string;
};

type Props = {
  auth: any;
  rental: RentalDTO;
  clients: any[];
  // sent by controller edit(): useful to hide price section if false
  canEditPrice?: boolean;
  carModels: any[];
};

export default function EditRentalRestricted({ auth, rental, clients, canEditPrice = false, carModels }: Props) {
  const initialManualMode = !!(rental.manual_total ?? null); // true if there is a saved manual override
  const resolvedCarModelId =
    rental.carModel?.id ??
    (rental as any).car_model?.id ??
    rental.car_model_id ??
    rental.car?.car_model_id ??
    "";
  const resolvedCarId = rental.car?.id ?? (rental as any).car_id ?? "";

  const { data, setData, put, processing, errors, transform } = useForm({
    // identifiers
    rental_id: rental.id,
    car_id: resolvedCarId,
    car_model_id: resolvedCarModelId,

    // client / second driver
    client_id: rental.client?.id ?? '',
    // minimal client object for StepSelectOrCreateClient
    client: rental.client
      ? {
        name: rental.client?.name ?? '',
        phone: rental.client?.phone ?? '',
        identity_card_number: rental.client?.identity_card_number ?? '',
        address: rental.client?.address ?? '',
        license_number: rental.client?.license_number ?? '',
        license_date: rental.client?.license_date ?? '',
        license_expiration_date: rental.client?.license_expiration_date ?? '',
        license_front_image: rental.client?.license_front_image ?? '',
        license_back_image: rental.client?.license_back_image ?? '',
        cin_front_image: rental.client?.cin_front_image ?? '',
        cin_back_image: rental.client?.cin_back_image ?? '',
      }
      : { name: '', phone: '' },
    second_driver_id: rental.secondDriver?.id ?? null,
    second_driver: rental.secondDriver
      ? {
        name: rental.secondDriver?.name ?? '',
        phone: rental.secondDriver?.phone ?? '',
        identity_card_number: rental.secondDriver?.identity_card_number ?? '',
        address: rental.secondDriver?.address ?? '',
        license_number: rental.secondDriver?.license_number ?? '',
        license_date: rental.secondDriver?.license_date ?? '',
        license_expiration_date: rental.secondDriver?.license_expiration_date ?? '',
      }
      : {},

    // dates & times
    start_date: rental.start_date ?? '',
    end_date: rental.end_date ?? '',
    pickup_time: rental.pickup_time ?? '',
    return_time: rental.return_time ?? '',
    days: rental.days ?? 1,

    // pricing (server only honors for admins)
    initial_price_per_day: rental.initial_price_per_day ?? rental.price_per_day ?? 0,
    price_per_day: rental.price_per_day ?? 0,
    global_discount: rental.global_discount ?? 0,
    total_price: rental.total_price ?? 0,

    // ✅ Manual override state
    manual_mode: initialManualMode,
    manual_total: (rental.manual_total ?? null) as number | null,

    // optional payment (not persisted in update right now, but we keep UI consistent)
    advance_payment: 0,
    payment_method: '',
    reference: '',
  });

  const [step, setStep] = useState<number>(1);
  const prevDataRef = useRef(data);
  useEffect(() => { prevDataRef.current = data; }, [data]);

  // Compute days from dates (inclusive)
  useEffect(() => {
    if (data.start_date && data.end_date) {
      const s = new Date(data.start_date);
      const e = new Date(data.end_date);
      const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      setData('days', diff);
    }
  }, [data.start_date, data.end_date, setData]);

  // Auto-calc totals unless manual
  useEffect(() => {
    if (data.manual_mode) return; // ✅ skip when manual override is on
    const subtotal = (Number(data.price_per_day) || 0) * (Number(data.days) || 0);
    const totalAfterDiscount = Math.max(subtotal - (Number(data.global_discount) || 0), 0);
    setData((prev: any) => ({
      ...prev,
      total_price: totalAfterDiscount,
      // do not touch manual_total here
    }));
  }, [data.days, data.price_per_day, data.global_discount, data.manual_mode, setData]);

  // Validation per step
  const isStepValid = (stepId: number) => {
    switch (stepId) {
      case 1:
        return !!data.start_date && !!data.end_date && !!data.pickup_time && !!data.return_time;
      case 2:
        return !!data.client_id || !!(data.client && (data.client as any).name);
      case 3:
        return true; // admin-only step; server validates pricing anyway
      default:
        return true;
    }
  };

  const canNavigateToStep = (target: number) => {
    if (target <= step) return true;
    if (target === step + 1 && isStepValid(step)) return true;
    for (let i = 1; i < target; i++) if (!isStepValid(i)) return false;
    return true;
  };

  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (step < 4 && isStepValid(step)) setStep(step + 1);
  };
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // Submit (PUT)
  function submit() {
    const missing: string[] = [];
    if (!data.start_date) missing.push('date de début');
    if (!data.end_date) missing.push('date de fin');
    if (!data.pickup_time) missing.push("heure d'enlèvement");
    if (!data.return_time) missing.push('heure de retour');
    if (!data.client_id && !(data as any).client?.name) missing.push('client');
    if (missing.length) {
      alert(`Veuillez renseigner: ${missing.join(', ')}`);
      return;
    }

    // ✅ Normalize payload for backend: apply/clear manual override
    const normalized = { ...data } as any;
    if (normalized.manual_mode) {
      normalized.total_price = Number(normalized.manual_total ?? 0);
    } else {
      normalized.manual_total = null;
    }

    transform((payload: any) => ({
      client_id: normalized.client_id,
      second_driver_id: normalized.second_driver_id,
      second_driver: normalized.second_driver,
      start_date: normalized.start_date,
      end_date: normalized.end_date,
      pickup_time: normalized.pickup_time,
      return_time: normalized.return_time,
      days: normalized.days,
      // pricing (server ignores if not admin)
      initial_price_per_day: normalized.initial_price_per_day,
      price_per_day: normalized.price_per_day,
      global_discount: normalized.global_discount,
      total_price: normalized.total_price,
      manual_total: normalized.manual_total, // ✅ send to backend
      // optional payment bits (server can ignore on update)
      advance_payment: normalized.advance_payment,
      payment_method: normalized.payment_method,
      reference: normalized.reference,
    }));

    put(route('rentals.update', rental.id), {
      preserveScroll: true,
      onError: () => {
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
          const msg = (errors as any)[firstKey];
          if (msg) alert(Array.isArray(msg) ? msg[0] : String(msg));
        }
      },
      onSuccess: () => alert('Modifications enregistrées'),
    });
  }

  const title = useMemo(() => `Modifier la location #${rental.id}`, [rental.id]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={title} />

      <RentalWizardLayout
        title={title}
        steps={steps}
        currentStep={step}
        canNavigateToStep={canNavigateToStep}
        onStepChange={setStep}
        onPrev={prevStep}
        onNext={nextStep}
        onSubmit={submit}
        isFirstStep={step === 1}
        isLastStep={step === 4}
        nextDisabled={!isStepValid(step)}
        submitDisabled={processing}
        submitLabel="Enregistrer les modifications"
      >
        <form className="space-y-8">
          <input type="hidden" name="rental_id" value={data.rental_id} />
          <div className="flex-grow space-y-8">
            {step === 1 && (
              <StepRentalDates
                start_date={data.start_date}
                end_date={data.end_date}
                pickup_time={data.pickup_time}
                return_time={data.return_time}
                days={data.days}
                updateData={setData}
                errors={errors}
                selectedCar={carModels.find((m) => m.id === Number(data.car_model_id))}
              />
            )}

            {step === 2 && (
              <StepSelectOrCreateClient
                clients={clients}
                formData={data}
                setFormData={setData}
                errors={errors}
              />
            )}

            {step === 3 && canEditPrice && (
              <StepPaymentInfo
                manual_mode={data.manual_mode}
                manual_total={data.manual_total}
                total_price={data.total_price}
                days={data.days}
                discount_per_day={0}
                global_discount={data.global_discount}
                initial_price_per_day={data.initial_price_per_day}
                price_per_day={data.price_per_day}
                advance_payment={data.advance_payment}
                payment_method={data.payment_method}
                reference={data.reference}
                updateData={setData}
                errors={errors}
                car_model_id={data.car_model_id}
                carModels={carModels}
                start_date={data.start_date}
                end_date={data.end_date}
                pickup_time={data.pickup_time}
                return_time={data.return_time}
              />
            )}

            {step === 3 && !canEditPrice && (
              <section className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas les droits pour éditer les prix. Passez à l'étape suivante pour confirmer.
                </p>
              </section>
            )}

            {step === 4 && (
              <StepRecap
                data={{
                  ...data,
                  client: data.client || clients.find((c) => c.id === data.client_id),
                }}
                carModels={carModels}
              />
            )}
          </div>
        </form>
      </RentalWizardLayout>
    </AuthenticatedLayout>
  );
}
