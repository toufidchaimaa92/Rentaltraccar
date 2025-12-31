import React, { useRef } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Car, CreditCard, Eye } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

function formatCurrency(
  value: number | string | undefined | null,
  fallback = "0.00"
) {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? fallback : num.toFixed(2);
}

interface Client {
  name?: string;
  phone?: string;
  address?: string;
  identity_card_number?: string;
  license_number?: string;
}
interface CarModel {
  brand?: string;
  model?: string;
  finish?: string;
  fuel_type?: string;
  transmission?: string;
}
interface Car {
  license_plate?: string;
  model?: CarModel;
}
interface Payment {
  amount?: number | string;
}
interface Rental {
  id: number;
  client?: Client;
  secondDriver?: Client;
  carModel?: CarModel;
  car?: Car;
  total_price?: number | string;
  price_per_day?: number | string;
  days?: number;
  start_date?: string;
  end_date?: string;
  pickup_time?: string;
  return_time?: string;
  manual_mode?: boolean;
  manual_total?: number | string | null;
  payments?: Payment[];
}
interface Props {
  auth?: { user?: { name?: string } } | null;
  rental: Rental;
}

export default function RentalContractPreview({ auth, rental }: Props) {
  if (!rental) return <div className="text-center py-10">Chargement...</div>;

  const client = rental.client || {};
  const secondDriver = rental.secondDriver || null;
  const carModel = rental.carModel || {};
  const car = rental.car || {};
  const isLongTerm = rental.rental_type === "long_term";
  const conductor = isLongTerm ? secondDriver || client : null;

  const totalPaid =
    rental.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) ?? 0;
  const totalPriceNum = Number(rental.total_price || 0);
  const remainingToPay = totalPriceNum - totalPaid;

  const hasSecondDriver =
    !isLongTerm &&
    !!(
      secondDriver &&
      (secondDriver.name ||
        secondDriver.phone ||
        secondDriver.address ||
        secondDriver.identity_card_number ||
        secondDriver.license_number)
    );

  const days = Number(rental.days || 0);
  const manual =
    Boolean(rental.manual_mode) ||
    (rental.manual_total !== null && rental.manual_total !== undefined);
  const manualTotalNum = Number(rental.total_price || 0);
  const estimatedPerDayManual = days > 0 ? Math.floor(manualTotalNum / days) : 0;

  const contractRef = useRef<HTMLDivElement | null>(null);
  const termsRef = useRef<HTMLDivElement | null>(null);

  // PDF-only layout + hide-in-PDF helper
  const PdfStyles = () => (
    <style>{`
      /* Force desktop-like layout while capturing (even on small screens) */
      .pdf-mode .two-up { display: block !important; }
      .pdf-mode .two-up.has-second {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 1rem !important;
        align-items: start !important;
      }
      .pdf-mode .two-up .card {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .pdf-mode .no-pdf { display: none !important; }
    `}</style>
  );

  // ——— capture helpers ———
  function cloneWithInlineColors(sourceEl: HTMLElement): HTMLElement {
    const cloneDoc = document.implementation.createHTMLDocument("");
    const cloneRoot = sourceEl.cloneNode(true) as HTMLElement;
    cloneDoc.body.appendChild(cloneRoot);

    const walkerSrc = document.createNodeIterator(
      sourceEl,
      NodeFilter.SHOW_ELEMENT
    );
    const walkerDst = cloneDoc.createNodeIterator(
      cloneRoot,
      NodeFilter.SHOW_ELEMENT
    );

    let srcNode = walkerSrc.nextNode() as HTMLElement | null;
    let dstNode = walkerDst.nextNode() as HTMLElement | null;

    while (srcNode && dstNode) {
      const cs = getComputedStyle(srcNode);
      dstNode.style.color = cs.color;
      dstNode.style.borderColor = cs.borderColor;
      dstNode.style.boxShadow = "none";
      srcNode = walkerSrc.nextNode() as HTMLElement | null;
      dstNode = walkerDst.nextNode() as HTMLElement | null;
    }
    (cloneRoot.style as any).backgroundColor = "transparent";
    return cloneRoot;
  }

  /**
   * Render element off-screen at a fixed A4 desktop width (794px),
   * so mobile taps still produce a desktop/A4 layout.
   */
  async function elementToCanvas(
    el: HTMLElement,
    forcePdfLayout = false,
    forceWidthPx = 794
  ): Promise<HTMLCanvasElement> {
    if (forcePdfLayout) el.classList.add("pdf-mode");
    const sanitized = cloneWithInlineColors(el);
    if (forcePdfLayout) el.classList.remove("pdf-mode");

    // lock the clone at desktop/A4 width
    sanitized.style.width = `${forceWidthPx}px`;
    sanitized.style.minWidth = `${forceWidthPx}px`;
    sanitized.style.maxWidth = `${forceWidthPx}px`;
    sanitized.style.boxSizing = "border-box";

    // mount off-screen
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-10000px";
    holder.style.top = "0";
    holder.style.width = `${forceWidthPx}px`;
    holder.style.zIndex = "-1";
    holder.appendChild(sanitized);
    document.body.appendChild(holder);

    // ensure the clone itself is in pdf mode (hides buttons, enables 2-up)
    sanitized.classList.add("pdf-mode");

    const canvas = await html2canvas(sanitized, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    document.body.removeChild(holder);
    return canvas;
  }

  const previewPDF = async () => {
    try {
      const contractEl = contractRef.current!;
      const termsEl = termsRef.current!;

      // Force A4/desktop layout for both sections even on phones
      const [canvas1, canvas2] = await Promise.all([
        elementToCanvas(contractEl, true, 794),
        elementToCanvas(termsEl, true, 794),
      ]);

      const img1 = canvas1.toDataURL("image/png");
      const img2 = canvas2.toDataURL("image/png");

      const pdf = new jsPDF("p", "pt", "a4");
      const imgWidth = 595.28;   // A4 width in points
      const pageHeight = 841.89; // A4 height in points

      // optional background on FIRST page only — remove block if you don’t need it
      const bgUrl = "/images/arriereplan.png";
      const bg = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = bgUrl;
      });

      const paginate = (
        imgData: string,
        srcCanvas: HTMLCanvasElement,
        withBackgroundOnFirstPage: boolean
      ) => {
        const imgHeight = (srcCanvas.height * imgWidth) / srcCanvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        if (withBackgroundOnFirstPage) {
          pdf.addImage(bg, "PNG", 0, 0, imgWidth, pageHeight);
        }
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0.5) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      };

      // 1) Contract (with BG on first)
      paginate(img1, canvas1, true);

      // 2) Terms (no BG)
      if (canvas2.height > 0) {
        pdf.addPage();
        const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
        let heightLeft2 = imgHeight2;
        let position2 = 0;

        pdf.addImage(img2, "PNG", 0, position2, imgWidth, imgHeight2);
        heightLeft2 -= pageHeight;

        while (heightLeft2 > 0.5) {
          position2 = heightLeft2 - imgHeight2;
          pdf.addPage();
          pdf.addImage(img2, "PNG", 0, position2, imgWidth, imgHeight2);
          heightLeft2 -= pageHeight;
        }
      }

      const url = pdf.output("bloburl");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("Impossible de générer l’aperçu PDF.");
    }
  };

  // Typography: headers xl, content lg
  const cardBase = "bg-transparent";
  const tightHeader = "pb-1";
  const tightContent = "space-y-1 text-lg";

  return (
    <AuthenticatedLayout user={auth?.user}>
      <PdfStyles />
      <div className="mx-auto">
        {/* PAGE 1 */}
        <div
          ref={contractRef}
          className="contract-print-area bg-transparent p-6 mx-auto flex flex-col"
        >
          {/* Header */}
          <header className="pb-2 flex justify-between items-center border-b border-gray-300 mb-2">
            <div className="text-8xl font-black text-foreground leading-none">
              Taliani Auto
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xl font-semibold text-muted-foreground">
                Contrat #{rental.id}
              </div>
              {/* Hide this button in PDF via .no-pdf */}
              <Button
                onClick={previewPDF}
                variant="outline"
                size="sm"
                title="Aperçu PDF"
                className="no-pdf"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <div className="space-y-2 flex-1">
            {/* Client + Conducteur (LLD) or optional second driver */}
            {isLongTerm ? (
              <div className="flex flex-col gap-4">
                <Card className={`${cardBase} card`}>
                  <CardHeader className={tightHeader}>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="w-5 h-5" /> Conducteur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`${tightContent} font-semibold`}>
                    {[
                      ["Nom complet", conductor?.driver_name || conductor?.name],
                      ["Téléphone", conductor?.phone],
                      ["Adresse", conductor?.address],
                      ["Carte d'identité", conductor?.identity_card_number],
                      ["Numéro de permis", conductor?.license_number],
                    ].map(([label, value], i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span>{(value as string) || "—"}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div
                className={`two-up ${hasSecondDriver ? "has-second" : ""} flex flex-col gap-4`}
              >
                {/* Client */}
                <Card className={`${cardBase} card`}>
                  <CardHeader className={tightHeader}>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="w-5 h-5" /> Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`${tightContent} font-semibold`}>
                    {[
                      ["Nom complet", client?.name],
                      ["Téléphone", client?.phone],
                      ["Adresse", client?.address],
                      ["Carte d'identité", client?.identity_card_number],
                      ["Numéro de permis", client?.license_number],
                    ].map(([label, value], i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span>{(value as string) || "—"}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Second Driver */}
                {hasSecondDriver && (
                  <Card className={`${cardBase} card`}>
                    <CardHeader className={tightHeader}>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="w-5 h-5" /> Deuxième Conducteur
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={`${tightContent} font-semibold`}>
                      {[
                        ["Nom complet", secondDriver!.name],
                        ["Téléphone", secondDriver!.phone],
                        ["Adresse", secondDriver!.address],
                        ["Carte d'identité", secondDriver!.identity_card_number],
                        ["Numéro de permis", secondDriver!.license_number],
                      ].map(([label, value], i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span>{(value as string) || "—"}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Véhicule & Dates */}
            <Card className={cardBase}>
              <CardHeader className={tightHeader}>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Car className="w-5 h-5" /> Véhicule & Dates
                </CardTitle>
              </CardHeader>
              <CardContent className={tightContent}>
                <div className="flex justify-between">
                  <span>Marque / Modèle</span>
                  <span className="font-semibold">
                    {(carModel.brand ?? "—") + " " + (carModel.model ?? "—")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Immatriculation</span>
                  <span>{car.license_plate ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Du</span>
                  <span>
                    {rental.start_date
                      ? new Date(rental.start_date).toLocaleDateString("fr-FR")
                      : "—"}
                    {rental.pickup_time && ` à ${rental.pickup_time.slice(0, 5)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Au</span>
                  <span>
                    {rental.end_date
                      ? new Date(rental.end_date).toLocaleDateString("fr-FR")
                      : "—"}
                    {rental.return_time && ` à ${rental.return_time.slice(0, 5)}`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Paiement (hidden for long-term contracts) */}
            {!isLongTerm && (
              <Card className={cardBase}>
                <CardHeader className={tightHeader}>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="w-5 h-5" /> Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className={tightContent}>
                  <div className="flex justify-between">
                    <span>Durée</span>
                    <span>{rental.days} jour(s)</span>
                  </div>
                  {manual && days > 0 ? (
                    <div className="flex justify-between">
                      <span>Prix par jour</span>
                      <span>{estimatedPerDayManual} MAD</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>Prix par jour</span>
                      <span>{formatCurrency(rental.price_per_day)} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(rental.total_price)} MAD</span>
                  </div>
                  {totalPaid > 0 && (
                    <div className="flex justify-between">
                      <span>Avance</span>
                      <span>-{formatCurrency(totalPaid)} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Reste</span>
                    <span>{formatCurrency(remainingToPay)} MAD</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Note Importante */}
            <Card className="mt-3 md:col-span-2 note-importante">
              <CardHeader>
                <CardTitle className="card-title text-xl">
                  Note Importante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Le Client est seul responsable de toute infraction au Code
                    de la route.
                  </li>
                  <li>
                    En cas de restitution du véhicule dans un état sale, des
                    frais de lavage de 50 DH seront appliqués.
                  </li>
                  <li>
                    Si le véhicule n’est pas restitué à temps et sans
                    renouvellement préalable, le véhicule pourra être désactivé
                    à distance et récupéré par l’entreprise.
                  </li>
                  <li>
                    Tout dépassement d'horaire entraîne la facturation d'une
                    journée supplémentaire.
                  </li>
                  <li className="font-semibold text-center list-none">
                    J'ai lu et accepté les conditions stipulées au verso de ce
                    contrat.
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center border-t border-gray-400 pt-2">
                <p className="mb-1">Signature du Client :</p>
                <div className="w-full h-20" />
              </div>
              <div className="flex flex-col items-center border-t border-gray-400 pt-2">
                <p className="mb-1">Cachet de l'entreprise :</p>
                <div className="w-full h-20" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-2 pt-1 border-t border-gray-300 text-center text-xs">
            <p>Taliani Auto - Service de location de véhicules</p>
            <p>IF : 51820863 / TP: 27300518 / RC: 158687</p>
            <p>Adresse : RDC Hay Nahda Imm. K Lot.N°1 N°226 - Rabat</p>
            <p>Télé: 06 30 04 40 28 / ICE: 003030322000030</p>
            <p>Merci pour votre confiance !</p>
          </footer>
        </div>

        {/* PAGE 2 — Conditions en deux colonnes */}
        <div ref={termsRef} className="second-page bg-transparent p-10 mx-auto">
          <div className="mb-2 pb-1 text-center font-extrabold text-xl border-b border-gray-300">
            Conditions Générales de Location
          </div>

          {/* Use proper lists; avoid <p><li> nesting */}
          <div className="columns-2 gap-6 text-[12px] leading-relaxed text-justify">
            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">
                1. Portée — Opposabilité
              </h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Les présentes conditions générales régissent seules tous les
                  contrats de location conclus entre notre société et ses
                  clients, sauf stipulations particulières contraires,
                  spécialement prévues au contrat. L'acceptation de toute offre
                  emporte adhésion aux présentes conditions.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">2. Livraison et restitution</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Le véhicule est remis en bon état avec ses accessoires. Hors
                  usure normale, toute détérioration est à la charge du
                  locataire. Non-restitution à la date prévue = abus de
                  confiance. Aucune réclamation d’objets oubliés après reprise.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">3. Entretien et réparation</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Usure normale à la charge du loueur; usure anormale /
                  négligence à la charge du locataire. Déclaration de sinistre
                  sous 48h. Pannes dues au mauvais carburant facturées.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">
                4. Conditions d’utilisation du véhicule
              </h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Conduite exclusivement par les conducteurs agréés, respect des
                  lois, interdits : compétition, apprentissage, remorquage,
                  surcharge, conduite sous influence, etc. Restitution avec
                  papiers et accessoires.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">5. Conditions de paiement</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Prix payables au départ sauf accord; journée entamée due.
                  Frais possibles : heure sup., carburant manquant, retour autre
                  lieu, etc. Dépôt de garantie requis.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">6. Assurance</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  RC envers les tiers sous conditions; exclusions si obligations
                  non respectées ou nombre de passagers excédent. Vol/incendie
                  sous franchise.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">7. Suppression de franchise</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Optionnelle, avec franchise incompressible; exclusions
                  (parties supérieures/inférieures, carburant non conforme,
                  non-déclaration, etc.).
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">
                8. Assurance conducteur / personnes transportées
              </h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>Option journalière suivant tarif en vigueur.</li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">
                9. Assurances marchandises transportées
              </h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Le client en conserve la charge et peut demander une
                  couverture spécifique.
                </li>
              </ul>
            </section>

            <section className="break-inside-avoid mb-3">
              <h3 className="font-semibold mb-1">10. Juridiction</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>
                  Tribunal du siège du loueur compétent, sauf renonciation
                  expresse.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
