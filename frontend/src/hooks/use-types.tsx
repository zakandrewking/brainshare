"use client";

import useSWR from "swr";

import { COLUMN_TYPES, type TypeDefinition } from "@/utils/column-types";
import { createClient, useUser } from "@/utils/supabase/client";

type UseTypesOptions = {
  revalidateIfStale?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
};

export function useCustomTypes(options?: UseTypesOptions) {
  const user = useUser();
  const supabase = createClient();

  const { data: customTypes } = useSWR(
    user ? "/custom-types" : null,
    async () => {
      const { data, error } = await supabase
        .from("custom_type")
        .select("*")
        .or(`user_id.eq.${user!.id},public.is.true`);
      if (error) console.error("Failed to fetch custom types:", error);
      return (
        data?.map((type) => ({
          ...type,
          // supabase js does not handle (+/-)Infinity for us
          min_value:
            (type.min_value as any) === "-Infinity"
              ? -Infinity
              : type.min_value,
          max_value:
            (type.max_value as any) === "Infinity" ? Infinity : type.max_value,
          is_custom: true,
        })) || []
      );
    },
    {
      revalidateIfStale: options?.revalidateIfStale,
      revalidateOnFocus: options?.revalidateOnFocus,
      revalidateOnReconnect: options?.revalidateOnReconnect,
    }
  );
  return customTypes;
}

export function useAllTypes(
  options?: UseTypesOptions
): TypeDefinition[] | undefined {
  const customTypes = useCustomTypes(options);
  if (customTypes === undefined) return undefined;
  return [...COLUMN_TYPES, ...(customTypes || [])];
}
