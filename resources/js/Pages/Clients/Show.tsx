import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  Edit,
  User,
  Phone,
  Home,
  CreditCard,
  FileText,
  ScrollText,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RentalStatusBadge from "@/components/rentals/RentalStatusBadge";
import { Link } from "@inertiajs/react";
import { ImageZoom } from "@/components/file/imagezoom";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";

export default function ShowClient({ auth, client }) {
  const toStorageUrl = (p?: string | null) =>
    !p
      ? null
      : p.startsWith("http://") || p.startsWith("https://")
        ? p
        : p.startsWith("/storage/")
          ? p
          : `/storage/${p}`;

  const documents = useMemo(
    () =>
      [
        { url: toStorageUrl(client.license_front_image), label: "Permis – Recto" },
        { url: toStorageUrl(client.license_back_image), label: "Permis – Verso" },
        { url: toStorageUrl(client.cin_front_image), label: "CIN – Recto" },
        { url: toStorageUrl(client.cin_back_image), label: "CIN – Verso" },
      ].filter((d) => !!d.url),
    [client]
  );

  const rentals = Array.isArray(client.rentals) ? client.rentals : [];
  const [visibleCount, setVisibleCount] = useState(2);
  const visibleRentals = rentals.slice(0, visibleCount);

  const ratingValue = Number.isFinite(Number(client?.rating))
    ? Number(client.rating)
    : null;

  const clientNote =
    typeof client?.note === "string" ? client.note.trim() : "";

  return (
    <AuthenticatedLayout user={auth.user}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          {/* CLIENT CARD */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>

                <div>
                  <CardTitle className="text-xl font-semibold">
                    {client.name || "Nom non défini"}
                  </CardTitle>
                  <p className="text-sm">Informations du client</p>
                </div>
              </div>

              <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                <Link href={route("clients.edit", client.id)}>
                  <Edit className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {[
                {
                  label: "Nom complet",
                  value: client.name,
                  icon: <User className="h-4 w-4" />,
                },
                {
                  label: "Téléphone",
                  value: client.phone,
                  icon: <Phone className="h-4 w-4" />,
                },
                {
                  label: "Adresse",
                  value: client.address,
                  icon: <Home className="h-4 w-4" />,
                },
                {
                  label: "Carte d'identité",
                  value: client.identity_card_number,
                  icon: <CreditCard className="h-4 w-4" />,
                },
                {
                  label: "Numéro de permis",
                  value: client.license_number,
                  icon: <ScrollText className="h-4 w-4" />,
                },
                {
                  label: "Date du permis",
                  value: client.license_date
                    ? new Date(client.license_date).toLocaleDateString("fr-FR")
                    : "—",
                  icon: <CalendarIcon className="h-4 w-4" />,
                },
                {
                  label: "Expiration du permis",
                  value: client.license_expiration_date
                    ? new Date(
                      client.license_expiration_date
                    ).toLocaleDateString("fr-FR")
                    : "—",
                  icon: <CalendarIcon className="h-4 w-4" />,
                },
              ].map(({ label, value, icon }, idx) => (
                <div
                  key={idx}
                  className="flex justify-between border-b pb-2 last:border-none last:pb-0"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {icon}
                    {label}
                  </span>

                  <span className="font-medium text-foreground">
                    {value || "—"}
                  </span>
                </div>
              ))}

              {/* RATING */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Note client
                </span>

                {ratingValue ? (
                  <Rating
                    value={ratingValue}
                    readOnly
                    className="flex items-center gap-0.5"
                  >
                    {Array.from({ length: 5 }).map((_, index) => (
                      <RatingButton
                        key={index}
                        className="text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </Rating>
                ) : (
                  <span className="text-sm text-foreground">
                    Aucune note
                  </span>
                )}
              </div>

              {clientNote ? (
                <div className="rounded-lg bg-muted/60 p-3 text-sm text-foreground">
                  {clientNote}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* DOCUMENTS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>

            <CardContent>
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {documents.map((doc, i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-xl border border-border/70
                       bg-card shadow-sm transition hover:-translate-y-0.5
                       hover:shadow-md cursor-zoom-in"
                    >
                      {/* Image */}
                      <ImageZoom
                        imageUrl={doc.url!}
                        thumbnailUrl={doc.url!}
                        imageTitle={doc.label}
                        className="h-full w-full"
                        classNameThumbnailViewer="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Label overlay */}
                      <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5
                            text-[11px] text-white">
                        {doc.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-15
                      rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
                  Aucun document disponible
                </div>
              )}
            </CardContent>
          </Card>



        </div>

        {/* RIGHT PANEL */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Locations récentes</CardTitle>
            </CardHeader>

            <CardContent className="divide-y">
              {visibleRentals.length > 0 ? (
                <>
                  {visibleRentals.map((rental) => {
                    const totalPrice = Number(rental.total_price) || 0;
                    const totalPaid = Array.isArray(rental.payments)
                      ? rental.payments.reduce(
                        (sum, p) => sum + Number(p.amount || 0),
                        0
                      )
                      : 0;

                    const remaining = Math.max(totalPrice - totalPaid, 0);

                    return (
                      <div
                        key={rental.id}
                        onClick={() => (window.location.href = route("rentals.show", rental.id))}
                        className="py-2  text-sm space-y-3 rounded-md transition
                     hover:bg-muted/40 cursor-pointer"
                      >
                        <div className="font-medium text-blue-600">
                          Location #{rental.id} –{" "}
                          {rental.car_model?.brand} {rental.car_model?.model}
                        </div>

                        <div className="flex justify-between">
                          <span>Dates</span>
                          <span>
                            {new Date(rental.start_date).toLocaleDateString("fr-FR")} →{" "}
                            {new Date(rental.end_date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Prix total</span>
                          <span>{totalPrice} MAD</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Statut</span>
                          <RentalStatusBadge status={rental.status} />
                        </div>

                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Total payé</span>
                            <span>{totalPaid} MAD</span>
                          </div>

                          <div className="flex justify-between">
                            <span>Reste</span>
                            <span
                              className={
                                remaining > 0
                                  ? "font-semibold text-red-600"
                                  : "font-medium text-emerald-600"
                              }
                            >
                              {remaining} MAD
                            </span>
                          </div>
                        </div>
                      </div>

                    );
                  })}

                  {visibleCount < rentals.length && (
                    <div className="text-center pt-3">
                      <Button
                        variant="ghost"
                        className="text-blue-600 text-sm"
                        onClick={() => setVisibleCount((v) => v + 3)}
                      >
                        Afficher plus
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm">Aucune location trouvée.</p>
              )}
            </CardContent>

          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
