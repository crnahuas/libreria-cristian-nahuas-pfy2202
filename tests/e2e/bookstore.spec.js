import { test, expect } from "@playwright/test";

const shots = "evidencias/capturas";
async function capture(page, options) {
  // El recorrido completo muestra también las portadas que normalmente se cargan al deslizar.
  await page
    .locator(".book-cover img, .category-image img")
    .evaluateAll((images) =>
      images.forEach((image) => {
        image.loading = "eager";
      }),
    );
  await page.waitForFunction(
    () =>
      [
        ...document.querySelectorAll(".book-cover img, .category-image img"),
      ].every((image) => image.complete),
    null,
    { timeout: 20000 },
  );
  await page.screenshot(options);
}
test("mantiene la navegación arriba y el footer abajo sin cubrir el contenido", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Navegación principal" });
  for (const destination of [
    "Catálogo",
    "Categorías",
    "La librería",
    "Inicio",
  ]) {
    await menu.getByRole("link", { name: destination, exact: true }).click();
    await expect(
      menu.getByRole("link", { name: destination, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("main")).toBeFocused();
  }
  // Navegar desde el pie de una página larga también recupera el inicio completo.
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Sobre la librería" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sobre Entre Líneas", level: 1 }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/#/pagina-inexistente");
    await expect(
      page.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByRole("contentinfo")
          .evaluate((footer) =>
            Math.round(
              footer.getBoundingClientRect().bottom +
                window.scrollY -
                document.documentElement.scrollHeight,
            ),
          ),
      )
      .toBe(0);
  }
  await page.goto("/#/catalogo");
  await expect(
    page.getByRole("link", { name: "Desolación", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.querySelector("footer").getBoundingClientRect().top >=
        document.querySelector("main").getBoundingClientRect().bottom - 1,
    ),
  ).toBe(true);
});
test("permite buscar, ordenar por precio y navegar a 320 px sin repetir la consulta", async ({
  page,
}) => {
  let bookRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/api/books")) bookRequests++;
  });
  await page.goto("/#/catalogo");
  await expect(
    page.getByRole("link", { name: "Desolación", exact: true }),
  ).toBeVisible();
  // StrictMode puede iniciar y cancelar una consulta durante el montaje en desarrollo.
  const initialBookRequests = bookRequests;
  await page
    .getByRole("searchbox", { name: "Buscar en el catálogo" })
    .fill("desolacion");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Desolación", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await page.getByLabel("Ordenar").selectOption("price-asc");
  await expect(
    page.getByRole("article").first().getByRole("heading"),
  ).toHaveText("La máquina del tiempo");
  await page
    .getByRole("searchbox", { name: "Título o autor" })
    .fill("Gabriela Mistral");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Desolación", exact: true }),
  ).toBeVisible();
  expect(bookRequests).toBe(initialBookRequests);
  await page.setViewportSize({ width: 320, height: 780 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Entre Líneas, inicio" }).click();
  await expect(
    page.getByRole("heading", { name: /¿Qué te gustaría/, level: 1 }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("recorre el catálogo, prueba errores y genera evidencias en escritorio", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /¿Qué te gustaría/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/01-inicio-escritorio.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Explorar el catálogo" }).click();
  await expect(
    page.getByRole("heading", { name: "Todos los libros", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/02-catalogo-escritorio.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Ciencia ficción", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Ciencia ficción" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Frankenstein", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toHaveCount(0);
  await capture(page, {
    path: `${shots}/03-filtro-categoria.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Frankenstein", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Frankenstein", exact: true, level: 1 }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/04-detalle-libro.png`,
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Categorías", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ficción", exact: true }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/05-categorias-rest.png`,
    fullPage: true,
  });
  await page.getByText("Probar estados del servicio", { exact: true }).click();
  await page.getByLabel("Respuesta de la API").selectOption("500");
  await expect(page.getByRole("alert")).toContainText("500");
  await expect(
    page.getByRole("heading", { name: "Ficción", exact: true }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/06-error-500-respaldo.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ficción", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Respuesta de la API").selectOption("404");
  await expect(page.getByRole("alert")).toContainText("404");
  await capture(page, { path: `${shots}/07-error-404.png`, fullPage: true });
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Respuesta de la API")).toBeEnabled();
  await page.getByLabel("Respuesta de la API").selectOption("network");
  await expect(page.getByRole("alert")).toContainText("Revisa tu conexión");
  await capture(page, {
    path: `${shots}/08-error-conexion.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Respuesta de la API")).toBeEnabled();
  await page.getByLabel("Respuesta de la API").selectOption("slow");
  await expect(page.getByRole("status")).toContainText(
    "Cargando las categorías",
  );
  await capture(page, {
    path: `${shots}/09-carga-lenta.png`,
    fullPage: true,
  });
  await expect(page.getByLabel("Respuesta de la API")).toBeEnabled();
  await page.getByLabel("Respuesta de la API").selectOption("empty");
  await expect(
    page.getByRole("heading", { name: "No hay categorías disponibles" }),
  ).toBeVisible();
  await page.getByLabel("Respuesta de la API").selectOption("normal");
  await expect(
    page.getByRole("heading", { name: "Ficción", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("link", { name: /Drama.*Explorar libros/ }).click();
  await expect(
    page.getByRole("heading", { name: "No hay libros en esta categoría" }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/10-categoria-vacia.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Drama" })).toBeVisible();
  await page.goto("/#/libros/no-existe");
  await expect(page.getByRole("alert")).toContainText("404");
  await capture(page, {
    path: `${shots}/11-libro-inexistente.png`,
    fullPage: true,
  });
  await page.goto("/#/ruta-inexistente");
  await expect(
    page.getByRole("heading", { name: "Página no encontrada" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("se adapta a móvil y tablet y conserva el foco por teclado", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /¿Qué te gustaría/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toBeVisible();
  await capture(page, {
    path: `${shots}/12-inicio-movil.png`,
    fullPage: true,
  });
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.getByRole("link", { name: "Explorar el catálogo" }).click();
  await expect(
    page.getByRole("heading", { name: "Todos los libros", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await capture(page, {
    path: `${shots}/13-catalogo-movil.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Orgullo y prejuicio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Orgullo y prejuicio",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await capture(page, {
    path: `${shots}/14-detalle-movil.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/#/catalogo");
  await expect(
    page.getByRole("link", { name: "Orgullo y prejuicio", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await capture(page, {
    path: `${shots}/15-catalogo-tablet.png`,
    fullPage: true,
  });
});
