import React, { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon, ClockIcon } from "lucide-react";
import ReservationInfoCard from "@/components/rentals/ReservationInfoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RentalWizardMode } from "../hooks/useRentalWizardState";

interface Photo {
  photo_path: string;
}

interface SelectedCar {
  brand: string;
  model: string;
  fuel_type?: string;
  transmission?: string;
  finish?: string;
  photos?: Photo[];
}

interface StepRentalDatesSharedProps {
  mode: RentalWizardMode;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  days: number | null;
  updateData: (key: string, value: any) => void;
  errors?: Record<string, string>;
  selectedCar?: SelectedCar;
}

const dayMs = 24 * 60 * 60 * 1000;

function combineDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return undefined;
  const [h = "12", m = "00"] = (timeStr || "12:00").split(":");
  const d = new Date(dateStr);
  d.setHours(Number(h), Number(m), 0, 0);
  return d;
}

function calculateDays(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / dayMs));
}

export default function StepRentalDatesShared({
  mode,
  start_date,
  end_date,
  pickup_time,
  return_time,
  days,
  updateData,
  errors = {},
  selectedCar,
}: StepRentalDatesSharedProps) {
  const isImmediate = mode === "immediate";

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [returnTimeManuallyChanged, setReturnTimeManuallyChanged] = useState(false);
  const [inputDays, setInputDays] = useState<string>(days != null ? String(days) : "");
  const [daysFocused, setDaysFocused] = useState(false);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return t;
  }, []);
  const todayStr = useMemo(() => today.toISOString().split("T")[0], [today]);

  const currentYear = new Date().getFullYear();

  const minEndDate = useMemo(() => {
    const d = new Date(isImmediate ? start_date || todayStr : start_date || todayStr);
    d.setHours(12, 0, 0, 0);
    return d;
  }, [isImmediate, start_date, todayStr]);

  const maxEndDate = useMemo(() => {
    const d = new Date(currentYear + 5, 11, 31);
    d.setHours(12, 0, 0, 0);
    return d;
  }, [currentYear]);

  const endDateObj = useMemo(() => {
    if (!end_date) return undefined;
    const d = new Date(end_date);
    d.setHours(12, 0, 0, 0);
    return d;
  }, [end_date]);

  useEffect(() => {
    if (!start_date) updateData("start_date", todayStr);
    if (!pickup_time) updateData("pickup_time", "12:00");
    if (!return_time) updateData("return_time", pickup_time || "12:00");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!returnTimeManuallyChanged && pickup_time) {
      updateData("return_time", pickup_time);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup_time]);

  useEffect(() => {
    if (start_date && end_date) {
      const startDT = isImmediate
        ? combineDateTime(start_date, pickup_time)
        : new Date(start_date);
      const endDT = isImmediate
        ? combineDateTime(end_date, return_time)
        : new Date(end_date);
      if (startDT && endDT) {
        startDT.setHours(isImmediate ? startDT.getHours() : 12, isImmediate ? startDT.getMinutes() : 0, 0, 0);
        endDT.setHours(isImmediate ? endDT.getHours() : 12, isImmediate ? endDT.getMinutes() : 0, 0, 0);
        const computed = calculateDays(startDT, endDT);
        updateData("days", computed);
        if (!daysFocused) setInputDays(String(computed));
      }
    } else {
      updateData("days", null);
      if (!daysFocused) setInputDays("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start_date, end_date, pickup_time, return_time]);

  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const selected = new Date(date);
    selected.setHours(12, 0, 0, 0);
    const iso = selected.toISOString().split("T")[0];
    updateData("start_date", iso);

    if (end_date) {
      const end = new Date(end_date);
      end.setHours(12, 0, 0, 0);
      if (end < selected) {
        updateData("end_date", iso);
        updateData("days", 1);
      } else {
        updateData("days", calculateDays(selected, end));
      }
    } else {
      updateData("days", 1);
      updateData("end_date", iso);
    }
    setStartOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date || !start_date) return;
    const selected = new Date(date);
    selected.setHours(12, 0, 0, 0);
    updateData("end_date", selected.toISOString().split("T")[0]);
    const start = new Date(start_date);
    start.setHours(12, 0, 0, 0);
    updateData("days", calculateDays(start, selected));
    setEndOpen(false);
  };

  const handleDaysChange = (value: string) => {
    setInputDays(value);

    if (value === "") {
      updateData("days", null);
      return;
    }

    const numValue = parseInt(value, 10);
    if (Number.isNaN(numValue) || numValue < 1 || !start_date) return;

    if (isImmediate) {
      const start = combineDateTime(start_date, pickup_time);
      if (!start) return;
      const calculatedEnd = addDays(start, numValue);
      const endForBound = new Date(calculatedEnd);
      endForBound.setHours(12, 0, 0, 0);
      if (endForBound > maxEndDate) return;
      updateData("end_date", calculatedEnd.toISOString().split("T")[0]);
    } else {
      const start = new Date(start_date);
      start.setHours(12, 0, 0, 0);
      const calculatedEnd = new Date(start);
      calculatedEnd.setDate(start.getDate() + numValue);
      updateData("end_date", calculatedEnd.toISOString().split("T")[0]);
    }
    updateData("days", numValue);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

      {/* LEFT CARD */}
      <div className="flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Sélection des dates</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 space-y-2 sm:space-y-4">
            <div className="flex flex-wrap gap-3 sm:gap-6 justify-center">
              <div className="flex flex-col gap-1">
                <Label className="text-sm">Date de début</Label>
                {isImmediate ? (
                  <Button
                    variant="outline"
                    disabled
                    className="w-36 sm:w-40 justify-center font-normal text-sm cursor-default"
                  >
                    {new Date(todayStr).toLocaleDateString("fr-FR")}
                  </Button>
                ) : (
                  <Popover open={startOpen} onOpenChange={setStartOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-36 sm:w-40 justify-between font-normal text-sm"
                      >
                        {start_date ? new Date(start_date).toLocaleDateString("fr-FR") : "Sélectionner"}
                        <ChevronDownIcon className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={start_date ? new Date(start_date) : undefined}
                        captionLayout="dropdown"
                        fromYear={currentYear}
                        toYear={currentYear + 5}
                        fromDate={new Date(todayStr)}
                        toDate={maxEndDate}
                        onSelect={handleStartDateSelect}
                        disabled={(date) => {
                          const normalized = new Date(date);
                          normalized.setHours(12, 0, 0, 0);
                          return normalized < new Date(todayStr) || normalized > maxEndDate;
                        }}
                        weekStartsOn={1}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {errors.start_date && <p className="text-red-600 text-xs mt-0.5">{errors.start_date}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm">Heure de prise</Label>
                <Popover open={pickupOpen} onOpenChange={setPickupOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-36 sm:w-40 justify-between font-normal text-sm"
                    >
                      {pickup_time || "12:00"}
                      <ClockIcon className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2">
                    <Input
                      type="time"
                      step={60}
                      value={pickup_time}
                      onChange={(e) => updateData("pickup_time", e.target.value)}
                      className="w-36 sm:w-40"
                    />
                  </PopoverContent>
                </Popover>
                {errors.pickup_time && <p className="text-red-600 text-xs mt-0.5">{errors.pickup_time}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-6 justify-center">
              <div className="flex flex-col gap-1">
                <Label className="text-sm">Date de fin</Label>
                <Popover open={endOpen} onOpenChange={setEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-36 sm:w-40 justify-between font-normal text-sm"
                    >
                      {endDateObj ? endDateObj.toLocaleDateString("fr-FR") : "Sélectionner"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateObj}
                      captionLayout="dropdown"
                      fromYear={currentYear}
                      toYear={currentYear + 5}
                      fromDate={minEndDate}
                      toDate={maxEndDate}
                      onSelect={handleEndDateSelect}
                      disabled={(date) => {
                        const normalized = new Date(date);
                        normalized.setHours(12, 0, 0, 0);
                        const min = isImmediate ? minEndDate : start_date ? new Date(start_date) : new Date(todayStr);
                        min.setHours(12, 0, 0, 0);
                        const belowMin = normalized < min;
                        const aboveMax = normalized > maxEndDate;
                        return belowMin || aboveMax;
                      }}
                      weekStartsOn={1}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                {errors.end_date && <p className="text-red-600 text-xs mt-0.5">{errors.end_date}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm">Heure de retour</Label>
                <Popover open={returnOpen} onOpenChange={setReturnOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-36 sm:w-40 justify-between font-normal text-sm"
                    >
                      {return_time || "12:00"}
                      <ClockIcon className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-2">
                    <Input
                      type="time"
                      step={60}
                      value={return_time}
                      onChange={(e) => {
                        updateData("return_time", e.target.value);
                        setReturnTimeManuallyChanged(true);
                      }}
                      className="w-36 sm:w-40"
                    />
                  </PopoverContent>
                </Popover>
                {errors.return_time && <p className="text-red-600 text-xs mt-0.5">{errors.return_time}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-6 justify-center">
              <div className="flex flex-col gap-1">
                <Label className="text-sm">Nombre de jours</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-36 sm:w-40"
                  value={inputDays}
                  onFocus={() => setDaysFocused(true)}
                  onBlur={() => {
                    setDaysFocused(false);
                    if (days != null) setInputDays(String(days));
                  }}
                  onChange={(e) => handleDaysChange(e.target.value)}
                />
                {errors.days && <p className="text-red-600 text-xs mt-0.5">{errors.days}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT CARD */}
      <div className="flex flex-col h-full">
        <ReservationInfoCard
          className="flex-1 flex flex-col"
          car={selectedCar}
          startDate={start_date}
          endDate={end_date}
          pickupTime={pickup_time}
          returnTime={return_time}
          showDays
          days={days || 0}
          formatDates
          contentClassName="space-y-1 sm:space-y-2 flex-1"
        />
      </div>

    </div>
  );
}
