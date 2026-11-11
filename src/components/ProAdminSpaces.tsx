import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Eye,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import {
  BillingMode,
  CategoryId,
  EventCategoryMatrix,
  EventTypeId,
  GiftProduct,
  ModerationReport,
  Provider,
  RelevanceLevel,
  ServiceInquiry,
  ServicePackage,
  SubscriptionPlanId,
} from '../types';
import {
  BILLING_MODE_LABELS,
  EVENT_TYPES,
  SERVICE_CATEGORIES,
  formatFcfa,
} from '../data/initialData';

interface ProAdminSpacesProps {
  initialSpace?: 'prestataire' | 'admin';
  providers: Provider[];
  matrix: EventCategoryMatrix;
  inquiries: ServiceInquiry[];
  gifts: GiftProduct[];
  reports: ModerationReport[];
  onAddPackageToProvider: (providerId: string, pkg: ServicePackage) => void;
  onUpdateProviderSubscription: (providerId: string, plan: SubscriptionPlanId) => void;
  onReplyToInquiry: (
    inquiryId: string,
    status: ServiceInquiry['status'],
    reply: string
  ) => void;
  onUpdateMatrixCell: (
    eventId: EventTypeId,
    categoryId: CategoryId,
    nextLevel: RelevanceLevel
  ) => void;
  onToggleVerifyProvider: (providerId: string) => void;
  onUpdateGiftStock: (giftId: string, nextStock: number) => void;
  onResolveReport: (reportId: string) => void;
}

const RELEVANCE_CYCLE: Record<RelevanceLevel, RelevanceLevel> = {
  recommandee: 'facultative',
  facultative: 'masquee',
  masquee: 'recommandee',
};

const RELEVANCE_LABELS: Record<RelevanceLevel, string> = {
  recommandee: 'Recommandée',
  facultative: 'Facultative',
  masquee: 'Masquée',
};

