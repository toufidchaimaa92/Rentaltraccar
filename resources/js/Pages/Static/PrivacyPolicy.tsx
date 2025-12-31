import { Head } from '@inertiajs/react';
import MarketingLayout from '@/layouts/layout';
import Wrapper from '@/components/global/wrapper';

const PrivacyPolicyPage = () => {
  return (
    <MarketingLayout>
      <Head title="Politique de confidentialité">
        <meta
          name="description"
          content="Consultez la politique de confidentialité de Taliani Auto pour comprendre comment vos données sont utilisées et protégées."
        />
      </Head>

      <Wrapper>
        <h1 className="text-4xl md:text-6xl font-heading font-bold my-12 text-center w-full">
          Politique de confidentialité
        </h1>
        <p className="text-sm mb-2 italic mt-20">Dernière mise à jour : 26 mai 2025</p>

        <p className="mt-4">
          Chez <strong>Taliani Auto</strong>, la protection de votre vie privée est une priorité. Cette politique explique quelles données personnelles ou techniques nous collectons, comment nous les utilisons et les droits dont vous disposez lorsque vous utilisez notre plateforme.
        </p>

        <h2 className="text-xl font-medium mt-8">Données collectées</h2>

        <h3 className="text-lg mt-4">Informations personnelles</h3>
        <p className="mt-8">
          Lorsqu’un administrateur crée votre compte ou que vous utilisez nos services, nous pouvons enregistrer des informations telles que votre nom, votre adresse e-mail et, le cas échéant, des données de paiement.
        </p>

        <h3 className="text-lg font-medium mt-12">Informations techniques</h3>
        <p className="mt-8">
          Nous collectons automatiquement certaines données non personnelles (adresse IP, type de navigateur, pages consultées) afin d’améliorer la sécurité et la performance de la plateforme.
        </p>

        <h3 className="text-lg font-medium mt-8">Journalisation</h3>
        <p className="mt-8">
          Comme la plupart des sites, nous utilisons des journaux pour analyser l’activité (horodatage, clics, fournisseur d’accès) et améliorer l’expérience utilisateur.
        </p>

        <h3 className="text-lg font-medium mt-8">Cookies</h3>
        <p className="mt-8">
          Des cookies peuvent être utilisés pour sécuriser la session et mémoriser vos préférences. Vous pouvez les désactiver dans votre navigateur, mais certaines fonctionnalités pourraient être limitées.
        </p>

        <h2 className="text-xl font-medium mt-12">Utilisation des données</h2>

        <ul className="list-disc ml-8 mt-2 space-y-2">
          <li>Fournir et maintenir les services de gestion des locations.</li>
          <li>Personnaliser l’interface et faciliter votre navigation.</li>
          <li>Communiquer avec vous pour le suivi des contrats et des paiements.</li>
          <li>Assurer la sécurité des comptes et prévenir la fraude.</li>
          <li>Analyser l’usage de la plateforme afin d’améliorer nos outils.</li>
        </ul>

        <h2 className="text-xl font-medium mt-12">Vos droits</h2>

        <h3 className="text-lg mt-8">Accès et mise à jour</h3>
        <p className="mt-8">
          Vous pouvez consulter et mettre à jour vos informations personnelles en vous connectant à votre compte ou en contactant un administrateur.
        </p>

        <h3 className="text-lg mt-8">Opposition et suppression</h3>
        <p className="mt-8">
          Vous pouvez demander l’arrêt des communications marketing ou la suppression de vos données en nous écrivant à <a href="mailto:contact@talianiauto.com" className="underline">contact@talianiauto.com</a>.
        </p>

        <h3 className="text-lg mt-8">Conservation</h3>
        <p className="mt-8">
          Les données sont conservées aussi longtemps que nécessaire pour fournir le service ou respecter nos obligations légales.
        </p>

        <h2 className="text-xl font-medium mt-12">Sécurité</h2>
        <p className="mt-8">
          Nous mettons en place des mesures techniques et organisationnelles pour protéger vos informations contre tout accès non autorisé.
        </p>

        <h2 className="text-xl font-medium mt-12">Modifications</h2>
        <p className="mt-8">
          Cette politique peut être mise à jour. Nous publierons toute modification majeure avec une nouvelle date de mise à jour. Nous vous invitons à la consulter régulièrement.
        </p>

        <h2 className="text-xl font-medium mt-12">Contact</h2>
        <p className="mt-8">
          Pour toute question concernant la confidentialité, écrivez-nous à <a href="mailto:contact@talianiauto.com" className="underline">contact@talianiauto.com</a>.
        </p>

        <p className="mt-8 font-medium">
          En utilisant la plateforme <strong>Taliani Auto</strong>, vous reconnaissez avoir pris connaissance de cette politique de confidentialité.
        </p>
      </Wrapper>
    </MarketingLayout>
  );
};

export default PrivacyPolicyPage;
