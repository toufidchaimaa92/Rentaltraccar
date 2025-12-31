<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>{{ $title ?? 'Document' }}</title>
  <style>
    /* ===== DOMPDF PAGE SETTINGS ===== */
    @page { size: A4; margin: 0; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color:#000; }

    /* ===== PAGE WRAPPERS ===== */
    .page { position: relative; padding: 0mm 12mm 0mm 12mm; z-index: 1; }
    .page1 { }
    .conditions-page { padding: 15mm 12mm 18mm 12mm; font-size: 9px; line-height: 1.2; }

    /* ===== BACKGROUND IMAGE ===== */
    .page-bg {
      position: absolute; top:0; left:0; width:210mm; height:297mm; /* A4 */
      object-fit: cover;
      opacity: 1;            /* keep background fully visible */
      z-index: -1;           /* ensure text sits above the background */
    }

    /* ===== HEADER ===== */
    .page1-header {
      border-bottom: none;       /* no line under header */
      padding-top: 5mm;          /* top space */
      margin-bottom: 12mm;       /* space below header */
      position: relative;
      height: 25mm;              /* control header height */
    }

    .hdr {
      width: 100%;
      border-collapse: collapse;
    }

    .hdr td {
      vertical-align: bottom;
    }

    .brand {
      width: 60%; /* empty cell to create spacing */
    }

    .contract-no {
      font-size: 24px;
      font-weight: 600;
      text-align: right;
      padding-right: 15mm; /* push to the right */
      padding-top: 10mm;   /* move lower */
      position: relative;
    }

    /* ===== FOOTER ===== */
    .page1-footer {
      border-top: 1px solid #ccc;
      padding: 0mm;
      margin-top: 4mm;
      text-align: center;
      font-size: 10px;
      color: #333;
      line-height: 1.25;
    }

    /* ===== CARDS ===== */
.card {
  border: 1px solid #ddd;
  border-radius: 6px;
  margin: 0 0 10px 0;
  background: none !important; /* NO background */
}
    .card-h { padding: 8px 10px; border-bottom: 1px solid #eee; }
    .card-t { font-size: 16px; font-weight: 700; margin: 0; }
    .card-c { padding: 10px; }

    /* ===== TABLES ===== */
    .two-col { width: 100%; border-collapse: separate; border-spacing: 10px 0; }
    .two-col td { width: 50%; vertical-align: top; padding: 0; }

    .kv { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .kv col.label { width: 45%; }
    .kv col.val   { width: 55%; }
    .kv td { padding: 2px 0; vertical-align: top; }
    .kv .label { color:#000; font-weight:500; }
    .kv .val { text-align:right; font-weight:600; word-break: break-word; }

    .kv4 { width:100%; border-collapse: collapse; table-layout: fixed; }
    .kv4 col.l1 { width:22%; }
    .kv4 col.v1 { width:28%; }
    .kv4 col.l2 { width:22%; }
    .kv4 col.v2 { width:28%; }
    .kv4 td { padding:2px 0; vertical-align: top; }
    .kv4 .label { font-weight:500; }
    .kv4 .val { text-align:right; font-weight:600; word-break: break-word; }

    /* Force table transparency so content sits above the page background */
table,
thead,
tbody,
tr,
th,
td {
  background: none !important;
  background-color: transparent !important;
}

    /* ===== SIGNATURE ===== */
    .sig-table { width:100%; border-collapse: separate; border-spacing: 12px 0; margin-top: 14px; }
    .sig-cell { vertical-align: top; }
    .sig { border-top:1px solid #bbb; padding-top:8px; min-height:90px; text-align:center; }

    /* ===== CONDITIONS PAGE ===== */
    .conditions-page {
      padding: 4mm 10mm 6mm 10mm;
      font-size: 5px;
      line-height: 0.9;
    }
    .conditions-header {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 4mm 0;
    }
    .conditions-columns {
      column-count: 2;
      column-gap: 2mm;
    }
    .conditions-columns h3 {
      font-size: 9px;
      font-weight: 700;
      margin: 4px 0 2px;
      break-after: avoid;
    }
    .conditions-columns p {
      margin: 0 0 3px;
      text-align: justify;
      font-size: 8.5px;
    }
  </style>
</head>

<body>

  {{-- ===== PAGE 1 ===== --}}
  <div class="page page1" style="page-break-after: always;">
    {{-- Background ONLY on page 1 --}}
    @if(!empty($bgImage))
      <img class="page-bg" src="{{ $bgImage }}" alt="">
    @endif

    {{-- HEADER --}}
    <div class="page1-header">
      <table class="hdr">
        <tr>
          <td class="brand"></td>
          <td class="contract-no">
            Contrat N°: <span style="color:blue;">{{ $rental->id }}</span>
          </td>
        </tr>
      </table>
    </div>
    
    {{-- Main content --}}
    <main>
      <h2 style="margin:0 0 6px;">Contrat de location</h2>
      @php
        $client   = $rental->client;
        $second   = $rental->secondDriver;
        $car      = $rental->car;
        $carModel = $rental->carModel;
        $isLongTerm = ($rental->rental_type ?? null) === 'long_term';
        $conductor = $isLongTerm ? ($rental->secondDriver ?? $client) : null;

        $brand = $carModel->brand ?? '';
        $model = $carModel->model ?? ($carModel->name ?? '');
        $imm   = $car->license_plate ?? ($car->registration ?? null);

        // Dates & times
        $startDate = optional($rental->start_date)->format('d/m/Y');
        $endDate   = optional($rental->end_date)->format('d/m/Y');
        $pickup    = $rental->pickup_time ? substr($rental->pickup_time, 0, 5) : null;
        $returnT   = $rental->return_time ? substr($rental->return_time, 0, 5) : null;

        $fmt = fn($v) => number_format((float)$v, 2, ',', ' ');
      @endphp

      {{-- Client + Conducteur --}}
      @if($isLongTerm)
        <div class="card">
          <div class="card-h"><h3 class="card-t">Conducteur</h3></div>
          <div class="card-c">
            <table class="kv">
              <tr><td class="label">Nom complet</td><td class="val">{{ $conductor->driver_name ?? $conductor->name ?? '—' }}</td></tr>
              <tr><td class="label">Téléphone</td><td class="val">{{ $conductor->phone ?? '—' }}</td></tr>
              <tr><td class="label">Adresse</td><td class="val">{{ $conductor->address ?? '—' }}</td></tr>
              <tr><td class="label">Carte d'identité</td><td class="val">{{ $conductor->identity_card_number ?? '—' }}</td></tr>
              <tr><td class="label">Numéro de permis</td><td class="val">{{ $conductor->license_number ?? '—' }}</td></tr>
            </table>
          </div>
        </div>
      @elseif($hasSecondDriver)
        <table class="two-col">
          <tr>
            <td>
              <div class="card">
                <div class="card-h"><h3 class="card-t">Client</h3></div>
                <div class="card-c">
                  <table class="kv">
                    <tr><td class="label">Nom complet</td><td class="val">{{ $client->name ?? '—' }}</td></tr>
                    <tr><td class="label">Téléphone</td><td class="val">{{ $client->phone ?? '—' }}</td></tr>
                    <tr><td class="label">Adresse</td><td class="val">{{ $client->address ?? '—' }}</td></tr>
                    <tr><td class="label">Carte d'identité</td><td class="val">{{ $client->identity_card_number ?? '—' }}</td></tr>
                    <tr><td class="label">Numéro de permis</td><td class="val">{{ $client->license_number ?? '—' }}</td></tr>
                  </table>
                </div>
              </div>
            </td>
            <td>
              <div class="card">
                <div class="card-h"><h3 class="card-t">Deuxième Conducteur</h3></div>
                <div class="card-c">
                  <table class="kv">
                    <tr><td class="label">Nom complet</td><td class="val">{{ $second->name ?? '—' }}</td></tr>
                    <tr><td class="label">Téléphone</td><td class="val">{{ $second->phone ?? '—' }}</td></tr>
                    <tr><td class="label">Adresse</td><td class="val">{{ $second->address ?? '—' }}</td></tr>
                    <tr><td class="label">Carte d'identité</td><td class="val">{{ $second->identity_card_number ?? '—' }}</td></tr>
                    <tr><td class="label">Numéro de permis</td><td class="val">{{ $second->license_number ?? '—' }}</td></tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        </table>
      @else
        <div class="card">
          <div class="card-h"><h3 class="card-t">Client</h3></div>
          <div class="card-c">
            <table class="kv">
              <tr><td class="label">Nom complet</td><td class="val">{{ $client->name ?? '—' }}</td></tr>
              <tr><td class="label">Téléphone</td><td class="val">{{ $client->phone ?? '—' }}</td></tr>
              <tr><td class="label">Adresse</td><td class="val">{{ $client->address ?? '—' }}</td></tr>
              <tr><td class="label">Carte d'identité</td><td class="val">{{ $client->identity_card_number ?? '—' }}</td></tr>
              <tr><td class="label">Numéro de permis</td><td class="val">{{ $client->license_number ?? '—' }}</td></tr>
            </table>
          </div>
        </div>
      @endif

      {{-- Véhicule & Dates --}}
      <div class="card">
        <div class="card-h"><h3 class="card-t">Véhicule & Dates</h3></div>
        <div class="card-c">
          <table class="kv">
            <tr><td class="label">Marque / Modèle</td><td class="val">{{ trim(($brand ?: '—').' '.($model ?: '')) }}</td></tr>
                        <tr><td class="label">Immatriculation</td><td class="val" style="color:blue;">{{ $imm ?? '—' }}</td></tr>
            <tr><td class="label">Du</td><td class="val">{{ $startDate ?: '—' }} @if($pickup) à {{ $pickup }}@endif</td></tr>
            <tr><td class="label">Au</td><td class="val">{{ $endDate ?: '—' }} @if($returnT) à {{ $returnT }}@endif</td></tr>
          </table>
        </div>
      </div>

      {{-- Paiement (non affiché pour les contrats LLD) --}}
      @unless($isLongTerm)
        <div class="card">
          <div class="card-h"><h3 class="card-t">Paiement</h3></div>
          <div class="card-c">
            @if(!empty($showExtensionOnly))
              <table class="kv">
                <tr><td class="label">Durée d’extension</td><td class="val">{{ is_null($extensionDays) ? '—' : $extensionDays . ' jour(s)' }}</td></tr>
                <tr><td class="label">Total extension</td><td class="val">{{ is_null($extensionTotal) ? '—' : $fmt($extensionTotal) }} MAD</td></tr>
              </table>
            @else
              @php
                $daysInt = (int) ($days ?? 0);
                $manual = (bool) (($rental->manual_mode ?? false) || !is_null($rental->manual_total ?? null));
                $estimatedPerDayManual = $daysInt > 0 ? (int) floor((float) ($rental->total_price ?? 0) / $daysInt) : null;
              @endphp
              <table class="kv">
                <tr><td class="label">Durée</td><td class="val">{{ $daysInt }} jour(s)</td></tr>
                @if($manual && $daysInt > 0)
                  <tr><td class="label">Prix par jour</td><td class="val">{{ $estimatedPerDayManual }} MAD</td></tr>
                @else
                  <tr><td class="label">Prix par jour</td><td class="val">{{ $fmt($rental->price_per_day ?? 0) }} MAD</td></tr>
                @endif
                <tr><td class="label">Total</td><td class="val">{{ $fmt($rental->total_price ?? ($daysInt * ($rental->price_per_day ?? 0))) }} MAD</td></tr>
                @if(($totalPaid ?? 0) > 0)
                  <tr><td class="label">Avance</td><td class="val">-{{ $fmt($totalPaid) }} MAD</td></tr>
                @endif
                <tr><td class="label">Reste</td><td class="val">{{ $fmt($remainingToPay ?? 0) }} MAD</td></tr>
              </table>
            @endif
          </div>
        </div>
      @endunless

      {{-- Note Importante --}}
      <div class="card">
        <div class="card-h"><h3 class="card-t">Note Importante</h3></div>
        <div class="card-c">
          <ul style="margin:0 0 0 18px; padding:0;">
            <li>Le Client est seul responsable de toute infraction au Code de la route.</li>
            <li>En cas de restitution du véhicule dans un état sale, des frais de lavage de 50 DH seront appliqués.</li>
            <li>Si le véhicule n’est pas restitué à temps et sans renouvellement préalable, le véhicule pourra être désactivé à distance et récupéré par l’entreprise.</li>
            <li>Tout dépassement d'horaire entraîne la facturation d'une journée supplémentaire.</li>
            <li style="list-style:none; text-align:center; font-weight:600; margin-top:6px;">
              J'ai lu et accepté les conditions stipulées au verso de ce contrat.
            </li>
          </ul>
        </div>
      </div>

      {{-- Signatures --}}
      <table class="sig-table">
        <tr>
          <td class="sig-cell">
            <div class="sig">
              <p style="margin:0 0 6px;">Signature du Client :</p>
              <div style="width:100%; height:130px;"></div>
            </div>
          </td>
          <td class="sig-cell">
            <div class="sig">
              <p style="margin:0 0 6px;">Cachet de l'entreprise :</p>
              <div style="width:100%; height:130px;"></div>
            </div>
          </td>
        </tr>
      </table>
    </main>

  </div>

  {{-- ===== PAGE 2 ===== --}}
  <div class="page conditions-page">
    <div class="conditions-header">Conditions Générales de Location</div>
    <div class="conditions-columns">
      {{-- Exemple de structure — remplacez par vos clauses --}}
      <h3>1. Portée — Opposabilité</h3>
      <p>Les présentes conditions générales régissent seules tous les contrats de location conclus entre notre société et ses clients, sauf stipulations particulières contraires, spécialement prévues au contrat. L'acceptation de toute offre émanant de notre société emporte adhésion aux présentes conditions générales qui sont toutes de rigueur.</p>

      <h3>2. Livraison et restitution</h3>
      <p>Le Client reconnaît que le véhicule loué lui est remis, avec les accessoires normaux, en bon état de marche, de carrosserie et pneumatiques (cinq) sans coupures. En cas de détérioration pour une cause autre que l'usure normale, ou en cas de disparition de l'un d'entre eux, le Locataire s'engage à le remplacer ou à en acquitter le prix. Les cinq pneus sont au départ en bon état. En cas de détérioration de l'un d'entre eux pour une cause autre que l'usage normal ou de la disparition de l'un d'entre eux, ou autre que la collision avec le véhicule d'un tiers, le client s'engage à le remplacer immédiatement par un pneu de mêmes dimensions et d'usure sensiblement égale, même si la suppression de la franchise a été acceptée. À compter de la remise, le preneur se voit transférer la garde juridique du véhicule, et à ce titre, en devient responsable. Les compteurs sont plombés et les plombs ne pourront être enlevés ou violés sous peine de payer un prix équivalent à un forfait de 500 Km par jour de location. Le véhicule sera rendu dans le même état à l'issue de la période de location au lieu où le véhicule aura été mis à la disposition du Client et à la date convenue entre les parties, sauf stipulations particulières. À défaut, le Locataire devra acquitter le montant de la remise en état. Sauf prolongation expressément autorisée par le loueur, la non-restitution du véhicule à la date prévue constitue un détournement constitutif d'abus de confiance, pénalement sanctionné. Nous ne pouvons malheureusement pas tenir compte des réclamations concernant des dégâts apparents qui n'auront pas été signalés au moment du départ. Vous devez rendre le véhicule dans l'état où vous l'avez reçu. Tous frais de remise en état consécutifs à une faute du locataire ou d'un tiers non identifié viendront en sus du coût de la location. Après reprise du véhicule, aucune réclamation d'objet oublié ne sera prise en considération. Il n'y a pas de remboursement de carburant. Le Loueur se réserve le droit de refuser toute demande de prolongation.</p>

      <h3>3. Entretien et réparation</h3>
      <p>Les réparations, échanges de pièces ou de pneumatiques résultant de l'usure normale sont à la charge du Loueur. Ceux résultant d'usure anormale, de négligence, de cause accidentelle ou indéterminée sont à la charge du Locataire. L'immobilisation du véhicule consécutive, même indépendante de la volonté du Locataire, donnera lieu au paiement par celui-ci d'une indemnité égale au prix de location du véhicule. En aucun cas, le Locataire ne pourra réclamer de dommages et intérêts pour trouble de jouissance ou annulation de location, ou pour une immobilisation dans le cas de réparation effectuée au cours de la location. Les dommages dus au gel restent toujours à la charge du Locataire. Sous réserve du respect de ses obligations découlant des présentes conditions, le Client ainsi que tout conducteur agréé par le Loueur sont garantis : Sans limitation contre les conséquences pécuniaires de sa responsabilité civile à raison des accidents causés aux tiers. Sont exclus de cette garantie le locataire, en sa qualité de conducteur, ainsi que tout conducteur agréé. En outre, la garantie ne joue pas lorsque le véhicule transporte plus d'occupants qu'il ne comporte de places assises fixées au véhicule ainsi que toute charge dépassant celle indiquée par le constructeur. - Contre le vol et l'incendie du véhicule sous déduction de la franchise prévue au tarif et à l'exclusion de tout objet se trouvant à l'intérieur du véhicule. La garantie ne joue pas en cas de vol du véhicule par un préposé du Client ou par l'un de ses représentants. Sauf convention contraire, les dégâts occasionnés au véhicule loué resteront en totalité à la charge du Client. Le client subroge d'office le Loueur dans ses droits pour l'exercice du recours contre les tiers pour les dégâts matériels. Les assurances ne sont en vigueur que pour la durée de la location stipulée. Si le client conserve le véhicule au-delà sans avoir régularisé sa situation, il perd le bénéfice de l'assurance. Le client s'engage à déclarer par écrit au loueur sous 48 heures tout accident, vol, ou incendie sous peine d'être déchu du bénéfice de l'assurance. Sont également exclus du bénéfice de l'assurance toute personne en infraction avec les obligations mises à sa charge au titre des présentes conditions générales. Le Client pourra prendre connaissance d'une copie de la police d'assurance au siège du loueur. À chaque remise de plein, le client est tenu de faire vérifier le niveau d'huile, le niveau d'eau et la pression des pneus. Toute panne résultant d'une pénurie d'essence, ou de l'utilisation d'un mauvais carburant sera facturée au client.</p>

      <h3>4. CONDITIONS D'UTILISATION DU VÉHICULE</h3>
      <p>Le contrat de location est conclu intuitu personae. Il n'est, en conséquence, ni cessible, ni transmissible. Nulle personne autre que le signataire du contrat de location et que celles expressément agréées par le Loueur ne pourra conduire le véhicule loué. Pendant la durée de la location, le Client est tenu au respect des différentes obligations relatives à la réglementation des transports et la responsabilité du Loueur est expressément dégagée en cas d'inobservation par le Client de ces prescriptions. Le preneur est tenu de prendre soin du véhicule et de ses accessoires et notamment, de garder les clés du véhicule en sa possession, d'utiliser le dispositif anti-vol et de fermer le véhicule en conservant auprès de lui les titres de circulation. À ce titre, le locataire restera vigilant à tout signal émis par les voyants d'alerte apparaissant sur le tableau de bord du véhicule et prendra toutes les mesures conservatoires nécessaires. Toute assistance qui serait consécutive à une pénurie de carburant, ou même de type de carburant ou à des faits résultant de la négligence du conducteur ne sont pas couvertes par la garantie assistance et demeurent à la charge du locataire. Il n'y a pas de remboursement de carburant. Le Locataire s'engage, également, à ne pas utiliser ou laisser utiliser le véhicule loué : 1- En dehors des voies carrossables. 2- Pour le transport de personnes ou de marchandises à titre onéreux, sauf stipulations particulières. 3- Pour l'apprentissage de la conduite. 4- Pour des compétitions sportives automobiles. 5- Par toute personne sous l'influence de spiritueux ou de narcotiques ou déjà condamnée pour conduite en état d'ivresse ou pour homicide. 6- Pour pousser ou remorquer un autre véhicule. 7- En dehors du territoire métropolitain, sauf autorisation du Loueur. 8 - Le Client s'engage à utiliser le véhicule loué en vertu du présent agrément uniquement pour les transports faits pour le compte de son entreprise, à moins que l'objet de son commerce soit le transport public. Dans ce dernier cas, la signature du présent agrément impliquera la confirmation du Client d'avoir rempli les exigences légales pour l'exercice de cette activité. 9- En dehors des zones délimitées par la réglementation de la direction de la coordination des transports, et d'une manière générale, en dehors des aires de roulage pour lesquelles il a été conçu. 10- Pour transporter un nombre de passagers supérieur aux sièges fixés ou une charge supérieure à l'indication donnée par le fabricant. En outre, le preneur reconnaît qu'il avait été averti que toute fausse déclaration relative à ses qualités, à son permis de conduire, ou à son âge, entraîne de plein droit la perte du bénéfice de l'assurance à son égard, sans préjudice d'éventuels dommages et intérêts. Le véhicule doit être restitué tel qu'il a été livré avec tous ses papiers de roulage et ses accessoires. La perte d'un de ces éléments sera facturée au locataire ainsi que les frais de l'immobilisation engendrée.</p>

      <h3>5. CONDITIONS DE PAIEMENT</h3>
      <p>Les prix sont ceux en vigueur au jour de la location. Le prix de la location est payable le jour de la mise à disposition du véhicule sauf convention contraire. Toute journée entamée est due. Aux termes de l'engagement de la location, le preneur s'engage à payer au loueur, en plus de la journée de location : - Un montant kilométrique calculé au taux en vigueur dans la catégorie de tarif appliquée, le nombre de kilomètres parcourus pendant la durée du présent contrat étant celui indiqué par le compteur installé sur le véhicule par le fabricant. - L'heure supplémentaire : 1/5ème du prix de la journée. - Les redevances concernant la durée de location, la suppression de franchise, l'assistance et l'assurance conducteur et personnes transportées et autres frais et redevances divers mentionnés aux conditions particulières du contrat. - Le carburant manquant sera facturé, majoré de la remise de plein à 72 DHS. - Les frais de retour au cas où le véhicule est laissé en un autre endroit que prévu, ainsi qu'une indemnité calculée selon les tarifs en vigueur. - Tous frais encourus par le loueur résultant d'une infraction au code de la route et notamment d'une mise en fourrière du véhicule. - Une indemnité égale aux frais de recouvrement éventuels encourus par le Loueur, majorée d'une indemnité fixée forfaitairement à 25% des sommes dues à titre de clause pénale. - Tous frais encourus par suite d'une utilisation anormale. - Tous impôts et taxes leur incombant sur les paiements stipulés au présent article. Le Client verse, en outre, au loueur un dépôt de garantie dont le montant est déterminé par les tarifs en vigueur au jour de la location. Les prix de location peuvent à tout moment être modifiés en fonction de l'évolution des impôts, taxes et droits divers applicables.</p>

      <h3>6. Assurance</h3>
      <p>Sous réserve du respect de ses obligations découlant des présentes conditions, le Client ainsi que tout conducteur agréé par le Loueur sont garantis : - Sans limitation contre les conséquences pécuniaires de sa responsabilité civile à raison des accidents causés aux tiers. Sont exclus de cette garantie le locataire, en sa qualité de conducteur, ainsi que tout conducteur agréé. - En outre, la garantie ne joue pas lorsque le véhicule transporte plus d'occupants qu'il ne comporte de places assises fixées au véhicule ainsi que toute charge dépassant celle indiquée par le constructeur. - Contre le vol et l'incendie du véhicule sous déduction de la franchise prévue au tarif et à l'exclusion de tout objet se trouvant à l'intérieur du véhicule. - La garantie ne joue pas en cas de vol du véhicule par un préposé du Client ou par l'un de ses représentants. Sauf convention contraire, les dégâts occasionnés au véhicule loué resteront en totalité à la charge du Client. Le client subroge d'office le Loueur dans ses droits pour l'exercice du recours contre les tiers pour les dégâts matériels. Les assurances ne sont en vigueur que pour la durée de la location stipulée. Si le client conserve le véhicule au-delà sans avoir régularisé sa situation, il perd le bénéfice de l'assurance. Le client s'engage à déclarer par écrit au loueur sous 48 heures tout accident, vol, ou incendie sous peine d'être déchu du bénéfice de l'assurance. Sont également exclus du bénéfice de l'assurance toute personne en infraction avec les obligations mises à sa charge au titre des présentes conditions générales. Le Client pourra prendre connaissance d'une copie de la police d'assurance au siège du loueur.</p>

      <h3>7. Suppression de franchise</h3>
      <p>En apposant ses initiales dans la case prévue au recto de l'agrément, le client accepte de payer le supplément de location, et n'assume la charge des dommages matériels survenus accidentellement au véhicule loué que dans la limite de la franchise incompressible indiquée dans la grille tarifaire jointe au contrat. Restent toutefois à la charge du locataire, même si celui-ci a payé le supplément de location, les dommages occasionnés dans les cas suivants : - Ceux mentionnés à l'article D des présentes conditions. - Absence de tiers identifié. - Accident survenant après la date de retour prévue au contrat. - Dommages causés aux parties supérieures du véhicule pour quelque cause que ce soit. Les parties supérieures s'entendent de la carrosserie située au-dessus de la baie de pare-brise. - Dommages causés aux parties inférieures du véhicule, pour quelque cause que ce soit. Les parties inférieures s'entendent des organes situés au-dessous du châssis. - Dégradations intérieures. - Utilisation de carburant non conforme. - Non-déclaration d'accident ou de vol dans les délais prévus au contrat. La franchise est incompressible et est égale à la valeur de la grille tarifaire en vigueur. Elle ne sera payable que dans le cas où la responsabilité du client se trouve engagée. En l'absence de dommage ou de perte, le montant de la caution effectivement versé sera remboursé en fin de location.</p>


      <h3>8. ASSURANCE CONDUCTEUR / PERSONNE TRANSPORTÉE</h3>
      <p>En apposant ses initiales dans la case prévue au recto de l'agrément, le Client accepte de régler un supplément par jour de location (un jour minimum) suivant le tarif en vigueur, et bénéficie de ce fait de la garantie "Individuelle Personnes Transportées" souscrite pour le compte de qui il appartiendra par le loueur auprès de sa compagnie d'assurances.</p>

      <h3>9. ASSURANCES MARCHANDISES TRANSPORTÉES</h3>
      <p>Le Client conservant la charge des marchandises transportées, il lui appartient de prendre toutes dispositions utiles pour la sauvegarde de ses chargements. Il peut, toutefois, charger le loueur de couvrir les marchandises transportées.</p>

      <h3>10. ATTRIBUTION DE JURIDICTION</h3>
      <p>De convention expresse, le tribunal dans le ressort duquel est situé le siège social du loueur sera seul compétent pour connaître de tout litige relatif au présent contrat. Le Loueur pourra toutefois renoncer au bénéfice de la présente clause d'attribution de juridiction et porter les litiges devant tous tribunaux compétents.</p>
    </div>
  </div>

</body>
</html>