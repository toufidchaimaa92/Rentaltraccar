import React from "react";
import BaseRentalWizard from "./Partials/BaseRentalWizard";
import StepSelectCar from "./Partials/StepSelectCar";
import StepRentalDates from "./Partials/StepRentalDates";

type Props = {
  auth: any;
  carModels: {
    id: number;
    brand: string;
    model: string;
    price_per_day: number;
    initial_price_per_day?: number;
  }[];
  clients: any[];
};

export default function CreateReservationWizard(props: Props) {
  return (
    <BaseRentalWizard
      {...props}
      mode="reservation"
      SelectCarComponent={StepSelectCar}
      RentalDatesComponent={StepRentalDates}
      title="Créer une location"
    />
  );
}
