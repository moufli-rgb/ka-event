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
  Gift,
  Home,
  CalendarHeart,
  Briefcase,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BillingMode,
  CategoryId,
  ClientReview,
  EventCategoryMatrix,
  EventProject,
  EventTypeId,
  ProjectBudgetItem,
  Provider,
  ServiceInquiry,
} from './types';
import {
  BILLING_MODE_LABELS,
  EVENT_TYPES,
  INITIAL_EVENT_CATEGORY_MATRIX,
  SERVICE_CATEGORIES,
  formatFcfa,
} from './data/initialData';
import { SafeImage } from './components/SafeImage';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { ComparatorModal } from './components/ComparatorModal';
import { BudgetPlannerView } from './components/BudgetPlannerView';
import { KaGiftView } from './components/KaGiftView';
import { BottomTabBar, InstallAppBanner } from './components/MobileApp';
import { ProviderSpace } from './components/pro/ProviderSpace';
import { AdminSpace } from './components/pro/AdminSpace';
import { useAuth } from './lib/useAuth';
import {
  addReview,
  fetchPublicProviders,
  frError,
  isSupabaseConfigured,
  reportProvider,
  sendInquiry,
} from './lib/supabase';
import { HomeView, StartPlanningPayload } from './components/HomeView';

type ActiveRoute = 'accueil' | 'organiser' | 'prestataires' | 'cadeaux' | 'budget' | 'pro' | 'admin';
const ROUTES: ActiveRoute[] = ['accueil', 'organiser', 'prestataires', 'cadeaux', 'budget', 'pro', 'admin'];

/** Lit la page demandée dans l'adresse (#cadeaux, #pro, ?espace=pro après un e-mail…). */
const routeFromLocation = (): ActiveRoute => {
  const q = new URLSearchParams(window.location.search).get('espace');
  if (q === 'pro' || q === 'admin') return q;
  const h = window.location.hash.replace('#', '') as ActiveRoute;
  return ROUTES.includes(h) ? h : 'accueil';
};

export const NAV_ITEMS = [
  { id: 'accueil' as const, label: 'Accueil', icon: Home },
  { id: 'organiser' as const, label: 'Prestataires', icon: Search },
  { id: 'cadeaux' as const, label: 'Cadeaux Kā', icon: Gift },
  { id: 'budget' as const, label: 'Mon événement', icon: CalendarHeart },
  { id: 'pro' as const, label: 'Espace pro', icon: Briefcase },
];

const STORAGE_PROJECT_KEY = 'korafete_event_project_v2';
const STORAGE_FAV_KEY = 'korafete_favorites_v2';
const STORAGE_INQ_KEY = 'korafete_my_inquiries_v1';

const DEFAULT_PROJECT: EventProject = {
  title: 'Mon événement',
  eventTypeId: null,
  eventDate: '',
  city: '',
  guestCount: 100,
  targetBudgetFcfa: 1000000,
  preferences: '',
  customAddedCategories: [],
  dismissedCategories: [],
  showFullCatalog: true,
  items: [],
};

