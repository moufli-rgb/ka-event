import {
  CategoryId,
  EventCategoryMatrix,
  EventTypeConfig,
  GiftProduct,
  ModerationReport,
  Provider,
  ServiceCategory,
} from '../types';
import { MEDIA } from '../assets/mediaRegistry';

export const BILLING_MODE_LABELS: Record<string, string> = {
  fixe: 'Prix fixe',
  horaire: 'Tarif horaire',
  m2: 'Prix au m²',
  personne: 'Prix par personne',
  unite: 'Prix à l’unité',
  quantite: 'Prix par lot / quantité',
  forfait: 'Forfait / Formule',
  sur_devis: 'Sur devis personnalisé',
};

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'mariage',
    label: 'Mariage & Fiançailles',
    shortDesc: 'Cérémonie civile, dot traditionnelle et grande réception nuptiale.',
    defaultGuests: 200,
    suggestedBudgetFcfa: 4500000,
    coverImage: MEDIA.heroReception,
  },
  {
    id: 'anniversaire',
    label: 'Anniversaire',
    shortDesc: 'Fête intimiste, soirée prestige ou célébration familiale sur mesure.',
    defaultGuests: 60,
    suggestedBudgetFcfa: 850000,
    coverImage: MEDIA.pastryCake,
  },
  {
    id: 'soutenance',
    label: 'Soutenance & Diplôme',
    shortDesc: 'Collation académique, impression de mémoires, toges et réception.',
    defaultGuests: 50,
    suggestedBudgetFcfa: 450000,
    coverImage: MEDIA.cateringBuffet,
  },
  {
    id: 'bapteme',
    label: 'Baptême & Naissance',
    shortDesc: 'Accueil de bébé, déjeuner convivial, pâtisserie douce et souvenirs.',
    defaultGuests: 80,
    suggestedBudgetFcfa: 950000,
    coverImage: MEDIA.decorStage,
  },
  {
    id: 'communion',
    label: 'Communion',
    shortDesc: 'Réception familiale chaleureuse, repas partagé et souvenirs photo.',
    defaultGuests: 70,
    suggestedBudgetFcfa: 750000,
    coverImage: MEDIA.pastryCake,
  },
  {
    id: 'familial',
    label: 'Cérémonie Familiale & Dot',
    shortDesc: 'Mariage coutumier, retrouvailles, tenues d’apparat et logistique.',
    defaultGuests: 150,
    suggestedBudgetFcfa: 2200000,
    coverImage: MEDIA.heroReception,
  },
  {
    id: 'professionnel',
    label: 'Événement Professionnel',
    shortDesc: 'Séminaire, lancement de produit, conférence, pause-café et gala.',
    defaultGuests: 120,
    suggestedBudgetFcfa: 2800000,
    coverImage: MEDIA.venueGarden,
  },
  {
    id: 'reception_privee',
    label: 'Réception Privée & Gala',
    shortDesc: 'Dîner privé en villa, cocktail dînatoire en jardin et scénographie.',
    defaultGuests: 80,
    suggestedBudgetFcfa: 1600000,
    coverImage: MEDIA.venueGarden,
  },
  {
    id: 'personnalise',
    label: 'Événement Personnalisé',
    shortDesc: 'Composez librement votre sélection à partir de toutes les catégories.',
    defaultGuests: 100,
    suggestedBudgetFcfa: 1500000,
    coverImage: MEDIA.decorStage,
  },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'salles',
    label: 'Salles & Jardins',
    shortDesc: 'Espaces climatisés, pavillons vitrés, domaines et terrasses.',
    coverImage: MEDIA.venueGarden,
  },
  {
    id: 'traiteurs',
    label: 'Traiteurs & Buffets',
    shortDesc: 'Gastronomie afro-fusion, cocktails dînatoires, grillades et service.',
    coverImage: MEDIA.cateringBuffet,
  },
  {
    id: 'patissiers',
    label: 'Pâtissiers & Gâteaux',
    shortDesc: 'Pièces montées, wedding cakes, mignardises et buffets sucrés.',
    coverImage: MEDIA.pastryCake,
  },
  {
    id: 'decorateurs',
    label: 'Décoration & Fleurs',
    shortDesc: 'Scénographie florale, arches, coin des mariés et art de la table.',
    coverImage: MEDIA.decorStage,
  },
  {
    id: 'photographes',
    label: 'Photo & Vidéo',
    shortDesc: 'Reportage haute définition, drone, film souvenir et studio.',
    coverImage: MEDIA.heroReception,
  },
  {
    id: 'boissons',
    label: 'Boissons & Jus Naturels',
    shortDesc: 'Jus locaux artisanaux (bissap, gingembre), caves, eaux et cocktails.',
    coverImage: MEDIA.cateringBuffet,
  },
  {
    id: 'animation',
    label: 'Animation, DJ & Maîtres',
    shortDesc: 'DJ, orchestre live, maître de cérémonie (MC) et ambiance.',
    coverImage: MEDIA.heroReception,
  },
  {
    id: 'impression',
    label: 'Imprimerie & Faire-part',
    shortDesc: 'Reliure de thèses, bâches, faire-part dorés, menus et badges.',
    coverImage: MEDIA.giftHamper,
  },
  {
    id: 'tenues',
    label: 'Tenues & Mise en beauté',
    shortDesc: 'Couture sur mesure, tenues de dot, costumes, toges et maquillage.',
    coverImage: MEDIA.decorStage,
  },
  {
    id: 'logistique',
    label: 'Chapiteaux & Sonorisation',
    shortDesc: 'Tentes climatisées, chaises Napoléon, groupes électrogènes et son.',
    coverImage: MEDIA.venueGarden,
  },
];

