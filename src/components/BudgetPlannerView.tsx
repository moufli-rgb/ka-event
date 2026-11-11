import React, { useMemo, useState } from 'react';
import {
  Trash2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Heart,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  BudgetLineStatus,
  EventProject,
  ProjectBudgetItem,
  Provider,
  ServiceInquiry,
} from '../types';
import {
  EVENT_TYPES,
  SERVICE_CATEGORIES,
  formatFcfa,
} from '../data/initialData';
import { SafeImage } from './SafeImage';

interface BudgetPlannerViewProps {
  project: EventProject;
  providers: Provider[];
  favoriteIds: string[];
  inquiries: ServiceInquiry[];
  onUpdateProject: (patch: Partial<EventProject>) => void;
  onUpdateBudgetItem: (id: string, patch: Partial<ProjectBudgetItem>) => void;
  onRemoveBudgetItem: (id: string) => void;
  onReplaceBudgetItem: (oldId: string, newItem: ProjectBudgetItem) => void;
  onOpenProvider: (provider: Provider) => void;
  onNavigateCatalog: () => void;
}

const STATUS_LABELS: Record<BudgetLineStatus, string> = {
  estimation: 'Estimation indicative',
  devis_demande: 'Devis en attente',
  devis_confirme: 'Devis confirmé',
  acompte_paye: 'Acompte / Paiement réglé',
};

