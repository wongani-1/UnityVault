import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export const useOfflineCache = <T,>(key: string, ttl: number = 3600000) => {
  const get = (): T | null => {
    try {
      const item = localStorage.getItem(`offline_${key}`);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      const now = Date.now();

      // Check if cache is expired
      if (now - timestamp > ttl) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  };

  const set = (data: T) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const remove = () => {
    localStorage.removeItem(`offline_${key}`);
  };

  return { get, set, remove };
};

export const useServiceWorker = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(error => console.error('SW registration failed:', error));
    }
  }, []);

  const update = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return { registration, updateAvailable, update };
};
