import React, { useState, useMemo } from 'react';
import {
  X,
  Heart,
  Check,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Flag,
  Send,
  Plus,
} from 'lucide-react';
import {
  Provider,
  ServicePackage,
  ProjectBudgetItem,
  ServiceInquiry,
  ClientReview,
} from '../types';
import { BILLING_MODE_LABELS, SERVICE_CATEGORIES, formatFcfa } from '../data/initialData';
import { SafeImage } from './SafeImage';

interface ProviderDetailModalProps {
  provider: Provider;
  defaultGuestCount: number;
  defaultEventDate: string;
  isFavorite: boolean;
  hasConfirmedBooking: boolean;
  onClose: () => void;
  onToggleFavorite: (providerId: string) => void;
  onAddToBudget: (item: ProjectBudgetItem) => void;
  onSendInquiry: (inquiry: Omit<ServiceInquiry, 'id' | 'reference' | 'createdAt' | 'status'>) => void;
  onAddReview: (providerId: string, review: Omit<ClientReview, 'id' | 'dateLabel'>) => void;
  onReportProvider: (targetName: string, reason: string) => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  defaultGuestCount,
  defaultEventDate,
  isFavorite,
  hasConfirmedBooking,
  onClose,
  onToggleFavorite,
  onAddToBudget,
  onSendInquiry,
  onAddReview,
  onReportProvider,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(provider.packages[0]?.id || '');
  const selectedPkg: ServicePackage | undefined = useMemo(
    () => provider.packages.find((p) => p.id === selectedPkgId) || provider.packages[0],
    [provider.packages, selectedPkgId]
  );

  const computeInitialQty = (pkg?: ServicePackage) => {
    if (!pkg) return 1;
    if (pkg.billingMode === 'personne' || pkg.billingMode === 'unite') {
      return Math.max(pkg.minQuantity, defaultGuestCount || 80);
    }
    if (pkg.billingMode === 'quantite') {
      return Math.max(pkg.minQuantity, Math.ceil((defaultGuestCount || 80) / 25));
    }
    if (pkg.billingMode === 'm2') {
      return Math.max(pkg.minQuantity, 80);
    }
    if (pkg.billingMode === 'horaire') {
      return Math.max(pkg.minQuantity, 5);
    }
    return Math.max(pkg.minQuantity, 1);
  };

  const [quantity, setQuantity] = useState<number>(() => computeInitialQty(provider.packages[0]));
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'catalogue' | 'avis' | 'contact'>('catalogue');

