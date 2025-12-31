import React from "react";
import { Head } from "@inertiajs/react";
import { Calendar, Car, CheckCircle, CreditCard, User } from "lucide-react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import StepSelectOrCreateClient from "./StepSelectOrCreateClient";
import StepPaymentInfo from "./StepPaymentInfo";
import StepRecap from "./StepRecap";
import { useRentalWizardState, RentalWizardMode } from "../hooks/useRentalWizardState";
import RentalWizardLayout from "./RentalWizardLayout";

type BaseRentalWizardProps = {
  auth: any;
  carModels: any[];
  clients: any[];
  mode: RentalWizardMode;
  SelectCarComponent: React.ComponentType<any>;
  RentalDatesComponent: React.ComponentType<any>;
  validateStep?: (stepId: number, data: any) => boolean;
  title?: string;
};

const steps = [
  { id: 1, title: "Voiture", icon: Car },
  { id: 2, title: "Dates", icon: Calendar },
  { id: 3, title: "Client", icon: User },
  { id: 4, title: "Paiement", icon: CreditCard },
  { id: 5, title: "Confirmation", icon: CheckCircle },
];

export default function BaseRentalWizard({
  auth,
  carModels,
  clients,
  mode,
  SelectCarComponent,
  RentalDatesComponent,
  validateStep,
  title = "Créer une location",
}: BaseRentalWizardProps) {
  const {
    data,
    setData,
    setStep,
    errors,
    processing,
    step,
    isNextDisabled,
    canNavigateToStep,
    nextStep,
    prevStep,
    submit,
  } = useRentalWizardState({ carModels, mode, validateStep });

  const selectedCar = React.useMemo(() => {
    if (data.car_id) {
      const matchedModel = carModels.find((model) =>
        model.cars?.some((car: any) => String(car.id) === String(data.car_id))
      );
      const matchedCar = matchedModel?.cars?.find(
        (car: any) => String(car.id) === String(data.car_id)
      );

      if (matchedModel) {
        return {
          ...matchedModel,
          license_plate: matchedCar?.license_plate,
        };
      }
    }

    return data.car_model_id
      ? carModels.find((m) => m.id === parseInt(String(data.car_model_id)))
      : undefined;
  }, [carModels, data.car_id, data.car_model_id]);

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
        isLastStep={step === 5}
        nextDisabled={isNextDisabled()}
        submitDisabled={processing}
      >
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <input type="hidden" name="rental_type" value={data.rental_type} />
          <div>
            {step === 1 && (
              <SelectCarComponent
                car_model_id={data.car_model_id}
                car_id={(data as any).car_id}
                updateData={setData}
                carModels={carModels}
              />
            )}
            {step === 2 && (
              <RentalDatesComponent
                start_date={data.start_date}
                end_date={data.end_date}
                pickup_time={data.pickup_time}
                return_time={data.return_time}
                days={data.days}
                updateData={setData}
                errors={errors}
                car_model_id={data.car_model_id}
                selectedCar={selectedCar}
              />
            )}
            {step === 3 && (
              <StepSelectOrCreateClient
                clients={clients}
                formData={data}
                setFormData={setData}
                errors={errors}
              />
            )}
            {step === 4 && (
              <StepPaymentInfo
                manual_mode={data.manual_mode}
                manual_total={data.manual_total}
                advance_payment={data.advance_payment}
                discount_per_day={data.discount_per_day}
                global_discount={data.global_discount}
                initial_price_per_day={data.initial_price_per_day}
                price_per_day={data.price_per_day}
                total_price={data.total_price}
                remaining_payment={data.remaining_payment}
                payment_method={data.payment_method}
                payment_status={data.payment_status}
                status={data.status}
                reference={data.reference}
                updateData={setData}
                errors={errors}
                days={data.days}
                car_model_id={data.car_model_id}
                carModels={carModels}
                start_date={data.start_date}
                end_date={data.end_date}
                pickup_time={data.pickup_time}
                return_time={data.return_time}
                selectedCar={selectedCar}
              />
            )}
            {step === 5 && (
              <StepRecap data={data} carModels={carModels} selectedCar={selectedCar} />
            )}
          </div>
        </form>
      </RentalWizardLayout>
    </AuthenticatedLayout>
  );
}
