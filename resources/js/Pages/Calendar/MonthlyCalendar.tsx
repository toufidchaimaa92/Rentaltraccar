"use client";

import { router } from "@inertiajs/react";
import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

// ===== Helpers: compare by *local* calendar day (avoid UTC drift) =====
const toLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Types
interface Car {
  id: string;
  make: string;
  model: string;
  license_plate: string;
}
interface Client {
  phone: string;
}
interface CarModel {
  brand: string;
  model: string;
}
interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  status: string;
  car_id?: string | null;
  car_model_id?: string | null;
  car?: Car | null;
  client?: Client | null;
  carModel: CarModel;
  eventType?: "start" | "end" | "single" | "due";
  displayColor?: string;
  paid_amount?: number;
  total_amount?: number;
  reste_a_payer?: number;
  has_payment_due?: boolean;
  payment_status?: string | null;
}
interface Props {
  auth: { user: any };
  events: Event[];
  currentDate: Date;
  today: Date;
  setCurrentDate: (date: Date) => void;
  setEvents: (events: Event[]) => void;
  setCurrentView: (view: "month" | "day") => void;
}

export default function MonthlyCalendar({
  auth,
  events,
  currentDate,
  today,
  setCurrentDate,
  setEvents,
  setCurrentView,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const todayRef = useRef<HTMLDivElement | null>(null);

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // ===== Only show events when the cell date equals local start OR local end (or single-day) =====
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = toLocalYMD(date);
    return events
      .filter((event) => event.status !== "completed")
      .map((event) => {
        const isDue = event.status?.toLowerCase() === "due";
        const start = new Date(event.start);
        const end = new Date(event.end);
        const startStr = toLocalYMD(start);
        const endStr = toLocalYMD(end);

        if (dateStr === startStr || dateStr === endStr) {
          const eventType = isDue
            ? "due"
            : startStr === endStr
              ? "single"
              : dateStr === startStr
                ? "start"
                : "end";

          const displayColor = (() => {
            if (eventType === "due") return "amber";
            if (eventType === "start" || eventType === "single") return "blue";
            return "red";
          })();

          return { ...event, eventType, displayColor };
        }
        return null;
      })
      .filter((e): e is Event => Boolean(e));
  };

  const fetchEvents = () => {
    setIsLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const url = `/calendar/month?year=${year}&month=${month}`;

    router.get(url, {}, {
      preserveState: true,
      preserveScroll: true,
      only: ["events"],
      onSuccess: (page: any) => {
        if (!page.props.events) {
          setIsLoading(false);
          return;
        }

        const fetchedEvents = page.props.events
          .map((event: any) => {
            if (!event.start || !event.end) return null;
            try {
              const startDate = new Date(event.start);
              const endDate = new Date(event.end);
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return null;
              }
              // IMPORTANT: keep server strings to avoid forcing UTC via toISOString()
              return {
                id: String(event.id),
                title: String(event.title),
                start: event.start,
                end: event.end,
                color: event.color || "blue",
                status: event.status || "pending",
                car_id: event.car_id || null,
                car_model_id: event.car_model_id || null,
                car: event.car || null,
                client: event.client || null,
                carModel: event.carModel || { brand: "Unknown", model: "Unknown" },
                paid_amount: event.paid_amount ?? 0,
                total_amount: event.total_amount ?? 0,
                reste_a_payer: event.reste_a_payer ?? 0,
                has_payment_due: event.has_payment_due ?? false,
                payment_status: event.payment_status ?? null,
              } as Event;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
          .filter((event: Event) => event.status !== "completed");

        setEvents(fetchedEvents as Event[]);
        setIsLoading(false);
      },
      onError: () => setIsLoading(false),
    });
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: { date: Date; isCurrentMonth: boolean; events: Event[] }[] = [];

    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, 1 - (startDay - i));
      days.push({ date: d, isCurrentMonth: false, events: getEventsForDate(d) });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push({ date: d, isCurrentMonth: true, events: getEventsForDate(d) });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    const trailingDaysNeeded = totalCells - days.length;
    for (let i = 0; i < trailingDaysNeeded; i++) {
      const d = new Date(year, month + 1, i + 1);
      days.push({ date: d, isCurrentMonth: false, events: getEventsForDate(d) });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  useEffect(() => {
    if (window.innerWidth >= 768) return;
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [calendarDays]);

  return (
    <>
      {isLoading && (
        <div className="mb-2 text-center text-muted-foreground">
          Chargement des événements…
        </div>
      )}

      <div className="hidden md:grid grid-cols-7 border-border divide-x divide-border">
        {dayNames.map((day) => (
          <div
            key={day}
            className="border-b border-border py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-7">
        {calendarDays.map((day, index) => {
          const isToday = day.date.toDateString() === today.toDateString();

          return (
            <div
              key={index}
              ref={isToday ? todayRef : null}
              onClick={() => {
                setCurrentDate(day.date);
                setCurrentView("day");
              }}
              className={`
                relative flex flex-col border-b border-r p-1 md:p-2 md:aspect-square cursor-pointer
                transition hover:bg-muted/50
                ${!day.isCurrentMonth ? "bg-muted/50 hidden md:flex" : "bg-card"}
                ${isToday ? "bg-primary/5" : ""}

              `}
            >
              <div
                className={`mb-1 text-sm font-medium w-fit p-1 rounded-full
                  ${isToday ? "bg-primary text-white" : ""}
                `}
              >
                {day.date.getDate()}
              </div>

              <div className="space-y-1">
                {day.events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={`${event.id}-${eventIndex}`}
                    className={`truncate text-xs ${
                      event.displayColor === "blue"
                        ? "text-blue-600"
                        : event.displayColor === "red"
                          ? "text-red-600"
                          : "text-amber-600"
                    }`}
                  >
                    <Badge
                      variant="outline"
                      className={`w-full rounded-sm p-1 text-left text-xs ${
                        event.displayColor === "blue"
                          ? "border-blue-600 text-blue-600"
                          : event.displayColor === "red"
                            ? "border-red-600 text-red-600"
                            : "border-amber-600 text-amber-600"
                      } bg-transparent`}
                    >
                      <div className="truncate">
                        {event.eventType === "start" && "▶ "}
                        {event.eventType === "end" && "◀ "}
                        {event.eventType === "single" && "● "}
                        {event.eventType === "due" && "⚠ "}
                        {event.title}
                      </div>

                      <div className="truncate text-[11px] opacity-80">
                        {event.carModel?.model}{" "}
                        {event.client?.phone && <>📞 {event.client.phone}</>}
                      </div>
                    </Badge>
                  </div>
                ))}

                {day.events.length > 2 && (
                  <div className="pl-1 text-xs text-muted-foreground">
                    +{day.events.length - 2} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}