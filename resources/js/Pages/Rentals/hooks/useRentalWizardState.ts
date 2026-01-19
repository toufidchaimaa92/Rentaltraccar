import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";

export type RentalWizardMode = "reservation" | "immediate";

export type ValidateStep = (stepId: number, data: any) => boolean;

type UseRentalWizardStateArgs = {
  carModels: { id: number; initial_price_per_day?: number; price_per_day?: number }[];
  mode: RentalWizardMode;
  validateStep?: ValidateStep;
};

const buildInitialData = (mode: RentalWizardMode) => ({
  car_model_id: "",
  car_id: "",
  client_id: "",
  client_mode: "",
  second_driver_id: "",
  second_driver_mode: "",
  second_driver: {
    name: "",
    phone: "",
    identity_card_number: "",
    address: "",
    license_number: "",
    license_date: "",
    license_expiration_date: "",
  },
  client: {
    name: "",
    phone: "",
    identity_card_number: "",
    address: "",
    license_number: "",
    license_date: "",
    license_expiration_date: "",
    license_front_image: "",
    license_back_image: "",
    cin_front_image: "",
    cin_back_image: "",
  },
  start_date: "",
  end_date: "",
  pickup_time: "",
  return_time: "",
  days: 0,
  initial_price_per_day: 0,
  price_per_day: 0,
  global_discount: 0,
  discount_per_day: 0,
  total_price: 0,
  advance_payment: 0,
  remaining_payment: 0,
  status: "Confirmed",
  payment_method: "cash",
  payment_status: "Pending",
  reference: "",
  rental_type: mode,
  manual_mode: false,
  manual_total: null as number | null,
});

const defaultValidateStep: ValidateStep = (stepId, data) => {
  switch (stepId) {
    case 1:
      return Boolean(data.car_model_id);
    case 2:
      return Boolean(data.start_date) && Boolean(data.end_date);
    case 3: {
      const mainClientValid = Boolean(data.client_id) || Boolean(data.client?.name);
      const secondDriverValid =
        data.second_driver_mode !== "create" ||
        (Boolean(data.second_driver?.name) && Boolean(data.second_driver?.phone));
      return mainClientValid && secondDriverValid;
    }
    case 4:
      return !(
        data.advance_payment > 0 &&
        (!data.payment_method ||
          (["virement", "cheque"].includes(String(data.payment_method)) && !data.reference))
      );
    default:
      return true;
  }
};

export function useRentalWizardState({ carModels, mode, validateStep }: UseRentalWizardStateArgs) {
  const { data, setData, post, processing, errors } = useForm(buildInitialData(mode));
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (data.car_model_id) {
      const selectedModel = carModels.find((m) => m.id === parseInt(String(data.car_model_id)));
      if (selectedModel) {
        const initialPrice = selectedModel.initial_price_per_day || selectedModel.price_per_day || 0;
        setData((prevData: any) => ({
          ...prevData,
          initial_price_per_day: initialPrice,
          price_per_day: initialPrice,
          global_discount: 0,
          discount_per_day: 0,
        }));
      }
    }
  }, [data.car_model_id]);

  useEffect(() => {
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setData("days", diffDays);
    }
  }, [data.start_date, data.end_date, setData]);

  useEffect(() => {
    if (data.manual_mode) return;

    const subtotal = (Number(data.price_per_day) || 0) * (Number(data.days) || 0);
    const totalAfterDiscount = Math.max(subtotal - (Number(data.global_discount) || 0), 0);

    setData((prevData: any) => ({
      ...prevData,
      total_price: totalAfterDiscount,
      remaining_payment: Math.max(totalAfterDiscount - (Number(prevData.advance_payment) || 0), 0),
    }));
  }, [data.days, data.price_per_day, data.global_discount, data.manual_mode, setData]);

  useEffect(() => {
    const remaining = (Number(data.total_price) || 0) - (Number(data.advance_payment) || 0);
    setData("remaining_payment", Math.max(remaining, 0));
  }, [data.advance_payment, data.total_price, setData]);

  const mergedValidateStep = validateStep || defaultValidateStep;

  const isNextDisabled = () => !mergedValidateStep(step, data);

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep <= step) return true;
    for (let i = 1; i <= targetStep; i++) {
      if (!mergedValidateStep(i, data)) return false;
    }
    return true;
  };

  function nextStep() {
    if (step < 5 && !isNextDisabled()) {
      setStep(step + 1);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function submit() {
    const errs: Record<string, string> = {};

    if (!data.car_model_id) errs.car_model_id = "Car model is required";
    if (!data.start_date) errs.start_date = "Start date is required";
    if (!data.end_date) errs.end_date = "End date is required";
    if (!data.client_id && !(data.client as any).name) errs.client_name = "Client name is required";
    if (data.advance_payment > 0 && !data.payment_method) {
      errs.payment_method = "Payment method is required";
    }
    if (data.advance_payment > 0 && ["virement", "cheque"].includes(String(data.payment_method)) && !data.reference) {
      errs.reference = "Reference is required for virement or cheque";
    }

    if (Object.keys(errs).length > 0) {
      return;
    }

    const payload: any = { ...data };
    if (payload.manual_mode) {
      payload.total_price = Number(payload.manual_total ?? 0);
    } else {
      payload.manual_total = null;
    }

    setData((prev: any) => ({ ...prev, ...payload }));
    post(route("rentals.store"));
  }

  return {
    data,
    setData,
    post,
    processing,
    errors,
    step,
    setStep,
    isNextDisabled,
    canNavigateToStep,
    nextStep,
    prevStep,
    submit,
  };
}
