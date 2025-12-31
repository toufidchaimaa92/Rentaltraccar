@component('mail::message')
<style>
  body {
    font-family: Arial, sans-serif;
  }
  .button {
    background-color: #4CAF50;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    display: inline-block;
  }
</style>

<div style="text-align: center; margin-bottom: 20px;">
  <img src="{{ asset('images/email-logo.png') }}" alt="PasterLink Logo" width="150">
</div>

<div style="padding: 10px 10px;">
  <h1 style="margin-bottom: 10px;">🔐 Réinitialisation du mot de passe</h1>

  <p style="margin-bottom: 20px;">
    Bonjour {{ $user->name ?? 'Utilisateur' }},<br><br>
    Vous recevez ce message car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
  </p>

  @component('mail::button', ['url' => $url, 'color' => 'success'])
  Réinitialiser le mot de passe
  @endcomponent

  <p style="margin-top: 20px;">
    Ce lien expirera dans 60 minutes.<br><br>
    Si vous n’avez pas demandé cette réinitialisation, aucune action n’est requise.
  </p>

  <p>Merci,<br>
  L'équipe {{ config('app.name') }}</p>
</div>
@endcomponent
