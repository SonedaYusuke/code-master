import { useEffect, useState } from 'react';
import { formatRoute, parseRoute, type Route } from './lib/route';

export function useHashRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}

export function navigate(route: Route, replace = false): void {
  const hash = formatRoute(route);
  if (replace) window.location.replace(hash);
  else window.location.hash = hash;
}
