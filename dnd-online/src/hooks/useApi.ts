import { useState, useCallback } from 'react';
import { handleApiError } from '../utils/errorHandler';

interface UseApiResult<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (params?: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for handling API requests
 * @param apiFunction API function to call
 * @param initialData Initial data (optional)
 * @returns API request state and execution function
 */
export const useApi = <T, P = void>(
  apiFunction: (params: P) => Promise<T>,
  initialData: T | null = null
): UseApiResult<T, P> => {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (params?: P): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(params as P);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return { data, loading, error, execute, reset };
};

/**
 * Custom hook for handling API requests with automatic execution
 * @param apiFunction API function to call
 * @param params Parameters to pass to the API function
 * @param initialData Initial data (optional)
 * @param skip Whether to skip the initial execution (optional)
 * @returns API request state and execution function
 */
export const useApiEffect = <T, P = void>(
  apiFunction: (params: P) => Promise<T>,
  params: P,
  initialData: T | null = null,
  skip: boolean = false
): UseApiResult<T, P> => {
  const api = useApi<T, P>(apiFunction, initialData);

  // Execute the API call on mount
  useState(() => {
    if (!skip) {
      api.execute(params);
    }
  });

  return api;
};
