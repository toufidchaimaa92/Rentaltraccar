import { Head } from '@inertiajs/react';
import MarketingLayout from '@/layouts/layout';
import Wrapper from '@/components/global/wrapper';

const FeaturesPage = () => (
  <MarketingLayout>
    <Head title="Fonctionnalités - Taliani Auto" />
    <Wrapper>
      <h1 className="text-4xl md:text-5xl font-bold font-heading mb-10 text-center">✨ Fonctionnalités</h1>
      <p className="text-center max-w-2xl mx-auto text-muted-foreground mb-8">
        Tout ce que vous pouvez faire avec Taliani Auto en un coup d’œil.
      </p>

      <ul className="space-y-5 text-lg">
        <li>✅ Création rapide de dossiers de location</li>
        <li>🔗 Gestion des contrats et plaques d’immatriculation</li>
        <li>📈 Suivi en temps réel des paiements et retards</li>
        <li>🛡️ Accès sécurisé réservé aux équipes internes</li>
        <li>🎨 Interface claire et uniforme pour toute l’équipe</li>
        <li>👥 Comptes employés gérés uniquement par les administrateurs</li>
      </ul>
    </Wrapper>
  </MarketingLayout>
);

export default FeaturesPage;
