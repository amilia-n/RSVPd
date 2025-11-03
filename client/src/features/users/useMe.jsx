import { useQuery } from "@tanstack/react-query";
import authApi from "../auth/auth.api";
import { queryKeys } from "@/utils/queryKeys";

export function useMe() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        const response = await authApi.me();
        return response.user || response;
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: data || null,
    isLoading,
    error,
    refetch,
  };
}