export const INITIAL_EVENT_CATEGORY_MATRIX: EventCategoryMatrix = {
  mariage: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    patissiers: 'recommandee',
    decorateurs: 'recommandee',
    photographes: 'recommandee',
    boissons: 'recommandee',
    animation: 'recommandee',
    tenues: 'recommandee',
    impression: 'facultative',
    logistique: 'facultative',
  },
  anniversaire: {
    salles: 'recommandee',
    patissiers: 'recommandee',
    decorateurs: 'recommandee',
    traiteurs: 'recommandee',
    boissons: 'recommandee',
    photographes: 'recommandee',
    animation: 'recommandee',
    logistique: 'facultative',
    tenues: 'facultative',
    impression: 'masquee',
  },
  soutenance: {
    salles: 'recommandee',
    impression: 'recommandee',
    traiteurs: 'recommandee',
    boissons: 'recommandee',
    photographes: 'recommandee',
    tenues: 'recommandee',
    patissiers: 'facultative',
    decorateurs: 'facultative',
    logistique: 'facultative',
    animation: 'masquee',
  },
  bapteme: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    patissiers: 'recommandee',
    decorateurs: 'recommandee',
    photographes: 'recommandee',
    boissons: 'recommandee',
    logistique: 'facultative',
    tenues: 'facultative',
    animation: 'facultative',
    impression: 'facultative',
  },
  communion: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    patissiers: 'recommandee',
    photographes: 'recommandee',
    boissons: 'recommandee',
    decorateurs: 'facultative',
    animation: 'facultative',
    impression: 'facultative',
    logistique: 'facultative',
    tenues: 'facultative',
  },
  familial: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    decorateurs: 'recommandee',
    boissons: 'recommandee',
    tenues: 'recommandee',
    animation: 'recommandee',
    logistique: 'recommandee',
    photographes: 'recommandee',
    patissiers: 'facultative',
    impression: 'facultative',
  },
  professionnel: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    impression: 'recommandee',
    photographes: 'recommandee',
    logistique: 'recommandee',
    boissons: 'recommandee',
    decorateurs: 'facultative',
    animation: 'facultative',
    patissiers: 'masquee',
    tenues: 'masquee',
  },
  reception_privee: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    decorateurs: 'recommandee',
    boissons: 'recommandee',
    animation: 'recommandee',
    photographes: 'facultative',
    patissiers: 'facultative',
    logistique: 'facultative',
    impression: 'masquee',
    tenues: 'masquee',
  },
  personnalise: {
    salles: 'recommandee',
    traiteurs: 'recommandee',
    patissiers: 'recommandee',
    decorateurs: 'recommandee',
    photographes: 'recommandee',
    boissons: 'recommandee',
    animation: 'recommandee',
    impression: 'recommandee',
    tenues: 'recommandee',
    logistique: 'recommandee',
  },
};

// Données de démonstration supprimées : tout vient maintenant de la base Supabase.
export const INITIAL_PROVIDERS: Provider[] = [];

// Données de démonstration supprimées : tout vient maintenant de la base Supabase.
export const INITIAL_GIFTS: GiftProduct[] = [];

// Données de démonstration supprimées : tout vient maintenant de la base Supabase.
export const INITIAL_REPORTS: ModerationReport[] = [];

export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount))} FCFA`;
}
