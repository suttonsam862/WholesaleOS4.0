
import { useQuery } from "@tanstack/react-query";

export function useCsrf() {
  const { data: csrfToken, refetch } = useQuery<{ csrfToken: string }>({
    queryKey: ["/api/auth/csrf-token"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    csrfToken: csrfToken?.csrfToken,
    refreshToken: refetch,
  };
}

/**
 * Add CSRF token to request headers
 */
export function addCsrfHeader(headers: Record<string, string>, csrfToken?: string): Record<string, string> {
  if (csrfToken) {
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  return headers;
}
