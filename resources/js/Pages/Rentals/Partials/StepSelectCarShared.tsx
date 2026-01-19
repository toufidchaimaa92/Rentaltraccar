/* 
  ✨ Redesigned StepSelectCarShared
  - Premium UX
  - shadcn/ui Dialog
  - Dark mode perfect
  - Strong green selection
  - Mobile friendly
*/

import React, {
  useMemo,
  useState,
  useDeferredValue,
  useEffect,
  useRef,
} from "react";
import { Search, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SharedCarCard, {
  CarModel as SharedCarModel,
} from "@/components/cars/SharedCarCard";

/* ---- TYPES ---- */
interface CarType {
  id: number;
  license_plate: string;
  status?: string;
}

export interface CarModel extends SharedCarModel {
  cars?: CarType[];
}

export interface StepSelectCarSharedProps {
  car_model_id: string | number;
  car_id?: string | number;
  updateData: (key: string, value: any) => void;
  carModels?: CarModel[];
  requireCarSelection?: boolean;
  selectionColor?: "green";
  isLoading?: boolean;
}

/* ---- CONSTANTS ---- */
const statusConfig = {
  available: { text: "Disponible", color: "green" },
  rented: { text: "Louée", color: "red" },
  reserved: { text: "Réservé", color: "gray" },
  maintenance: { text: "Maintenance", color: "gray" },
} as const;

/* ---- SKELETON (DARK SAFE) ---- */
const CarCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-background animate-pulse overflow-hidden">
    <div className="h-40 w-full bg-muted" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded" />
      </div>
      <div className="h-5 bg-muted rounded w-16 ml-auto" />
    </div>
  </div>
);

/* ---- MAIN ---- */
export default function StepSelectCarShared({
  car_model_id,
  car_id,
  updateData,
  carModels = [],
  requireCarSelection = false,
  isLoading = false,
}: StepSelectCarSharedProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [limit, setLimit] = useState(24);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | number | null>(
    car_id ?? null
  );

  useEffect(() => setSelectedCarId(car_id ?? null), [car_id]);

  /* MAP SEARCH */
  const modelsWithSearch = useMemo(
    () =>
      carModels.map((m) => ({
        ...m,
        _search: `${m.brand} ${m.model}`.toLowerCase(),
      })),
    [carModels]
  );

  /* FILTER */
  const filteredModels = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return !q
      ? modelsWithSearch
      : modelsWithSearch.filter((m) => m._search.includes(q));
  }, [deferredSearch, modelsWithSearch]);

  useEffect(() => setLimit(24), [deferredSearch]);

  const visible = filteredModels.slice(0, limit);
  const hasMore = filteredModels.length > limit;

  /* INFINITE SCROLL */
  useEffect(() => {
    if (!hasMore) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((p) => p + 24);
      },
      { rootMargin: "200px" }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore]);

  const handleModelClick = (model: CarModel) => {
    updateData("car_model_id", model.id);
    if (requireCarSelection) {
      setSelectedModel(model);
      setModalOpen(true);
    }
  };

  const handleCarSelect = (id: number | string) => {
    if (selectedModel) updateData("car_model_id", selectedModel.id);
    updateData("car_id", id);
    setSelectedCarId(id);
    setModalOpen(false);
    setSelectedModel(null);
  };

  const isSkeleton = isLoading && !carModels.length;

  return (
    <div className="space-y-4">
      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une marque ou un modèle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full h-11 rounded-2xl border border-border px-10 text-sm
            bg-background
            focus:ring-2 focus:ring-green-500/30
            dark:focus:ring-green-400/40
          "
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {isSkeleton ? (
          Array.from({ length: 8 }).map((_, i) => (
            <CarCardSkeleton key={i} />
          ))
        ) : visible.length ? (
          visible.map((m) => (
            <SharedCarCard
              key={m.id}
              model={m}
              isSelected={String(car_model_id) === String(m.id)}
              onClick={() => handleModelClick(m)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm">
            <Info className="h-5 w-5 opacity-80" />
            <p>Aucun modèle trouvé</p>
          </div>
        )}
      </div>

      {hasMore && <div ref={loadMoreRef} className="h-px w-full" />}

      {/* MODAL */}
      {requireCarSelection && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            {/* HEADER */}
            <DialogHeader className="pb-2 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    Sélectionner une voiture
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedModel?.brand} {selectedModel?.model}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* LIST */}
            <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto ">
              {selectedModel?.cars?.length ? (
                selectedModel.cars.map((car) => {
                  const selected =
                    String(selectedCarId) === String(car.id);
                  const cfg =
                    statusConfig[
                      (car.status ?? "").toLowerCase() as keyof typeof statusConfig
                    ] ?? { text: "Inconnu", color: "gray" };

                  return (
                    <div
                      key={car.id}
                      onClick={() => handleCarSelect(car.id)}
                      className={[
                        "cursor-pointer rounded-xl border px-4 py-3 transition-all",
                        "flex flex-col gap-2",
                        selected
                          ? `
                              border-green-600
                              bg-green-50
                              ring-2 ring-green-200
                              dark:bg-green-900/30
                              dark:border-green-500
                              dark:ring-green-500/40
                            `
                          : `
                              hover:border-green-400
                              hover:bg-muted/40
                            `,
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm tracking-wide">
                          {car.license_plate}
                        </span>

                        <Badge
                          variant="outline"
                          className={[
                            "uppercase text-[10px] px-2 py-0.5",
                            cfg.color === "green"
                              ? "text-green-700 border-green-500 bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                              : cfg.color === "red"
                              ? "text-red-700 border-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300"
                              : "text-muted-foreground border-border bg-muted",
                          ].join(" ")}
                        >
                          {cfg.text}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Info className="h-5 w-5 mb-2 opacity-70" />
                  <p className="text-sm text-center">
                    Aucune voiture disponible pour ce modèle
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
