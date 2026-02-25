import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { apiRequest } from '@/lib/api';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription or create new one
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        // VAPID public key (you'll need to generate this on the backend)
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        });
      }

      if (sub) {
        const subData = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
            auth: arrayBufferToBase64(sub.getKey('auth'))
          }
        };

        setSubscription(subData);

        // Send subscription to backend
        await apiRequest('/notifications/subscribe', {
          method: 'POST',
          body: subData,
        });

        toast.success('Successfully subscribed to notifications!');
        return subData;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to subscribe to notifications');
      return null;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        
        // Notify backend
        await apiRequest('/notifications/unsubscribe', {
          method: 'POST',
          body: { endpoint: sub.endpoint },
        });

        setSubscription(null);
        toast.success('Unsubscribed from notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to unsubscribe');
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
