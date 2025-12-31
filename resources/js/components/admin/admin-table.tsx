import React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Grid3X3,
  Search,
  Settings2,
  X,
} from "lucide-react";

export type AdminSortState = { by?: string | null; dir?: "asc" | "desc" | null };

export type AdminTableColumn = {
  id: string;
  label: React.ReactNode;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

export type AdminTableRow = {
  key: React.Key;
  cells: React.ReactNode[];
  className?: string;
  onClick?: () => void;
};

export type AdminPagination = {
  model: (number | "ellipsis")[];
  current?: number;
  last?: number;
  prev?: string | null;
  next?: string | null;
  findUrl: (page: number) => string | null;
  onPaginate: (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string | null,
  ) => void;
};

export type PaginatorLink = { url: string | null; label: string; active: boolean };

export function adminPaginationFromLinks(links?: PaginatorLink[]) {
  if (!links?.length)
    return { current: 1, last: 1, prev: null, next: null, findUrl: () => null };

  const numeric = links
    .map((l) => ({ ...l, num: /^\d+$/.test(l.label) ? Number(l.label) : null }))
    .filter((l) => l.num !== null) as (PaginatorLink & { num: number })[];

  const current = numeric.find((l) => l.active)?.num ?? 1;
  const last = Math.max(...numeric.map((l) => l.num));

  return {
    current,
    last,
    prev: links[0]?.url ?? null,
    next: links[links.length - 1]?.url ?? null,
    findUrl: (n: number) => numeric.find((l) => l.num === n)?.url ?? null,
  };
}

export function buildPaginationModel(current: number, last: number) {
  const visible = new Set([1, last, current - 1, current, current + 1]);
  return [...visible]
    .filter((n) => n >= 1 && n <= last)
    .sort((a, b) => a - b)
    .flatMap((n, i, arr) => (i > 0 && n - arr[i - 1] > 1 ? ["ellipsis", n] : [n]));
}

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onReset?: () => void;
  resetVisible?: boolean;
  submitLabel?: string;
  hideResetIcon?: boolean;
};

type AdminResourceProps = {
  id?: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

export const AdminResourceCard = React.forwardRef<HTMLDivElement, AdminResourceProps>(
  (
    {
      id,
      title,
      icon,
      actions,
      children,
      className,
      headerClassName,
      contentClassName,
    },
    ref,
  ) => {
    return (
      <Card ref={ref} id={id} className={cn("shadow-sm", className)}>
        <CardHeader
          className={cn(
            "relative space-y-3 gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between",
            headerClassName,
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-primary">

              {icon ?? <Grid3X3 className="h-5 w-5" />}
            </div>

            <CardTitle className="text-xl">{title}</CardTitle>
          </div>

          {actions ? (
            <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {actions}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
      </Card>
    );
  },
);

AdminResourceCard.displayName = "AdminResourceCard";

export function AdminSearchInput({
  value,
  onChange,
  onSearch,
  onReset,
  resetVisible,
  submitLabel = "",
  hideResetIcon,
}: AdminSearchInputProps) {
  const showReset =
    !hideResetIcon && Boolean(onReset) && (Boolean(resetVisible) || value.length > 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      className="w-full sm:w-auto"
    >
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher…"
          className="h-12 rounded-full border border-input bg-background pl-11 pr-32 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-10 sm:rounded-lg sm:pr-28"
        />

        <div className="pointer-events-none absolute inset-y-1 right-1 flex items-center gap-1">
          <Button
            type="submit"
            size="sm"
            className="pointer-events-auto flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-9 sm:rounded-lg sm:px-3.5"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>

          {showReset && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onReset?.();
                onChange("");
              }}
              className="pointer-events-auto h-8 w-8 rounded-full text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Réinitialiser</span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

type AdminFilterTriggerProps = {
  badgeCount?: number;
  label?: string;
  onClick?: () => void;
};

export function AdminFilterTrigger({ badgeCount, label = "Filtres", onClick }: AdminFilterTriggerProps) {
  const mobileButton = (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "ml-auto h-10 w-10 rounded-full p-0 sm:hidden",
        badgeCount ? "border-primary/50 text-primary shadow-sm" : "",
      )}
    >
      <Settings2 className="h-4 w-4" />
      <span className="sr-only">{label}</span>
      {badgeCount ? (
        <Badge className="absolute -right-1 -top-1 rounded-full px-1.5 py-0 text-[10px]" variant="secondary">
          {badgeCount}
        </Badge>
      ) : null}
    </Button>
  );

  const desktopButton = (
    <Button
      variant="outline"
      className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2"
      onClick={onClick}
    >
      <Settings2 className="h-4 w-4" />
      {label}
      {badgeCount ? (
        <Badge className="ml-2 rounded-full" variant="secondary">
          {badgeCount}
        </Badge>
      ) : null}
    </Button>
  );


  return (
    <>
      {onClick ? (
        <>
          {mobileButton}
          {desktopButton}
        </>
      ) : (
        <>
          <DialogTrigger asChild>{mobileButton}</DialogTrigger>
          <DialogTrigger asChild>{desktopButton}</DialogTrigger>
        </>
      )}
    </>
  );
}

function SortIcon({ sort, col }: { sort?: AdminSortState; col: string }) {
  if (sort?.by !== col) return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
  if (sort.dir === "asc") return <ChevronUp className="h-4 w-4" />;
  return <ChevronDown className="h-4 w-4" />;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn[];
  data: T[];
  renderRow: (row: T) => AdminTableRow;
  sort?: AdminSortState;
  onSort?: (col: string) => void;
  emptyMessage?: string;
  pagination?: AdminPagination;
}

export function AdminTable<T>({
  columns,
  data,
  renderRow,
  sort,
  onSort,
  emptyMessage = "Aucun enregistrement trouvé.",
  pagination,
}: AdminTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.id} className={cn(col.headerClassName)}>
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.id)}
                      className="flex w-full items-center gap-2 text-left font-medium"
                    >
                      <span className="flex-1 truncate">{col.label}</span>
                      <SortIcon sort={sort} col={col.id} />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const rendered = renderRow(row);
                const clickable = typeof rendered.onClick === "function";

                return (
                  <TableRow
                    key={rendered.key ?? idx}
                    className={cn(rendered.className, clickable && "cursor-pointer hover:bg-muted/50 focus-within:bg-muted/50")}
                    onClick={rendered.onClick}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            rendered.onClick?.();
                          }
                        }
                        : undefined
                    }
                  >
                    {rendered.cells.map((cell, i) => (
                      <TableCell key={`${rendered.key}-${i}`} className={cn(columns[i]?.cellClassName)}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={pagination.prev ?? undefined}
                onClick={(e) => pagination.onPaginate(e, pagination.prev ?? null)}
                className={!pagination.prev ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {pagination.model.map((item, i) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  {(() => {
                    const pageUrl = pagination.findUrl(item);
                    const isActive = pagination.current === item;

                    return (
                      <PaginationLink
                        href={pageUrl ?? undefined}
                        onClick={(e) => pagination.onPaginate(e, pageUrl)}
                        className={!pageUrl ? "pointer-events-none opacity-50" : ""}
                        isActive={isActive}
                      >
                        {item}
                      </PaginationLink>
                    );
                  })()}
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={pagination.next ?? undefined}
                onClick={(e) => pagination.onPaginate(e, pagination.next ?? null)}
                className={!pagination.next ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}