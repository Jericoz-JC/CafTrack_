import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  AlertCircle,
  Percent,
  Plus,
  Search,
  X
} from 'lucide-react';
import {
  RECENT_DRINK_STORAGE_KEY,
  getCategoryLabel,
  useDrinkDatabase
} from '../../hooks/useDrinkDatabase';

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const SEARCH_RESULTS_LIMIT = 60;

const FEATURED_DRINKS = [
  {
    id: 'featured-brewed-coffee-8oz',
    name: 'Brewed Coffee (8 oz)',
    category: 'coffee',
    serving: { oz: 8, ml: 237 },
    caffeineMg: 95
  },
  {
    id: 'featured-latte-8oz',
    name: 'Latte (8 oz)',
    category: 'coffee',
    serving: { oz: 8, ml: 237 },
    caffeineMg: 63
  },
  {
    id: 'featured-black-tea-8oz',
    name: 'Black Tea (8 oz)',
    category: 'tea',
    serving: { oz: 8, ml: 237 },
    caffeineMg: 47
  },
  {
    id: 'featured-red-bull-8oz',
    name: 'Red Bull (8.4 oz)',
    category: 'energy',
    serving: { oz: 8.4, ml: 250 },
    caffeineMg: 80
  },
  {
    id: 'featured-celsius-12oz',
    name: 'Celsius (12 oz)',
    category: 'energy',
    serving: { oz: 12, ml: 355 },
    caffeineMg: 200
  }
];

const FEATURED_DRINK_MAP = FEATURED_DRINKS.reduce(
  (map, drink) => map.set(drink.id, drink),
  new Map()
);

