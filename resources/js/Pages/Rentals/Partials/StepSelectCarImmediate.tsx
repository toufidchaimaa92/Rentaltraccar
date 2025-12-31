import React from "react";
import StepSelectCarShared, { StepSelectCarSharedProps } from "./StepSelectCarShared";

export default function StepSelectCarImmediate(props: StepSelectCarSharedProps) {
  return (
    <StepSelectCarShared
      {...props}
      requireCarSelection
      selectionColor="green"
    />
  );
}
