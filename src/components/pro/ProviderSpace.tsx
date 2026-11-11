import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  Clock,
  ImagePlus,
  Inbox,
  Loader2,
  MessageCircle,
  Package as PackageIcon,
  Pencil,
  Phone,
  Plus,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BillingMode, CategoryId } from '../../types';
import { BILLING_MODE_LABELS, SERVICE_CATEGORIES, formatFcfa } from '../../data/initialData';
import {
  InquiryRow,
  PackageRow,
  ProviderRow,
  frError,
  supabase,
  uploadProviderImage,
} from '../../lib/supabase';
import { AuthState } from '../../lib/useAuth';
import { AuthPanel, FullLoader, NotConfigured, ProShell } from './ProShell';
import { SafeImage } from '../SafeImage';

const CITIES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Ouidah', 'Parakou', 'Abidjan', 'Dakar', 'Lomé', 'Douala'];

const field =
  'w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white';
const labelCls = 'text-xs font-medium text-stone-600';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-stone-200 p-5 sm:p-7 ${className}`}>{children}</div>
);

/* ═════════════════════════════════ Profil ═════════════════════════════════ */

type ProfileDraft = Omit<ProviderRow, 'id' | 'owner_id' | 'verified' | 'created_at'>;

const emptyProfile = (email: string): ProfileDraft => ({
  business_name: '',
  tagline: '',
  presentation: '',
  category_id: 'traiteurs',
  city: 'Cotonou',
  coverage_area: '',
  phone: '',
  email,
  cover_image: '',
  gallery_images: [],
  availability_summary: 'Disponible sur réservation',
  booking_conditions: '',
  cancellation_policy: '',
  deposit_percent: 30,
  published: true,
});

const ProfileForm: React.FC<{
  userId: string;
  initial: ProfileDraft;
  isNew: boolean;
  onSaved: (row: ProviderRow) => void;
  providerId?: string;
}> = ({ userId, initial, isNew, onSaved, providerId }) => {
  const [d, setD] = useState<ProfileDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'cover' | 'gallery' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  const onCover = async (f?: File) => {
    if (!f) return;
    setUploading('cover');
    setError(null);
    try {
      set('cover_image', await uploadProviderImage(userId, f));
    } catch (e) {
      setError(frError(e));
    } finally {
      setUploading(null);
    }
  };

  const onGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading('gallery');
    setError(null);
    try {
      const room = Math.max(0, 6 - d.gallery_images.length);
      const urls = await Promise.all(Array.from(files).slice(0, room).map((f) => uploadProviderImage(userId, f)));
      set('gallery_images', [...d.gallery_images, ...urls]);
    } catch (e) {
      setError(frError(e));
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      const payload = { ...d, business_name: d.business_name.trim() };
      const q = isNew
        ? supabase.from('providers').insert({ ...payload, owner_id: userId })
        : supabase.from('providers').update(payload).eq('id', providerId!);
      const { data, error } = await q.select().single();
      if (error) throw error;
      onSaved(data as ProviderRow);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(frError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Votre entreprise</h2>
          <p className="text-sm text-stone-500">Ces informations apparaissent sur votre page vue par les clients.</p>
        </div>

        {/* Photo de couverture */}
        <label className="block relative aspect-[16/7] rounded-xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-300 cursor-pointer group">
          {d.cover_image ? (
            <SafeImage src={d.cover_image} alt="Photo de couverture" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500 gap-2">
              <Camera className="w-7 h-7" />
              <span className="text-sm font-medium">Ajouter une photo de couverture</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            {uploading === 'cover' && <Loader2 className="w-7 h-7 animate-spin text-white" />}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onCover(e.target.files?.[0])} />
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 sm:col-span-2">
            <span className={labelCls}>Nom de votre entreprise *</span>
            <input required className={field} value={d.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="Ex. Saveurs du Bénin Traiteur" />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Votre métier *</span>
            <select className={field} value={d.category_id} onChange={(e) => set('category_id', e.target.value as CategoryId)}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Ville *</span>
            <input required list="kf-cities" className={field} value={d.city} onChange={(e) => set('city', e.target.value)} />
            <datalist id="kf-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className={labelCls}>Phrase d’accroche</span>
            <input className={field} maxLength={140} value={d.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Ex. Buffets béninois et cocktails pour vos grands jours" />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className={labelCls}>Présentation</span>
            <textarea rows={4} className={field} value={d.presentation} onChange={(e) => set('presentation', e.target.value)} placeholder="Votre expérience, votre style, ce qui vous rend unique…" />
          </label>
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-lg font-semibold">Contact et zone</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className={labelCls}>Téléphone / WhatsApp *</span>
            <input required type="tel" className={field} value={d.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+229 01 00 00 00 00" />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>E-mail de contact</span>
            <input type="email" className={field} value={d.email} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Zone couverte</span>
            <input className={field} value={d.coverage_area} onChange={(e) => set('coverage_area', e.target.value)} placeholder="Ex. Cotonou et environs" />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Disponibilités</span>
            <input className={field} value={d.availability_summary} onChange={(e) => set('availability_summary', e.target.value)} />
          </label>
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-lg font-semibold">Conditions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className={labelCls}>Acompte demandé (%)</span>
            <input type="number" min={0} max={100} className={field} value={d.deposit_percent} onChange={(e) => set('deposit_percent', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className={labelCls}>Conditions de réservation</span>
            <textarea rows={2} className={field} value={d.booking_conditions} onChange={(e) => set('booking_conditions', e.target.value)} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className={labelCls}>Annulation / report</span>
            <textarea rows={2} className={field} value={d.cancellation_policy} onChange={(e) => set('cancellation_policy', e.target.value)} />
          </label>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Galerie photos</h2>
            <p className="text-sm text-stone-500">Jusqu’à 6 photos de vos réalisations.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {d.gallery_images.map((src) => (
            <div key={src} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
              <SafeImage src={src} alt="Réalisation" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => set('gallery_images', d.gallery_images.filter((g) => g !== src))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                aria-label="Retirer la photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {d.gallery_images.length < 6 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-500 cursor-pointer hover:border-emerald-700 hover:text-emerald-800">
              {uploading === 'gallery' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGallery(e.target.files)} />
            </label>
          )}
        </div>
      </Card>

      {!isNew && (
        <Card>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-semibold">Profil visible par les clients</p>
              <p className="text-sm text-stone-500">Désactivez pour masquer temporairement votre page.</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-emerald-700" checked={d.published} onChange={(e) => set('published', e.target.checked)} />
          </label>
        </Card>
      )}

      {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-4 py-3">{error}</p>}

      <div className="sticky bottom-3 z-10">
        <button
          type="submit"
          disabled={busy || uploading !== null}
          className="w-full sm:w-auto sm:float-right px-8 py-3.5 rounded-full bg-emerald-800 text-white text-sm font-semibold shadow-lg hover:bg-emerald-900 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {isNew ? 'Créer mon profil' : saved ? 'Enregistré' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
};

/* ═════════════════════════════════ Prestations ═════════════════════════════════ */

type PackageDraft = {
  title: string;
  description: string;
  billing_mode: BillingMode;
  unit_price_fcfa: number;
  unit_label: string;
  min_quantity: number;
  max_capacity_label: string;
  included: string;
  extra_fees_label: string;
  lead_time_days: number;
};

const UNIT_HINT: Record<BillingMode, string> = {
  fixe: 'prix fixe',
  horaire: 'par heure',
  m2: 'par m²',
  personne: 'par invité',
  unite: 'par pièce',
  quantite: 'par lot',
  forfait: 'forfait',
  sur_devis: 'sur devis',
};

const emptyPackage = (): PackageDraft => ({
  title: '',
  description: '',
  billing_mode: 'forfait',
  unit_price_fcfa: 0,
  unit_label: 'forfait',
  min_quantity: 1,
  max_capacity_label: '',
  included: '',
  extra_fees_label: '',
  lead_time_days: 7,
});

const fromRow = (r: PackageRow): PackageDraft => ({
  title: r.title,
  description: r.description,
  billing_mode: r.billing_mode,
  unit_price_fcfa: r.unit_price_fcfa,
  unit_label: r.unit_label,
  min_quantity: r.min_quantity,
  max_capacity_label: r.max_capacity_label,
  included: (r.included_items || []).join('\n'),
  extra_fees_label: r.extra_fees_label || '',
  lead_time_days: r.lead_time_days,
});

const PackageEditor: React.FC<{
  providerId: string;
  editing: PackageRow | null;
  onDone: () => void;
  onCancel: () => void;
}> = ({ providerId, editing, onDone, onCancel }) => {
  const [d, setD] = useState<PackageDraft>(editing ? fromRow(editing) : emptyPackage());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PackageDraft>(k: K, v: PackageDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const surDevis = d.billing_mode === 'sur_devis';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const row = {
      provider_id: providerId,
      title: d.title.trim(),
      description: d.description.trim(),
      billing_mode: d.billing_mode,
      unit_price_fcfa: surDevis ? 0 : Math.max(0, Math.round(d.unit_price_fcfa)),
      unit_label: d.unit_label.trim() || UNIT_HINT[d.billing_mode],
      min_quantity: Math.max(1, d.min_quantity),
      max_capacity_label: d.max_capacity_label.trim(),
      included_items: d.included.split('\n').map((s) => s.trim()).filter(Boolean),
      extra_fees_label: d.extra_fees_label.trim() || null,
      lead_time_days: Math.max(0, d.lead_time_days),
    };
    try {
      const { error } = editing
        ? await supabase.from('packages').update(row).eq('id', editing.id)
        : await supabase.from('packages').insert(row);
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(frError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-emerald-700 p-5 sm:p-7 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{editing ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
        <button type="button" onClick={onCancel} className="p-1.5 text-stone-400 hover:text-zinc-900" aria-label="Fermer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelCls}>Nom de la prestation *</span>
          <input required className={field} value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex. Buffet mariage 100 invités" />
        </label>
        <label className="space-y-1.5">
          <span className={labelCls}>Comment est calculé le prix ?</span>
          <select
            className={field}
            value={d.billing_mode}
            onChange={(e) => {
              const m = e.target.value as BillingMode;
              setD((p) => ({ ...p, billing_mode: m, unit_label: UNIT_HINT[m] }));
            }}
          >
            {Object.entries(BILLING_MODE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </label>
        {!surDevis && (
          <label className="space-y-1.5">
            <span className={labelCls}>Prix (FCFA) *</span>
            <input required type="number" min={0} step={500} className={`${field} tabular-nums`} value={d.unit_price_fcfa || ''} onChange={(e) => set('unit_price_fcfa', Number(e.target.value) || 0)} />
          </label>
        )}
        {!surDevis && (
          <label className="space-y-1.5">
            <span className={labelCls}>Unité affichée</span>
            <input className={field} value={d.unit_label} onChange={(e) => set('unit_label', e.target.value)} />
          </label>
        )}
        {!surDevis && (
          <label className="space-y-1.5">
            <span className={labelCls}>Quantité minimum</span>
            <input type="number" min={1} className={field} value={d.min_quantity} onChange={(e) => set('min_quantity', Number(e.target.value) || 1)} />
          </label>
        )}
        <label className="space-y-1.5">
          <span className={labelCls}>Capacité</span>
          <input className={field} value={d.max_capacity_label} onChange={(e) => set('max_capacity_label', e.target.value)} placeholder="Ex. Jusqu’à 300 invités" />
        </label>
        <label className="space-y-1.5">
          <span className={labelCls}>Réserver au moins (jours avant)</span>
          <input type="number" min={0} className={field} value={d.lead_time_days} onChange={(e) => set('lead_time_days', Number(e.target.value) || 0)} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelCls}>Description</span>
          <textarea rows={3} className={field} value={d.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelCls}>Ce qui est inclus (une ligne par élément)</span>
          <textarea rows={3} className={field} value={d.included} onChange={(e) => set('included', e.target.value)} placeholder={'Service à table\nVaisselle\nInstallation'} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelCls}>Frais en plus (facultatif)</span>
          <input className={field} value={d.extra_fees_label} onChange={(e) => set('extra_fees_label', e.target.value)} placeholder="Ex. Transport hors Cotonou : 15 000 FCFA" />
        </label>
      </div>
      {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-4 py-3">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-3 rounded-full text-sm font-semibold text-stone-600 hover:bg-stone-100">
          Annuler
        </button>
        <button type="submit" disabled={busy} className="px-6 py-3 rounded-full bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 disabled:opacity-60 inline-flex items-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {editing ? 'Enregistrer' : 'Publier la prestation'}
        </button>
      </div>
    </motion.form>
  );
};

const PackagesPanel: React.FC<{ providerId: string; packages: PackageRow[]; reload: () => void }> = ({
  providerId,
  packages,
  reload,
}) => {
  const [editing, setEditing] = useState<PackageRow | 'new' | null>(packages.length === 0 ? 'new' : null);

  const remove = async (p: PackageRow) => {
    if (!supabase || !window.confirm(`Supprimer « ${p.title} » ?`)) return;
    await supabase.from('packages').delete().eq('id', p.id);
    reload();
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {editing ? (
          <PackageEditor
            key={editing === 'new' ? 'new' : editing.id}
            providerId={providerId}
            editing={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        ) : (
          <motion.button
            key="add"
            type="button"
            onClick={() => setEditing('new')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full py-5 rounded-2xl border-2 border-dashed border-stone-300 text-stone-600 font-semibold hover:border-emerald-700 hover:text-emerald-800 inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Ajouter une prestation
          </motion.button>
        )}
      </AnimatePresence>

      {packages.map((p) => (
        <Card key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-stone-500">{BILLING_MODE_LABELS[p.billing_mode]}</p>
            <h3 className="font-semibold text-zinc-900 truncate">{p.title}</h3>
            <p className="text-sm font-bold text-emerald-900 tabular-nums mt-0.5">
              {p.billing_mode === 'sur_devis' ? 'Sur devis' : `${formatFcfa(p.unit_price_fcfa)} / ${p.unit_label}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setEditing(p)} className="px-4 py-2 rounded-full border border-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-stone-50">
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
            <button type="button" onClick={() => remove(p)} className="px-3 py-2 rounded-full border border-stone-200 text-stone-500 hover:text-rose-700 hover:border-rose-200" aria-label="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* ═════════════════════════════════ Demandes reçues ═════════════════════════════════ */

