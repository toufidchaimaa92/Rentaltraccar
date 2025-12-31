{{-- resources/views/contracts/pdf.blade.php --}}
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Contrat de location #{{ $rental->id ?? '—' }}</title>

  @php
    $bgImage = $bgImage ?? null;
    // ===== Inline logo (SVG as base64) =====
    $logoPath = public_path('images/design.svg');
    $logoData = is_file($logoPath) ? base64_encode(@file_get_contents($logoPath)) : null;

    // ===== Helpers =====
    $fmt  = fn($n) => number_format((float)$n, 2, ',', ' ');
    $fmt0 = fn($n) => number_format((float)$n, 0, ',', ' ');

    // ===== Totals =====
    $total = (float) ($rental->total_price ?? 0);
    $paid  = (float) ($rental->payments?->sum('amount') ?? 0);
    $rest  = max(0, $total - $paid);

    // ===== Manual/day logic =====
    $days   = (int)   ($rental->days ?? 0);
    $manual = (bool)  ($rental->manual_mode ?? false) || !is_null($rental->manual_total ?? null);
    $estPerDay = $days > 0 ? floor($total / $days) : 0;
    $pricePerDayDisplay = $manual && $days > 0
      ? $estPerDay
      : (is_numeric($rental->price_per_day ?? null) ? (float) $rental->price_per_day : null);
  @endphp

  <style>
    /* ===== Full-bleed page so the background can edge-to-edge ===== */
    @page { size: A4; margin: 0; }

    * { box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; color:#000; background:#fff; font-size:10px; line-height:1.2; margin:0; padding:0; }
    h1,h2,h3 { margin: 0 0 6px; }
    p { margin: 0 0 6px; }
    .small { font-size:11px; }
    .tiny  { font-size:10px; }
    .mono  { font-family: DejaVu Sans Mono, monospace; }

    /* ===== Page containers ===== */
    .page { position: relative; width: 100%; min-height: 297mm; } /* A4 height */
    .page-1 { position: relative; }

    /* Background wrapper for page 1 only */
    .bg-wrap { position:absolute; left:0; top:0; right:0; bottom:0; }
    .bg-img  { width:100%; height:100%; display:block; opacity:1.0; } /* + visible */

    /* Content area margins (replacing old @page margins) */
    .content { position: relative; }
    .content-inner { padding: 8mm 8mm 10mm 8mm; } /* top right bottom left */

    /* ===== Header ===== */
    .header { margin-bottom: 6px; }
    table.hdr { width: 100%; border-collapse: collapse; }
    table.hdr td { vertical-align: middle; }
    .hdr-left img { height: 50px; display: inline-block; vertical-align: middle; margin-right: 8px; }
    .brand { display:inline-block; vertical-align: middle; font-size: 42px; font-weight: 1000; letter-spacing: .2px; }
    .hdr-right { text-align: right; }
    .contract-no { font-size: 16px; font-weight: 700; white-space: nowrap; }

    /* ===== Layout helpers ===== */
    .row { display: table; width: 100%; table-layout: fixed; border-collapse: separate; }
    .gap-8 { border-spacing: 8px 0; }
    .col { display: table-cell; vertical-align: top; }
    .w-1-2 { width: 50%; }

    /* Single-column rows (DOMPDF-safe) */
    .row.single { display: block; width: 100%; }
    .row.single > .col { display: block; width: 100%; padding-left: 0; padding-right: 0; }

    /* ===== Cards ===== */
    .card {
      border: 0; border-radius: 4px; padding: 8px 10px; margin-bottom: 8px;
      background: rgba(255,255,255,0.80); /* slightly more transparent */
      width: 100%;
    }
    .card h3 { font-size: 13px; margin-bottom: 6px; }

    /* ===== Key/Value tables (2 colonnes) ===== */
    table.kvs {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.kvs col.label { width: 40%; }
    table.kvs col.val   { width: 60%; }
    table.kvs td { padding: 5px 0; vertical-align: top; }
    table.kvs td.label { font-weight: 500; }
    table.kvs td.val   { font-weight: 700; text-align: right; word-break: break-word; }

    /* ===== Key/Value tables (4 colonnes synchronisées) ===== */
    table.kvs4 {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.kvs4 col.l1 { width: 20%; }   /* label gauche  */
    table.kvs4 col.v1 { width: 30%; }   /* valeur gauche */
    table.kvs4 col.l2 { width: 20%; }   /* label droite  */
    table.kvs4 col.v2 { width: 30%; }   /* valeur droite */
    table.kvs4 td { padding: 5px 0; vertical-align: top; }
    table.kvs4 td.label { font-weight: 500; }
    table.kvs4 td.val   { font-weight: 700; text-align: right; word-break: break-word; }

    /* ===== Totals panel ===== */
    .totals { border: 1px solid #000; border-radius: 4px; background: rgba(255,255,255,0.85); }
    .totals .head { background: #fff; padding: 8px 10px; font-weight: 800; border-bottom: 1px solid #000; }
    .totals table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .totals col.label { width: 60%; }
    .totals col.val   { width: 40%; }
    .totals td { padding: 8px 10px; }
    .totals td.label { text-align: left; }
    .totals td.val   { text-align: right; font-weight: 800; font-family: "DejaVu Sans Mono", monospace; white-space: nowrap; }

    /* ===== Notes & signatures ===== */
    .note { border:1px dashed #000; border-radius: 4px; background: rgba(255,255,255,0.80); padding:8px 10px; }
    .note ul { margin:6px 0 0 16px; padding:0; }
    .note li { margin-bottom:4px; }

    .sigs { display: table; width: 100%; table-layout: fixed; margin-top: 8px; }
    .sig { display: table-cell; padding: 0 8px; vertical-align: top; }
    .sig .line { border-top:1px solid #000; height:48px; margin-top: 8px; }

    /* ===== Footer (page 1 only) ===== */
    .page-1 .footer {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 4px 8mm 0 8mm; /* align with content side padding */
      border-top: 1px solid #000; text-align: center; font-size: 11px; background: rgba(255,255,255,0.9);
    }

    /* ===== Page 2 (Conditions) ===== */
    .title-center { text-align: center; margin-bottom: 2px; }
    .conditions { font-size: 8px; }
    .conditions h3 { font-size: 8px; margin: 6px 0 3px; }
    .conditions ul { margin: 0 0 6px 10px; padding: 0; }
    .conditions li { margin-bottom: 2px; text-align: justify; }

    .two-cols { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .two-cols td { vertical-align: top; padding: 0 6px; width: 50%; }

    /* Page break between the two pages */
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

  {{-- ======================== PAGE 1 (with full-bleed background) ======================== --}}
  <div class="page page-1">
    @if(!empty($bgImage))
      <div class="bg-wrap">
        <img class="bg-img" src="{{ $bgImage }}" alt="background">
      </div>
    @endif

    <div class="content">
      <div class="content-inner">
        <div class="header">
          <table class="hdr">
            <tr>
              <td class="hdr-left">
                @if($logoData)
                  <img src="data:image/svg+xml;base64,{{ $logoData }}" alt="Taliani Auto">
                @endif
                <span class="brand">Taliani Auto</span>
              </td>
              <td class="hdr-right">
                <span class="contract-no">Contrat n° {{ $rental->id ?? '—' }}</span>
              </td>
            </tr>
          </table>
        </div>

        {{-- Client & Second driver (alignés sur 4 colonnes si présent) --}}
        @php
          $c  = $rental->client;
          $sd = $rental->secondDriver;
          $hasSD = $sd && ($sd->name || $sd->phone || $sd->address || $sd->identity_card_number || $sd->license_number);
        @endphp

        @if($hasSD)
          <div class="card">
            <h3>Informations clients</h3>
            <table class="kvs4 small">
              <colgroup>
                <col class="l1"><col class="v1"><col class="l2"><col class="v2">
              </colgroup>
              <tr>
                <td class="label">Nom complet</td><td class="val">{{ $c->name ?? '—' }}</td>
                <td class="label">Nom complet</td><td class="val">{{ $sd->name ?? '—' }}</td>
              </tr>
              <tr>
                <td class="label">Téléphone</td><td class="val">{{ $c->phone ?? '—' }}</td>
                <td class="label">Téléphone</td><td class="val">{{ $sd->phone ?? '—' }}</td>
              </tr>
              <tr>
                <td class="label">Adresse</td><td class="val">{{ $c->address ?? '—' }}</td>
                <td class="label">Adresse</td><td class="val">{{ $sd->address ?? '—' }}</td>
              </tr>
              <tr>
                <td class="label">Carte d'identité</td><td class="val">{{ $c->identity_card_number ?? '—' }}</td>
                <td class="label">Carte d'identité</td><td class="val">{{ $sd->identity_card_number ?? '—' }}</td>
              </tr>
              <tr>
                <td class="label">Numéro de permis</td><td class="val">{{ $c->license_number ?? '—' }}</td>
                <td class="label">Numéro de permis</td><td class="val">{{ $sd->license_number ?? '—' }}</td>
              </tr>
            </table>
          </div>
        @else
          <div class="card">
            <h3>Client</h3>
            <table class="kvs small">
              <colgroup><col class="label"><col class="val"></colgroup>
              <tr><td class="label">Nom complet</td><td class="val">{{ optional($rental->client)->name ?? '—' }}</td></tr>
              <tr><td class="label">Téléphone</td><td class="val">{{ optional($rental->client)->phone ?? '—' }}</td></tr>
              <tr><td class="label">Adresse</td><td class="val">{{ optional($rental->client)->address ?? '—' }}</td></tr>
              <tr><td class="label">Carte d'identité</td><td class="val">{{ optional($rental->client)->identity_card_number ?? '—' }}</td></tr>
              <tr><td class="label">Numéro de permis</td><td class="val">{{ optional($rental->client)->license_number ?? '—' }}</td></tr>
            </table>
          </div>
        @endif

        {{-- Vehicle & Dates --}}
        <div class="card">
          <h3>Véhicule &amp; Dates</h3>
          <table class="kvs small">
            <colgroup><col class="label"><col class="val"></colgroup>
            <tr><td class="label">Marque / Modèle</td><td class="val">{{ (optional($rental->carModel)->brand ?? '—') . ' ' . (optional($rental->carModel)->model ?? '—') }}</td></tr>
            <tr><td class="label">Finition</td><td class="val">{{ optional($rental->carModel)->finish ?? '—' }}</td></tr>
            <tr><td class="label">Carburant</td><td class="val">{{ optional($rental->carModel)->fuel_type ?? '—' }}</td></tr>
            <tr><td class="label">Transmission</td><td class="val">{{ optional($rental->carModel)->transmission ?? '—' }}</td></tr>
            <tr><td class="label">Immatriculation</td><td class="val">{{ optional($rental->car)->license_plate ?? '—' }}</td></tr>
            <tr>
              <td class="label">Du</td>
              <td class="val">
                @if($rental->start_date)
                  {{ \Carbon\Carbon::parse($rental->start_date)->locale('fr')->isoFormat('DD/MM/YYYY') }}
                  @if($rental->pickup_time) à {{ \Illuminate\Support\Str::of($rental->pickup_time)->substr(0,5) }} @endif
                @else — @endif
              </td>
            </tr>
            <tr>
              <td class="label">Au</td>
              <td class="val">
                @if($rental->end_date)
                  {{ \Carbon\Carbon::parse($rental->end_date)->locale('fr')->isoFormat('DD/MM/YYYY') }}
                  @if($rental->return_time) à {{ \Illuminate\Support\Str::of($rental->return_time)->substr(0,5) }} @endif
                @else — @endif
              </td>
            </tr>
          </table>
        </div>

        {{-- Payment + Totals --}}
        <div class="row gap-8">
          <div class="col w-1-2">
            <div class="card">
              <h3>Détails de paiement</h3>
              <table class="kvs small">
                <colgroup><col class="label"><col class="val"></colgroup>
                <tr><td class="label">Durée</td><td class="val">{{ $rental->days ?? '—' }} jour(s)</td></tr>
                @if($manual && $days > 0)
                  <tr><td class="label">Prix par jour</td><td class="val mono">{{ $fmt0($estPerDay) }} MAD</td></tr>
                @else
                  <tr><td class="label">Prix par jour</td><td class="val mono">{{ isset($pricePerDayDisplay) ? $fmt($pricePerDayDisplay) : '—' }} MAD</td></tr>
                @endif
              </table>
            </div>
          </div>

          <div class="col w-1-2">
            <div class="totals">
              <div class="head">Résumé</div>
              <table>
                <colgroup><col class="label"><col class="val"></colgroup>
                <tr><td class="label">Total</td><td class="val mono">{{ $fmt($total) }} MAD</td></tr>
                <tr><td class="label">Avance</td><td class="val mono">-{{ $fmt($paid) }} MAD</td></tr>
                <tr><td class="label">Reste à payer</td><td class="val mono">{{ $fmt($rest) }} MAD</td></tr>
              </table>
            </div>
          </div>
        </div>

        {{-- Notes --}}
        <div class="note small">
          <strong style="display:block; margin-bottom:4px;">Note importante</strong>
          <ul>
            <li>Le Client est seul responsable de toute infraction au Code de la route.</li>
            <li>Véhicule restitué sale : frais de lavage 50 DH.</li>
            <li>Retard sans renouvellement : désactivation et récupération possibles.</li>
            <li>Tout dépassement d'horaire entraîne la facturation d'une journée supplémentaire.</li>
            <li style="list-style:none; text-align:center; font-weight:700; margin-top:4px;">
              J'ai lu et accepté les conditions stipulées au verso de ce contrat.
            </li>
          </ul>
        </div>

        {{-- Signatures --}}
        <div class="sigs">
          <div class="sig">
            <div>Signature du Client</div>
            <div class="line"></div>
          </div>
          <div class="sig">
            <div>Cachet de l'entreprise</div>
            <div class="line"></div>
          </div>
        </div>
      </div> {{-- /.content-inner --}}
    </div> {{-- /.content --}}

    {{-- Footer (page 1 only; aligned with content padding) --}}
    <div class="footer">
      <div>Taliani Auto — Service de location de véhicules</div>
      <div>IF : 51820863 &nbsp;•&nbsp; TP : 27300518 &nbsp;•&nbsp; RC : 158687</div>
      <div>Adresse : RDC Hay Nahda Imm. K Lot.N°1 N°226 — Rabat</div>
      <div>Tél : 06 30 04 40 28 &nbsp;•&nbsp; ICE : 003030322000030</div>
      <div>Merci pour votre confiance !</div>
    </div>
  </div>


  {{-- ======================== PAGE BREAK ======================== --}}
  <div class="page-break"></div>

  {{-- ======================== PAGE 2 (no background) ======================== --}}
  <div class="page">
    <div class="content">
      <div class="content-inner">
        <div class="title-center">
          <h2 style="font-size:16px;">Conditions Générales de Location</h2>
        </div>

        <table class="two-cols conditions">
          <tr>
            <td>
              <h3>1. Utilisation du véhicule</h3>
              <ul>
                <li>Le véhicule doit être utilisé conformément au Code de la route.</li>
                <li>Tout usage non autorisé (compétition, remorquage, etc.) est interdit.</li>
                <li>Le conducteur doit être titulaire d’un permis valide.</li>
              </ul>

              <h3>2. Assurance &amp; franchise</h3>
              <ul>
                <li>Le véhicule est assuré conformément aux conditions du loueur.</li>
                <li>En cas de sinistre, une franchise peut rester à la charge du client.</li>
                <li>Tout incident doit être déclaré dans les 24 heures.</li>
              </ul>

              <h3>3. Entretien &amp; carburant</h3>
              <ul>
                <li>Le client veille au niveau de carburant et à la pression des pneus.</li>
                <li>Le carburant n’est pas inclus et reste à la charge du client.</li>
              </ul>
            </td>
            <td>
              <h3>4. Restitution</h3>
              <ul>
                <li>Le véhicule doit être restitué à la date et l’heure prévues.</li>
                <li>Tout retard peut entraîner la facturation d’une journée supplémentaire.</li>
                <li>Le véhicule doit être rendu propre ; frais de lavage si nécessaire.</li>
              </ul>

              <h3>5. Paiement</h3>
              <ul>
                <li>Le solde est exigible à la restitution du véhicule.</li>
                <li>Les amendes et contraventions restent à la charge du client.</li>
              </ul>

              <h3>6. Divers</h3>
              <ul>
                <li>Le présent contrat est régi par le droit marocain.</li>
                <li>Toute modification doit être convenue par écrit.</li>
              </ul>
            </td>
          </tr>
        </table>
      </div> {{-- /.content-inner --}}
    </div> {{-- /.content --}}
  </div>

</body>
</html>
