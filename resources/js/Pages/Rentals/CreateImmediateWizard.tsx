import React from "react";
import BaseRentalWizard from "./Partials/BaseRentalWizard";
import StepSelectCarImmediate from "./Partials/StepSelectCarImmediate";
import StepRentalDatesImmediate from "./Partials/StepRentalDatesImmediate";

type Props = {
  auth: any;
  carModels: { id: number; brand: string; model: string; price_per_day: number; initial_price_per_day?: number }[];
  clients: any[];
};

export default function CreateImmediateWizard(props: Props) {
  return (
    <BaseRentalWizard
      {...props}
      mode="immediate"
      SelectCarComponent={StepSelectCarImmediate}
      RentalDatesComponent={StepRentalDatesImmediate}
      title="Créer une location"
    />
  );
}
