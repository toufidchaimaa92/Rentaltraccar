import React, { useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CarFront,
  Edit,
  Fuel,
  Gauge,
  MoreVertical,
  Plus,
  Settings,
} from "lucide-react";

// ------------------ TYPES ------------------
interface Car {
  id: number;
  license_plate: string;
  wwlicense_plate?: string;
  status?: string;
}

interface CarModel {
  id: number;
  brand: string;
  model: string;
  fuel_type: string;
  price_per_day: number;
  transmission: string;
  finish: string;
  photos: { id: number; photo_path: string; order: number }[];
  cars?: Car[];
}

interface ShowCarModelProps {
  auth: { user: any };
  carModel: CarModel;
}

// ---------------------------------------------------

export default function ShowCarModel({ auth, carModel }: ShowCarModelProps) {
  const heroImage = useMemo(() => {
    const raw = carModel.photos?.[0]?.photo_path;
    if (!raw) return "/images/default-car.jpg";
    return raw.startsWith("http") ? raw : `/storage/${raw}`;
  }, [carModel.photos]);

  const statusBadge = (status?: string) => {
    const st = status?.toLowerCase();
    const classMap: any = {
      available: "bg-emerald-100 text-emerald-700",
      reserved: "bg-amber-100 text-amber-700",
      maintenance: "bg-red-100 text-red-700",
      rented: "bg-slate-200 text-slate-700",
    };
    return (
      <Badge variant="outline" className={classMap[st] || ""}>
        {status || "Inconnu"}
      </Badge>
    );
  };

  const cars = carModel.cars || [];
  const stats = {
    total: cars.length,
    rented: cars.filter((c) => c.status === "rented").length,
  };

  // ---------------------------------------------------

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Détails: ${carModel.brand} ${carModel.model}`} />

      <div className="space-y-6">
        {/* ================== PAGE HEADER ================== */}
        <div className="flex items-center justify-between">

          {/* LEFT: Title */}
          <h1 className="text-2xl font-semibold tracking-tight capitalize flex items-center gap-2">
            {carModel.brand} {carModel.model}
            {carModel.finish && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {carModel.finish}
              </Badge>
            )}
          </h1>

          {/* RIGHT: ACTION BUTTONS */}
          <div className="flex items-center gap-2">

            {/* Desktop button */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <Link href={route("car-models.edit", carModel.id)}>
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </Link>
            </Button>

            {/* Phone button (icon only) */}
            <Button
              variant="outline"
              size="icon"
              asChild
              className="sm:hidden"
            >
              <Link href={route("car-models.edit", carModel.id)}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>

          </div>
        </div>



        {/* ===================== 2-COLUMN LAYOUT ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ========== LEFT: HERO IMAGE ========== */}
         {/* ========== LEFT: HERO IMAGE (FULL CARD) ========== */}
<Card className="overflow-hidden rounded-2xl shadow-xl border h-full">
  <div className="relative w-full h-full aspect-square">
    <img
      src={heroImage}
      alt={`${carModel.brand} ${carModel.model}`}
      className="absolute inset-0 w-full h-full object-cover"
      onError={(e) =>
        ((e.currentTarget as HTMLImageElement).src = "/images/default-car.jpg")
      }
    />

    {/* Gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

    {/* Overlay text */}
    <div className="absolute bottom-0 left-0 w-full p-4 space-y-1 text-white">
      <div className="flex gap-2">
        <Badge className="bg-white/20 border-white/30 text-white backdrop-blur-sm text-xs">
          ID #{carModel.id}
        </Badge>

        {carModel.finish && (
          <Badge className="bg-white/20 border-white/30 text-white backdrop-blur-sm text-xs">
            {carModel.finish}
          </Badge>
        )}
      </div>

      <h2 className="text-lg font-semibold capitalize">
        {carModel.brand} {carModel.model}
      </h2>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge className="bg-black/40 border-white/20 text-white backdrop-blur-sm">
          {carModel.fuel_type}
        </Badge>
        <Badge className="bg-black/40 border-white/20 text-white backdrop-blur-sm">
          {carModel.transmission}
        </Badge>
        <Badge className="bg-emerald-600 text-white">
          {carModel.price_per_day} MAD / jour
        </Badge>
      </div>
    </div>
  </div>
</Card>

          {/* ========== RIGHT: VEHICLES LIST (TABLE) ========== */}
          <Card className="border border-border/60 rounded-xl h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Véhicules de ce modèle</CardTitle>
                  <CardDescription>
                    {stats.total} véhicules enregistrés.
                  </CardDescription>
                </div>

                <Button size="sm" asChild>
                  <Link href={route("cars.create") + `?car_model_id=${carModel.id}`}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {cars.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Matricule
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {cars.map((car) => (
                        <tr
                          key={car.id}
                          className="border-b hover:bg-muted/50 transition"
                        >
                          {/* Matricule */}
                          <td className="px-4 py-3 font-medium">
                            {car.license_plate}
                            {car.wwlicense_plate && (
                              <span className="block text-xs text-muted-foreground">
                                WW: {car.wwlicense_plate}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {statusBadge(car.status)}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={route("cars.show", car.id)}>
                                Voir
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground border-t">
                  Aucun véhicule enregistré pour ce modèle.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
