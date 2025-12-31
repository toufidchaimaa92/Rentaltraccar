import {
    LockIcon,
    DatabaseIcon,
    TrendingUpIcon,
    Link2Icon,
    ZapIcon
} from "lucide-react";

export const FEATURES = [
    {
        title: "Créer un collage",
        description: "Créez et partagez facilement des liens et textes regroupés.",
        icon: Link2Icon,
        image: "/images/feature-two.svg",
    },
    {
        title: "Collages protégés par mot de passe",
        description: "Protégez vos partages avec un mot de passe pour en contrôler l’accès.",
        icon: LockIcon,
        image: "/images/feature-one.svg",
    },
    {
        title: "Gestion des liens",
        description: "Retrouvez vos contenus simplement grâce à la recherche.",
        icon: DatabaseIcon,
        image: "/images/feature-three.svg",
    },
    {
        title: "Analyses en temps réel",
        description: "Suivez et analysez les performances de vos partages en direct.",
        icon: TrendingUpIcon,
        image: "/images/feature-four.svg",
    },
    {
        title: "Optimisation dynamique",
        description: "Optimisez automatiquement vos liens pour de meilleures performances.",
        icon: ZapIcon,
        image: "/images/feature-five.svg",
    }
]