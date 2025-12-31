import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
type MobileCardItem = {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
};

type AdminMobileCardProps = {
  items: MobileCardItem[];
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

const AdminMobileCard: React.FC<AdminMobileCardProps> = ({ items, footer, onClick, className }) => {
  return (
    <Card
      className={cn("border border-border shadow-sm", onClick && "cursor-pointer", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className={cn("text-right", item.emphasis && "font-semibold")}>{item.value}</span>
          </div>
        ))}
      </CardContent>

      {footer ? (
        <CardFooter
          className="flex justify-end gap-2 pt-0"
          onClick={(event) => event.stopPropagation()}
        >
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
};

export default AdminMobileCard;
