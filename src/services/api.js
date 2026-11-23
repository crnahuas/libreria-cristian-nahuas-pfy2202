export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiUrl(path, scenario = "normal") {
  const base =
    import.meta.env.VITE_API_URL ||
    new URL(`${import.meta.env.BASE_URL}api/`, window.location.href).href;
  const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
  if (scenario !== "normal") url.searchParams.set("scenario", scenario);
  return url;
}

export async function getResource(
  path,
  { signal, scenario = "normal", validate } = {},
) {
  if (typeof validate !== "function") {
    throw new TypeError("La consulta requiere un validador de respuesta.");
  }
  try {
    const response = await fetch(apiUrl(path, scenario), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const message =
        response.status === 404
          ? "No encontramos el recurso solicitado (404). Puedes volver al catálogo o reintentar."
          : response.status >= 500
            ? "El servicio tiene un problema temporal (500). Intenta cargar los datos nuevamente."
            : `No se pudo completar la consulta (${response.status}). Intenta nuevamente.`;
      throw new ApiError(message, response.status);
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        "La respuesta del servicio no es válida. Intenta nuevamente.",
      );
    }
    if (!validate(data)) {
      throw new ApiError(
        "Los datos recibidos están incompletos. Intenta cargar el contenido nuevamente.",
      );
    }
    return data;
  } catch (error) {
    if (
      signal?.aborted ||
      error.name === "AbortError" ||
      error instanceof ApiError
    )
      throw error;
    throw new ApiError(
      "No pudimos conectar con el servicio. Revisa tu conexión y vuelve a intentarlo.",
    );
  }
}
