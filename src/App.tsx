import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Heart,
  ShieldCheck,
  Plus,
  X,
  SlidersHorizontal,
  ArrowRight,
  Check,
  Scale,
  Menu,
} from 'lucide-react';
import {
  BillingMode,
  CategoryId,
  ClientReview,
  EventCategoryMatrix,
  EventProject,
  EventTypeId,
  GiftCartItem,
  GiftOrder,
  GiftProduct,
  ModerationReport,
  ProjectBudgetItem,
  Provider,
  RelevanceLevel,
  ServiceInquiry,
  ServicePackage,
  SubscriptionPlanId,
} from './types';
import {
  BILLING_MODE_LABELS,
  EVENT_TYPES,
  INITIAL_EVENT_CATEGORY_MATRIX,
  INITIAL_GIFTS,
  INITIAL_PROVIDERS,
  INITIAL_REPORTS,
  SERVICE_CATEGORIES,
  formatFcfa,
} from './data/initialData';
import { MEDIA } from './assets/mediaRegistry';
import { SafeImage } from './components/SafeImage';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { ComparatorModal } from './components/ComparatorModal';
import { BudgetPlannerView } from './components/BudgetPlannerView';
import { GiftShopView } from './components/GiftShopView';
import { ProAdminSpaces } from './components/ProAdminSpaces';

type ActiveRoute = 'organiser' | 'prestataires' | 'cadeaux' | 'budget' | 'pro';

const STORAGE_PROJECT_KEY = 'korafete_event_project_v1';
const STORAGE_FAV_KEY = 'korafete_favorites_v1';

const DEFAULT_PROJECT: EventProject = {
  title: 'Notre Célébration 2026',
  eventTypeId: 'mariage',
  eventDate: '2026-12-05',
  city: 'Abidjan',
  guestCount: 150,
  targetBudgetFcfa: 3500000,
  preferences: '',
  customAddedCategories: [],
  dismissedCategories: [],
  showFullCatalog: false,
  items: [
    {
      id: 'bgt-seed-1',
      providerId: 'prov-pavillon-ebene',
      providerName: 'Le Pavillon d’Ébène & Jardins',
      categoryId: 'salles',
      packageId: 'pkg-ebene-journee',
      packageTitle: 'Location Salle Vitrée + Jardin (Forfait 12h)',
      billingMode: 'forfait',
      unitPriceFcfa: 1200000,
      unitLabel: 'forfait 12 heures',
      quantity: 1,
      selectedOptionIds: [],
      optionsTotalFcfa: 0,
      declaredExtraFeeFcfa: 0,
      discountPercent: 0,
      status: 'devis_confirme',
      createdAt: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 'bgt-seed-2',
      providerId: 'prov-saveurs-kora',
      providerName: 'Maison Kora Gastronomie',
      categoryId: 'traiteurs',
      packageId: 'pkg-kora-prestige',
      packageTitle: 'Buffet Gala & Mariage "Saveurs d’Ivoire"',
      billingMode: 'personne',
      unitPriceFcfa: 14500,
      unitLabel: 'par personne',
      quantity: 150,
      selectedOptionIds: [],
      optionsTotalFcfa: 0,
      declaredExtraFeeFcfa: 0,
      discountPercent: 0,
      status: 'estimation',
      createdAt: '2026-11-10T10:05:00.000Z',
    },
  ],
};

