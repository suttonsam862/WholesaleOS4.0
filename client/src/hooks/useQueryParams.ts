import { useLocation } from "wouter";
import { useMemo } from "react";

export interface QueryParams {
  status?: string;
  filter?: string;
  type?: string;
  role?: string;
  stage?: string;
  [key: string]: string | undefined;
}

export function useQueryParams(): QueryParams {
  const [location] = useLocation();
  
  return useMemo(() => {
    const searchParams = new URLSearchParams(location.split("?")[1] || "");
    const params: QueryParams = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }, [location]);
}

export function buildUrl(basePath: string, params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function clearParams(basePath: string): string {
  return basePath.split("?")[0];
}