export const ProAdminSpaces: React.FC<ProAdminSpacesProps> = ({
  providers,
  matrix,
  inquiries,
  gifts,
  reports,
  onAddPackageToProvider,
  onUpdateProviderSubscription,
  onReplyToInquiry,
  onUpdateMatrixCell,
  onToggleVerifyProvider,
  onUpdateGiftStock,
  onResolveReport,
  initialSpace = 'prestataire',
}) => {
  const [activeSpace, setActiveSpace] = useState<'prestataire' | 'admin'>(initialSpace);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [adminLog, setAdminLog] = useState<string[]>([
    '11 nov. 2026 · Initialisation de la matrice de filtrage événementiel (9 types d’événements actifs).',
  ]);

  // New package form for Provider
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgBilling, setPkgBilling] = useState<BillingMode>('forfait');
  const [pkgPrice, setPkgPrice] = useState(150000);
  const [pkgUnitLabel, setPkgUnitLabel] = useState('forfait journée');
  const [pkgMinQty, setPkgMinQty] = useState(1);
  const [pkgCapacity, setPkgCapacity] = useState('Jusqu’à 150 personnes');
  const [pkgIncluded, setPkgIncluded] = useState('Installation complète, démontage inclus');
  const [proBanner, setProBanner] = useState<string | null>(null);

  // Reply state
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const activeProvider =
    providers.find((p) => p.id === selectedProviderId) || providers[0];

  const providerInquiries = inquiries.filter(
    (inq) => inq.providerId === activeProvider?.id
  );

  const appendLog = (entry: string) => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setAdminLog((prev) => [`${time} · ${entry}`, ...prev.slice(0, 9)]);
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvider || !pkgTitle.trim()) return;
    const newPkg: ServicePackage = {
      id: `pkg-custom-${Date.now()}`,
      title: pkgTitle.trim(),
      description: `Prestation proposée par ${activeProvider.businessName} (${pkgCapacity}).`,
      billingMode: pkgBilling,
      unitPriceFcfa: pkgBilling === 'sur_devis' ? 0 : Math.max(0, pkgPrice),
      unitLabel: pkgBilling === 'sur_devis' ? 'sur devis' : pkgUnitLabel.trim(),
      minQuantity: Math.max(1, pkgMinQty),
      maxCapacityLabel: pkgCapacity.trim(),
      includedItems: pkgIncluded
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      options: [],
      leadTimeDays: 7,
    };
    onAddPackageToProvider(activeProvider.id, newPkg);
    setPkgTitle('');
    setProBanner('Nouvelle prestation publiée ! Elle est immédiatement visible et calculable côté client.');
    setTimeout(() => setProBanner(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 mb-2">
            Espace pro
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900">
            {activeSpace === 'prestataire' ? 'Mon espace prestataire' : 'Administration'}
          </h1>
          <p className="text-sm text-stone-500 mt-2 max-w-xl">
            {activeSpace === 'prestataire'
              ? 'Gérez votre profil, publiez vos prestations avec leurs prix et répondez aux demandes des clients.'
              : 'Vérifiez les prestataires, choisissez les prestations proposées pour chaque événement et traitez les signalements.'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-full w-fit max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSpace('prestataire')}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeSpace === 'prestataire'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-stone-600 hover:text-zinc-900'
            }`}
          >
            Je suis prestataire
          </button>
          <button
            type="button"
            onClick={() => setActiveSpace('admin')}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              activeSpace === 'admin'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-stone-600 hover:text-zinc-900'
            }`}
          >
            Je suis administrateur
          </button>
        </div>
      </div>

      {activeSpace === 'prestataire' && activeProvider && (
        <div className="space-y-8">
          {/* Provider Selector & KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 p-6 rounded-xl bg-white border border-stone-200 space-y-3">
              <label className="block text-xs font-medium text-stone-600">
                Sélectionner la vitrine prestataire à gérer :
              </label>
              <select
                value={activeProvider.id}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-medium bg-[#FAF9F6] border border-stone-300 rounded-lg"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businessName} ({p.city})
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500">
                Statut du profil :{' '}
                <strong className="text-zinc-800">
                  {activeProvider.verifiedProfile
                    ? 'Profil professionnel vérifié'
                    : 'En attente de validation par l’administration'}
                </strong>
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white border border-stone-200">
                <p className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-stone-400" />
                  Consultations vitrine
                </p>
                <p className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
                  {activeProvider.statsViews}
                </p>
                <p className="text-xs text-stone-500 mt-1">30 derniers jours</p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-stone-200">
                <p className="text-xs text-stone-500 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-stone-400" />
                  Demandes reçues
                </p>
                <p className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
                  {activeProvider.statsInquiries + providerInquiries.length}
                </p>
                <p className="text-xs text-stone-500 mt-1">Devis & pré-réservations</p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-stone-200">
                <p className="text-xs text-stone-500">Formule active</p>
                <p className="text-base font-bold text-emerald-900 mt-1">
                  {activeProvider.subscriptionPlan === 'lancement_gratuit'
                    ? 'Accès Lancement (0 FCFA)'
                    : activeProvider.subscriptionPlan === 'essentiel'
                      ? 'Abonnement Essentiel'
                      : 'Abonnement Prestige'}
                </p>
                <p className="text-xs text-stone-500 mt-1">0 % de commission cachée</p>
              </div>
            </div>
          </div>

          {proBanner && (
            <div className="px-5 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-medium">
              {proBanner}
            </div>
          )}

          {/* Add Multi-Unit Tariff Form + Client Inquiries */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleCreatePackage}
              className="lg:col-span-6 p-6 rounded-xl bg-white border border-stone-200 space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Ajouter une prestation ou actualiser vos tarifs
                </h2>
                <p className="text-xs text-stone-500">
                  Supporte les 8 modes de facturation événementiels (fixe, horaire, m², invité, unité, quantité, forfait, sur devis).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Intitulé de la prestation ou formule
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Formule Décoration Florale Mariage Civil"
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Mode de facturation
                  </label>
                  <select
                    value={pkgBilling}
                    onChange={(e) => setPkgBilling(e.target.value as BillingMode)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                  >
                    {Object.entries(BILLING_MODE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {pkgBilling !== 'sur_devis' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Tarif unitaire (FCFA)
                    </label>
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={pkgPrice}
                      onChange={(e) => setPkgPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Libellé d’unité</label>
                  <input
                    type="text"
                    value={pkgUnitLabel}
                    onChange={(e) => setPkgUnitLabel(e.target.value)}
                    placeholder="par m², par invité..."
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Quantité min.</label>
                  <input
                    type="number"
                    min={1}
                    value={pkgMinQty}
                    onChange={(e) => setPkgMinQty(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Capacité / Volume</label>
                  <input
                    type="text"
                    value={pkgCapacity}
                    onChange={(e) => setPkgCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Éléments inclus (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={pkgIncluded}
                  onChange={(e) => setPkgIncluded(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publier cette prestation dans mon catalogue
              </button>
            </form>

            {/* Incoming Inquiries Management */}
            <div className="lg:col-span-6 p-6 rounded-xl bg-white border border-stone-200 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Demandes clients à traiter ({providerInquiries.length})
              </h2>
              {providerInquiries.length === 0 ? (
                <p className="text-xs text-stone-500 py-4">
                  Aucune nouvelle demande en attente pour {activeProvider.businessName}. Lorsqu’un client envoie une demande depuis votre vitrine, vous pouvez confirmer votre disponibilité ici.
                </p>
              ) : (
                <div className="space-y-4">
                  {providerInquiries.map((inq) => (
                    <div key={inq.id} className="p-4 rounded-lg bg-[#FAF9F6] border border-stone-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900">
                          {inq.clientName} ({inq.clientPhone})
                        </span>
                        <span className="text-emerald-800 font-medium">{inq.status}</span>
                      </div>
                      <p className="text-xs text-stone-600">
                        {inq.packageTitle} · Date : {inq.eventDate} · {inq.guestCount} invités
                      </p>
                      <p className="text-xs text-stone-700">« {inq.message} »</p>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Votre réponse chiffrée et confirmation de date..."
                          value={replyDrafts[inq.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                          }
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onReplyToInquiry(
                              inq.id,
                              inq.type === 'reservation' ? 'Réservation validée' : 'Disponibilité confirmée',
                              replyDrafts[inq.id] || 'Date disponible ! Voici notre accord de principe.'
                            );
                            setProBanner('Réponse envoyée au client !');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-md whitespace-nowrap"
                        >
                          Confirmer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transparent Economic Model & Subscriptions */}
          <section className="p-6 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Formules d’abonnement & Transparence commerciale
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                L’inscription de lancement est offerte pour permettre à chaque artisan et prestataire de tester la plateforme. L’accès gratuit initial est distinct des futures options professionnelles facultatives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  id: 'lancement_gratuit' as const,
                  name: 'Offre Acquisition Lancement',
                  price: '0 FCFA / mois (période lancement)',
                  desc: 'Vitrine complète, jusqu’à 3 prestations tarifées, réception directe des demandes de devis.',
                },
                {
                  id: 'essentiel' as const,
                  name: 'Formule Essentiel Pro',
                  price: '15 000 FCFA / mois',
                  desc: 'Catalogue illimité, calendrier de disponibilités vérifiées, statistiques détaillées et relances devis.',
                },
                {
                  id: 'prestige' as const,
                  name: 'Formule Prestige & Visibilité',
                  price: '35 000 FCFA / mois',
                  desc: 'Multi-villes, gestion des acomptes Mobile Money et emplacements clairement identifiés « Sponsorisé ».',
                },
              ].map((plan) => {
                const isCurrent = activeProvider.subscriptionPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`p-5 rounded-xl bg-white border flex flex-col justify-between space-y-4 ${
                      isCurrent ? 'border-emerald-800' : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold text-zinc-900">{plan.name}</h3>
                      <p className="text-sm font-bold text-emerald-900 tabular-nums">{plan.price}</p>
                      <p className="text-xs text-stone-600 leading-relaxed">{plan.desc}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        onUpdateProviderSubscription(activeProvider.id, plan.id);
                        setProBanner(`Formule mise à jour vers « ${plan.name} ».`);
                      }}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-stone-100 text-stone-500 cursor-default'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isCurrent ? 'Formule actuelle' : 'Choisir cette formule'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeSpace === 'admin' && (
        <div className="space-y-10">
          {/* Smart Event-Category Filtering Matrix */}
          <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-stone-200 space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-800" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  Configuration du Filtrage Intelligent (Événements × Catégories)
                </h2>
              </div>
              <p className="text-xs text-stone-600">
                Cliquez sur une cellule pour basculer entre <strong>Recommandée</strong> (affichée par défaut), <strong>Facultative</strong> (proposée en option) et <strong>Masquée</strong> (écartée par défaut car non pertinente). Tout changement est actif immédiatement dans l’espace client.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-stone-200">
                    <th className="py-3 px-4 font-semibold text-zinc-800 sticky left-0 bg-[#FAF9F6]">
                      Événement \ Catégorie
                    </th>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <th key={cat.id} className="py-3 px-2.5 font-semibold text-stone-600">
                        {cat.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {EVENT_TYPES.filter((e) => e.id !== 'personnalise').map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-3 px-4 font-medium text-zinc-900 sticky left-0 bg-white">
                        {ev.label}
                      </td>
                      {SERVICE_CATEGORIES.map((cat) => {
                        const level = matrix[ev.id]?.[cat.id] || 'facultative';
                        const next = RELEVANCE_CYCLE[level];
                        return (
                          <td key={cat.id} className="py-2.5 px-2">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateMatrixCell(ev.id, cat.id, next);
                                appendLog(
                                  `Règle modifiée : ${ev.label} → ${cat.label} défini sur "${RELEVANCE_LABELS[next]}".`
                                );
                              }}
                              className={`w-full py-1.5 px-2 rounded text-[11px] font-medium border transition-colors whitespace-nowrap ${
                                level === 'recommandee'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                  : level === 'facultative'
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                    : 'bg-stone-100 border-stone-200 text-stone-500'
                              }`}
                            >
                              {RELEVANCE_LABELS[level]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Provider Verification + Gift Stock + Audit Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Verification of Providers */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  Vérification des profils professionnels
                </h3>
                <p className="text-xs text-stone-500">
                  Règle stricte : aucun profil n’est affiché comme vérifié sans contrôle effectif des pièces.
                </p>
              </div>
              <div className="divide-y divide-stone-200">
                {providers.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-zinc-900">{p.businessName}</p>
                      <p className="text-stone-500">
                        {p.city} · {p.verifiedProfile ? 'Vérifié (RCCM contrôlé)' : 'Non vérifié'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleVerifyProvider(p.id);
                        appendLog(
                          `Statut de vérification basculé pour "${p.businessName}".`
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium border transition-colors whitespace-nowrap ${
                        p.verifiedProfile
                          ? 'border-stone-200 text-stone-700 hover:bg-stone-50'
                          : 'border-emerald-800 bg-[#065F46] text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {p.verifiedProfile ? 'Retirer vérification' : 'Valider le dossier'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gift Shop Inventory + Reports + Audit Log */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-zinc-900">
                  Gestion des stocks — Boutique de Cadeaux
                </h3>
                <div className="divide-y divide-stone-200">
                  {gifts.map((g) => (
                    <div key={g.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-zinc-800">{g.name}</span>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="text-stone-500">{formatFcfa(g.priceFcfa)}</span>
                        <input
                          type="number"
                          min={0}
                          value={g.stock}
                          onChange={(e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            onUpdateGiftStock(g.id, next);
                          }}
                          className="w-16 px-2 py-1 border border-stone-300 rounded text-right"
                        />
                        <span className="text-stone-500">en stock</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
                <h3 className="text-base font-semibold text-zinc-900">
                  Signalements & Journal des opérations sensibles
                </h3>
                <div className="space-y-2">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 rounded-lg bg-[#FAF9F6] border border-stone-200 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {rep.targetName} ({rep.status})
                        </p>
                        <p className="text-stone-600">{rep.reason}</p>
                      </div>
                      {rep.status === 'Ouvert' && (
                        <button
                          type="button"
                          onClick={() => {
                            onResolveReport(rep.id);
                            appendLog(`Signalement "${rep.targetName}" traité et clôturé.`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-white rounded whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Clôturer
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-1">
                  <p className="text-[11px] font-semibold text-stone-500">
                    Historique d’audit administratif :
                  </p>
                  {adminLog.map((line, i) => (
                    <p key={i} className="text-[11px] text-stone-600 font-mono">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
