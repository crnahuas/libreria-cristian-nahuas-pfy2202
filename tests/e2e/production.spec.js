import { test, expect } from "@playwright/test";

test("inicio obtiene solo cuatro libros y las categorías", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes("/api/")) requests.push(`${url.pathname}${url.search}`);
  });
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(page.locator(".category-links a")).toHaveCount(6);
  expect(requests.sort()).toEqual(["/api/books?limit=4", "/api/categories"]);
});

test("la búsqueda difiere la URL sin consultas adicionales y respeta el historial", async ({ page }) => {
  let bookRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/api/books")) bookRequests++;
  });
  await page.goto("/#/catalogo?source=prueba");
  await expect(page.getByRole("link", { name: "Desolación", exact: true })).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Buscar en el catálogo" });
  await search.fill("desolacion");
  await expect(page.getByRole("article")).toHaveCount(1);
  expect(page.url()).not.toContain("q=");
  await page.getByLabel("Ordenar").selectOption("price-asc");
  await expect(page).toHaveURL(/q=desolacion/);
  expect(page.url()).toContain("source=prueba");
  expect(page.url()).toContain("sort=price-asc");
  const filteredUrl = page.url();
  await page.getByRole("searchbox", { name: "Título o autor" }).fill("Mary Shelley");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(search).toHaveValue("Mary Shelley");
  await expect(page.getByRole("link", { name: "Frankenstein", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(filteredUrl);
  await expect(search).toHaveValue("desolacion");
  await expect(page.getByRole("link", { name: "Desolación", exact: true })).toBeVisible();
  await page.goForward();
  await expect(search).toHaveValue("Mary Shelley");
  await expect(page.getByRole("link", { name: "Frankenstein", exact: true })).toBeVisible();
  expect(bookRequests).toBe(1);
});

test("oculta la simulación e ignora escenarios de la URL en producción", async ({ page }) => {
  const scenarios = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes("/api/")) scenarios.push(url.searchParams.get("scenario"));
  });
  for (const [route, heading] of [
    ["catalogo", "Todos los libros"],
    ["categorias", "Categorías"],
    ["libros/frankenstein", "Frankenstein"],
  ]) {
    await page.goto(`/#/${route}?scenario=500`);
    await expect(page.getByRole("heading", { name: heading, exact: true, level: 1 })).toBeVisible();
    await expect(page.getByText("Probar estados del servicio", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Respuesta de la API")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  await expect(page.getByRole("link", { name: "Ver más de Ciencia ficción" })).toBeVisible();
  expect(scenarios.length).toBeGreaterThan(0);
  expect(scenarios.every((scenario) => scenario === null)).toBe(true);
});

test("un detalle inexistente solo consulta el libro y permite reintentar", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.includes("/api/")) requests.push(path);
  });
  await page.goto("/#/libros/no-existe");
  await expect(page.getByRole("alert")).toContainText("404");
  await expect(page.getByRole("alert")).toHaveCount(1);
  expect(requests).toEqual(["/api/books/no-existe"]);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect.poll(() => requests.length).toBe(2);
  await expect(page.getByRole("alert")).toContainText("404");
  expect(requests).toEqual(["/api/books/no-existe", "/api/books/no-existe"]);
  await expect(page.getByRole("link", { name: "Volver al catálogo" })).toBeVisible();
});
