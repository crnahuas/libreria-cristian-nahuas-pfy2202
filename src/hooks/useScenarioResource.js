import { useDevelopmentResource } from "../dev/useDevelopmentResource.js";
import { useResource } from "./useResource.js";

// Vite elimina la herramienta de simulación del build de producción.
export const useScenarioResource = import.meta.env.DEV
  ? useDevelopmentResource
  : useResource;