export function App() {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>('organiser');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectionDrawerOpen, setSelectionDrawerOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);

  // Stateful Domain Entities
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [matrix, setMatrix] = useState<EventCategoryMatrix>(INITIAL_EVENT_CATEGORY_MATRIX);
  const [gifts, setGifts] = useState<GiftProduct[]>(INITIAL_GIFTS);
  const [reports, setReports] = useState<ModerationReport[]>(INITIAL_REPORTS);

  // Persisted Client Project
  const [project, setProject] = useState<EventProject>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROJECT_KEY);
      if (raw) return JSON.parse(raw) as EventProject;
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PROJECT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(project));
    } catch {
      // ignore storage errors
    }
  }, [project]);

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FAV_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
    return ['prov-pavillon-ebene', 'prov-atelier-vanille'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds]);

  // Filtering & Discovery States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryId | 'toutes'>('toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('Toutes les villes');
  const [billingFilter, setBillingFilter] = useState<BillingMode | 'tous'>('tous');
  const [sortBy, setSortBy] = useState<'pertinence' | 'prix_asc' | 'avis_desc'>('pertinence');

  // Comparator & Active Vitrine Modal
  const [compareIds, setCompareIds] = useState<string[]>(['prov-pavillon-ebene', 'prov-villa-almadies']);
  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [selectedProviderModalId, setSelectedProviderModalId] = useState<string | null>(null);

  // Inquiries & Gift Cart / Orders
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([
    {
      id: 'inq-init-1',
      reference: 'DEV-2026-841',
      providerId: 'prov-pavillon-ebene',
      providerName: 'Le Pavillon d’Ébène & Jardins',
      packageTitle: 'Location Salle Vitrée + Jardin (Forfait 12h)',
      clientName: 'Aïcha & Cédric',
      clientPhone: '+225 07 59 11 22 33',
      eventDate: '2026-12-05',
      guestCount: 150,
      message: 'Souhaitons visiter la salle ce samedi à 15h et confirmer l’option sécurité parking.',
      estimatedTotalFcfa: 1200000,
      isSurDevis: false,
      type: 'reservation',
      status: 'Disponibilité confirmée',
      providerReply: 'Date du 5 décembre bloquée en option pour 72h. Visite confirmée samedi à 15h !',
      createdAt: '2026-11-09T14:20:00Z',
    },
  ]);

  const [giftCart, setGiftCart] = useState<GiftCartItem[]>([]);
  const [giftOrders, setGiftOrders] = useState<GiftOrder[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Smart Event Filtering Resolution
  const currentEventConfig = useMemo(
    () => EVENT_TYPES.find((e) => e.id === project.eventTypeId) || null,
    [project.eventTypeId]
  );

  const smartCategoryBuckets = useMemo(() => {
    if (!project.eventTypeId || project.showFullCatalog || activeRoute === 'prestataires') {
      return {
        visibleCategories: SERVICE_CATEGORIES,
        optionalSuggestions: [] as typeof SERVICE_CATEGORIES,
      };
    }

    const rules = matrix[project.eventTypeId];
    const visibleCategories = SERVICE_CATEGORIES.filter((cat) => {
      if (project.dismissedCategories.includes(cat.id)) return false;
      if (project.customAddedCategories.includes(cat.id)) return true;
      return rules[cat.id] === 'recommandee';
    });

    const optionalSuggestions = SERVICE_CATEGORIES.filter((cat) => {
      if (visibleCategories.some((v) => v.id === cat.id)) return false;
      return rules[cat.id] === 'facultative' || project.dismissedCategories.includes(cat.id);
    });

    return { visibleCategories, optionalSuggestions };
  }, [
    project.eventTypeId,
    project.showFullCatalog,
    project.dismissedCategories,
    project.customAddedCategories,
    matrix,
    activeRoute,
  ]);

  // Select Event Type Handler
  const handleSelectEventType = (eventId: EventTypeId | null) => {
    if (!eventId) {
      setProject((prev) => ({
        ...prev,
        eventTypeId: null,
        showFullCatalog: true,
        customAddedCategories: [],
        dismissedCategories: [],
      }));
      setActiveCategoryFilter('toutes');
      return;
    }

    const cfg = EVENT_TYPES.find((e) => e.id === eventId);
    setProject((prev) => ({
      ...prev,
      eventTypeId: eventId,
      guestCount: cfg ? cfg.defaultGuests : prev.guestCount,
      targetBudgetFcfa: cfg ? cfg.suggestedBudgetFcfa : prev.targetBudgetFcfa,
      showFullCatalog: false,
      customAddedCategories: [],
      dismissedCategories: [],
    }));
    setActiveCategoryFilter('toutes');
  };

  const handleDismissCategory = (catId: CategoryId) => {
    setProject((prev) => ({
      ...prev,
      dismissedCategories: Array.from(new Set([...prev.dismissedCategories, catId])),
      customAddedCategories: prev.customAddedCategories.filter((c) => c !== catId),
    }));
    if (activeCategoryFilter === catId) {
      setActiveCategoryFilter('toutes');
    }
  };

  const handleAddOptionalCategory = (catId: CategoryId) => {
    setProject((prev) => ({
      ...prev,
      customAddedCategories: Array.from(new Set([...prev.customAddedCategories, catId])),
      dismissedCategories: prev.dismissedCategories.filter((c) => c !== catId),
    }));
    setActiveCategoryFilter(catId);
  };

  // Filtered & Sorted Providers
  const filteredProviders = useMemo(() => {
    const allowedCategoryIds = new Set(smartCategoryBuckets.visibleCategories.map((c) => c.id));

    const list = providers.filter((p) => {
      // Event-driven category filter (unless searching specific keyword)
      if (!searchQuery.trim() && !allowedCategoryIds.has(p.categoryId)) {
        return false;
      }
      if (activeCategoryFilter !== 'toutes' && p.categoryId !== activeCategoryFilter) {
        return false;
      }
      if (cityFilter !== 'Toutes les villes' && !p.city.toLowerCase().includes(cityFilter.toLowerCase())) {
        return false;
      }
      if (
        billingFilter !== 'tous' &&
        !p.packages.some((pkg) => pkg.billingMode === billingFilter)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catLabel =
          SERVICE_CATEGORIES.find((c) => c.id === p.categoryId)?.label.toLowerCase() || '';
        const match =
          p.businessName.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          catLabel.includes(q) ||
          p.packages.some((pkg) => pkg.title.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'prix_asc') {
      sorted.sort((a, b) => {
        const pa = a.packages[0]?.unitPriceFcfa || 99999999;
        const pb = b.packages[0]?.unitPriceFcfa || 99999999;
        return pa - pb;
      });
    } else if (sortBy === 'avis_desc') {
      sorted.sort((a, b) => {
        const ra =
          a.Reviews.length > 0
            ? a.Reviews.reduce((s, r) => s + r.rating, 0) / a.Reviews.length
            : 0;
        const rb =
          b.Reviews.length > 0
            ? b.Reviews.reduce((s, r) => s + r.rating, 0) / b.Reviews.length
            : 0;
        return rb - ra;
      });
    } else {
      // Neutral relevance: verified profiles first, never artificially ranking sponsored above verified quality
      sorted.sort((a, b) => Number(b.verifiedProfile) - Number(a.verifiedProfile));
    }
    return sorted;
  }, [
    providers,
    smartCategoryBuckets.visibleCategories,
    activeCategoryFilter,
    cityFilter,
    billingFilter,
    searchQuery,
    sortBy,
  ]);

  const toggleCompare = (providerId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(providerId)) return prev.filter((id) => id !== providerId);
      if (prev.length >= 4) {
        showToast('Le comparateur affiche jusqu’à 4 prestataires simultanément.');
        return prev;
      }
      return [...prev, providerId];
    });
  };

  const toggleFavorite = (providerId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const handleAddToBudget = (item: ProjectBudgetItem) => {
    setProject((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
    showToast(`« ${item.providerName} » ajouté à votre budget prévisionnel.`);
  };

  const handleUpdateBudgetItem = (id: string, patch: Partial<ProjectBudgetItem>) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const handleRemoveBudgetItem = (id: string) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleReplaceBudgetItem = (oldId: string, newItem: ProjectBudgetItem) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === oldId ? newItem : it)),
    }));
    showToast(`Alternative appliquée avec succès dans votre budget.`);
  };

  const handleSendInquiry = (
    payload: Omit<ServiceInquiry, 'id' | 'reference' | 'createdAt' | 'status'>
  ) => {
    const newInquiry: ServiceInquiry = {
      ...payload,
      id: `inq-${Date.now()}`,
      reference: `DEV-2026-${Math.floor(100 + Math.random() * 899)}`,
      status: 'En attente de réponse',
      createdAt: new Date().toISOString(),
    };
    setInquiries((prev) => [newInquiry, ...prev]);
  };

  const handleAddReview = (
    providerId: string,
    review: Omit<ClientReview, 'id' | 'dateLabel'>
  ) => {
    const newRev: ClientReview = {
      ...review,
      id: `rev-${Date.now()}`,
      dateLabel: 'Novembre 2026',
    };
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, Reviews: [newRev, ...p.Reviews] } : p))
    );
  };

  const handleReportProvider = (targetName: string, reason: string) => {
    setReports((prev) => [
      {
        id: `rep-${Date.now()}`,
        targetName,
        reason,
        reporterName: 'Signalement Utilisateur',
        date: '11 nov. 2026',
        status: 'Ouvert',
      },
      ...prev,
    ]);
  };

  // Gift Cart & Order Handlers
  const handleAddGiftToCart = (item: GiftCartItem) => {
    setGiftCart((prev) => [...prev, item]);
  };

  const handleUpdateGiftQty = (id: string, delta: number) => {
    setGiftCart((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const handleRemoveGiftCartItem = (id: string) => {
    setGiftCart((prev) => prev.filter((it) => it.id !== id));
  };

  const handlePlaceGiftOrder = (
    payload: Omit<GiftOrder, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ) => {
    const orderNumber = `KF-${Math.floor(1020 + Math.random() * 8900)}`;
    const newOrder: GiftOrder = {
      ...payload,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Confirmée — En préparation',
    };
    setGiftOrders((prev) => [newOrder, ...prev]);
    // Decrement stocks
    setGifts((prev) =>
      prev.map((g) => {
        const bought = payload.items
          .filter((i) => i.gift.id === g.id)
          .reduce((a, b) => a + b.quantity, 0);
        return bought > 0 ? { ...g, stock: Math.max(0, g.stock - bought) } : g;
      })
    );
    setGiftCart([]);
    showToast(`Commande #${orderNumber} validée ! Préparation en cours.`);
  };

  // Pro & Admin Handlers
  const handleAddPackageToProvider = (providerId: string, pkg: ServicePackage) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, packages: [...p.packages, pkg] } : p))
    );
  };

  const handleUpdateProviderSubscription = (providerId: string, plan: SubscriptionPlanId) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, subscriptionPlan: plan, sponsored: plan === 'prestige' }
          : p
      )
    );
  };

  const handleReplyToInquiry = (
    inquiryId: string,
    status: ServiceInquiry['status'],
    reply: string
  ) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, status, providerReply: reply } : inq
      )
    );
  };

  const handleUpdateMatrixCell = (
    eventId: EventTypeId,
    categoryId: CategoryId,
    nextLevel: RelevanceLevel
  ) => {
    setMatrix((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [categoryId]: nextLevel,
      },
    }));
  };

  const handleToggleVerifyProvider = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, verifiedProfile: !p.verifiedProfile } : p
      )
    );
  };

  const handleUpdateGiftStock = (giftId: string, nextStock: number) => {
    setGifts((prev) =>
      prev.map((g) => (g.id === giftId ? { ...g, stock: nextStock } : g))
    );
  };

  const handleResolveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'Résolu' } : r))
    );
  };

  const activeProviderModal = useMemo(
    () => providers.find((p) => p.id === selectedProviderModalId) || null,
    [providers, selectedProviderModalId]
  );

  const comparedProviders = useMemo(
    () => providers.filter((p) => compareIds.includes(p.id)),
    [providers, compareIds]
  );

  const totalSelectionCount =
    project.items.length + giftCart.reduce((acc, it) => acc + it.quantity, 0);

  const budgetTotalPreview = useMemo(() => {
    return project.items.reduce((acc, item) => {
      if (item.billingMode === 'sur_devis') return acc;
      const base =
        item.unitPriceFcfa * item.quantity +
        item.optionsTotalFcfa +
        item.declaredExtraFeeFcfa;
      const disc = base * (item.discountPercent / 100);
      return acc + Math.round(base - disc);
    }, 0);
  }, [project.items]);

  // Render Catalog Grid (shared by 'organiser' smart view and 'prestataires' full directory)
  const renderProviderMarketplace = (isFullDirectoryMode: boolean) => (
    <section id="catalogue-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Event Selector Bar (Smart Filtering Principle) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-emerald-800 mb-1">
              {isFullDirectoryMode
                ? 'Annuaire ouvert · Accès libre à toutes les catégories'
                : 'Filtrage intelligent par événement · Personnalisable en toute liberté'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">
              {isFullDirectoryMode
                ? 'Tous nos prestataires événementiels'
                : currentEventConfig
                  ? `Services sélectionnés pour : ${currentEventConfig.label}`
                  : 'Catalogue complet tous événements'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => setComparatorOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                Comparer ({compareIds.length})
              </button>
            )}
            {!isFullDirectoryMode && !project.showFullCatalog && (
              <button
                type="button"
                onClick={() => handleSelectEventType(null)}
                className="text-xs font-medium text-stone-600 hover:text-zinc-900 underline whitespace-nowrap shrink-0"
              >
                Voir tout sans filtrer par événement
              </button>
            )}
          </div>
        </div>

        {/* Event Pills/Buttons Row */}
        {!isFullDirectoryMode && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {EVENT_TYPES.map((ev) => {
              const selected = project.eventTypeId === ev.id && !project.showFullCatalog;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleSelectEventType(ev.id)}
                  className={`px-4 py-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-[#065F46] text-white border-[#065F46]'
                      : 'bg-white text-zinc-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {ev.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Recommended Categories + Freedom to Remove or Add Optional Services */}
        <div className="p-5 rounded-xl bg-white border border-stone-200 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('toutes')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCategoryFilter === 'toutes'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              Toutes les catégories pertinentes ({smartCategoryBuckets.visibleCategories.length})
            </button>

            {smartCategoryBuckets.visibleCategories.map((cat) => {
              const active = activeCategoryFilter === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`inline-flex items-center rounded-md border text-xs transition-colors shrink-0 ${
                    active
                      ? 'bg-emerald-50 border-emerald-800 text-emerald-950 font-semibold'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat.id)}
                    className="px-3 py-1.5 whitespace-nowrap"
                  >
                    {cat.label}
                  </button>
                  {!isFullDirectoryMode && !project.showFullCatalog && (
                    <button
                      type="button"
                      onClick={() => handleDismissCategory(cat.id)}
                      title={`Masquer la catégorie ${cat.label}`}
                      className="pr-2 pl-1 py-1.5 text-stone-400 hover:text-rose-600"
                      aria-label={`Retirer ${cat.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!isFullDirectoryMode && smartCategoryBuckets.optionalSuggestions.length > 0 && (
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-500 mr-1">
                Ajouter un besoin facultatif à cet événement :
              </span>
              {smartCategoryBuckets.optionalSuggestions.map((optCat) => (
                <button
                  key={optCat.id}
                  type="button"
                  onClick={() => handleAddOptionalCategory(optCat.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-dashed border-stone-300 text-stone-600 hover:border-emerald-800 hover:text-emerald-900 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3 h-3" />
                  {optCat.label}
                </button>
              ))}
            </div>
          )}

          {/* Search, City, Billing Unit & Sort Toolbar */}
          <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un service précis (traiteur, toge, gâteau, m²...)"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-800"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg"
              >
                <option value="Toutes les villes">Toutes les villes</option>
                <option value="Abidjan">Abidjan</option>
                <option value="Dakar">Dakar</option>
                <option value="Cotonou">Cotonou</option>
                <option value="Douala">Douala</option>
                <option value="Lomé">Lomé</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                value={billingFilter}
                onChange={(e) => setBillingFilter(e.target.value as BillingMode | 'tous')}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg"
              >
                <option value="tous">Tous modes de facturation</option>
                {Object.entries(BILLING_MODE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg"
              >
                <option value="pertinence">Tri : Pertinence</option>
                <option value="prix_asc">Tri : Tarif croissant</option>
                <option value="avis_desc">Tri : Avis clients</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Provider Cards Grid */}
      {filteredProviders.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-stone-200 text-center space-y-3">
          <SlidersHorizontal className="w-7 h-7 text-stone-400 mx-auto" />
          <h3 className="text-lg font-semibold text-zinc-900">
            Aucun prestataire ne correspond exactement à ces filtres
          </h3>
          <p className="text-sm text-stone-600">
            Élargissez la ville, réinitialisez la recherche ou affichez l’ensemble du catalogue.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCityFilter('Toutes les villes');
              setBillingFilter('tous');
              setActiveCategoryFilter('toutes');
              handleSelectEventType(null);
            }}
            className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg"
          >
            Afficher tout le catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProviders.map((prov) => {
            const catLabel =
              SERVICE_CATEGORIES.find((c) => c.id === prov.categoryId)?.label || prov.categoryId;
            const mainPkg = prov.packages[0];
            const avg =
              prov.Reviews.length > 0
                ? (prov.Reviews.reduce((s, r) => s + r.rating, 0) / prov.Reviews.length).toFixed(1)
                : null;
            const isFav = favoriteIds.includes(prov.id);
            const isCompared = compareIds.includes(prov.id);

            return (
              <article
                key={prov.id}
                className="group bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform duration-150"
              >
                {/* Leading Visual (4:3 uniform aspect ratio) */}
                <div
                  onClick={() => setSelectedProviderModalId(prov.id)}
                  className="aspect-[4/3] w-full bg-stone-100 overflow-hidden cursor-pointer relative"
                >
                  <SafeImage
                    src={prov.coverImage}
                    alt={prov.businessName}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>

                {/* Clean Unboxed Metadata & Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Zero-Pill Inline Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                      <span className="uppercase tracking-wider text-[11px] font-medium text-stone-500">
                        {catLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{prov.city}</span>
                      {prov.verifiedProfile && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Vérifié
                          </span>
                        </>
                      )}
                      {prov.sponsored && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-800">Sponsorisé</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => setSelectedProviderModalId(prov.id)}
                        className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-900 cursor-pointer"
                      >
                        {prov.businessName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(prov.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 shrink-0"
                        aria-label="Ajouter aux favoris"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
                      </button>
                    </div>

                    <p className="text-sm text-stone-600 line-clamp-2">{prov.tagline}</p>

                    <p className="text-xs text-stone-500 tabular-nums pt-1">
                      {avg ? `Note ${avg}/5 (${prov.Reviews.length} avis)` : 'Nouveau profil'} ·{' '}
                      {prov.availabilitySummary}
                    </p>
                  </div>

                  {/* Baseline-Aligned Price & Actions */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <span className="text-xs text-stone-500">
                        {mainPkg ? BILLING_MODE_LABELS[mainPkg.billingMode] : 'Tarif'}
                      </span>
                      {mainPkg?.billingMode === 'sur_devis' ? (
                        <span className="text-sm font-bold text-amber-800">Sur devis</span>
                      ) : mainPkg ? (
                        <span className="text-base font-bold text-zinc-900">
                          {formatFcfa(mainPkg.unitPriceFcfa)}{' '}
                          <span className="text-xs font-normal text-stone-500">
                            / {mainPkg.unitLabel}
                          </span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCompare(prov.id)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          isCompared
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {isCompared ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Comparé
                          </span>
                        ) : (
                          'Comparer'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProviderModalId(prov.id)}
                        className="flex-1 px-3.5 py-2 text-xs font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors whitespace-nowrap"
                      >
                        Voir tarifs & réserver
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-zinc-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Single Wordmark */}
          <a
            href="#organiser"
            onClick={(e) => {
              e.preventDefault();
              setActiveRoute('organiser');
            }}
            className="font-display text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0"
          >
            KoraFête
          </a>

          {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            {[
              { id: 'organiser' as const, label: 'Organiser' },
              { id: 'prestataires' as const, label: 'Prestataires' },
              { id: 'cadeaux' as const, label: 'Boutique Cadeaux' },
              { id: 'budget' as const, label: 'Mon Budget' },
              { id: 'pro' as const, label: 'Espaces Pro' },
            ].map((nav) => (
              <a
                key={nav.id}
                href={`#${nav.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveRoute(nav.id);
                }}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeRoute === nav.id
                    ? 'border-emerald-800 text-zinc-900 font-semibold'
                    : 'border-transparent hover:text-zinc-900 hover:border-stone-300'
                }`}
              >
                {nav.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action (+ Mobile Hamburger) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSelectionDrawerOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#065F46] rounded-lg hover:bg-[#064E3B] transition-colors whitespace-nowrap shrink-0 tabular-nums"
            >
              Ma Sélection ({totalSelectionCount})
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 text-zinc-700 rounded-lg hover:bg-stone-100"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 flex flex-col gap-2">
            {[
              { id: 'organiser' as const, label: 'Organiser un événement' },
              { id: 'prestataires' as const, label: 'Catalogue Prestataires' },
              { id: 'cadeaux' as const, label: 'Boutique Cadeaux' },
              { id: 'budget' as const, label: 'Mon Budget & Devis' },
              { id: 'pro' as const, label: 'Espace Prestataire & Admin' },
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  setActiveRoute(nav.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  activeRoute === nav.id ? 'bg-stone-100 text-zinc-900' : 'text-stone-600'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg text-xs sm:text-sm font-medium flex items-center gap-3">
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-stone-400 hover:text-white"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {activeRoute === 'organiser' && (
          <>
            {/* Section 1: Editorial Split Hero */}
            <section className="border-b border-stone-200 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                  {/* Left Column: Campaign Copy + Central Event Configurator */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-stone-500">
                        Abidjan · Dakar · Cotonou · Douala · Lomé
                      </p>
                      <h1 className="text-[clamp(2.15rem,3.6vw,3.35rem)] leading-[1.12] font-semibold text-zinc-900">
                        Chaque célébration mérite les bons artisans, au juste prix.
                      </h1>
                      <p className="text-base text-stone-600 leading-relaxed max-w-xl">
                        Choisissez votre événement pour découvrir automatiquement les services adaptés, comparer les tarifs réels en FCFA, construire votre budget prévisionnel ou offrir un coffret cadeau.
                      </p>
                    </div>

                    {/* Interactive Quick Event Launcher */}
                    <div className="p-5 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-medium text-stone-600 mb-1">
                            Votre événement
                          </label>
                          <select
                            value={project.eventTypeId || 'mariage'}
                            onChange={(e) => handleSelectEventType(e.target.value as EventTypeId)}
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
                          <label className="block text-xs font-medium text-stone-600 mb-1">
                            Nombre d’invités
                          </label>
                          <input
                            type="number"
                            min={10}
                            value={project.guestCount}
                            onChange={(e) =>
                              setProject((p) => ({
                                ...p,
                                guestCount: Math.max(10, Number(e.target.value) || 50),
                              }))
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg tabular-nums focus:outline-none focus:border-emerald-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">
                            Budget indicatif (FCFA)
                          </label>
                          <input
                            type="number"
                            step={50000}
                            value={project.targetBudgetFcfa}
                            onChange={(e) =>
                              setProject((p) => ({
                                ...p,
                                targetBudgetFcfa: Math.max(50000, Number(e.target.value) || 500000),
                              }))
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg tabular-nums focus:outline-none focus:border-emerald-800"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href="#catalogue-section"
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B] transition-colors whitespace-nowrap"
                        >
                          Découvrir les services adaptés
                          <ArrowRight className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setActiveRoute('cadeaux')}
                          className="px-4 py-2.5 text-sm font-medium bg-white text-zinc-900 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap"
                        >
                          Acheter un cadeau sans événement
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stretched High-Resolution Reception Photography */}
                  <div className="lg:col-span-6 relative rounded-xl overflow-hidden min-h-[320px] lg:min-h-[440px] border border-stone-200">
                    <SafeImage
                      src={MEDIA.heroReception}
                      alt="Réception de mariage et gala dans une cour architecturale illuminée"
                      className="w-full h-full object-cover lg:h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                      <p className="text-xs text-stone-200 mb-1">
                        Réalisation vérifiée · Réception 240 convives à Cocody
                      </p>
                      <p className="font-display text-lg sm:text-xl font-medium">
                        Des tarifs détaillés à l’invité, au m², à l’heure ou au forfait — sans mauvaise surprise.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Smart Event-Filtered Marketplace */}
            {renderProviderMarketplace(false)}

            {/* Section 3: Independent Gift Boutique Spotlight & Attributable Proof */}
            <section className="border-t border-stone-200 bg-white py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-800">
                      Boutique de Cadeaux KoraFête
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">
                      Un anniversaire, un mariage ou un remerciement ? Offrez dès aujourd’hui
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRoute('cadeaux')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 hover:underline whitespace-nowrap shrink-0"
                  >
                    Explorer toute la boutique ({gifts.length} coffrets)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                  {gifts.slice(0, 3).map((gift) => (
                    <div
                      key={gift.id}
                      onClick={() => setActiveRoute('cadeaux')}
                      className="group bg-[#FAF9F6] border border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                        <SafeImage src={gift.image} alt={gift.name} />
                      </div>
                      <div className="p-5 space-y-2">
                        <p className="text-xs text-stone-500">
                          {gift.occasionLabel} · {gift.stock} en stock
                        </p>
                        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-emerald-900">
                          {gift.name}
                        </h3>
                        <p className="text-sm font-bold text-zinc-900 tabular-nums pt-1">
                          {formatFcfa(gift.priceFcfa)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attributable Client Proof Adjacent to Value Proposition */}
                <div className="pt-8 border-t border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-2">
                    <p className="text-sm text-stone-700 leading-relaxed">
                      « Pour ma soutenance de médecine à Abidjan, le filtrage m’a tout de suite proposé l’imprimeur 24h, la location de toge et le cocktail 50 personnes sans me noyer sous les offres de mariage. »
                    </p>
                    <p className="text-xs font-semibold text-zinc-900 pt-1">
                      Dr. Marc-Antoine Bamba · Soutenance CHU Cocody (Budget respecté à 410 000 FCFA)
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-2">
                    <p className="text-sm text-stone-700 leading-relaxed">
                      « Le comparateur côte à côte nous a permis de voir qu’une salle aux Almadies n’appliquait aucun droit de bouchon, économisant 380 000 FCFA sur notre réception familiale. »
                    </p>
                    <p className="text-xs font-semibold text-zinc-900 pt-1">
                      Fatou Ndiaye · Baptême 90 invités à Dakar
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#FAF9F6] border border-stone-200 space-y-2">
                    <p className="text-sm text-stone-700 leading-relaxed">
                      « En tant que cheffe pâtissière, pouvoir afficher mes tarifs à la part pour les wedding cakes et au forfait pour les anniversaires m’évite des dizaines d’appels non qualifiés. »
                    </p>
                    <p className="text-xs font-semibold text-zinc-900 pt-1">
                      L’Atelier Vanille & Cacao · Prestataire vérifié KoraFête
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeRoute === 'prestataires' && renderProviderMarketplace(true)}

        {activeRoute === 'cadeaux' && (
          <GiftShopView
            gifts={gifts}
            cart={giftCart}
            orders={giftOrders}
            onAddToCart={handleAddGiftToCart}
            onUpdateCartQty={handleUpdateGiftQty}
            onRemoveCartItem={handleRemoveGiftCartItem}
            onPlaceOrder={handlePlaceGiftOrder}
          />
        )}

        {activeRoute === 'budget' && (
          <BudgetPlannerView
            project={project}
            providers={providers}
            favoriteIds={favoriteIds}
            inquiries={inquiries}
            onUpdateProject={(patch) => setProject((prev) => ({ ...prev, ...patch }))}
            onUpdateBudgetItem={handleUpdateBudgetItem}
            onRemoveBudgetItem={handleRemoveBudgetItem}
            onReplaceBudgetItem={handleReplaceBudgetItem}
            onOpenProvider={(prov) => setSelectedProviderModalId(prov.id)}
            onNavigateCatalog={() => setActiveRoute('organiser')}
          />
        )}

        {activeRoute === 'pro' && (
          <ProAdminSpaces
            providers={providers}
            matrix={matrix}
            inquiries={inquiries}
            gifts={gifts}
            reports={reports}
            onAddPackageToProvider={handleAddPackageToProvider}
            onUpdateProviderSubscription={handleUpdateProviderSubscription}
            onReplyToInquiry={handleReplyToInquiry}
            onUpdateMatrixCell={handleUpdateMatrixCell}
            onToggleVerifyProvider={handleToggleVerifyProvider}
            onUpdateGiftStock={handleUpdateGiftStock}
            onResolveReport={handleResolveReport}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-stone-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-zinc-900">KoraFête</span>
            <span>·</span>
            <span>Services événementiels & Boutique de cadeaux</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveRoute('organiser')}
              className="hover:text-zinc-900 transition-colors"
            >
              Événements
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('cadeaux')}
              className="hover:text-zinc-900 transition-colors"
            >
              Boutique Cadeaux
            </button>
            <button
              type="button"
              onClick={() => setComparatorOpen(true)}
              className="hover:text-zinc-900 transition-colors"
            >
              Comparateur ({compareIds.length})
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen(true)}
              className="hover:text-zinc-900 transition-colors underline"
            >
              Confiance, Annulations & Confidentialité
            </button>
          </div>
        </div>
      </footer>

      {/* Provider Detail Modal */}
      {activeProviderModal && (
        <ProviderDetailModal
          provider={activeProviderModal}
          defaultGuestCount={project.guestCount}
          defaultEventDate={project.eventDate}
          isFavorite={favoriteIds.includes(activeProviderModal.id)}
          hasConfirmedBooking={inquiries.some((i) => i.providerId === activeProviderModal.id)}
          onClose={() => setSelectedProviderModalId(null)}
          onToggleFavorite={toggleFavorite}
          onAddToBudget={handleAddToBudget}
          onSendInquiry={handleSendInquiry}
          onAddReview={handleAddReview}
          onReportProvider={handleReportProvider}
        />
      )}

      {/* Side-by-Side Comparator Modal */}
      {comparatorOpen && (
        <ComparatorModal
          providers={comparedProviders}
          guestCount={project.guestCount}
          onClose={() => setComparatorOpen(false)}
          onRemoveProvider={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
          onSelectProviderDetail={(prov) => {
            setComparatorOpen(false);
            setSelectedProviderModalId(prov.id);
          }}
          onAddToBudget={handleAddToBudget}
        />
      )}

      {/* Slide-Over Selection Drawer (Event Budget + Gift Cart) */}
      {selectionDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white h-full shadow-xl border-l border-stone-200 flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Récapitulatif de ma sélection
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectionDrawerOpen(false)}
                  className="p-1.5 text-stone-500 hover:text-zinc-900 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Project Services Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Mon Projet Événementiel ({project.items.length})
                  </h3>
                  <span className="text-xs font-bold text-emerald-900 tabular-nums">
                    {formatFcfa(budgetTotalPreview)}
                  </span>
                </div>
                {project.items.length === 0 ? (
                  <p className="text-xs text-stone-500">Aucune prestation ajoutée.</p>
                ) : (
                  <div className="space-y-2">
                    {project.items.map((it) => (
                      <div
                        key={it.id}
                        className="p-3 rounded-lg bg-[#FAF9F6] border border-stone-200 flex items-start justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900">{it.providerName}</p>
                          <p className="text-stone-500">
                            {it.packageTitle} (×{it.quantity})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBudgetItem(it.id)}
                          className="text-stone-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectionDrawerOpen(false);
                    setActiveRoute('budget');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                >
                  Ouvrir le calculateur de budget complet
                </button>
              </div>

              {/* Gift Cart Summary */}
              <div className="pt-5 border-t border-stone-200 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Panier Boutique Cadeaux ({giftCart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                {giftCart.length === 0 ? (
                  <p className="text-xs text-stone-500">Aucun coffret cadeau dans le panier.</p>
                ) : (
                  <div className="space-y-2">
                    {giftCart.map((gc) => (
                      <div
                        key={gc.id}
                        className="p-3 rounded-lg bg-[#FAF9F6] border border-stone-200 flex items-center justify-between text-xs"
                      >
                        <span>
                          {gc.gift.name} (×{gc.quantity})
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatFcfa((gc.gift.priceFcfa + gc.wrappingFeeFcfa) * gc.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectionDrawerOpen(false);
                    setActiveRoute('cadeaux');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-[#065F46] text-white rounded-lg hover:bg-[#064E3B]"
                >
                  Accéder à la Boutique Cadeaux
                </button>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 pt-6">
              Votre sélection événementielle est sauvegardée automatiquement pour vous permettre de reprendre votre préparation à tout moment.
            </p>
          </div>
        </div>
      )}

      {/* Trust, Cancellations & Privacy Modal */}
      {legalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-lg font-semibold text-zinc-900">
                Charte de Confiance, Annulations & Confidentialité
              </h2>
              <button
                type="button"
                onClick={() => setLegalModalOpen(false)}
                className="p-1 text-stone-500 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
              <p>
                <strong className="text-zinc-900">1. Vérification réelle des profils :</strong> La mention « Profil vérifié » n’est attribuée qu’après contrôle humain de l’identité du gérant, du registre de commerce (RCCM) et de références réelles. Les profils en attente restent clairement indiqués comme non vérifiés.
              </p>
              <p>
                <strong className="text-zinc-900">2. Neutralité du comparateur :</strong> Les résultats de comparaison affichent objectivement les tarifs, unités, prestations incluses et avis clients. Une mise en avant commerciale porte toujours la mention explicite « Sponsorisé ».
              </p>
              <p>
                <strong className="text-zinc-900">3. Règles d’annulation et litiges :</strong> Chaque fiche prestataire détaille son pourcentage d’acompte et son délai de report/remboursement sans frais avant tout engagement. En cas de litige, notre médiation centrale examine les échanges horodatés.
              </p>
              <p>
                <strong className="text-zinc-900">4. Protection des données personnelles :</strong> Vos coordonnées téléphoniques ne sont transmises qu’aux prestataires que vous sollicitez explicitement pour un devis ou une réservation.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLegalModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg"
              >
                J’ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
