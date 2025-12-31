import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ReservationInfoCard from "@/components/rentals/ReservationInfoCard";
import { fr } from "date-fns/locale";

interface Photo { photo_path: string; }
interface SelectedCar {
  brand: string;
  model: string;
  fuel_type?: string;
  transmission?: string;
  finish?: string;
  photos?: Photo[];
}

interface StepRentalDatesProps {
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  days: number;
  updateData: (key: string, value: any) => void;
  errors?: Record<string, string>;
  selectedCar?: SelectedCar;
  /** Optional: limit which weekdays can be chosen as start date. 0=Sun..6=Sat */
  allowedStartWeekdays?: number[];
}

export default function StepRentalDates({
  start_date,
  end_date,
  pickup_time,
  return_time,
  days,
  updateData,
  errors = {},
  selectedCar,
  allowedStartWeekdays,
}: StepRentalDatesProps) {
  // Popover states
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnTimeManuallyChanged, setReturnTimeManuallyChanged] = useState(false);

  // Today (no start date before today)
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Freeze initial values (for “only reduce” rules)
  const initialEndRef = useRef<Date | null>(end_date ? new Date(end_date) : null);
  const initialDaysRef = useRef<number>(Math.max(1, Number(days) || 1));
  useEffect(() => {
    // Normalize initial end ref once
    if (initialEndRef.current) initialEndRef.current.setHours(12, 0, 0, 0);
  }, []);

  const endDateObj = end_date ? new Date(end_date) : undefined;
  if (endDateObj) endDateObj.setHours(12, 0, 0, 0);

  // Initialize defaults
  useEffect(() => {
    if (!start_date) updateData("start_date", todayStr);
    if (!pickup_time) updateData("pickup_time", "12:00");
    if (!return_time) updateData("return_time", pickup_time || "12:00");
  }, []);

  // Keep return_time in sync unless user changed it
  useEffect(() => {
    if (!returnTimeManuallyChanged && pickup_time) {
      updateData("return_time", pickup_time);
    }
  }, [pickup_time]);

  // Recalculate days whenever dates change (inclusive count)
  useEffect(() => {
    if (start_date && end_date) {
      const s = new Date(start_date); s.setHours(12,0,0,0);
      const e = new Date(end_date); e.setHours(12,0,0,0);
      const diffDays = Math.max(1, Math.floor((e.getTime() - s.getTime()) / 86400000) + 1);
      // Clamp days to not exceed initial days
      updateData("days", Math.min(diffDays, initialDaysRef.current));
      // If selected end tries to extend beyond initial, clamp end to initial
      if (initialEndRef.current && e.getTime() > initialEndRef.current.getTime()) {
        const clamp = new Date(initialEndRef.current);
        updateData("end_date", clamp.toISOString().split("T")[0]);
      }
    } else {
      updateData("days", null);
    }
  }, [start_date, end_date]);

  // Helpers
  const isStartWeekdayAllowed = (date: Date) => {
    if (!allowedStartWeekdays || allowedStartWeekdays.length === 0) return true;
    const weekday = date.getDay(); // 0..6
    return allowedStartWeekdays.includes(weekday);
  };

  const disableStartDate = (date: Date) => {
    const normalized = new Date(date); normalized.setHours(12, 0, 0, 0);
    // cannot pick before today
    if (normalized < new Date(todayStr)) return true;
    // respect allowed weekdays if provided
    if (!isStartWeekdayAllowed(normalized)) return true;
    return false;
  };

  const disableEndDate = (date: Date) => {
    const normalized = new Date(date); normalized.setHours(12, 0, 0, 0);
    const min = start_date ? new Date(start_date) : new Date(todayStr);
    min.setHours(12,0,0,0);
    // cannot be before start
    if (normalized < min) return true;
    // cannot extend beyond initial end (only reduce)
    if (initialEndRef.current && normalized > initialEndRef.current) return true;
    return false;
  };

  // Centered layout: everything in the middle, right panel optional
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-start justify-center px-2 sm:px-4 gap-4 lg:gap-8">

      {/* LEFT (main) */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Sélection des dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Row 1: Start Date + Pickup Time */}
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Start date */}
            <div className="flex flex-col gap-1 items-center">
              <Label className="text-sm">Date de début</Label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-between font-normal text-sm">
                    {start_date ? new Date(start_date).toLocaleDateString("fr-FR") : "Sélectionner"}
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={start_date ? new Date(start_date) : undefined}
                    captionLayout="dropdown"
                    fromDate={new Date(todayStr)}
                    onSelect={(date) => {
                      if (!date) return;
                      const selected = new Date(date); selected.setHours(12,0,0,0);
                      // enforce not before today (already covered by disabled)
                      if (selected < today) return;

                      updateData("start_date", selected.toISOString().split("T")[0]);

                      // if end is before start, clamp end to start
                      if (end_date) {
                        const end = new Date(end_date); end.setHours(12,0,0,0);
                        if (end < selected) {
                          updateData("end_date", selected.toISOString().split("T")[0]);
                          updateData("days", 1);
                        }
                      } else {
                        updateData("end_date", selected.toISOString().split("T")[0]);
                        updateData("days", 1);
                      }
                      setStartOpen(false);
                    }}
                    disabled={disableStartDate}
                    weekStartsOn={1}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && <p className="text-red-600 text-xs mt-0.5">{errors.start_date}</p>}
            </div>

            {/* Pickup time */}
            <div className="flex flex-col gap-1 items-center">
              <Label className="text-sm">Heure de prise</Label>
              <Popover open={pickupOpen} onOpenChange={setPickupOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-between font-normal text-sm">
                    {pickup_time || "12:00"}
                    <ClockIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-auto p-2">
                  <Input
                    type="time"
                    step="60"
                    value={pickup_time}
                    onChange={(e) => updateData("pickup_time", e.target.value)}
                    className="w-40"
                  />
                </PopoverContent>
              </Popover>
              {errors.pickup_time && <p className="text-red-600 text-xs mt-0.5">{errors.pickup_time}</p>}
            </div>
          </div>

          {/* Row 2: End Date + Return Time */}
          <div className="flex flex-wrap gap-4 justify-center">
            {/* End date */}
            <div className="flex flex-col gap-1 items-center">
              <Label className="text-sm">Date de fin (réduction seulement)</Label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-between font-normal text-sm">
                    {endDateObj ? endDateObj.toLocaleDateString("fr-FR") : "Sélectionner"}
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={endDateObj}
                    captionLayout="dropdown"
                    fromDate={new Date(todayStr)}
                    onSelect={(date) => {
                      if (!date || !start_date) return;
                      const selected = new Date(date); selected.setHours(12,0,0,0);
                      // cannot exceed initial end
                      if (initialEndRef.current && selected > initialEndRef.current) return;

                      const start = new Date(start_date); start.setHours(12,0,0,0);
                      if (selected < start) return;

                      // inclusive count, clamp to initial days
                      let diffDays = Math.max(1, Math.floor((selected.getTime() - start.getTime()) / 86400000) + 1);
                      if (diffDays > initialDaysRef.current) {
                        diffDays = initialDaysRef.current;
                        // recompute end date from clamped days
                        const clampedEnd = new Date(start);
                        clampedEnd.setDate(start.getDate() + (initialDaysRef.current - 1));
                        updateData("end_date", clampedEnd.toISOString().split("T")[0]);
                        updateData("days", initialDaysRef.current);
                      } else {
                        updateData("end_date", selected.toISOString().split("T")[0]);
                        updateData("days", diffDays);
                      }
                      setEndOpen(false);
                    }}
                    disabled={disableEndDate}
                    weekStartsOn={1}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && <p className="text-red-600 text-xs mt-0.5">{errors.end_date}</p>}
            </div>

            {/* Return time */}
            <div className="flex flex-col gap-1 items-center">
              <Label className="text-sm">Heure de retour</Label>
              <Popover open={returnOpen} onOpenChange={setReturnOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-between font-normal text-sm">
                    {return_time || "12:00"}
                    <ClockIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-auto p-2">
                  <Input
                    type="time"
                    step="60"
                    value={return_time}
                    onChange={(e) => {
                      updateData("return_time", e.target.value);
                      setReturnTimeManuallyChanged(true);
                    }}
                    className="w-40"
                  />
                </PopoverContent>
              </Popover>
              {errors.return_time && <p className="text-red-600 text-xs mt-0.5">{errors.return_time}</p>}
            </div>
          </div>

          {/* Row 3: Days (can only reduce) */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex flex-col gap-1 items-center">
              <Label className="text-sm">Nombre de jours</Label>
              <Input
                type="number"
                min={1}
                max={initialDaysRef.current}
                className="w-40 text-center"
                value={days ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    updateData("days", null);
                    return;
                  }
                  const num = Math.max(1, Math.min(parseInt(value, 10) || 1, initialDaysRef.current));
                  updateData("days", num);

                  if (start_date) {
                    const s = new Date(start_date); s.setHours(12,0,0,0);
                    const newEnd = new Date(s);
                    // inclusive end = start + (days - 1)
                    newEnd.setDate(s.getDate() + (num - 1));
                    // also cannot pass initial end
                    if (initialEndRef.current && newEnd > initialEndRef.current) {
                      const clamp = new Date(initialEndRef.current);
                      updateData("end_date", clamp.toISOString().split("T")[0]);
                    } else {
                      updateData("end_date", newEnd.toISOString().split("T")[0]);
                    }
                  }
                }}
              />
              {errors.days && <p className="text-red-600 text-xs mt-0.5">{errors.days}</p>}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* RIGHT (summary) */}
      {selectedCar && (
        <div className="w-full lg:w-[400px] space-y-2 mx-auto">
          <ReservationInfoCard
            car={selectedCar}
            startDate={start_date}
            endDate={end_date}
            pickupTime={pickup_time}
            returnTime={return_time}
            showDays
            days={days}
            formatDates
            contentClassName="space-y-2"
            titleClassName="text-center text-base"
          />
        </div>
      )}

    </div>
  );
}
