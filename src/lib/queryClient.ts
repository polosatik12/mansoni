/**
 * A2 & A5: TanStack Query client with Circuit Breaker pattern
 * + Persistent cache for offline-first experience
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { captureException } from './sentry';

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIME = 30000;

function isCircuitOpen(key: string): boolean {
  const state = circuitBreakers.get(key);
  if (!state) return false;
  if (state.isOpen) {
    if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_TIME) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }
    return true;
  }
  return false;
}

function recordFailure(key: string): void {
  const state = circuitBreakers.get(key) || { failures: 0, lastFailure: 0, isOpen: false };
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.isOpen = true;
    console.warn(`[Circuit Breaker] Circuit opened for: ${key}`);
  }
  circuitBreakers.set(key, state);
}

function recordSuccess(key: string): void {
  circuitBreakers.delete(key);
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('401') || message.includes('403') || message.includes('404')) {
      return false;
    }
  }
  return failureCount < 3;
}

function getRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/** 24 hours cache lifetime */
const CACHE_TIME = 1000 * 60 * 60 * 24;

/**
 * Create the query client with persistent offline cache
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        gcTime: CACHE_TIME, // 24h — keep cache for offline
        retry: shouldRetry,
        retryDelay: getRetryDelay,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        networkMode: 'offlineFirst', // serve cache first, then refetch
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
        networkMode: 'offlineFirst',
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        const queryKey = JSON.stringify(query.queryKey);
        recordFailure(queryKey);
        captureException(error, {
          tags: { type: 'query_error' },
          extra: { queryKey: query.queryKey },
        });
        console.error('[Query Error]', queryKey, error);
      },
      onSuccess: (_, query) => {
        const queryKey = JSON.stringify(query.queryKey);
        recordSuccess(queryKey);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        captureException(error, {
          tags: { type: 'mutation_error' },
          extra: { mutationKey: mutation.options.mutationKey },
        });
        console.error('[Mutation Error]', error);
      },
    }),
  });
}

/**
 * Create a persister that stores the query cache in localStorage
 */
export function createPersister() {
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'lovable-query-cache',
    // Throttle writes to localStorage to avoid performance issues
    throttleTime: 1000,
    serialize: (data) => {
      try {
        return JSON.stringify(data);
      } catch {
        return '{}';
      }
    },
    deserialize: (data) => {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    },
  });
}

export const circuitBreaker = {
  isOpen: isCircuitOpen,
  recordFailure,
  recordSuccess,
};