  // Inquiry form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [inquiryDate, setInquiryDate] = useState(defaultEventDate || '2026-12-05');
  const [inquiryType, setInquiryType] = useState<'devis' | 'reservation'>('devis');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Review state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewEvent, setReviewEvent] = useState('Réception vérifiée');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Report state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleSelectPackage = (pkg: ServicePackage) => {
    setSelectedPkgId(pkg.id);
    setQuantity(computeInitialQty(pkg));
    setSelectedOptionIds([]);
  };

  const toggleOption = (optId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  const optionsTotal = useMemo(() => {
    if (!selectedPkg) return 0;
    return selectedPkg.options
      .filter((o) => selectedOptionIds.includes(o.id))
      .reduce((acc, o) => acc + o.priceFcfa, 0);
  }, [selectedPkg, selectedOptionIds]);

  const estimatedTotal = useMemo(() => {
    if (!selectedPkg || selectedPkg.billingMode === 'sur_devis') return 0;
    return selectedPkg.unitPriceFcfa * quantity + optionsTotal;
  }, [selectedPkg, quantity, optionsTotal]);

  const categoryLabel =
    SERVICE_CATEGORIES.find((c) => c.id === provider.categoryId)?.label || provider.categoryId;

  const avgRating = useMemo(() => {
    if (provider.Reviews.length === 0) return null;
    const sum = provider.Reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / provider.Reviews.length).toFixed(1);
  }, [provider.Reviews]);

  const handleAddBudgetClick = () => {
    if (!selectedPkg) return;
    const item: ProjectBudgetItem = {
      id: `bgt-${Date.now()}`,
      providerId: provider.id,
      providerName: provider.businessName,
      categoryId: provider.categoryId,
      packageId: selectedPkg.id,
      packageTitle: selectedPkg.title,
      billingMode: selectedPkg.billingMode,
      unitPriceFcfa: selectedPkg.unitPriceFcfa,
      unitLabel: selectedPkg.unitLabel,
      quantity: Math.max(selectedPkg.minQuantity, quantity),
      selectedOptionIds,
      optionsTotalFcfa: optionsTotal,
      declaredExtraFeeFcfa: 0,
      discountPercent: 0,
      status: selectedPkg.billingMode === 'sur_devis' ? 'devis_demande' : 'estimation',
      createdAt: new Date().toISOString(),
    };
    onAddToBudget(item);
    setFeedbackBanner('Prestation ajoutée à votre budget prévisionnel.');
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !clientName.trim() || !clientPhone.trim()) return;
    onSendInquiry({
      providerId: provider.id,
      providerName: provider.businessName,
      packageTitle: selectedPkg.title,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      eventDate: inquiryDate,
      guestCount: defaultGuestCount || quantity,
      message:
        inquiryMessage.trim() ||
        `Bonjour, je souhaite vérifier votre disponibilité pour la formule "${selectedPkg.title}" (quantité : ${quantity}).`,
      estimatedTotalFcfa: estimatedTotal,
      isSurDevis: selectedPkg.billingMode === 'sur_devis',
      type: inquiryType,
    });
    setFeedbackBanner(
      inquiryType === 'reservation'
        ? 'Demande de pré-réservation envoyée au prestataire.'
        : 'Demande de devis envoyée avec succès.'
    );
    setInquiryMessage('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    onAddReview(provider.id, {
      authorName: reviewAuthor.trim(),
      eventLabel: reviewEvent.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedBooking: hasConfirmedBooking,
    });
    setReviewAuthor('');
    setReviewComment('');
    setFeedbackBanner('Merci ! Votre avis client a été enregistré.');
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    onReportProvider(provider.businessName, reportReason.trim());
    setReportReason('');
    setShowReportForm(false);
    setFeedbackBanner('Signalement transmis à l’équipe de modération KoraFête.');
  };

  const gallery = provider.galleryImages.length > 0 ? provider.galleryImages : [provider.coverImage];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
    >
      <div className="relative w-full max-w-6xl bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 mb-1">
              <span>{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{provider.city}</span>
              {provider.verifiedProfile ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Profil vérifié
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-stone-500">Vérification documentaire en cours</span>
                </>
              )}
              {provider.sponsored && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-800 font-medium">Sponsorisé</span>
                </>
              )}
            </div>
            <h2 id="provider-modal-title" className="text-xl sm:text-2xl font-semibold text-zinc-900 truncate">
              {provider.businessName}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(provider.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-stone-200 bg-white text-zinc-700 hover:bg-stone-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
              {isFavorite ? 'Dans vos favoris' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-zinc-900 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Fermer la vitrine"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {feedbackBanner && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between">
            <span>{feedbackBanner}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline ml-4 whitespace-nowrap"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Scrollable Two-Column Body */}
        <div className="overflow-y-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Gallery, Presentation & Tabs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                <SafeImage
                  src={gallery[activePhotoIdx] || provider.coverImage}
                  alt={provider.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
              {gallery.length > 1 && (
                <div className="flex items-center gap-3">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-20 h-14 rounded-md overflow-hidden border transition-opacity ${
                        activePhotoIdx === idx
                          ? 'border-emerald-800 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <SafeImage src={img} alt={`${provider.businessName} vue ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                {provider.presentation}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Zone couverte : {provider.coverageArea}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{provider.availabilitySummary}</span>
                </div>
              </div>
            </div>

            {/* Segmented Tab Bar */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setActiveSubTab('catalogue')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSubTab === 'catalogue'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-stone-600 hover:text-zinc-900'
                }`}
              >
                Prestations & Conditions ({provider.packages.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('avis')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSubTab === 'avis'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-stone-600 hover:text-zinc-900'
                }`}
              >
                Avis vérifiés ({provider.Reviews.length}{avgRating ? ` · ${avgRating}/5` : ''})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('contact')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSubTab === 'contact'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-stone-600 hover:text-zinc-900'
                }`}
              >
                Demander un devis / Réserver
              </button>
            </div>

            {activeSubTab === 'catalogue' && (
              <div className="space-y-4">
                {provider.packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPkg?.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`p-5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-emerald-800 bg-emerald-950/[0.02]'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 className="text-base font-semibold text-zinc-900">{pkg.title}</h3>
                        <div className="text-right tabular-nums">
                          {pkg.billingMode === 'sur_devis' ? (
                            <span className="text-sm font-semibold text-amber-800">Sur devis personnalisé</span>
                          ) : (
                            <span className="text-base font-bold text-emerald-900">
                              {formatFcfa(pkg.unitPriceFcfa)}{' '}
                              <span className="text-xs font-normal text-stone-500">/ {pkg.unitLabel}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 mb-3">
                        Mode : {BILLING_MODE_LABELS[pkg.billingMode]} · Capacité : {pkg.maxCapacityLabel} · Délai : J-{pkg.leadTimeDays}
                      </p>
                      <p className="text-sm text-stone-700 mb-3">{pkg.description}</p>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-zinc-800">Inclus dans cette formule :</p>
                        <ul className="space-y-1">
                          {pkg.includedItems.map((inc, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {pkg.extraFeesLabel && (
                        <p className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                          Suppléments éventuels : {pkg.extraFeesLabel}
                        </p>
                      )}
                    </div>
                  );
                })}

                <div className="p-4 rounded-lg bg-[#FAF9F6] border border-stone-200 space-y-2 text-xs text-stone-600">
                  <p>
                    <strong className="text-zinc-800">Conditions de réservation :</strong> {provider.bookingConditions}
                  </p>
                  <p>
                    <strong className="text-zinc-800">Politique d’annulation & report :</strong> {provider.cancellationPolicy}
                  </p>
                  <p>
                    <strong className="text-zinc-800">Coordonnées vérifiées :</strong> {provider.phone} · {provider.email}
                  </p>
                </div>
              </div>
            )}

            {activeSubTab === 'avis' && (
              <div className="space-y-5">
                {provider.Reviews.length === 0 ? (
                  <p className="text-sm text-stone-500">Aucun avis publié pour le moment.</p>
                ) : (
                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg bg-white">
                    {provider.Reviews.map((rev) => (
                      <div key={rev.id} className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{rev.authorName}</span>
                          <span className="text-xs font-semibold text-amber-700 tabular-nums">
                            Note : {rev.rating.toFixed(1)} / 5
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {rev.eventLabel} · {rev.dateLabel} ·{' '}
                          {rev.verifiedBooking ? 'Prestation vérifiée' : 'Avis client enregistré'}
                        </p>
                        <p className="text-sm text-stone-700 pt-1">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="p-5 rounded-lg border border-stone-200 bg-[#FAF9F6] space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-900">
                    Publier un avis suite à une prestation
                  </h4>
                  <p className="text-xs text-stone-500">
                    {hasConfirmedBooking
                      ? 'Vous disposez d’une demande/réservation enregistrée avec ce prestataire : votre avis portera la mention Prestation vérifiée.'
                      : 'Pour garantir la fiabilité, seuls les clients ayant réservé obtiennent la mention Prestation vérifiée.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Votre nom complet"
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      className="px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Événement (ex: Mariage)"
                      value={reviewEvent}
                      onChange={(e) => setReviewEvent(e.target.value)}
                      className="px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    >
                      <option value={5}>5 / 5 — Excellent</option>
                      <option value={4}>4 / 5 — Très bien</option>
                      <option value={3}>3 / 5 — Correct</option>
                      <option value={2}>2 / 5 — Décevant</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Décrivez concrètement la qualité de la prestation, la ponctualité et le respect des engagements..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    Publier mon avis
                  </button>
                </form>
              </div>
            )}

            {activeSubTab === 'contact' && (
              <form onSubmit={handleInquirySubmit} className="p-5 rounded-lg border border-stone-200 bg-white space-y-4">
                <h3 className="text-base font-semibold text-zinc-900">
                  Contacter {provider.businessName}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInquiryType('devis')}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      inquiryType === 'devis'
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Demander un devis précis
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryType('reservation')}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      inquiryType === 'reservation'
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Demander une réservation (Acompte {provider.depositPercent} %)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Nom & Prénom</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Awa Koné"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Téléphone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="+225 07 00 00 00 00"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Date souhaitée</label>
                    <input
                      type="date"
                      required
                      value={inquiryDate}
                      onChange={(e) => setInquiryDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Précisions sur votre événement (lieu, horaires, couleurs, exigences)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Précisez vos attentes pour recevoir une réponse chiffrée rapide..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  {inquiryType === 'reservation' ? 'Envoyer la demande de réservation' : 'Envoyer la demande de devis'}
                </button>
              </form>
            )}

            {/* Signalement / Confiance */}
            <div className="pt-2">
              {!showReportForm ? (
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-zinc-800 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Signaler une information inexacte sur cette fiche
                </button>
              ) : (
                <form onSubmit={handleReportSubmit} className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Motif du signalement (tarif erroné, numéro injoignable...)"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md whitespace-nowrap"
                  >
                    Envoyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-2 py-1.5 text-xs text-stone-600"
                  >
                    Annuler
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Contiguous Simulator & Budget Selection Module */}
          <div className="lg:col-span-5 lg:sticky lg:top-0 bg-[#FAF9F6] border border-stone-200 rounded-xl p-6 space-y-5">
            <div>
              <p className="text-xs text-stone-500 mb-1">Simulateur tarifaire & Ajout au projet</p>
              <h3 className="text-lg font-semibold text-zinc-900">
                {selectedPkg?.title || 'Sélectionnez une prestation'}
              </h3>
            </div>

            {selectedPkg && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Choisir la formule du prestataire
                  </label>
                  <select
                    value={selectedPkg.id}
                    onChange={(e) => {
                      const found = provider.packages.find((p) => p.id === e.target.value);
                      if (found) handleSelectPackage(found);
                    }}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                  >
                    {provider.packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.billingMode === 'sur_devis' ? 'Sur devis' : formatFcfa(p.unitPriceFcfa)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPkg.billingMode !== 'sur_devis' &&
                  selectedPkg.billingMode !== 'fixe' &&
                  selectedPkg.billingMode !== 'forfait' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-stone-700">
                        Quantité souhaitée ({selectedPkg.unitLabel}) — min. {selectedPkg.minQuantity}
                      </label>
                      <input
                        type="number"
                        min={selectedPkg.minQuantity}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(selectedPkg.minQuantity, Number(e.target.value) || selectedPkg.minQuantity))
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg tabular-nums focus:outline-none focus:border-emerald-800"
                      />
                    </div>
                  )}

                {selectedPkg.options.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-stone-700">Options facultatives déclarées :</p>
                    <div className="space-y-2">
                      {selectedPkg.options.map((opt) => {
                        const checked = selectedOptionIds.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white border border-stone-200 cursor-pointer text-xs"
                          >
                            <span className="flex items-start gap-2 text-zinc-800">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleOption(opt.id)}
                                className="mt-0.5 accent-emerald-800"
                              />
                              <span>{opt.label}</span>
                            </span>
                            <span className="font-semibold text-zinc-900 tabular-nums whitespace-nowrap">
                              +{formatFcfa(opt.priceFcfa)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Mode de facturation</span>
                    <span className="font-medium text-zinc-900">
                      {BILLING_MODE_LABELS[selectedPkg.billingMode]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Délai conseillé de commande</span>
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-900">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {selectedPkg.leadTimeDays} jours avant
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2">
                    <span className="text-sm font-semibold text-zinc-900">Estimation indicative</span>
                    {selectedPkg.billingMode === 'sur_devis' ? (
                      <span className="text-base font-bold text-amber-800">À chiffrer sur devis</span>
                    ) : (
                      <span className="text-xl font-bold text-emerald-900 tabular-nums">
                        {formatFcfa(estimatedTotal)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Estimation calculée selon les tarifs déclarés du prestataire. Ce montant devient définitif après confirmation du devis.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleAddBudgetClick}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter à mon projet & budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('contact')}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white text-zinc-900 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap"
                  >
                    Demander un devis ou vérifier une date
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
