import useSWR from "swr";

import { invoke } from "../supabase";

export interface ApiKey {
  id: string;
  name: string;
  value: string;
}

export default function useApiKey(user_id: string | undefined) {
  const getApiKey = async (): Promise<ApiKey | null> => {
    try {
      return await invoke("api-key", "GET");
    } catch (error: any) {
      // ignore the error if the key doesn't exist yet
      if (error?.context?.status === 404) return null;
      else throw error;
    }
  };

  return useSWR(user_id ? `/functions/api-key/${user_id}` : null, getApiKey, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
