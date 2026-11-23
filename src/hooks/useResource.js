import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getResource } from "../services/api.js";

export function useResource(
  path,
  { validate, enabled = true, scenario = "normal" } = {},
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [path, scenario],
    queryFn: ({ signal }) => getResource(path, { signal, scenario, validate }),
    enabled,
    staleTime: scenario === "normal" ? 5 * 60 * 1000 : 0,
  });
  const cached = client.getQueryData([path, "normal"]);
  const data = query.data ?? (query.isError ? cached : undefined);

  return {
    ...query,
    data,
    hasFallback: query.isError && data !== undefined,
    retry: query.refetch,
  };
}
