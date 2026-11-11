import React from 'react';
import { X, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { Provider, ProjectBudgetItem } from '../types';
import { BILLING_MODE_LABELS, SERVICE_CATEGORIES, formatFcfa } from '../data/initialData';
import { SafeImage } from './SafeImage';

interface ComparatorModalProps {
  providers: Provider[];
  guestCount: number;
  onClose: () => void;
  onRemoveProvider: (id: string) => void;
  onSelectProviderDetail: (provider: Provider) => void;
  onAddToBudget: (item: ProjectBudgetItem) => void;
}

export const ComparatorModal: React.FC<ComparatorModalProps> = ({
  providers,
  guestCount,
  onClose,
  onRemoveProvider,
  onSelectProviderDetail,
  onAddToBudget,
}) => {
  const simulatePackageCost = (provider: Provider) => {
    const pkg = provider.packages[0];
    if (!pkg || pkg.billingMode === 'sur_devis') return { label: 'Sur devis personnalisé', raw: null, qty: 1 };
    let qty = 1;
    if (pkg.billingMode === 'personne' || pkg.billingMode === 'unite') {
      qty = Math.max(pkg.minQuantity, guestCount);
    } else if (pkg.billingMode === 'quantite') {
      qty = Math.max(pkg.minQuantity, Math.ceil(guestCount / 25));
    } else if (pkg.billingMode === 'm2') {
      qty = Math.max(pkg.minQuantity, 80);
    } else if (pkg.billingMode === 'horaire') {
      qty = Math.max(pkg.minQuantity, 5);
    }
    const total = pkg.unitPriceFcfa * qty;
    return { label: formatFcfa(total), raw: total, qty };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparator-title"
    >
      <div className="w-full max-w-6xl bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] shrink-0">
          <div>
            <h2 id="comparator-title" className="text-xl font-semibold text-zinc-900">
              Comparateur objectif de prestataires ({providers.length})
            </h2>
            <p className="text-xs text-stone-600">
              Simulation basée sur {guestCount} invités · Classement neutre (les profils sponsorisés ne sont jamais présentés comme meilleurs par défaut).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-zinc-900 rounded-lg hover:bg-stone-100"
            aria-label="Fermer le comparateur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto p-6">
          {providers.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-base font-medium text-zinc-800">Aucun prestataire sélectionné pour la comparaison.</p>
              <p className="text-sm text-stone-500">
                Cliquez sur « Comparer » sur 2 à 4 fiches prestataires pour analyser leurs offres côte à côte.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="w-48 py-3 pr-4 text-xs font-semibold text-stone-500 align-top">
                    Critères détaillés
                  </th>
                  {providers.map((p) => {
                    const cat = SERVICE_CATEGORIES.find((c) => c.id === p.categoryId)?.label || p.categoryId;
                    return (
                      <th key={p.id} className="py-3 px-4 align-top min-w-[220px]">
                        <div className="space-y-2.5">
                          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                            <SafeImage src={p.coverImage} alt={p.businessName} />
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-normal text-stone-500">
                                {cat} {p.sponsored ? '· Sponsorisé' : ''}
                              </p>
                              <button
                                type="button"
                                onClick={() => onSelectProviderDetail(p)}
                                className="text-base font-semibold text-zinc-900 hover:text-emerald-800 text-left"
                              >
                                {p.businessName}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveProvider(p.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                              title="Retirer du comparateur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Tarif unitaire & Mode</td>
                  {providers.map((p) => {
                    const pkg = p.packages[0];
                    return (
                      <td key={p.id} className="py-3.5 px-4 tabular-nums">
                        <div className="font-semibold text-zinc-900">
                          {pkg.billingMode === 'sur_devis'
                            ? 'Sur devis'
                            : `${formatFcfa(pkg.unitPriceFcfa)} / ${pkg.unitLabel}`}
                        </div>
                        <div className="text-xs text-stone-500">{BILLING_MODE_LABELS[pkg.billingMode]}</div>
                      </td>
                    );
                  })}
                </tr>

                <tr className="bg-[#FAF9F6]">
                  <td className="py-3.5 pr-4 font-medium text-stone-700">
                    Simulation pour votre projet ({guestCount} inv.)
                  </td>
                  {providers.map((p) => {
                    const sim = simulatePackageCost(p);
                    return (
                      <td key={p.id} className="py-3.5 px-4 font-bold text-emerald-900 tabular-nums">
                        {sim.label}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Avis clients & Vérification</td>
                  {providers.map((p) => {
                    const avg =
                      p.Reviews.length > 0
                        ? (p.Reviews.reduce((a, b) => a + b.rating, 0) / p.Reviews.length).toFixed(1)
                        : 'Nouveau';
                    return (
                      <td key={p.id} className="py-3.5 px-4 space-y-1">
                        <div className="font-semibold text-zinc-900 tabular-nums">
                          {avg !== 'Nouveau' ? `${avg} / 5` : 'Aucun avis'} ({p.Reviews.length} avis)
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-1">
                          {p.verifiedProfile ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Identité & RCCM vérifiés</span>
                            </>
                          ) : (
                            <span>Profil non encore vérifié</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Capacités & Quantités</td>
                  {providers.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-stone-700 text-xs">
                      {p.packages[0]?.maxCapacityLabel}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Prestations incluses</td>
                  {providers.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 align-top">
                      <ul className="space-y-1 text-xs text-stone-700 list-disc pl-4">
                        {p.packages[0]?.includedItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Suppléments déclarés</td>
                  {providers.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-xs text-stone-600">
                      {p.packages[0]?.extraFeesLabel ||
                        (p.packages[0]?.options.length
                          ? `${p.packages[0].options.length} option(s) à la carte`
                          : 'Aucun frais supplémentaire déclaré')}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Localisation & Couverture</td>
                  {providers.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-xs text-stone-700">
                      <div className="font-medium text-zinc-900">{p.city}</div>
                      <div>{p.coverageArea}</div>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Disponibilités & Délais</td>
                  {providers.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-xs text-stone-700 space-y-1">
                      <div>{p.availabilitySummary}</div>
                      <div className="text-stone-500">Délai min. : {p.packages[0]?.leadTimeDays} jours</div>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3.5 pr-4 font-medium text-stone-600">Conditions & Acompte</td>
                  {providers.map((p) => (
                    <td key={p.id} className="py-3.5 px-4 text-xs text-stone-600 space-y-1">
                      <div className="font-medium text-zinc-800">Acompte : {p.depositPercent} %</div>
                      <div>{p.cancellationPolicy}</div>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-4 pr-4 font-medium text-stone-600">Action rapide</td>
                  {providers.map((p) => {
                    const pkg = p.packages[0];
                    const sim = simulatePackageCost(p);
                    return (
                      <td key={p.id} className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (!pkg) return;
                            onAddToBudget({
                              id: `bgt-${Date.now()}-${p.id}`,
                              providerId: p.id,
                              providerName: p.businessName,
                              categoryId: p.categoryId,
                              packageId: pkg.id,
                              packageTitle: pkg.title,
                              billingMode: pkg.billingMode,
                              unitPriceFcfa: pkg.unitPriceFcfa,
                              unitLabel: pkg.unitLabel,
                              quantity: sim.qty,
                              selectedOptionIds: [],
                              optionsTotalFcfa: 0,
                              declaredExtraFeeFcfa: 0,
                              discountPercent: 0,
                              status: pkg.billingMode === 'sur_devis' ? 'devis_demande' : 'estimation',
                              createdAt: new Date().toISOString(),
                            });
                            onClose();
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Retenir dans mon budget
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
