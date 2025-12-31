import React from "react";
import StepSelectCarShared, { StepSelectCarSharedProps } from "./StepSelectCarShared";

export default function StepSelectCar(props: StepSelectCarSharedProps) {
  return (
    <StepSelectCarShared
      {...props}
      requireCarSelection={false}
      selectionColor="blue"
    />
  );
}
