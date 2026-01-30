import { useEffect, useState } from 'react';

export const useMediaQuery = (query, defaultState = false) => {
  const getMatches = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return defaultState;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handler);
    } else {
      mediaQueryList.addListener(handler);
    }

    setMatches(mediaQueryList.matches);

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handler);
      } else {
        mediaQueryList.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
};
