import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export const useNotificationCount = (pollInterval: number = 5000) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let pollTimeout: NodeJS.Timeout;

    const fetchCount = async () => {
      try {
        const data = await apiRequest<{
          items: Array<{
            id: string;
            message: string;
            status: string;
            createdAt: string;
          }>;
        }>("/notifications");

        if (!active) return;
        setCount(data.items.length);
        setLoading(false);
      } catch (error) {
        // Silently fail on notification count fetch to avoid disrupting UI
        if (active) {
          setCount(0);
          setLoading(false);
        }
      }
    };

    const poll = () => {
      fetchCount();
      pollTimeout = setTimeout(poll, pollInterval);
    };

    poll();

    return () => {
      active = false;
      clearTimeout(pollTimeout);
    };
  }, [pollInterval]);

  return { count, loading };
};
