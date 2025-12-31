{{-- resources/views/factures/pdf.blade.php --}}
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>{{ $title ?? 'Facture' }}</title>

  <style>
    @page { size: A4; margin: 0; }

    :root {
      --safe-left: 12mm;
      --safe-right: 12mm;

      --col-desc: auto;
      --col-periode: 32mm;
      --col-qte: 16mm;
      --col-pu: 26mm;
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
    .small { font-size: 11px; }

    .items col.c-desc   { width: var(--col-desc); }
    .items col.c-periode{ width: var(--col-periode); }
    .items col.c-qte    { width: var(--col-qte); }
    .items col.c-pu     { width: var(--col-pu); }
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
          Facture N°: <span style="color:#1e40af;">{{ $facture->invoice_number }}</span>
        </td>
      </tr>
    </table>
  </header>

  <div class="content">

    <table style="width:100%; margin-bottom: 10px;">
      <tr>
        <td>
          RC : 158687 — ICE : 003030322000030
        </td>
        <td class="right">
          Date : {{ \Carbon\Carbon::parse($facture->date)->format('d/m/Y') }}
        </td>
      </tr>
    </table>

    <div class="section">
      <strong>Client</strong><br>
      {{ $facture->client_name }}<br>
      @if($facture->client_address) {{ $facture->client_address }}<br>@endif
      @if($facture->client_rc) RC&nbsp;: {{ $facture->client_rc }}<br>@endif
      @if($facture->client_ice) ICE&nbsp;: {{ $facture->client_ice }}<br>@endif
    </div>

    <table class="items">
      <colgroup>
        <col class="c-desc">
        <col class="c-periode">
        <col class="c-qte">
        <col class="c-pu">
        <col class="c-total">
      </colgroup>

      <thead>
        <tr>
          <th>Description</th>
          <th>Période</th>
          <th class="right">Qté</th>
          <th class="right">Prix unitaire</th>
          <th class="right">Total</th>
        </tr>
      </thead>

      <tbody>
      @foreach($facture->items as $item)
        @php
          $period = is_array($item->period) ? $item->period : ($item->period ? json_decode($item->period, true) : null);
          $from = $period['from'] ?? null;
          $to   = $period['to'] ?? null;
          $line = (float)$item->quantity * (float)$item->unit_price;
        @endphp
        <tr>
          <td style="white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; line-height: 1.1;">
            {!! nl2br(e($item->description)) !!}
          </td>
          <td class="small">
            @if($from || $to)
              {{ $from ? \Carbon\Carbon::parse($from)->format('d/m/Y') : '—' }} → {{ $to ? \Carbon\Carbon::parse($to)->format('d/m/Y') : '—' }}
            @else
              —
            @endif
          </td>
          <td class="right num">{{ number_format($item->quantity, 0, ',', ' ') }}</td>
          <td class="right num">{{ number_format($item->unit_price, 2, ',', ' ') }} MAD</td>
          <td class="right num">{{ number_format($line, 2, ',', ' ') }} MAD</td>
        </tr>
      @endforeach
      </tbody>

      <tfoot>
        <tr>
          <td colspan="4" class="right strong">Sous-total (HT)</td>
          <td class="right num">{{ number_format($itemsTotal, 2, ',', ' ') }} MAD</td>
        </tr>
        <tr>
          <td colspan="4" class="right strong">TVA ({{ rtrim(rtrim(number_format($taxRate, 2, ',', ' '), '0'), ',') }}%)</td>
          <td class="right num">{{ number_format($taxAmount, 2, ',', ' ') }} MAD</td>
        </tr>
        <tr>
          <td colspan="4" class="right strong">Total TTC</td>
          <td class="right num strong">{{ number_format($grandTotal, 2, ',', ' ') }} MAD</td>
        </tr>
      </tfoot>
    </table>

    @if(!empty($facture->notes))
      <div class="section"><strong>Notes :</strong><br>{{ $facture->notes }}</div>
    @endif
  </div>

  <div class="footer">
    <div>Taliani Auto — Location</div>
    <div>IF: 51820863 • TP: 27300518 • RC: 158687 • ICE: 003030322000030</div>
    <div>Hay Nahda — Rabat • Tél : 06 30 04 40 28</div>
  </div>

</body>
</html>