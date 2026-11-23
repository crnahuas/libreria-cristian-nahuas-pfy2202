import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { useResource } from "../hooks/useResource.js";

const scenarios = new Set(["normal", "404", "500", "network", "slow", "empty"]);

export function useDevelopmentResource(
  path,
  { allowEmpty = true, ...options } = {},
) {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const requested = params.get("scenario");
  const scenario =
    scenarios.has(requested) && (allowEmpty || requested !== "empty")
      ? requested
      : "normal";
  const resource = useResource(path, { ...options, scenario });

  function changeScenario(next) {
    if (!scenarios.has(next) || (!allowEmpty && next === "empty")) return;
    if (next === scenario) {
      resource.refetch();
      return;
    }
    client.invalidateQueries({
      queryKey: [path, next],
      exact: true,
      refetchType: "none",
    });
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === "normal") updated.delete("scenario");
        else updated.set("scenario", next);
        return updated;
      },
      { replace: true },
    );
  }

  return {
    ...resource,
    scenario,
    changeScenario,
    retry: () => changeScenario("normal"),
  };
}