function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* stockage indisponible */
    }
    return initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* stockage indisponible */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function App() {
  const [activeRoute, setActiveRouteState] = useState<ActiveRoute>(routeFromLocation);
  const auth = useAuth();

  const setActiveRoute = (r: ActiveRoute) => {
    setActiveRouteState(r);
    const url = r === 'accueil' ? window.location.pathname : `${window.location.pathname}#${r}`;
    window.history.pushState(null, '', url);
  };

  useEffect(() => {
    const onPop = () => setActiveRouteState(routeFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeRoute]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectionDrawerOpen, setSelectionDrawerOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);

  // Données publiques (Supabase)
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(isSupabaseConfigured);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [matrix] = useState<EventCategoryMatrix>(INITIAL_EVENT_CATEGORY_MATRIX);

  const loadProviders = async () => {
    try {
      setProviders(await fetchPublicProviders());
      setProvidersError(null);
    } catch (err) {
      setProvidersError(frError(err));
    } finally {
      setProvidersLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  // Données du client, gardées sur son appareil
  const [project, setProject] = usePersistentState<EventProject>(STORAGE_PROJECT_KEY, DEFAULT_PROJECT);
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(STORAGE_FAV_KEY, []);
  const [inquiries, setInquiries] = usePersistentState<ServiceInquiry[]>(STORAGE_INQ_KEY, []);

  // Filtering & Discovery States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryId | 'toutes'>('toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('Toutes les villes');
  const [billingFilter, setBillingFilter] = useState<BillingMode | 'tous'>('tous');
  const [sortBy, setSortBy] = useState<'pertinence' | 'prix_asc' | 'avis_desc'>('pertinence');

  // Comparator & Active Vitrine Modal
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparatorOpen, setComparatorOpen] = useState(false);
  const [selectedProviderModalId, setSelectedProviderModalId] = useState<string | null>(null);

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

  const handleStartPlanning = (p: StartPlanningPayload) => {
    const recommended = SERVICE_CATEGORIES.filter(
      (c) => matrix[p.eventTypeId][c.id] === 'recommandee'
    ).map((c) => c.id);
    setProject((prev) => ({
      ...prev,
      eventTypeId: p.eventTypeId,
      guestCount: p.guestCount,
      targetBudgetFcfa: p.targetBudgetFcfa,
      eventDate: p.eventDate,
      showFullCatalog: false,
      customAddedCategories: p.selectedCategories.filter((c) => !recommended.includes(c)),
      dismissedCategories: recommended.filter((c) => !p.selectedCategories.includes(c)),
    }));
    setActiveCategoryFilter('toutes');
    setActiveRoute('organiser');
  };

  const handleBrowseAllProviders = () => {
    handleSelectEventType(null);
    setActiveRoute('organiser');
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
    sendInquiry(payload)
      .then((saved) => setInquiries((prev) => [saved, ...prev]))
      .catch((err) => showToast(`Demande non envoyée : ${frError(err)}`));
  };

  const handleAddReview = (providerId: string, review: Omit<ClientReview, 'id' | 'dateLabel'>) => {
    addReview(providerId, review)
      .then(loadProviders)
      .catch((err) => showToast(`Avis non publié : ${frError(err)}`));
  };

  const handleReportProvider = (targetName: string, reason: string) => {
    const prov = providers.find((p) => p.businessName === targetName);
    reportProvider(prov?.id ?? null, targetName, reason).catch((err) =>
      showToast(`Signalement non envoyé : ${frError(err)}`)
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

  const totalSelectionCount = project.items.length;

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
      {/* En-tête simple */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 mb-2">
              Prestataires
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900">
              {currentEventConfig && !project.showFullCatalog && !isFullDirectoryMode
                ? `Pour votre ${currentEventConfig.label.toLowerCase()}`
                : 'Trouvez vos prestataires'}
            </h1>
            <p className="text-sm text-stone-500 mt-2 max-w-xl">
              Choisissez votre événement, puis ce dont vous avez besoin. Touchez une carte pour voir les prix et réserver.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => setComparatorOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                Comparer ({compareIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Event Pills/Buttons Row */}
        {!isFullDirectoryMode && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <button
              type="button"
              onClick={() => handleSelectEventType(null)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0 ${
                project.showFullCatalog || !project.eventTypeId
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              Tous
            </button>
            {EVENT_TYPES.map((ev) => {
              const selected = project.eventTypeId === ev.id && !project.showFullCatalog;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleSelectEventType(ev.id)}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0 ${
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
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-4">
          <p className="text-xs font-semibold text-stone-500">Ce dont vous avez besoin</p>
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
              Tout ({smartCategoryBuckets.visibleCategories.length})
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
                Ajouter aussi :
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
          <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher : traiteur, gâteau, salle…"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF9F6] border border-stone-200 rounded-full focus:outline-none focus:border-emerald-800"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-full border transition-colors shrink-0 ${
                filtersOpen ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-stone-200 text-zinc-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtres
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg"
              >
                <option value="Toutes les villes">Toutes les villes</option>
                {Array.from(new Set(providers.map((p) => p.city.trim()).filter(Boolean)))
                  .sort((a, b) => a.localeCompare(b, 'fr'))
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <select
                value={billingFilter}
                onChange={(e) => setBillingFilter(e.target.value as BillingMode | 'tous')}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg"
              >
                <option value="tous">Tous les types de prix</option>
                {Object.entries(BILLING_MODE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-stone-200 rounded-lg"
              >
                <option value="pertinence">Trier : recommandés</option>
                <option value="prix_asc">Trier : moins cher</option>
                <option value="avis_desc">Trier : mieux notés</option>
              </select>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Grille des prestataires */}
      {providersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-white border border-stone-200 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-stone-200" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-1/3 bg-stone-200 rounded" />
                <div className="h-5 w-2/3 bg-stone-200 rounded" />
                <div className="h-3 w-full bg-stone-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-2xl bg-white border border-stone-200 text-center space-y-4">
          <Briefcase className="w-9 h-9 text-emerald-800 mx-auto" />
          <h3 className="text-xl font-semibold text-zinc-900">
            {providersError ? 'Impossible de charger les prestataires' : 'Les premiers prestataires arrivent bientôt'}
          </h3>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            {providersError
              ? providersError
              : !isSupabaseConfigured
                ? 'La base de données n’est pas encore branchée.'
                : 'Vous êtes traiteur, décorateur, photographe, propriétaire de salle… ? Créez votre profil gratuitement et soyez visible dès aujourd’hui.'}
          </p>
          {!providersError && (
            <button
              type="button"
              onClick={() => setActiveRoute('pro')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#065F46] text-white rounded-full hover:bg-[#064E3B]"
            >
              Je suis prestataire <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : filteredProviders.length === 0 ? (
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

  // Espaces séparés : prestataire et administration (sans le menu du site client)
  if (activeRoute === 'pro') {
    return (
      <ProviderSpace
        auth={auth}
        onBackToSite={() => {
          setActiveRoute('accueil');
          loadProviders();
        }}
        onOpenAdmin={() => setActiveRoute('admin')}
      />
    );
  }
  if (activeRoute === 'admin') {
    return (
      <AdminSpace
        auth={auth}
        onBackToSite={() => {
          setActiveRoute('accueil');
          loadProviders();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-zinc-900">
      {/* Barre du haut */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 h-16">
          <a
            href="#accueil"
            onClick={(e) => {
              e.preventDefault();
              setActiveRoute('accueil');
            }}
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0"
          >
            <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg" />
            KoraFête
          </a>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-stone-600">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeRoute === id || (id === 'organiser' && activeRoute === 'prestataires');
              const isKa = id === 'cadeaux';
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveRoute(id);
                  }}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors whitespace-nowrap ${
                    isKa
                      ? active
                        ? 'bg-[#344B31] text-[#F4F2EC] font-semibold'
                        : 'bg-[#344B31]/10 text-[#344B31] font-semibold hover:bg-[#344B31]/20'
                      : active
                        ? 'text-zinc-900 font-semibold'
                        : 'hover:text-zinc-900 hover:bg-stone-100'
                  }`}
                >
                  {active && !isKa && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-stone-100"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative w-4 h-4" />
                  <span className="relative">{label}</span>
                </a>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setSelectionDrawerOpen(true)}
            className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#065F46] rounded-full hover:bg-[#064E3B] transition-colors whitespace-nowrap shrink-0"
            aria-label={`Ma sélection (${totalSelectionCount})`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Ma sélection</span>
            <motion.span
              key={totalSelectionCount}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              className="min-w-5 h-5 px-1 rounded-full bg-white text-[#065F46] text-[11px] flex items-center justify-center tabular-nums"
            >
              {totalSelectionCount}
            </motion.span>
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-24 md:bottom-5 left-4 right-4 md:left-auto md:right-5 z-50 md:max-w-sm bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg text-xs sm:text-sm font-medium flex items-center gap-3">
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
        <AnimatePresence mode="wait">
        <motion.div
          key={activeRoute}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
        {activeRoute === 'accueil' && (
          <HomeView
            project={project}
            matrix={matrix}
            providerCount={providers.length}
            onStartPlanning={handleStartPlanning}
            onGoGifts={() => setActiveRoute('cadeaux')}
            onGoProviders={handleBrowseAllProviders}
            onOpenPro={(space) => setActiveRoute(space === 'admin' ? 'admin' : 'pro')}
          />
        )}

        {activeRoute === 'organiser' && renderProviderMarketplace(false)}

        {activeRoute === 'prestataires' && renderProviderMarketplace(true)}

        {activeRoute === 'cadeaux' && <KaGiftView />}

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

        </motion.div>
        </AnimatePresence>
      </main>

      {/* Pied de page */}
      <footer className={`border-t border-stone-200 bg-white py-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-8 ${activeRoute === 'cadeaux' ? 'hidden md:block' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-zinc-900">KoraFête</span>
            <span>·</span>
            <span>Services événementiels & Boutique de cadeaux</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveRoute('accueil')}
              className="hover:text-zinc-900 transition-colors"
            >
              Accueil
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
              onClick={() => setActiveRoute('pro')}
              className="hover:text-zinc-900 transition-colors font-semibold"
            >
              Espace prestataire
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('admin')}
              className="hover:text-zinc-900 transition-colors"
            >
              Administration
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

      <InstallAppBanner />
      <BottomTabBar
        items={NAV_ITEMS}
        active={activeRoute === 'prestataires' ? 'organiser' : activeRoute}
        onSelect={(id) => setActiveRoute(id as ActiveRoute)}
      />

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

              {/* Cadeaux Kā */}
              <div className="pt-5 border-t border-stone-200 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">Un cadeau à offrir ?</h3>
                <p className="text-xs text-stone-500">Composez une calebasse cadeau Kā, validée sur WhatsApp.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionDrawerOpen(false);
                    setActiveRoute('cadeaux');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-[#344B31] text-[#F4F2EC] rounded-lg hover:opacity-90"
                >
                  Faire ma Kā
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
