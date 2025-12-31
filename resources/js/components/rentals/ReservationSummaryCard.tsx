import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReservationSummaryItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  divider?: boolean;
};

type ReservationSummaryCardProps = {
  items: ReservationSummaryItem[];
  title?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  headerActions?: React.ReactNode;
  variant?: "card" | "plain";
};

export function ReservationSummaryCard({
  items,
  title = "Résumé de la Réservation",
  className,
  contentClassName,
  titleClassName,
  headerActions,
  variant = "card",
}: ReservationSummaryCardProps) {
  if (variant === "plain") {
    return (
      <section className={cn("space-y-2", className)}>
        {title && (
          <h2 className={cn("font-bold mb-2 text-foreground border-b pb-1", titleClassName)}>
            {title}
          </h2>
        )}
        <div className={cn("space-y-2 text-sm", contentClassName)}>
          {items.map((item, idx) => (
            <div
              key={idx}
              className={cn("flex justify-between", item.divider && "border-t pt-2", item.className)}
            >
              <span className={cn(item.labelClassName)}>{item.label}</span>
              <span className={cn("font-medium", item.valueClassName)}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
          <CardTitle className={cn(titleClassName)}>{title}</CardTitle>
          {headerActions}
      </CardHeader>
      <CardContent className={cn("space-y-2 text-sm", contentClassName)}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn("flex justify-between", item.divider && "border-t pt-2", item.className)}
          >
            <span className={cn( item.labelClassName)}>{item.label}</span>
            <span className={cn("font-medium", item.valueClassName)}>{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ReservationSummaryCard;