export const AddIntakeForm = ({ onAdd, darkMode = false }) => {
  const { drinks, drinksById, loading, error } = useDrinkDatabase();
  const [timeMode, setTimeMode] = useState('now');
  const [customTime, setCustomTime] = useState(getCurrentTime());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [portion, setPortion] = useState(100);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [recentDrinkIds, setRecentDrinkIds] = useState([]);
  const [recentLoaded, setRecentLoaded] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const searchInputRef = useRef(null);
  const customNameInputRef = useRef(null);
  const customFormRef = useRef(null);

  const combinedDrinks = useMemo(() => {
    const map = new Map();
    FEATURED_DRINKS.forEach((drink) => map.set(drink.id, drink));
    drinks.forEach((drink) => map.set(drink.id, drink));
    return Array.from(map.values());
  }, [drinks]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_DRINK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentDrinkIds(parsed);
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setRecentLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!recentLoaded) return;
    try {
      localStorage.setItem(
        RECENT_DRINK_STORAGE_KEY,
        JSON.stringify(recentDrinkIds)
      );
    } catch {
      // ignore storage errors
    }
  }, [recentDrinkIds, recentLoaded]);

  const deferredQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const filteredDrinks = useMemo(() => {
    if (!deferredQuery) {
      return [];
    }

    return combinedDrinks
      .filter((drink) => {
        const nameMatch = drink.name.toLowerCase().includes(deferredQuery);
        const categoryMatch = getCategoryLabel(drink.category)
          .toLowerCase()
          .includes(deferredQuery);
        return nameMatch || categoryMatch;
      })
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [deferredQuery, drinks]);

  const recentDrinks = useMemo(() => {
    if (!recentDrinkIds.length) return [];
    return recentDrinkIds
      .map((id) => drinksById.get(id) || FEATURED_DRINK_MAP.get(id))
      .filter(Boolean);
  }, [recentDrinkIds, drinksById]);

  const servingLabel = (drink) => {
    if (!drink?.serving) return null;
    const ml = drink.serving.ml ? `${drink.serving.ml} ml` : null;
    let ozLabel = null;
    if (typeof drink.serving.oz === 'number') {
      const ozValue =
        Number.isInteger(drink.serving.oz)
          ? drink.serving.oz.toFixed(0)
          : drink.serving.oz.toFixed(1);
      ozLabel = `${ozValue} oz`;
    }
    return [ozLabel, ml].filter(Boolean).join(' • ');
  };

  const highlightName = (name) => {
    if (!deferredQuery) {
      return name;
    }
    const normalizedName = name.toLowerCase();
    const matchIndex = normalizedName.indexOf(deferredQuery);
    if (matchIndex === -1) {
      return name;
    }
    const before = name.slice(0, matchIndex);
    const match = name.slice(matchIndex, matchIndex + deferredQuery.length);
    const after = name.slice(matchIndex + deferredQuery.length);
    return (
      <>
        {before}
        <span className={darkMode ? 'text-blue-300' : 'text-blue-600'}>
          {match}
        </span>
        {after}
      </>
    );
  };

  const buildTimestamp = () => {
    if (timeMode !== 'custom') {
      return new Date().toISOString();
    }
    const [hours, minutes] = customTime.split(':').map((value) => Number(value) || 0);
    const customDate = new Date();
    customDate.setHours(hours, minutes, 0, 0);
    return customDate.toISOString();
  };

  const recordRecentDrink = (id) => {
    setRecentDrinkIds((prev) => {
      const next = [id, ...prev.filter((existing) => existing !== id)].slice(
        0,
        5
      );
      return next;
    });
  };

  const addDrinkWithCurrentSettings = (drink) => {
    if (!drink) return;
    const adjustedAmount = Math.max(
      0,
      Math.round((drink.caffeineMg * portion) / 100)
    );
    const timestamp = buildTimestamp();

    onAdd({
      name: `${drink.name}${portion !== 100 ? ` (${portion}%)` : ''}`,
      amount: adjustedAmount,
      category: drink.category,
      timestamp
    });

    recordRecentDrink(drink.id);
    setSelectedDrink(null);
    setPortion(100);
  };

  const handleAddSelectedDrink = () => {
    if (!selectedDrink) return;
    addDrinkWithCurrentSettings(selectedDrink);
  };

  const handleDrinkClick = (drink) => {
    setSelectedDrink(drink);
    setPortion(100);
  };

  const handleCustomSubmit = (event) => {
    event.preventDefault();
    if (!customName.trim() || !customAmount.trim()) {
      return;
    }
    const timestamp = buildTimestamp();
    onAdd({
      name: customName.trim(),
      amount: Number(customAmount),
      category: 'custom',
      timestamp
    });
    setCustomName('');
    setCustomAmount('');
  };

  const handleCustomCtaClick = (prefillName = '') => {
    if (prefillName) {
      setCustomName(prefillName);
    }
    setShowCustomForm(true);
    setTimeout(() => {
      if (customFormRef.current) {
        customFormRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
      customNameInputRef.current?.focus({ preventScroll: true });
    }, 150);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && filteredDrinks.length > 0) {
      event.preventDefault();
      handleDrinkClick(filteredDrinks[0]);
    }
  };

  const listContainerClasses = `rounded-3xl border flex flex-col max-h-[28rem] ${
    darkMode
      ? 'border-gray-700 bg-gray-900 text-white'
      : 'border-slate-200 bg-white text-gray-900 shadow-lg'
  }`;

  const listButtonClasses = (isActive) =>
    `w-full text-left px-4 py-3 flex justify-between items-center rounded-2xl transition-all ${
      isActive
        ? darkMode
          ? 'bg-blue-900/40'
          : 'bg-blue-50'
        : darkMode
          ? 'hover:bg-gray-800'
          : 'hover:bg-slate-50'
    }`;

  const renderListItem = (drink) => {
    const isActive = selectedDrink?.id === drink.id;
    return (
      <button
        key={drink.id}
        onClick={() => handleDrinkClick(drink)}
        className={listButtonClasses(isActive)}
      >
        <div>
          <p className="font-semibold">{highlightName(drink.name)}</p>
          <p
            className={`text-xs ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {servingLabel(drink)} • {getCategoryLabel(drink.category)}
          </p>
        </div>
        <span
          className={`text-sm font-semibold ${
            darkMode ? 'text-blue-300' : 'text-blue-600'
          }`}
        >
          {drink.caffeineMg} mg
        </span>
      </button>
    );
  };

  const renderSection = (title, items) => {
    if (!items?.length) return null;
    return (
      <section className="py-3 space-y-3" key={title}>
        <p
          className={`px-4 text-xs font-semibold tracking-wide uppercase ${
            darkMode ? 'text-gray-400' : 'text-slate-500'
          }`}
        >
          {title}
        </p>
        <div className="space-y-3 px-2">{items.map(renderListItem)}</div>
      </section>
    );
  };

  const renderListContent = () => {
    if (loading) {
      return (
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map((key) => (
            <div
              key={key}
              className={`h-10 rounded-lg ${
                darkMode ? 'bg-gray-800 animate-pulse' : 'bg-gray-100 animate-pulse'
              }`}
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 flex items-center text-sm text-red-500">
          <AlertCircle size={16} className="mr-2" />
          Unable to load drinks. Please try again shortly.
        </div>
      );
    }

    if (!drinks.length) {
      return (
        <div className="p-4 text-sm">
          No drinks available. Add a custom drink below.
        </div>
      );
    }

    if (searchQuery.trim()) {
      if (!filteredDrinks.length) {
        return (
          <div className="p-6 text-center text-sm">
            <p className="font-semibold">
              Can’t find “{searchQuery}”?
            </p>
            <button
              onClick={() => handleCustomCtaClick(searchQuery)}
              className={`mt-3 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium ${
                darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              <Plus size={16} className="mr-2" />
              Create “{searchQuery}”
            </button>
          </div>
        );
      }

      return (
        <div>{filteredDrinks.map(renderListItem)}</div>
      );
    }

    return (
      <>
        {renderSection('Favorites', FEATURED_DRINKS)}
        {renderSection('Recent', recentDrinks)}
      </>
    );
  };

  const renderSelectedDrinkControls = () => {
    if (!selectedDrink) return null;
    return (
      <div
        className={`mt-4 rounded-2xl p-4 shadow-lg ${
          darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{selectedDrink.name}</p>
            <p
              className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {servingLabel(selectedDrink)} •{' '}
              {getCategoryLabel(selectedDrink.category)}
            </p>
          </div>
          <button
            onClick={() => setSelectedDrink(null)}
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1 text-sm font-medium">
            <span className="flex items-center">
              <Percent size={16} className="mr-2" />
              Portion consumed
            </span>
            <span
              className={darkMode ? 'text-blue-300' : 'text-blue-600'}
            >
              {portion}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={portion}
            onChange={(event) => setPortion(Number(event.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>10%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <button
          onClick={handleAddSelectedDrink}
          className={`mt-4 w-full rounded-lg px-4 py-2 font-semibold text-white ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } flex items-center justify-center`}
        >
          <Plus size={18} className="mr-2" />
          Add {selectedDrink.name}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl p-4 shadow-lg ${
          darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-slate-200'
        }`}
      >
        <div className="grid grid-cols-2 gap-3">
          {['now', 'custom'].map((mode) => {
            const isActive = timeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTimeMode(mode)}
                className={`h-20 rounded-2xl border text-lg font-semibold transition-all ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                      : 'bg-blue-500 text-white border-blue-500 shadow-lg'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 shadow'
                      : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-white shadow'
                }`}
                aria-pressed={isActive}
              >
                {mode === 'now' ? 'Now' : 'Custom'}
              </button>
            );
          })}
        </div>
        {timeMode === 'custom' && (
          <input
            type="time"
            value={customTime}
            onChange={(event) => setCustomTime(event.target.value)}
            className={`mt-4 w-full rounded-xl border px-3 py-3 text-base shadow-inner ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        )}
      </div>

      <div className={listContainerClasses}>
        <div
          className={`px-4 py-3 border-b ${
            darkMode ? 'border-gray-800' : 'border-slate-100'
          }`}
        >
          <label htmlFor="drink-search" className="sr-only">
            Search for a drink
          </label>
          <div className="relative">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              id="drink-search"
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search for a drink..."
              className={`w-full rounded-full border px-10 py-2 text-base ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">{renderListContent()}</div>
        <div
          className={`px-4 py-3 border-t ${
            darkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-100 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() => handleCustomCtaClick(searchQuery.trim())}
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold flex items-center justify-center ${
              darkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-slate-100 text-gray-900 hover:bg-slate-200'
            }`}
          >
            <Plus size={16} className="mr-2" />
            Add Custom Drink
          </button>
        </div>
      </div>

      {renderSelectedDrinkControls()}

      {showCustomForm && (
        <div
          ref={customFormRef}
          className={`rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 ${
            darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-slate-200'
          }`}
        >
          <h3 className="font-semibold mb-4">Custom drink</h3>
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Drink name
              </label>
            <input
                ref={customNameInputRef}
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Caffeine amount (mg)
              </label>
            <input
                type="number"
                min="1"
                max="1500"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <button
              type="submit"
              className={`w-full rounded-lg px-4 py-2 font-semibold text-white flex items-center justify-center ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Plus size={16} className="mr-2" />
              Log custom drink
            </button>
          </form>
        </div>
      )}
    </div>
  );
};