import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Car, Calendar, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { cn } from "@/lib/utils";

export default function SelectType() {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleSelect = (type: string) => {
    if (loadingType) return;
    setLoadingType(type);

    const options = {
      preserveScroll: true,
      preserveState: true,
      onFinish: () => setLoadingType(null),
    };

    if (type === "immediate") router.visit(route("rentals.createImmediate"), options);
    if (type === "reservation") router.visit(route("rentals.createReservation"), options);
    if (type === "long_term") router.visit(route("rentals.createLongTerm"), options);
  };

  const types = [
    {
      key: "immediate",
      Icon: Car,
      title: "Location Immédiate",
      iconBg:
        "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    },
    {
      key: "reservation",
      Icon: Calendar,
      title: "Réservation",
      iconBg:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    {
      key: "long_term",
      Icon: Building2,
      title: "Location Longue Durée",
      iconBg:
        "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="min-h-[70vh] flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6">
          {/* Title */}
          <h1 className="text-center text-4xl font-semibold tracking-tight
            text-gray-900 dark:text-white mb-16">
            Sélectionner le type de location
          </h1>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {types.map(({ key, Icon, title, iconBg }) => {
              const isLoading = loadingType === key;
              const isDisabled = loadingType !== null;

              return (
              <motion.button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={isDisabled}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                className="
                  relative group rounded-2xl p-10 text-center
                  dark:
                  border border-gray-200 dark:border-white/10
                  shadow-sm dark:shadow-none
                  hover:border-primary/50
                  hover:shadow-lg dark:hover:shadow-none
                  transition-all duration-300
                  focus:outline-none
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {/* subtle glow (dark only) */}
                <div className="absolute inset-0 rounded-2xl opacity-0
                  dark:group-hover:opacity-100 transition
                  bg-primary/5 pointer-events-none" />

                {isLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/80 text-sm font-medium text-gray-700 dark:bg-black/40 dark:text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement...
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center",
                      "ring-1 ring-black/5 dark:ring-white/10",
                      iconBg
                    )}
                  >
                    <Icon className="w-10 h-10" />
                  </div>

                  <h3 className="text-xl font-semibold
                    text-gray-900 dark:text-white">
                    {title}
                  </h3>
                </div>
              </motion.button>
            );
            })}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
