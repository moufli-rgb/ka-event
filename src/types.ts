export type EventTypeId =
  | 'mariage'
  | 'anniversaire'
  | 'bapteme'
  | 'communion'
  | 'soutenance'
  | 'reception_privee'
  | 'professionnel'
  | 'familial'
  | 'personnalise';

export type CategoryId =
  | 'salles'
  | 'traiteurs'
  | 'patissiers'
  | 'decorateurs'
  | 'photographes'
  | 'boissons'
  | 'animation'
  | 'impression'
  | 'tenues'
  | 'logistique';

export type RelevanceLevel = 'recommandee' | 'facultative' | 'masquee';

export type BillingMode =
  | 'fixe'
  | 'horaire'
  | 'm2'
  | 'personne'
  | 'unite'
  | 'quantite'
  | 'forfait'
  | 'sur_devis';

export interface EventTypeConfig {
  id: EventTypeId;
  label: string;
  shortDesc: string;
  defaultGuests: number;
  suggestedBudgetFcfa: number;
  coverImage: string;
}

export interface ServiceCategory {
  id: CategoryId;
  label: string;
  shortDesc: string;
  coverImage: string;
}

export type EventCategoryMatrix = Record<EventTypeId, Record<CategoryId, RelevanceLevel>>;

export interface ExtraOption {
  id: string;
  label: string;
  priceFcfa: number;
}

export interface ServicePackage {
  id: string;
  title: string;
  description: string;
  billingMode: BillingMode;
  unitPriceFcfa: number; // 0 when sur_devis
  unitLabel: string; // ex: "par invité", "par m²", "par heure", "forfait journée"
  minQuantity: number;
  maxCapacityLabel: string;
  includedItems: string[];
  extraFeesLabel?: string;
  options: ExtraOption[];
  leadTimeDays: number;
}

export interface ClientReview {
  id: string;
  authorName: string;
  eventLabel: string;
  dateLabel: string;
  rating: number;
  comment: string;
  verifiedBooking: boolean;
}

export type SubscriptionPlanId = 'lancement_gratuit' | 'essentiel' | 'prestige';

export interface Provider {
  id: string;
  businessName: string;
  tagline: string;
  presentation: string;
  categoryId: CategoryId;
  secondaryCategories?: CategoryId[];
  city: string;
  coverageArea: string;
  phone: string;
  email: string;
  verifiedProfile: boolean;
  sponsored: boolean;
  subscriptionPlan: SubscriptionPlanId;
  coverImage: string;
  galleryImages: string[];
  packages: ServicePackage[];
  Reviews: ClientReview[];
  availabilitySummary: string;
  availableSaturdays: string[];
  bookingConditions: string;
  cancellationPolicy: string;
  depositPercent: number;
  statsViews: number;
  statsInquiries: number;
}

export type BudgetLineStatus =
  | 'estimation'
  | 'devis_demande'
  | 'devis_confirme'
  | 'acompte_paye';

export interface ProjectBudgetItem {
  id: string;
  providerId: string;
  providerName: string;
  categoryId: CategoryId;
  packageId: string;
  packageTitle: string;
  billingMode: BillingMode;
  unitPriceFcfa: number;
  unitLabel: string;
  quantity: number;
  selectedOptionIds: string[];
  optionsTotalFcfa: number;
  declaredExtraFeeFcfa: number;
  discountPercent: number;
  status: BudgetLineStatus;
  clientNotes?: string;
  createdAt: string;
}

export interface EventProject {
  title: string;
  eventTypeId: EventTypeId | null;
  eventDate: string;
  city: string;
  guestCount: number;
  targetBudgetFcfa: number;
  preferences: string;
  customAddedCategories: CategoryId[];
  dismissedCategories: CategoryId[];
  showFullCatalog: boolean;
  items: ProjectBudgetItem[];
}

export type GiftOccasion =
  | 'toutes'
  | 'anniversaire'
  | 'mariage'
  | 'naissance'
  | 'remerciement'
  | 'coffret_personnalise';

export interface GiftProduct {
  id: string;
  name: string;
  occasion: Exclude<GiftOccasion, 'toutes'>;
  occasionLabel: string;
  description: string;
  contents: string[];
  priceFcfa: number;
  stock: number;
  image: string;
  deliveryDelay: string;
  customizableBox: boolean;
}

export interface GiftCartItem {
  id: string;
  gift: GiftProduct;
  quantity: number;
  wrappingStyle: 'ecrin_emeraude' | 'kraft_artisanal' | 'coffret_bois';
  wrappingFeeFcfa: number;
  personalMessage: string;
  recipientName: string;
}

export interface GiftOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: GiftCartItem[];
  deliveryMode: 'livraison_express' | 'retrait_boutique';
  deliveryFeeFcfa: number;
  paymentMethod: 'Mobile Money (Wave / Orange / MTN)' | 'Carte bancaire' | 'Paiement à la livraison';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalFcfa: number;
  status: 'Confirmée — En préparation' | 'En cours de livraison' | 'Livrée';
}

export interface ServiceInquiry {
  id: string;
  reference: string;
  providerId: string;
  providerName: string;
  packageTitle: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  guestCount: number;
  message: string;
  estimatedTotalFcfa: number;
  isSurDevis: boolean;
  type: 'devis' | 'reservation';
  status: 'En attente de réponse' | 'Disponibilité confirmée' | 'Réservation validée';
  providerReply?: string;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  targetName: string;
  reason: string;
  reporterName: string;
  date: string;
  status: 'Ouvert' | 'Résolu';
}
