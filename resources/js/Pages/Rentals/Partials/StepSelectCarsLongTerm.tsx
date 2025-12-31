/* 
  ✨ StepSelectCarsLongTerm
  - Same design as StepSelectCarShared
  - Premium cards
  - Auto / Manu transmission
  - Unified search & badges
*/

import React, { useMemo, useState } from "react";
import { Search, X, Info, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  id: number | string;
  license_plate: string;
  status?: string;
}

interface CarModelType extends SharedCarModel {
  cars?: CarType[];
}

interface VehicleSelection {
  car_id: number | string;
  car_model_id: number | string;
  monthly_price: string | number;
  price_input_type?: "ht" | "ttc";
}

interface Props {
  carModels: CarModelType[];
  vehicles: VehicleSelection[];
  setVehicles: (vehicles: VehicleSelection[]) => void;
}

/* ---- CONSTANTS ---- */
const statusConfig = {
  available: { text: "Disponible", color: "green" },
  rented: { text: "Louée", color: "red" },
  reserved: { text: "Réservé", color: "gray" },
  maintenance: { text: "Maintenance", color: "gray" },
} as const;

/* ---- MAIN ---- */
export default function StepSelectCarsLongTerm({
  carModels,
  vehicles,
  setVehicles,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<CarModelType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  /* MAP MODELS */
  const modelsWithMeta = useMemo(
    () =>
      carModels.map((m) => {
        return {
          ...m,
          _search: `${m.brand ?? ""} ${m.model ?? ""}`.toLowerCase(),
        };
      }),
    [carModels]
  );

  /* FILTER */
  const filteredModels = useMemo(() => {
    const q = search.toLowerCase().trim();
    return !q
      ? modelsWithMeta
      : modelsWithMeta.filter((m) => m._search.includes(q));
  }, [modelsWithMeta, search]);

  /* TOGGLE VEHICLE */
  const toggleCar = (car: CarType, model: CarModelType) => {
    const exists = vehicles.some((v) => String(v.car_id) === String(car.id));

    setVehicles(
      exists
        ? vehicles.filter((v) => String(v.car_id) !== String(car.id))
        : [
            ...vehicles,
            {
              car_id: car.id,
              car_model_id: model.id,
              monthly_price: "",
              price_input_type: "ttc",
            },
          ]
    );
  };

  const isCarSelected = (carId: string | number) =>
    vehicles.some((v) => String(v.car_id) === String(carId));

  return (
    <div className="space-y-4">
      {/* SEARCH (same as Shared) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une marque ou un modèle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 rounded-2xl border px-10 text-sm focus:ring-2 focus:ring-green-200"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-gray-200"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredModels.length ? (
          filteredModels.map((model) => {
            const hasSelection = vehicles.some(
              (v) => String(v.car_model_id) === String(model.id)
            );

            return (
              <SharedCarCard
                key={model.id}
                model={model}
                isSelected={hasSelection}
                onClick={() => {
                  setSelectedModel(model);
                  setModalOpen(true);
                }}
                showPrice
              />
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm">
            <Info className="h-5 w-5 opacity-80" />
            Aucun modèle trouvé
          </div>
        )}
      </div>

      {/* MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle>Sélectionner des véhicules</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {selectedModel?.cars?.length ? (
              selectedModel.cars.map((car) => {
                const selected = isCarSelected(car.id);
                const cfg =
                  statusConfig[
                    (car.status ?? "").toLowerCase() as keyof typeof statusConfig
                  ] ?? { text: "Inconnu", color: "gray" };

                return (
                  <div
                    key={car.id}
                    onClick={() =>
                      selectedModel && toggleCar(car, selectedModel)
                    }
                    className={[
                      "cursor-pointer rounded-xl border p-4 transition-all text-sm flex flex-col gap-3",
                      selected
                        ? "border-green-500 bg-green-500/10"
                        : "hover:border-green-400",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{car.license_plate}</p>

                      <Badge
                        variant="outline"
                        className={
                          cfg.color === "green"
                            ? "border-green-500 bg-green-500/15 text-green-600"
                            : cfg.color === "red"
                            ? "border-red-500 bg-red-500/15 text-red-600"
                            : "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {cfg.text}
                      </Badge>
                    </div>

                    {selected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCar(car, selectedModel);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-green-500 text-green-600 hover:bg-green-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCar(car, selectedModel);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucun véhicule disponible
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