const InquiriesPanel: React.FC<{ inquiries: InquiryRow[]; reload: () => void }> = ({ inquiries, reload }) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const answer = async (inq: InquiryRow, status: InquiryRow['status']) => {
    if (!supabase) return;
    setBusyId(inq.id);
    await supabase
      .from('inquiries')
      .update({ status, provider_reply: (drafts[inq.id] ?? inq.provider_reply ?? '').trim() || null })
      .eq('id', inq.id);
    setBusyId(null);
    reload();
  };

  if (inquiries.length === 0) {
    return (
      <Card className="text-center py-14 space-y-2">
        <Inbox className="w-8 h-8 text-stone-300 mx-auto" />
        <p className="font-semibold">Aucune demande pour le moment</p>
        <p className="text-sm text-stone-500">Les demandes de devis des clients apparaîtront ici.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inq) => {
        const wa = `https://wa.me/${inq.client_phone.replace(/[^\d]/g, '')}`;
        const pending = inq.status === 'En attente de réponse';
        return (
          <Card key={inq.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-stone-500">
                  {inq.reference} · {new Date(inq.created_at).toLocaleDateString('fr-FR')} ·{' '}
                  {inq.type === 'reservation' ? 'Réservation' : 'Devis'}
                </p>
                <h3 className="font-semibold text-zinc-900">{inq.client_name}</h3>
                <p className="text-sm text-stone-600">{inq.package_title}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                  pending ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {inq.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-600">
              {inq.event_date && (
                <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(inq.event_date).toLocaleDateString('fr-FR')}</span>
              )}
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {inq.guest_count} invités</span>
              <span className="tabular-nums font-semibold text-zinc-900">
                {inq.is_sur_devis ? 'Sur devis' : `≈ ${formatFcfa(inq.estimated_total_fcfa)}`}
              </span>
            </div>
            {inq.message && <p className="text-sm text-stone-700 bg-stone-50 rounded-xl p-3">« {inq.message} »</p>}

            <div className="flex flex-wrap gap-2">
              <a href={`tel:${inq.client_phone}`} className="px-4 py-2 rounded-full border border-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-stone-50">
                <Phone className="w-3.5 h-3.5" /> {inq.client_phone}
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold inline-flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>

            <textarea
              rows={2}
              className={field}
              placeholder="Votre réponse au client (facultatif)"
              value={drafts[inq.id] ?? inq.provider_reply ?? ''}
              onChange={(e) => setDrafts((p) => ({ ...p, [inq.id]: e.target.value }))}
            />
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" disabled={busyId === inq.id} onClick={() => answer(inq, 'Disponibilité confirmée')} className="px-4 py-2.5 rounded-full border border-emerald-700 text-emerald-800 text-xs font-semibold hover:bg-emerald-50">
                Je suis disponible
              </button>
              <button type="button" disabled={busyId === inq.id} onClick={() => answer(inq, 'Réservation validée')} className="px-4 py-2.5 rounded-full bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 inline-flex items-center gap-1.5">
                {busyId === inq.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Valider la réservation
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

/* ═════════════════════════════════ Nouveau mot de passe ═════════════════════════════════ */

const NewPasswordForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase!.auth.updateUser({ password: pwd });
          setBusy(false);
          if (error) setError(frError(error));
          else onDone();
        }}
        className="bg-white rounded-2xl border border-stone-200 p-7 space-y-4"
      >
        <h1 className="text-xl font-semibold">Choisissez un nouveau mot de passe</h1>
        <input type="password" required minLength={6} className={field} value={pwd} onChange={(e) => setPwd(e.target.value)} />
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-emerald-800 text-white text-sm font-semibold">
          Enregistrer
        </button>
      </form>
    </div>
  );
};

/* ═════════════════════════════════ Page principale ═════════════════════════════════ */

type Tab = 'prestations' | 'demandes' | 'profil';

export const ProviderSpace: React.FC<{ auth: AuthState; onBackToSite: () => void; onOpenAdmin: () => void }> = ({
  auth,
  onBackToSite,
  onOpenAdmin,
}) => {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderRow | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [tab, setTab] = useState<Tab>('prestations');
  const [recovery, setRecovery] = useState(false);
  const userId = auth.user?.id;

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!supabase || !userId) return;
    const { data: prov } = await supabase.from('providers').select('*').eq('owner_id', userId).maybeSingle();
    setProvider((prov as ProviderRow) || null);
    if (prov) {
      const [{ data: pk }, { data: iq }] = await Promise.all([
        supabase.from('packages').select('*').eq('provider_id', prov.id).order('created_at'),
        supabase.from('inquiries').select('*').eq('provider_id', prov.id).order('created_at', { ascending: false }),
      ]);
      setPackages((pk as PackageRow[]) || []);
      setInquiries((iq as InquiryRow[]) || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      load();
    }
  }, [userId, load]);

  const shell = (children: React.ReactNode) => (
    <ProShell title="Espace prestataire" userEmail={auth.user?.email} onBackToSite={onBackToSite}>
      {children}
    </ProShell>
  );

  if (!supabase) return shell(<NotConfigured />);
  if (auth.loading) return shell(<FullLoader />);
  if (recovery && auth.user) return shell(<NewPasswordForm onDone={() => setRecovery(false)} />);
  if (!auth.user)
    return shell(
      <AuthPanel heading="Espace prestataire" subheading="Connectez-vous pour gérer votre profil et vos prestations." />
    );
  if (loading) return shell(<FullLoader />);

  // Première connexion : création du profil
  if (!provider) {
    return shell(
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Bienvenue</p>
          <h1 className="text-3xl font-semibold mt-1">Créez votre profil prestataire</h1>
          <p className="text-sm text-stone-500 mt-2">
            Remplissez ces informations une seule fois. Vous ajouterez ensuite vos prestations et vos prix.
          </p>
          {auth.isAdmin && (
            <button type="button" onClick={onOpenAdmin} className="mt-3 text-sm font-semibold text-emerald-800 underline">
              Ou aller à l’administration →
            </button>
          )}
        </div>
        <ProfileForm
          userId={auth.user.id}
          isNew
          initial={emptyProfile(auth.user.email || '')}
          onSaved={(row) => {
            setProvider(row);
            setTab('prestations');
          }}
        />
      </div>
    );
  }

  const pendingCount = inquiries.filter((i) => i.status === 'En attente de réponse').length;
  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'prestations', label: 'Mes prestations', icon: PackageIcon },
    { id: 'demandes', label: 'Demandes', icon: Inbox, badge: pendingCount },
    { id: 'profil', label: 'Mon profil', icon: Store },
  ];

  return shell(
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Carte d'identité */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 text-white">
        {provider.cover_image && (
          <SafeImage src={provider.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="relative p-6 sm:p-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-white/15">
              {SERVICE_CATEGORIES.find((c) => c.id === provider.category_id)?.label}
            </span>
            {provider.verified ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white inline-flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" /> Vérifié
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> En attente de vérification
              </span>
            )}
            {!provider.published && <span className="px-2.5 py-1 rounded-full bg-rose-500">Masqué</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold">{provider.business_name}</h1>
          <div className="flex gap-6 text-sm text-stone-300 tabular-nums">
            <span><strong className="text-white text-lg">{packages.length}</strong> prestation{packages.length > 1 ? 's' : ''}</span>
            <span><strong className="text-white text-lg">{inquiries.length}</strong> demande{inquiries.length > 1 ? 's' : ''}</span>
          </div>
          {auth.isAdmin && (
            <button type="button" onClick={onOpenAdmin} className="text-xs font-semibold underline text-emerald-300">
              Ouvrir l’administration →
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-stone-200 rounded-full">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative py-2.5 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
              tab === id ? 'text-white' : 'text-stone-600'
            }`}
          >
            {tab === id && (
              <motion.span layoutId="pro-tab" className="absolute inset-0 rounded-full bg-emerald-800" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <Icon className="relative w-4 h-4" />
            <span className="relative">{label}</span>
            {!!badge && (
              <span className="relative min-w-5 h-5 px-1 rounded-full bg-amber-400 text-zinc-950 text-[10px] flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'prestations' && <PackagesPanel providerId={provider.id} packages={packages} reload={load} />}
          {tab === 'demandes' && <InquiriesPanel inquiries={inquiries} reload={load} />}
          {tab === 'profil' && (
            <ProfileForm
              userId={auth.user.id}
              isNew={false}
              providerId={provider.id}
              initial={{
                business_name: provider.business_name,
                tagline: provider.tagline,
                presentation: provider.presentation,
                category_id: provider.category_id,
                city: provider.city,
                coverage_area: provider.coverage_area,
                phone: provider.phone,
                email: provider.email,
                cover_image: provider.cover_image,
                gallery_images: provider.gallery_images || [],
                availability_summary: provider.availability_summary,
                booking_conditions: provider.booking_conditions,
                cancellation_policy: provider.cancellation_policy,
                deposit_percent: provider.deposit_percent,
                published: provider.published,
              }}
              onSaved={(row) => setProvider(row)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
