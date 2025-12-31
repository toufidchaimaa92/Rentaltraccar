import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  LinkIcon,
} from "lucide-react";
import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

type Car = {
  id: number;
  car_model: {
    brand: string;
    model: string;
  } | null;
  license_plate: string | null;
  wwlicense_plate: string | null;
  status: string;
  insurance_expiry_date: string | null;
  technical_check_expiry_date: string | null;
  mileage: number | null;
};

export const columns: ColumnDef<Car>[] = [
  {
    id: "view",
    header: "View",
    size: 60,
    cell: ({ row }) => {
      const car = row.original;
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/cars/${car.id}`}>
            <EyeIcon className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Link>
        </Button>
      );
    },
  },
  {
    id: "model",
    accessorFn: (row) =>
      row.car_model ? `${row.car_model.brand} ${row.car_model.model}` : "N/A",
    header: () => <div className="max-w-[200px] truncate">Modèle</div>,
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">{row.getValue("model")}</div>
    ),
    size: 220,
  },
  {
    id: "license_plate",
    accessorKey: "license_plate",
    header: "Plaque",
    cell: ({ row }) => (
      <div>{row.getValue("license_plate") || row.original.wwlicense_plate || "N/A"}</div>
    ),
    size: 150,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => <div>{row.getValue("status")}</div>,
    size: 120,
  },
  {
    id: "insurance_expiry_date",
    accessorKey: "insurance_expiry_date",
    header: "Assurance (expiry)",
    cell: ({ row }) => <div>{row.getValue("insurance_expiry_date") || "—"}</div>,
    size: 140,
  },
  {
    id: "technical_check_expiry_date",
    accessorKey: "technical_check_expiry_date",
    header: "Contrôle technique (expiry)",
    cell: ({ row }) => <div>{row.getValue("technical_check_expiry_date") || "—"}</div>,
    size: 170,
  },
  {
    id: "mileage",
    accessorKey: "mileage",
    header: () => <div className="text-center w-full">Kilométrage</div>,
    cell: ({ row }) => (
      <div className="text-center w-full">{row.getValue("mileage") ?? "—"}</div>
    ),
    size: 100,
  },
  {
    id: "actions",
    header: "Actions",
    size: 120,
    cell: ({ row }) => {
      const car = row.original;
      const [open, setOpen] = useState(false);
      const [processing, setProcessing] = useState(false);

      const handleDelete = () => {
        setProcessing(true);
        router.delete(route("cars.destroy", car.id), {
          onFinish: () => {
            setProcessing(false);
            setOpen(false);
            toast.success("Voiture supprimée.");
          },
        });
      };

      const handleCopyLink = () => {
        const url = `${window.location.origin}/cars/${car.id}`;
        navigator.clipboard.writeText(url).then(() => {
          toast.success("Lien copié dans le presse-papiers !");
        });
      };

      return (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/cars/${car.id}`}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Voir
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/cars/${car.id}/edit`}
                  className="flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Copier le lien
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpen(true)}>
                <div className="flex items-center text-red-600 gap-2">
                  <TrashIcon className="h-4 w-4" />
                  Supprimer
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et supprimera définitivement cette voiture.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={processing}
              >
                {processing ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
