import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@inertiajs/react";
import { ImageZoom } from "@/components/ui/image-zoom";
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
        { url: toStorageUrl(client.license_front_image), label: "License avant" },
        { url: toStorageUrl(client.license_back_image), label: "License arrière" },
        { url: toStorageUrl(client.cin_front_image), label: "CIN avant" },
        { url: toStorageUrl(client.cin_back_image), label: "CIN arrière" },
      ].filter((d) => !!d.url),
    [client]
  );

  const rentals = Array.isArray(client.rentals) ? client.rentals : [];
  const [visibleCount, setVisibleCount] = useState(2);
  const visibleRentals = rentals.slice(0, visibleCount);
  const ratingValue = Number.isFinite(Number(client?.rating)) ? Number(client.rating) : null;
  const clientNote = typeof client?.note === "string" ? client.note.trim() : "";

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500 text-white",
    confirmed: "bg-green-600 text-white",
    cancelled: "bg-red-600 text-white",
    completed: "bg-blue-600 text-white",
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      {/* GRID CONTAINER */}
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
                ["Nom complet", client.name],
                ["Téléphone", client.phone],
                ["Adresse", client.address],
                ["Carte d'identité", client.identity_card_number],
                ["Numéro de permis", client.license_number],
                [
                  "Date du permis",
                  client.license_date
                    ? new Date(client.license_date).toLocaleDateString("fr-FR")
                    : "—",
                ],
                [
                  "Expiration du permis",
                  client.license_expiration_date
                    ? new Date(client.license_expiration_date).toLocaleDateString("fr-FR")
                    : "—",
                ],
              ].map(([label, value], idx) => (
                <div
                  key={idx}
                  className="flex justify-between border-b pb-2 last:border-none last:pb-0"
                >
                  <span>{label}</span>
                  <span className="font-medium">{value || "—"}</span>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Note client
                </span>

                {ratingValue ? (
                  <Rating value={ratingValue} readOnly className="flex items-center gap-0.5">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {documents.map((doc, i) => (
                    <ImageZoom
                      key={i}
                      src={doc.url!}
                      alt={doc.label}
                      className="rounded-lg border shadow-sm"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg text-sm">
                  Aucun document disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Locations récentes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
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
                      <Card
                        key={rental.id}
                        className="border rounded-lg shadow-sm hover:shadow-md transition"
                      >
                        <CardContent className="py-4 text-sm space-y-3">

                          <Link
                            href={route("rentals.show", rental.id)}
                            className="font-medium text-blue-600 hover:underline block"
                          >
                            Location #{rental.id} – {rental.car_model?.brand} {rental.car_model?.model}
                          </Link>

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

                          <div className="flex justify-between">
                            <span>Statut</span>
                            <Badge
                              className={statusColor[rental.status] || "bg-gray-200 text-gray-800"}
                            >
                              {rental.status}
                            </Badge>
                          </div>

                          <div className="pt-2 border-t mt-2 space-y-1">
                            <div className="flex justify-between">
                              <span>Total payé</span>
                              <span>{totalPaid} MAD</span>
                            </div>

                            <div className="flex justify-between">
                              <span>Reste</span>
                              <span>{remaining} MAD</span>
                            </div>
                          </div>

                        </CardContent>
                      </Card>
                    );
                  })}

                  {visibleCount < rentals.length && (
                    <div className="text-center">
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