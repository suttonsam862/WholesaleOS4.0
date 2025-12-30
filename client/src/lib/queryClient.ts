import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Custom error class that preserves HTTP status for global error handling
export class HttpError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// Global CSRF token cache
let cachedCsrfToken: string | null = null;

// Check if we're in development mode for logging
const isDevelopment = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') || 
                      (typeof import.meta !== 'undefined' && import.meta.env?.DEV);

// Safe logging that only outputs in development
function devLog(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(...args);
  }
}

function devError(...args: unknown[]): void {
  if (isDevelopment) {
    console.error(...args);
  }
}

// Helper function to provide user-friendly error messages
function getUserFriendlyErrorMessage(status: number, serverMessage: string): string {
  // If server provided a user-friendly message, use it
  if (serverMessage && !serverMessage.includes("<!DOCTYPE") && serverMessage.length < 200) {
    return serverMessage;
  }

  // Otherwise, provide friendly defaults based on status code
  switch (status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This action conflicts with existing data. Please check and try again.";
    case 422:
      return "Invalid data provided. Please check the form and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "A server error occurred. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "The service is temporarily unavailable. Please try again in a moment.";
    default:
      return serverMessage || `An error occurred (${status}). Please try again.`;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const friendlyMessage = getUserFriendlyErrorMessage(res.status, text);
    throw new HttpError(friendlyMessage, res.status);
  }
}

// Clear cached CSRF token (used on logout)
export function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

// Fetch CSRF token if needed
async function getCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  try {
    const response = await fetch('/api/auth/csrf-token', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }

  return null;
}

async function handleFetch(
  url: string,
  options: RequestInit
): Promise<Response> {
  // Add CSRF token for state-changing requests
  const needsCsrf = options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method);

  if (needsCsrf && !url.startsWith('/api/public/')) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
      };
    }
  }

  return fetch(url, options);
}


export async function apiRequest<T = any>(
  endpoint: string,
  requestConfig: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: any;
  }
): Promise<T>;
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  body?: any
): Promise<T>;
export async function apiRequest<T = any>(
  endpointOrMethod: string,
  requestConfigOrEndpoint: any,
  body?: any
): Promise<T> {
  // Handle both parameter formats for backward compatibility
  let endpoint: string;
  let method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  let requestBody: any;

  if (typeof requestConfigOrEndpoint === "string") {
    // New format: apiRequest(method, endpoint, body)
    method = endpointOrMethod as "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    endpoint = requestConfigOrEndpoint;
    requestBody = body;
  } else {
    // Old format: apiRequest(endpoint, { method, body })
    endpoint = endpointOrMethod;
    method = requestConfigOrEndpoint.method;
    requestBody = requestConfigOrEndpoint.body;
  }

  // Construct the full URL by combining the base origin with the endpoint.
  const url = `${window.location.origin}${endpoint}`;

  devLog(`[API Request] ${method} ${url}`);
  if (requestBody && method !== "GET") {
    devLog(`[API Request Body]`, JSON.stringify(requestBody, null, 2));
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (requestBody && method !== "GET") {
    const serializedBody = JSON.stringify(requestBody);
    devLog(`[API Serialized Body]`, serializedBody);
    options.body = serializedBody;
  }

  const response = await handleFetch(url, options); // Use handleFetch for CSRF token injection

  devLog(`[API Response] ${method} ${url} - Status: ${response.status} ${response.statusText}`);
  devLog(`[API Response Headers]`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    // Log the response text for debugging before throwing error
    const responseText = await response.text();
    devError(`[API Error Response Text]`, responseText);

    // Try to parse as JSON first, fallback to plain text
    let errorMessage;
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson.message || responseText;
    } catch {
      errorMessage = responseText || response.statusText;
    }

    // Get user-friendly error message
    const friendlyMessage = getUserFriendlyErrorMessage(response.status, errorMessage);
    throw new HttpError(friendlyMessage, response.status);
  }

  // For 204 No Content responses, return null instead of trying to parse JSON
  if (response.status === 204) {
    devLog(`[API Response Text]`, '(empty - 204 No Content)');
    return null as T;
  }

  // Get response text first to log it
  const responseText = await response.text();
  devLog(`[API Response Text]`, responseText);

  // If response is empty, return null
  if (!responseText.trim()) {
    return null as T;
  }

  // Try to parse as JSON
  try {
    return JSON.parse(responseText);
  } catch (error) {
    const err = error as Error;
    devError(`[API JSON Parse Error]`, err);
    devError(`[API Response that failed to parse]`, responseText);
    throw new SyntaxError(`Failed to parse JSON response: ${err.message}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Re-enable for data freshness
      staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s before refetching
      gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache for 5min
      retry: 1, // Retry once on failure
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Don't show toast for 401s as they are handled by auth logic
      // and don't show toast if explicitly disabled for this query
      const isUnauthorized = error instanceof HttpError && error.status === 401;
      const isSilent = query.meta?.silent || query.options.meta?.silent;
      
      if (isUnauthorized || isSilent) {
        return;
      }

      toast({
        title: "Query Failed",
        description: error.message || "An error occurred while fetching data",
        variant: "destructive",
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Don't show toast if explicitly disabled for this mutation
      if (mutation.meta?.silent || mutation.options.meta?.silent) {
        return;
      }

      toast({
        title: "Action Failed",
        description: error.message || "An error occurred while performing this action",
        variant: "destructive",
      });
    },
  }),
});

// Logout helper function that properly clears all state
export async function performLogout(): Promise<void> {
  try {
    // Use handleFetch to include CSRF token
    const response = await handleFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Clear local state regardless of response
    clearCsrfToken();
    queryClient.clear();
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      // Redirect to the appropriate location
      // For Replit Auth, redirect to OIDC logout endpoint
      // For local auth, redirect to home
      window.location.href = data.redirectTo || '/';
    } else {
      // Server-side logout failed, try the direct OIDC logout endpoint as fallback
      console.error('Logout API failed, redirecting to fallback logout endpoint');
      window.location.href = '/api/logout';
    }
  } catch (error) {
    // On any error, still clear local state and try fallback redirect
    console.error('Logout error:', error);
    clearCsrfToken();
    queryClient.clear();
    // Use OIDC logout endpoint as fallback
    window.location.href = '/api/logout';
  }
}