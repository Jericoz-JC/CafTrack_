import { useEffect, useMemo, useState } from 'react';

const POPULAR_NAMES = [
  'Coffee Friend Brewed Coffee',
  'Tea (Black)',
  'Coca-Cola Classic',
  'Red Bull',
  'Monster Energy',
  'Latte'
];

const CATEGORY_LABELS = {
  coffee: 'Coffee',
  tea: 'Tea',
  energy: 'Energy',
  soda: 'Soda',
  other: 'Other'
};

export const RECENT_DRINK_STORAGE_KEY = 'caftrack_recent_drinks';

export const useDrinkDatabase = () => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDrinks = async () => {
      try {
        const response = await fetch('/data/drinks.json', {
          cache: 'force-cache'
        });

        if (!response.ok) {
          throw new Error('Failed to load drinks');
        }

        const data = await response.json();
        if (isMounted) {
          setDrinks(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchDrinks();

    return () => {
      isMounted = false;
    };
  }, []);

  const drinksById = useMemo(() => {
    const map = new Map();
    drinks.forEach((drink) => {
      map.set(drink.id, drink);
    });
    return map;
  }, [drinks]);

  const popularDrinks = useMemo(() => {
    if (!drinks.length) return [];
    const resolved = POPULAR_NAMES.map((name) =>
      drinks.find((drink) => drink.name === name)
    ).filter(Boolean);

    if (resolved.length >= 5) {
      return resolved;
    }

    const fallback = drinks
      .filter((drink) => drink.category === 'coffee' || drink.category === 'tea')
      .slice(0, 5);

    return [...resolved, ...fallback].slice(0, 5);
  }, [drinks]);

  return {
    drinks,
    drinksById,
    popularDrinks,
    loading,
    error
  };
};

export const getCategoryLabel = (category) =>
  CATEGORY_LABELS[category] || CATEGORY_LABELS.other;

