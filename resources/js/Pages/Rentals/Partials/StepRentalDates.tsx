import React from "react";
import StepRentalDatesShared from "./StepRentalDatesShared";

interface StepRentalDatesProps {
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  days: number | null;
  updateData: (key: string, value: any) => void;
  errors?: Record<string, string>;
  selectedCar?: any;
}

export default function StepRentalDates(props: StepRentalDatesProps) {
  return <StepRentalDatesShared mode="reservation" {...props} />;
}
