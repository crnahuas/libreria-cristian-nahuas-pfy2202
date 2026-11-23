import { http, HttpResponse, delay } from "msw";
import { books, categories } from "./data.js";

// El comodín admite la raíz y las rutas bajo subdirectorios.
async function simulate(request) {
  const scenario = new URL(request.url).searchParams.get("scenario");
  await delay(
    scenario === "slow" ? 2500 : import.meta.env.MODE === "test" ? 0 : 450,
  );
  if (scenario === "network") return HttpResponse.error();
  if (scenario === "404" || scenario === "500") {
    return HttpResponse.json(
      {
        message:
          scenario === "404"
            ? "Recurso no encontrado."
            : "El servicio no está disponible temporalmente.",
      },
      { status: Number(scenario) },
    );
  }
  if (scenario === "empty") return HttpResponse.json([]);
  return null;
}

export const handlers = [
  http.get("*/api/categories", async ({ request }) => {
    return (await simulate(request)) ?? HttpResponse.json(categories);
  }),
  http.get("*/api/books", async ({ request }) => {
    const simulated = await simulate(request);
    if (simulated) return simulated;
    const params = new URL(request.url).searchParams;
    const category = params.get("category");
    if (category && !categories.some((item) => item.id === category)) {
      return HttpResponse.json(
        { message: "La categoría no existe." },
        { status: 404 },
      );
    }
    const limit = params.get("limit");
    if (
      limit !== null &&
      (!/^\d+$/.test(limit) ||
        Number(limit) < 1 ||
        !Number.isSafeInteger(Number(limit)))
    ) {
      return HttpResponse.json(
        { message: "El límite debe ser un entero positivo." },
        { status: 400 },
      );
    }
    const filtered = category
      ? books.filter((book) => book.categoryId === category)
      : books;
    return HttpResponse.json(
      limit === null ? filtered : filtered.slice(0, Number(limit)),
    );
  }),
  http.get("*/api/books/:bookId", async ({ request, params }) => {
    const simulated = await simulate(request);
    if (simulated) return simulated;
    const book = books.find((item) => item.id === params.bookId);
    return book
      ? HttpResponse.json(book)
      : HttpResponse.json({ message: "El libro no existe." }, { status: 404 });
  }),
];
