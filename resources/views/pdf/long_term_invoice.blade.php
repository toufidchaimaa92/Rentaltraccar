<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Facture #{{ $invoice['id'] ?? '-' }}</title>

  @php
    $bgImage = $bgImage ?? null;
  @endphp

  <style>
    @page { size: A4; margin: 0; }

    :root {
      --safe-left: 12mm;
      --safe-right: 12mm;

      --col-desc: auto;
      --col-periode: 36mm;
      --col-ht: 28mm;
      --col-total: 26mm;
    }

    body {
      font-family: DejaVu Sans, Arial, sans-serif;
      margin: 0;
      color: #000;
      font-size: 12px;
      position: relative;
      min-height: 297mm;
    }

    .bg {
      position: absolute;
      top: 0; left: 0;
      width: 210mm; height: 297mm;
      object-fit: cover;
      z-index: 0;
    }

    header {
      height: 40mm;
      margin-bottom: 0mm;
      padding: 10mm var(--safe-right) 0 var(--safe-left);
      position: relative;
      z-index: 1;
    }

    .hdr { width: 100%; }
    .hdr td { vertical-align: bottom; }

    .invoice-no {
      font-size: 24px;
      font-weight: 700;
      text-align: right;
      padding-right: 6mm;
    }

    .content {
      position: relative;
      z-index: 2;
      padding: 0 var(--safe-right) 35mm var(--safe-left);
    }

    .section {
      margin-bottom: 10px;
    }

    .muted { color: #6b7280; }

    table { width: 100%; border-collapse: collapse; }

    th, td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }

    th {
      background: #f3f4f6;
      font-weight: 600;
    }

    .right { text-align: right; }

    .items col.c-desc   { width: var(--col-desc); }
    .items col.c-periode{ width: var(--col-periode); }
    .items col.c-ht     { width: var(--col-ht); }
    .items col.c-total  { width: var(--col-total); }

    .num {
      font-family: "DejaVu Sans Mono", monospace;
      white-space: nowrap;
    }

    tfoot td {
      border-bottom: none;
      padding-top: 6px;
    }

    .strong { font-weight: 700; }

    .footer {
      position: absolute;
      left: var(--safe-left);
      right: var(--safe-right);
      bottom: 10mm;
      font-size: 10px;
      text-align: center;
      color: #6b7280;
      line-height: 1.4;
    }
  </style>
</head>

<body>

@if(!empty($bgImage))
  <img class="bg" src="{{ $bgImage }}" alt="">
@endif

<header>
  <table class="hdr">
    <tr>
      <td></td>
      <td class="invoice-no">
        Facture LLD N°: <span style="color:#1e40af;">{{ $invoice['id'] ?? '-' }}</span>
      </td>
    </tr>
  </table>
</header>

<div class="content">

  {{-- DATE + ENTREPRISE INFO --}}
  <table style="width:100%; margin-bottom: 10px;">
    <tr>
      <td>
        RC : 158687 — ICE : 003030322000030
      </td>
      <td class="right">
        Date :
        {{ $invoice['due_date']
            ? \Carbon\Carbon::parse($invoice['due_date'])->format('d/m/Y')
            : '—' }}
      </td>
    </tr>
  </table>

  {{-- CLIENT --}}
  @php
      // Extract client from contract or invoice
      $client = $contract['client'] ?? ($invoice['client'] ?? null);

      // Normalize to object
      if (is_array($client)) {
          $client = (object) $client;
      }
  @endphp

  <div class="section">
    <strong>Client</strong><br>

    {{-- Name --}} 
    <strong>{{ $client->name ?? $client->company_name ?? '—' }}</strong><br>

    {{-- Address --}} 
    @if(!empty($client->address))
      {{ $client->address }}<br>
    @endif

    {{-- Company address --}} 
    @if(!empty($client->company_address))
      {{ $client->company_address }}<br>
    @endif

    {{-- RC --}} 
    @if(!empty($client->rc))
      RC : {{ $client->rc }}<br>
    @endif

    {{-- ICE --}} 
    @if(!empty($client->ice))
      ICE : {{ $client->ice }}<br>
    @endif
  </div>

  {{-- ITEMS TABLE --}}
  @php
    $periodStart = isset($invoice['period_start'])
      ? \Carbon\Carbon::parse($invoice['period_start'])
      : null;

    $periodEnd = isset($invoice['period_end'])
      ? \Carbon\Carbon::parse($invoice['period_end'])
      : null;

    $totalDue = $invoice['group_total'] ?? $invoice['amount_due'] ?? 0;
    $totalHt = $invoice['group_total_ht'] ?? ($totalDue ? $totalDue / 1.2 : 0);
    $totalTva = $invoice['group_total_tva'] ?? ($totalDue - $totalHt);
  @endphp

  <table class="items">
    <colgroup>
      <col class="c-desc">
      <col class="c-periode">
      <col class="c-ht">
      <col class="c-total">
    </colgroup>

    <thead>
      <tr>
        <th>Véhicule</th>
        <th>Période</th>
        <th class="right">Prix (HT)</th>
        <th class="right">Montant</th>
      </tr>
    </thead>

    <tbody>
      @foreach(($invoice['vehicles'] ?? []) as $line)
        @php
          $amount = (float)($line['amount'] ?? 0);
        @endphp

        <tr>
          <td>
            <strong>{{ $line['carModel']['brand'] ?? '' }} {{ $line['carModel']['model'] ?? '' }}</strong><br>
            <span class="muted">{{ $line['carModel']['finish'] ?? '' }}</span><br>
            <span class="muted">Plaque : {{ $line['car']['license_plate'] ?? '—' }}</span>
          </td>

          <td class="small">
            @if($periodStart || $periodEnd)
              {{ $periodStart?->format('d/m/Y') ?? '—' }} → {{ $periodEnd?->format('d/m/Y') ?? '—' }}
            @else
              —
            @endif
          </td>

          <td class="right num">
            {{ number_format($line['amount_ht'] ?? ($amount / 1.2), 2, ',', ' ') }} MAD
          </td>

          <td class="right num">
            {{ number_format($amount, 2, ',', ' ') }} MAD
          </td>
        </tr>
      @endforeach
    </tbody>

    <tfoot>
      <tr>
        <td colspan="3" class="right strong">Total HT</td>
        <td class="right num">
          {{ number_format($totalHt, 2, ',', ' ') }} MAD
        </td>
      </tr>
      <tr>
        <td colspan="3" class="right strong">TVA (20 %)</td>
        <td class="right num">
          {{ number_format($totalTva, 2, ',', ' ') }} MAD
        </td>
      </tr>
      <tr>
        <td colspan="3" class="right strong">Total TTC</td>
        <td class="right num strong">
          {{ number_format($totalDue, 2, ',', ' ') }} MAD
        </td>
      </tr>
    </tfoot>
  </table>

</div>



</body>
</html>