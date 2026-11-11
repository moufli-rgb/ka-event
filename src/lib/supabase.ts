import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  BillingMode,
  CategoryId,
  ClientReview,
  ExtraOption,
  ModerationReport,
  Provider,
  ServiceInquiry,
  ServicePackage,
} from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true quand les clés Supabase sont renseignées dans le fichier .env.local */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export const IMAGE_BUCKET = 'provider-images';

/* ─────────────────────────── Lignes de la base ─────────────────────────── */

export interface ProviderRow {
  id: string;
  owner_id: string;
  business_name: string;
  tagline: string;
  presentation: string;
  category_id: string;
  city: string;
  coverage_area: string;
  phone: string;
  email: string;
  cover_image: string;
  gallery_images: string[];
  availability_summary: string;
  booking_conditions: string;
  cancellation_policy: string;
  deposit_percent: number;
  verified: boolean;
  published: boolean;
  created_at: string;
}

export interface PackageRow {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  billing_mode: BillingMode;
  unit_price_fcfa: number;
  unit_label: string;
  min_quantity: number;
  max_capacity_label: string;
  included_items: string[];
  extra_fees_label: string | null;
  options: ExtraOption[];
  lead_time_days: number;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  provider_id: string;
  author_name: string;
  event_label: string;
  rating: number;
  comment: string;
  verified_booking: boolean;
  created_at: string;
}

export interface InquiryRow {
  id: string;
  reference: string;
  provider_id: string;
  package_title: string;
  client_name: string;
  client_phone: string;
  event_date: string | null;
  guest_count: number;
  message: string;
  estimated_total_fcfa: number;
  is_sur_devis: boolean;
  type: 'devis' | 'reservation';
  status: ServiceInquiry['status'];
  provider_reply: string | null;
  created_at: string;
}

export interface ReportRow {
  id: string;
  provider_id: string | null;
  target_name: string;
  reason: string;
  reporter_name: string;
  status: 'Ouvert' | 'Résolu';
  created_at: string;
}

/* ─────────────────────────── Conversions ─────────────────────────── */

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

export const toPackage = (r: PackageRow): ServicePackage => ({
  id: r.id,
  title: r.title,
  description: r.description,
  billingMode: r.billing_mode,
  unitPriceFcfa: r.unit_price_fcfa,
  unitLabel: r.unit_label,
  minQuantity: r.min_quantity,
  maxCapacityLabel: r.max_capacity_label,
  includedItems: r.included_items || [],
  extraFeesLabel: r.extra_fees_label || undefined,
  options: Array.isArray(r.options) ? r.options : [],
  leadTimeDays: r.lead_time_days,
});

export const toReview = (r: ReviewRow): ClientReview => ({
  id: r.id,
  authorName: r.author_name,
  eventLabel: r.event_label,
  dateLabel: monthLabel(r.created_at),
  rating: r.rating,
  comment: r.comment,
  verifiedBooking: r.verified_booking,
});

export const toProvider = (
  r: ProviderRow & { packages?: PackageRow[]; reviews?: ReviewRow[] }
): Provider => ({
  id: r.id,
  businessName: r.business_name,
  tagline: r.tagline,
  presentation: r.presentation,
  categoryId: r.category_id as CategoryId,
  city: r.city,
  coverageArea: r.coverage_area,
  phone: r.phone,
  email: r.email,
  verifiedProfile: r.verified,
  sponsored: false,
  subscriptionPlan: 'lancement_gratuit',
  coverImage: r.cover_image,
  galleryImages: r.gallery_images || [],
  packages: (r.packages || [])
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(toPackage),
  Reviews: (r.reviews || [])
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toReview),
  availabilitySummary: r.availability_summary,
  availableSaturdays: [],
  bookingConditions: r.booking_conditions,
  cancellationPolicy: r.cancellation_policy,
  depositPercent: r.deposit_percent,
  statsViews: 0,
  statsInquiries: 0,
});

export const toInquiry = (r: InquiryRow, providerName = ''): ServiceInquiry => ({
  id: r.id,
  reference: r.reference,
  providerId: r.provider_id,
  providerName,
  packageTitle: r.package_title,
  clientName: r.client_name,
  clientPhone: r.client_phone,
  eventDate: r.event_date || '',
  guestCount: r.guest_count,
  message: r.message,
  estimatedTotalFcfa: r.estimated_total_fcfa,
  isSurDevis: r.is_sur_devis,
  type: r.type,
  status: r.status,
  providerReply: r.provider_reply || undefined,
  createdAt: r.created_at,
});

export const toReport = (r: ReportRow): ModerationReport => ({
  id: r.id,
  targetName: r.target_name,
  reason: r.reason,
  reporterName: r.reporter_name,
  date: new Date(r.created_at).toLocaleDateString('fr-FR'),
  status: r.status,
});

/* ─────────────────────────── Lectures publiques ─────────────────────────── */

export async function fetchPublicProviders(): Promise<Provider[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('providers')
    .select('*, packages(*), reviews(*)')
    .eq('published', true)
    .order('verified', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toProvider);
}

/* ─────────────────────────── Actions des clients ─────────────────────────── */

export async function sendInquiry(
  payload: Omit<ServiceInquiry, 'id' | 'reference' | 'createdAt' | 'status'>
): Promise<ServiceInquiry> {
  if (!supabase) throw new Error('Base de données non configurée');
  // Les clients ne peuvent pas relire la table (confidentialité) : la référence est créée ici.
  const reference = `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { error } = await supabase.from('inquiries').insert({
    reference,
    provider_id: payload.providerId,
    package_title: payload.packageTitle,
    client_name: payload.clientName,
    client_phone: payload.clientPhone,
    event_date: payload.eventDate || null,
    guest_count: payload.guestCount,
    message: payload.message,
    estimated_total_fcfa: Math.round(payload.estimatedTotalFcfa),
    is_sur_devis: payload.isSurDevis,
    type: payload.type,
  });
  if (error) throw error;
  return {
    ...payload,
    id: `local-${Date.now()}`,
    reference,
    status: 'En attente de réponse',
    createdAt: new Date().toISOString(),
  };
}

export async function addReview(providerId: string, review: Omit<ClientReview, 'id' | 'dateLabel'>) {
  if (!supabase) throw new Error('Base de données non configurée');
  const { error } = await supabase.from('reviews').insert({
    provider_id: providerId,
    author_name: review.authorName,
    event_label: review.eventLabel,
    rating: review.rating,
    comment: review.comment,
  });
  if (error) throw error;
}

export async function reportProvider(providerId: string | null, targetName: string, reason: string) {
  if (!supabase) throw new Error('Base de données non configurée');
  const { error } = await supabase
    .from('reports')
    .insert({ provider_id: providerId, target_name: targetName, reason });
  if (error) throw error;
}

/* ─────────────────────────── Photos ─────────────────────────── */

export async function uploadProviderImage(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Base de données non configurée');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Traduit les erreurs Supabase les plus courantes en français. */
export function frError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String((err as { message?: string })?.message || err);
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(msg)) return 'Confirmez d’abord votre adresse e-mail (lien reçu par e-mail).';
  if (/User already registered/i.test(msg)) return 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
  if (/Password should be at least/i.test(msg)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (/rate limit/i.test(msg)) return 'Trop de tentatives. Patientez quelques minutes.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Connexion impossible. Vérifiez votre accès internet.';
  return msg || 'Une erreur est survenue.';
}