export const BudgetPlannerView: React.FC<BudgetPlannerViewProps> = ({
  project,
  providers,
  favoriteIds,
  inquiries,
  onUpdateProject,
  onUpdateBudgetItem,
  onRemoveBudgetItem,
  onReplaceBudgetItem,
  onOpenProvider,
  onNavigateCatalog,
}) => {
  const [subView, setSubView] = useState<'budget' | 'demandes' | 'favoris'>('budget');

  const computeLineTotal = (item: ProjectBudgetItem) => {
    if (item.billingMode === 'sur_devis') return 0;
    const base = item.unitPriceFcfa * item.quantity + item.optionsTotalFcfa + item.declaredExtraFeeFcfa;
    const discount = base * (Math.min(100, Math.max(0, item.discountPercent)) / 100);
    return Math.round(base - discount);
  };

  const totals = useMemo(() => {
    let totalPrevisionnel = 0;
    let totalEstimationOnly = 0;
    let totalDevisConfirme = 0;
    let totalPaye = 0;
    let unconfirmedSurDevisCount = 0;
    const byCategory: Record<string, number> = {};

    project.items.forEach((item) => {
      if (item.billingMode === 'sur_devis' && item.unitPriceFcfa === 0) {
        unconfirmedSurDevisCount += 1;
        return;
      }
      const lineTotal = computeLineTotal(item);
      totalPrevisionnel += lineTotal;
      byCategory[item.categoryId] = (byCategory[item.categoryId] || 0) + lineTotal;

      if (item.status === 'acompte_paye') {
        totalPaye += lineTotal;
      } else if (item.status === 'devis_confirme') {
        totalDevisConfirme += lineTotal;
      } else {
        totalEstimationOnly += lineTotal;
      }
    });

    const remaining = project.targetBudgetFcfa - totalPrevisionnel;
    return {
      totalPrevisionnel,
      totalEstimationOnly,
      totalDevisConfirme,
      totalPaye,
      unconfirmedSurDevisCount,
      remaining,
      byCategory,
    };
  }, [project.items, project.targetBudgetFcfa]);

  // Suggest smart lower-cost alternatives in the same category
  const smartAlternatives = useMemo(() => {
    const suggestions: Array<{
      currentItem: ProjectBudgetItem;
      currentCost: number;
      altProvider: Provider;
      altPkgTitle: string;
      altCost: number;
      savings: number;
      newItem: ProjectBudgetItem;
    }> = [];

    project.items.forEach((item) => {
      if (item.billingMode === 'sur_devis') return;
      const currentCost = computeLineTotal(item);
      const candidates = providers.filter(
        (p) => p.categoryId === item.categoryId && p.id !== item.providerId
      );

      candidates.forEach((cand) => {
        cand.packages.forEach((pkg) => {
          if (pkg.billingMode === 'sur_devis') return;
          let qty = 1;
          if (pkg.billingMode === 'personne' || pkg.billingMode === 'unite') {
            qty = Math.max(pkg.minQuantity, project.guestCount);
          } else if (pkg.billingMode === 'quantite') {
            qty = Math.max(pkg.minQuantity, Math.ceil(project.guestCount / 25));
          } else if (pkg.billingMode === 'm2') {
            qty = Math.max(pkg.minQuantity, 60);
          } else if (pkg.billingMode === 'horaire') {
            qty = Math.max(pkg.minQuantity, 5);
          }
          const altCost = pkg.unitPriceFcfa * qty;
          if (altCost < currentCost - 25000) {
            suggestions.push({
              currentItem: item,
              currentCost,
              altProvider: cand,
              altPkgTitle: pkg.title,
              altCost,
              savings: currentCost - altCost,
              newItem: {
                id: `bgt-${Date.now()}-${pkg.id}`,
                providerId: cand.id,
                providerName: cand.businessName,
                categoryId: cand.categoryId,
                packageId: pkg.id,
                packageTitle: pkg.title,
                billingMode: pkg.billingMode,
                unitPriceFcfa: pkg.unitPriceFcfa,
                unitLabel: pkg.unitLabel,
                quantity: qty,
                selectedOptionIds: [],
                optionsTotalFcfa: 0,
                declaredExtraFeeFcfa: 0,
                discountPercent: 0,
                status: 'estimation',
                createdAt: new Date().toISOString(),
              },
            });
          }
        });
      });
    });

    return suggestions.sort((a, b) => b.savings - a.savings).slice(0, 3);
  }, [project.items, project.guestCount, providers]);

  const favoriteProviders = useMemo(
    () => providers.filter((p) => favoriteIds.includes(p.id)),
    [providers, favoriteIds]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Client Workspace Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <p className="text-xs text-stone-500 mb-1">
            Espace Client · Sauvegarde automatique sur cet appareil
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            Mon Projet Événementiel & Budget
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setSubView('budget')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subView === 'budget'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-stone-600 hover:text-zinc-900'
            }`}
          >
            Simulateur de Budget ({project.items.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('demandes')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subView === 'demandes'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-stone-600 hover:text-zinc-900'
            }`}
          >
            Demandes & Réservations ({inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('favoris')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              subView === 'favoris'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-stone-600 hover:text-zinc-900'
            }`}
          >
            Prestataires Favoris ({favoriteProviders.length})
          </button>
        </div>
      </div>

      {subView === 'budget' && (
        <>
          {/* Event Parameters Bar */}
          <section className="p-6 rounded-xl bg-white border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Paramètres de votre événement</h2>
              <span className="text-xs text-stone-500">Modifiable à tout moment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Nom du projet</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => onUpdateProject({ title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Type d’événement</label>
                <select
                  value={project.eventTypeId || 'mariage'}
                  onChange={(e) => onUpdateProject({ eventTypeId: e.target.value as EventProject['eventTypeId'] })}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                >
                  {EVENT_TYPES.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Ville / Quartier</label>
                <input
                  type="text"
                  value={project.city}
                  onChange={(e) => onUpdateProject({ city: e.target.value })}
                  placeholder="Ex: Abidjan, Cocody"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Nombre d’invités</label>
                <input
                  type="number"
                  min={5}
                  value={project.guestCount}
                  onChange={(e) => onUpdateProject({ guestCount: Math.max(1, Number(e.target.value) || 50) })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg tabular-nums focus:outline-none focus:border-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Budget global cible (FCFA)</label>
                <input
                  type="number"
                  step={50000}
                  min={50000}
                  value={project.targetBudgetFcfa}
                  onChange={(e) =>
                    onUpdateProject({ targetBudgetFcfa: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg tabular-nums focus:outline-none focus:border-emerald-800"
                />
              </div>
            </div>
          </section>

          {/* 4-Column Financial Summary Strip */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-stone-200">
              <p className="text-xs text-stone-500 mb-1">Total prévisionnel cumulé</p>
              <p className="text-2xl font-bold text-zinc-900 tabular-nums">
                {formatFcfa(totals.totalPrevisionnel)}
              </p>
              <p className="text-xs text-stone-500 mt-1 tabular-nums">
                Sur un budget cible de {formatFcfa(project.targetBudgetFcfa)}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-stone-200">
              <p className="text-xs text-stone-500 mb-1">Budget restant disponible</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  totals.remaining >= 0 ? 'text-emerald-800' : 'text-rose-700'
                }`}
              >
                {totals.remaining >= 0
                  ? formatFcfa(totals.remaining)
                  : `Dépassement : ${formatFcfa(Math.abs(totals.remaining))}`}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {totals.remaining >= 0 ? 'Conforme à votre enveloppe' : 'Consultez les alternatives ci-dessous'}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-stone-200">
              <p className="text-xs text-stone-500 mb-1">Devis confirmés vs Estimations</p>
              <p className="text-lg font-bold text-zinc-900 tabular-nums">
                {formatFcfa(totals.totalDevisConfirme)} confirmés
              </p>
              <p className="text-xs text-stone-500 mt-1 tabular-nums">
                {formatFcfa(totals.totalEstimationOnly)} encore au stade d’estimation
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-stone-200">
              <p className="text-xs text-stone-500 mb-1">Paiements / Acomptes & Sur devis</p>
              <p className="text-lg font-bold text-emerald-900 tabular-nums">
                {formatFcfa(totals.totalPaye)} réglés
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {totals.unconfirmedSurDevisCount > 0
                  ? `${totals.unconfirmedSurDevisCount} prestation(s) sur devis à chiffrer`
                  : 'Aucun prix en attente de chiffrage'}
              </p>
            </div>
          </section>

          {/* Breakdown by Category + Detailed Table */}
          {project.items.length === 0 ? (
            <div className="p-12 rounded-xl bg-white border border-stone-200 text-center space-y-4">
              <h3 className="text-xl font-semibold text-zinc-900">
                Votre sélection budgétaire est vide pour l’instant
              </h3>
              <p className="text-sm text-stone-600 max-w-lg mx-auto">
                Parcourez les prestataires filtrés selon votre événement et ajoutez salles, traiteurs, pâtissiers ou décorateurs pour calculer automatiquement votre budget global.
              </p>
              <button
                type="button"
                onClick={onNavigateCatalog}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors"
              >
                Explorer les prestataires adaptés
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Detailed Line Items */}
              <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-zinc-900">
                    Détail des prestations sélectionnées
                  </h3>
                  <button
                    type="button"
                    onClick={onNavigateCatalog}
                    className="text-xs font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                  >
                    + Ajouter un autre service
                  </button>
                </div>

                <div className="divide-y divide-stone-200">
                  {project.items.map((item) => {
                    const catLabel =
                      SERVICE_CATEGORIES.find((c) => c.id === item.categoryId)?.label || item.categoryId;
                    const lineTotal = computeLineTotal(item);
                    const isUnpricedDevis = item.billingMode === 'sur_devis' && item.unitPriceFcfa === 0;

                    return (
                      <div key={item.id} className="p-5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-stone-500">
                              {catLabel} · {item.providerName}
                            </p>
                            <h4 className="text-sm sm:text-base font-semibold text-zinc-900">
                              {item.packageTitle}
                            </h4>
                          </div>

                          <div className="text-right tabular-nums">
                            {isUnpricedDevis ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Prix sur devis à confirmer
                              </span>
                            ) : (
                              <span className="text-base font-bold text-zinc-900">
                                {formatFcfa(lineTotal)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] text-stone-500 mb-1">
                              Quantité ({item.unitLabel})
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                onUpdateBudgetItem(item.id, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md tabular-nums"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-stone-500 mb-1">
                              Tarif unitaire (FCFA)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={item.unitPriceFcfa}
                              onChange={(e) =>
                                onUpdateBudgetItem(item.id, {
                                  unitPriceFcfa: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md tabular-nums"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-stone-500 mb-1">
                              Frais suppl. / Remise (%)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={80}
                                title="Remise accordée en %"
                                placeholder="0%"
                                value={item.discountPercent}
                                onChange={(e) =>
                                  onUpdateBudgetItem(item.id, {
                                    discountPercent: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md tabular-nums"
                              />
                              <span className="text-xs text-stone-500">%</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-stone-500 mb-1">
                              Statut financier réel
                            </label>
                            <select
                              value={item.status}
                              onChange={(e) =>
                                onUpdateBudgetItem(item.id, {
                                  status: e.target.value as BudgetLineStatus,
                                })
                              }
                              className="w-full px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                            >
                              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                                <option key={k} value={k}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
                          <span>
                            {item.optionsTotalFcfa > 0
                              ? `Inclut ${formatFcfa(item.optionsTotalFcfa)} d’options choisies`
                              : 'Aucune option additionnelle cochée'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveBudgetItem(item.id)}
                            className="inline-flex items-center gap-1 text-stone-500 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Retirer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Category Breakdown & Smart Alternatives */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-xl bg-white border border-stone-200 space-y-4">
                  <h3 className="text-base font-semibold text-zinc-900">
                    Répartition par catégorie
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(totals.byCategory).map(([catId, amount]) => {
                      const catLabel =
                        SERVICE_CATEGORIES.find((c) => c.id === catId)?.label || catId;
                      const pct =
                        totals.totalPrevisionnel > 0
                          ? Math.round((amount / totals.totalPrevisionnel) * 100)
                          : 0;
                      return (
                        <div key={catId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-800">{catLabel}</span>
                            <span className="tabular-nums text-stone-600">
                              {formatFcfa(amount)} ({pct} %)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-800 rounded-full"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {smartAlternatives.length > 0 && (
                  <div className="p-6 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        Alternatives économiques suggérées
                      </h3>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Optimisez votre enveloppe avec des prestataires vérifiés de même catégorie :
                      </p>
                    </div>

                    <div className="space-y-3">
                      {smartAlternatives.map((alt) => (
                        <div
                          key={`${alt.currentItem.id}-${alt.newItem.packageId}`}
                          className="p-3.5 rounded-lg bg-white border border-stone-200 space-y-2"
                        >
                          <p className="text-xs text-stone-500">
                            En remplacement de {alt.currentItem.providerName}
                          </p>
                          <p className="text-sm font-semibold text-zinc-900">
                            {alt.altProvider.businessName} — {alt.altPkgTitle}
                          </p>
                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span className="text-stone-600">Nouveau coût : {formatFcfa(alt.altCost)}</span>
                            <span className="font-semibold text-emerald-800">
                              Économie : -{formatFcfa(alt.savings)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onReplaceBudgetItem(alt.currentItem.id, alt.newItem)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Appliquer cette alternative
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {subView === 'demandes' && (
        <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-zinc-900">
              Historique de vos demandes de devis et réservations
            </h2>
          </div>
          {inquiries.length === 0 ? (
            <div className="p-10 text-center text-sm text-stone-500">
              Vous n’avez pas encore envoyé de demande de devis ou de réservation. Ouvrez une fiche prestataire pour le contacter directement.
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-stone-500">
                      Réf. {inq.reference} · {inq.type === 'reservation' ? 'Demande de réservation' : 'Demande de devis'} · Date prévue : {inq.eventDate}
                    </p>
                    <h3 className="text-base font-semibold text-zinc-900">
                      {inq.providerName} — {inq.packageTitle}
                    </h3>
                    <p className="text-sm text-stone-600">{inq.message}</p>
                    {inq.providerReply && (
                      <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 mt-2">
                        <strong>Réponse du prestataire :</strong> {inq.providerReply}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right space-y-1 shrink-0 tabular-nums">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      {inq.status === 'En attente de réponse' ? (
                        <Clock className="w-4 h-4 text-amber-700" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      )}
                      <span>{inq.status}</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">
                      {inq.isSurDevis ? 'Chiffrage sur devis' : formatFcfa(inq.estimatedTotalFcfa)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {subView === 'favoris' && (
        <section className="space-y-4">
          {favoriteProviders.length === 0 ? (
            <div className="p-10 rounded-xl bg-white border border-stone-200 text-center text-sm text-stone-500">
              Aucun prestataire en favori pour le moment. Cliquez sur l’icône cœur d’une vitrine pour la retrouver ici.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {favoriteProviders.map((prov) => (
                <div
                  key={prov.id}
                  onClick={() => onOpenProvider(prov)}
                  className="group bg-white border border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <SafeImage src={prov.coverImage} alt={prov.businessName} />
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs text-stone-500 flex items-center justify-between">
                      <span>{prov.city}</span>
                      <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                    </p>
                    <h3 className="text-base font-semibold text-zinc-900 group-hover:text-emerald-800">
                      {prov.businessName}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2">{prov.tagline}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
