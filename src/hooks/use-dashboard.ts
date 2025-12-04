import { useState, useEffect, useCallback, useRef } from "react";
import { useAsgardeo } from "@asgardeo/react";
import {
  loadDashboardData,
  getAttendanceDashboard,
  getLeaveSummary,
} from "@/lib/api/dashboard";
import type {
  DashboardData,
  AttendanceDashboard,
  LeaveSummary,
} from "@/lib/api/dashboard";

export interface UseDashboardResult {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseDashboardOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds, 0 to disable
}

const defaultOptions: UseDashboardOptions = {
  autoFetch: true,
  refreshInterval: 0, // disabled by default
};

export function useDashboard(
  options: UseDashboardOptions = {},
): UseDashboardResult {
  const { autoFetch, refreshInterval } = { ...defaultOptions, ...options };
  const { getAccessToken, isSignedIn } = useAsgardeo();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid dependency issues that cause infinite loops
  const getAccessTokenRef = useRef(getAccessToken);
  const hasFetchedRef = useRef(false);

  // Update ref when getAccessToken changes
  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  const fetchDashboard = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      setError("User not signed in");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getAccessTokenRef.current();
      if (!token) {
        throw new Error("Failed to get access token");
      }

      const dashboardData = await loadDashboardData(token);
      setData(dashboardData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  // Initial fetch - only run once when signed in
  useEffect(() => {
    if (autoFetch && isSignedIn && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDashboard();
    } else if (!isSignedIn) {
      setIsLoading(false);
      hasFetchedRef.current = false;
    }
  }, [autoFetch, isSignedIn, fetchDashboard]);

  // Refresh interval
  useEffect(() => {
    const interval = refreshInterval ?? 0;
    if (interval > 0 && isSignedIn) {
      const intervalId = setInterval(fetchDashboard, interval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, isSignedIn, fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}

// Individual data hooks for more granular control
export function useAttendanceSummary() {
  const { getAccessToken, isSignedIn } = useAsgardeo();
  const [data, setData] = useState<AttendanceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessTokenRef = useRef(getAccessToken);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  const fetch = useCallback(
    async (date?: string) => {
      if (!isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const token = await getAccessTokenRef.current();
        if (!token) throw new Error("No access token");

        const result = await getAttendanceDashboard(token, date);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load attendance",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn],
  );

  useEffect(() => {
    if (isSignedIn && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetch();
    } else if (!isSignedIn) {
      hasFetchedRef.current = false;
    }
  }, [isSignedIn, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useLeaveSummary() {
  const { getAccessToken, isSignedIn } = useAsgardeo();
  const [data, setData] = useState<LeaveSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessTokenRef = useRef(getAccessToken);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);

  const fetch = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = await getAccessTokenRef.current();
      if (!token) throw new Error("No access token");

      const result = await getLeaveSummary(token);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leave summary",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetch();
    } else if (!isSignedIn) {
      hasFetchedRef.current = false;
    }
  }, [isSignedIn, fetch]);

  return { data, isLoading, error, refetch: fetch };
}
