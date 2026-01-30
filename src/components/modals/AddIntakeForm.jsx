import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  AlertCircle,
  ChevronDown,
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

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

const getDateOffset = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const TimeOptionButton = ({ label, description, isSelected, onClick, darkMode, fullWidth = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      ${fullWidth ? 'w-full' : ''}
      px-4 py-3 rounded-xl border text-left transition-all
      touch-manipulation
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      ${isSelected
        ? darkMode
          ? 'bg-blue-500/20 border-blue-400/80 text-blue-300'
          : 'bg-blue-500/10 border-blue-500/70 text-blue-600'
        : darkMode
          ? 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/20'
          : 'bg-white/70 border-slate-200/70 text-slate-700 hover:bg-white'
      }
      ${darkMode
        ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
        : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
      }
    `}
    aria-pressed={isSelected}
  >
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
        isSelected
          ? 'border-blue-500 bg-blue-500'
          : darkMode ? 'border-white/30' : 'border-slate-300'
      }`}>
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{label}</span>
        {description && (
          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {description}
          </span>
        )}
      </div>
    </div>
  </button>
);

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
  const [customDate, setCustomDate] = useState(getCurrentDate());
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
  }, [deferredQuery, combinedDrinks]);

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
    const now = new Date();

    switch (timeMode) {
      case 'now':
        return now.toISOString();

      case '1hr': {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        return oneHourAgo.toISOString();
      }

      case 'earlier': {
        const morning = new Date(now);
        morning.setHours(8, 0, 0, 0);
        return morning.toISOString();
      }

      case 'specific': {
        const [year, month, day] = customDate.split('-').map(Number);
        const [hours, minutes] = customTime.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
      }

      default:
        return now.toISOString();
    }
  };

  const handleQuickDate = (daysAgo) => {
    setCustomDate(getDateOffset(daysAgo));
  };

  const getQuickDateLabel = (daysAgo) => {
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    return `${daysAgo} days ago`;
  };

  const isQuickDateSelected = (daysAgo) => {
    return customDate === getDateOffset(daysAgo);
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
    const parsedAmount = Number(customAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    const normalizedAmount = Math.min(1500, Math.max(1, Math.round(parsedAmount)));
    const timestamp = buildTimestamp();
    onAdd({
      name: customName.trim(),
      amount: normalizedAmount,
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

  const listContainerClasses = `rounded-3xl flex flex-col max-h-[28rem] glass-surface glass-highlight ${
    darkMode ? 'text-slate-100' : 'text-slate-900'
  }`;

  const listButtonClasses = (isActive) =>
    `w-full text-left px-4 py-3 flex justify-between items-center rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      darkMode
        ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
        : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
    } ${
      isActive
        ? darkMode
          ? 'bg-blue-500/15'
          : 'bg-blue-500/10'
        : darkMode
          ? 'hover:bg-white/10'
          : 'hover:bg-slate-900/5'
    }`;

  const renderListItem = (drink) => {
    const isActive = selectedDrink?.id === drink.id;
    const shouldHide = selectedDrink && !isActive;

    if (shouldHide) return null;

    return (
      <div key={drink.id} className="space-y-2">
        <button
          onClick={() => handleDrinkClick(drink)}
          className={listButtonClasses(isActive)}
        >
          <div>
            <p className="font-semibold">{highlightName(drink.name)}</p>
            <p
              className={`text-xs ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
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

        {isActive && renderInlineSelection(drink)}
      </div>
    );
  };

  const renderSection = (title, items) => {
    if (!items?.length) return null;
    return (
      <section className="py-3 space-y-3" key={title}>
        <p
          className={`px-4 text-xs font-semibold tracking-wide uppercase ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
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
              className={`h-10 rounded-lg animate-pulse ${
                darkMode ? 'bg-white/10' : 'bg-slate-200/70'
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
              className={`mt-3 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              } ${
                darkMode
                  ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                  : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
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

  const renderInlineSelection = (drink) => (
    <div
      className={`rounded-2xl p-4 glass-surface glass-highlight ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold">{drink.name}</p>
          <p
            className={`text-xs ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {servingLabel(drink)} • {getCategoryLabel(drink.category)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedDrink(null)}
          className={`p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            darkMode
              ? 'hover:bg-white/10 focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
              : 'hover:bg-slate-900/5 focus-visible:ring-blue-500 focus-visible:ring-offset-white'
          }`}
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1 text-sm font-medium">
          <span>Portion consumed</span>
          <span className={darkMode ? 'text-blue-300' : 'text-blue-600'}>
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
        <div className="flex justify-between text-[11px] mt-1">
          <span>10%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleAddSelectedDrink(drink)}
        className={`mt-4 w-full rounded-lg px-4 py-2 font-semibold text-white flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          darkMode
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-blue-500 hover:bg-blue-600'
        } ${
          darkMode
            ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
            : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
        }`}
      >
        <Plus size={16} className="mr-2" />
        Add {drink.name}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div
        className={`rounded-glass p-4 glass-surface glass-highlight ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}
      >
        <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          When did you have this?
        </p>

        <TimeOptionButton
          label="Just now"
          isSelected={timeMode === 'now'}
          onClick={() => setTimeMode('now')}
          darkMode={darkMode}
          fullWidth
        />

        <div className="grid grid-cols-2 gap-2 mt-2">
          <TimeOptionButton
            label="1 hour ago"
            isSelected={timeMode === '1hr'}
            onClick={() => setTimeMode('1hr')}
            darkMode={darkMode}
          />
          <TimeOptionButton
            label="Earlier today"
            description="8:00 AM"
            isSelected={timeMode === 'earlier'}
            onClick={() => setTimeMode('earlier')}
            darkMode={darkMode}
          />
        </div>

        <button
          type="button"
          onClick={() => setTimeMode('specific')}
          className={`mt-2 w-full px-4 py-3 rounded-xl border text-left transition-all touch-manipulation
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${timeMode === 'specific'
              ? darkMode
                ? 'bg-blue-500/20 border-blue-400/80 text-blue-300'
                : 'bg-blue-500/10 border-blue-500/70 text-blue-600'
              : darkMode
                ? 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/20'
                : 'bg-white/70 border-slate-200/70 text-slate-700 hover:bg-white'
            }
            ${darkMode
              ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
              : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }
          `}
          aria-pressed={timeMode === 'specific'}
          aria-expanded={timeMode === 'specific'}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                timeMode === 'specific'
                  ? 'border-blue-500 bg-blue-500'
                  : darkMode ? 'border-white/30' : 'border-slate-300'
              }`}>
                {timeMode === 'specific' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="font-medium">Pick exact time</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${timeMode === 'specific' ? 'rotate-180' : ''} ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            />
          </div>
        </button>

        {timeMode === 'specific' && (
          <div className={`mt-3 p-3 rounded-xl space-y-3 border ${
            darkMode ? 'bg-white/10 border-white/10' : 'bg-white/70 border-slate-200/70'
          }`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="custom-date"
                  className={`text-xs font-medium mb-1 block ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Date
                </label>
                <input
                  id="custom-date"
                  type="date"
                  value={customDate}
                  max={getCurrentDate()}
                  onChange={(event) => setCustomDate(event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-base ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white/80 border-slate-200/80 text-slate-900'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    darkMode
                      ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                      : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                  }`}
                />
              </div>
              <div>
                <label
                  htmlFor="custom-time"
                  className={`text-xs font-medium mb-1 block ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Time
                </label>
                <input
                  id="custom-time"
                  type="time"
                  value={customTime}
                  onChange={(event) => setCustomTime(event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-base ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white/80 border-slate-200/80 text-slate-900'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    darkMode
                      ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                      : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {[0, 1, 2].map((daysAgo) => (
                <button
                  key={daysAgo}
                  type="button"
                  onClick={() => handleQuickDate(daysAgo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    ${isQuickDateSelected(daysAgo)
                      ? darkMode
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/80'
                        : 'bg-blue-500/10 text-blue-600 border border-blue-500/70'
                      : darkMode
                        ? 'bg-white/10 text-slate-200 border border-white/10 hover:bg-white/20'
                        : 'bg-white/70 text-slate-700 border border-slate-200/70 hover:bg-white'
                    }
                    ${darkMode
                      ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                      : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                    }
                  `}
                >
                  {getQuickDateLabel(daysAgo)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={listContainerClasses}>
        <div className="px-4 py-3 border-b border-glass-stroke">
          <label htmlFor="drink-search" className="sr-only">
            Search for a drink
          </label>
          <div className="relative">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
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
                  ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                  : 'bg-white/80 border-slate-200/80 text-slate-900 placeholder-slate-500'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode
                  ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                  : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
              }`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {renderListContent()}
        </div>
        <div
          className={`px-4 py-3 border-t border-glass-stroke ${
            darkMode ? 'bg-white/5' : 'bg-white/60'
          }`}
        >
          <button
            type="button"
            onClick={() => handleCustomCtaClick(searchQuery.trim())}
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/80 text-slate-900 hover:bg-white'
            } ${
              darkMode
                ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
          >
            <Plus size={16} className="mr-2" />
            Add Custom Drink
          </button>
        </div>
      </div>

      {showCustomForm && (
        <div
          ref={customFormRef}
          className={`rounded-2xl p-4 glass-surface glass-highlight ${
            darkMode ? 'text-slate-100' : 'text-slate-900'
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
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white/80 border-slate-200/80 text-slate-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                    : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
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
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white/80 border-slate-200/80 text-slate-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                    : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                }`}
              />
            </div>
            <button
              type="submit"
              className={`w-full rounded-lg px-4 py-2 font-semibold text-white flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } ${
                darkMode
                  ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
                  : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
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
