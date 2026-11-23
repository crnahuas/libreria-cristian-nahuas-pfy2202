import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { useResource } from "../hooks/useResource.js";
import { useScenarioResource } from "../hooks/useScenarioResource.js";
import { isBookList, isCategoryList } from "../services/validators.js";
import { selectCategory, selectCategoryName } from "../selectors/categories.js";
import usePageTitle from "../hooks/usePageTitle.js";
import BookCard from "../components/BookCard.jsx";
import RequestState from "../components/RequestState.jsx";
import ServiceControls from "../components/ServiceControls.jsx";
import StateArt from "../components/StateArt.jsx";

const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export default function Catalog() {
  const { categoryId } = useParams();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const urlSearch = params.get("q") || "";
  const [search, setSearch] = useState(urlSearch);
  const sort = params.get("sort") || "default";
  const categories = useResource("categories", { validate: isCategoryList });
  const books = useScenarioResource(
    categoryId ? `books?category=${encodeURIComponent(categoryId)}` : "books",
    { validate: isBookList },
  );
  const category = selectCategory(categories.data, categoryId);
  const title = categoryId
    ? selectCategoryName(categories.data, categoryId)
    : "Todos los libros";

  // Recupera la búsqueda al navegar, incluidos Atrás y Adelante.
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch, pathname]);

  // El campo filtra de inmediato; la URL se actualiza al terminar de escribir.
  useEffect(() => {
    if (search === urlSearch) return;
    const timeout = setTimeout(() => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (search) updated.set("q", search);
          else updated.delete("q");
          return updated;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, urlSearch, pathname, setParams]);

  const visibleBooks = useMemo(() => {
    const term = normalize(search.trim());
    const filtered = books.data?.filter((book) =>
      normalize(`${book.title} ${book.author}`).includes(term),
    );
    if (sort === "price-asc") filtered?.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") filtered?.sort((a, b) => b.price - a.price);
    if (sort === "title")
      filtered?.sort((a, b) => a.title.localeCompare(b.title, "es"));
    return filtered;
  }, [books.data, search, sort]);

  function updateParam(key, value) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (value && value !== "default") updated.set(key, value);
        else updated.delete(key);
        return updated;
      },
      { replace: true },
    );
  }
  usePageTitle(title);
  return (
    <div className="wrap page-content">
      <p className="breadcrumbs">
        <Link to="/">Inicio</Link> / <Link to="/catalogo">Catálogo</Link>
        {categoryId && <> / {selectCategoryName(categories.data, categoryId)}</>}
      </p>
      <div className="page-heading">
        <h1>{title}</h1>
        <p>
          {category?.description ||
            "Elige por título, autor o categoría. Los precios están en pesos chilenos."}
        </p>
      </div>
      <div className="catalog-layout">
        <aside
          className="category-sidebar"
          aria-label="Filtrar libros por categoría"
        >
          <h2>Categorías</h2>
          <RequestState resource={categories} label="las categorías" />
          <nav aria-label="Categorías de libros">
            <Link
              to="/catalogo"
              aria-current={!categoryId ? "page" : undefined}
            >
              Todos los libros
            </Link>
            {categories.data?.map((item) => (
              <Link
                key={item.id}
                to={`/categorias/${item.id}`}
                aria-current={categoryId === item.id ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          {categories.data?.length === 0 && (
            <p>No hay categorías disponibles.</p>
          )}
        </aside>
        <section aria-label="Libros disponibles" aria-busy={books.isFetching}>
          <div className="catalog-toolbar">
            <p>
              {books.data
                ? `${visibleBooks.length} ${visibleBooks.length === 1 ? "libro" : "libros"}`
                : "Consultando catálogo"}
            </p>
            <div className="catalog-sort">
              <label htmlFor="book-sort">Ordenar</label>
              <select
                id="book-sort"
                value={sort}
                onChange={(event) => updateParam("sort", event.target.value)}
              >
                <option value="default">Orden original</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="title">Título: A–Z</option>
              </select>
            </div>
            <button
              className="text-link"
              onClick={() => books.refetch()}
              disabled={books.isFetching}
            >
              Actualizar
            </button>
          </div>
          <div className="catalog-search">
            <label htmlFor="catalog-search">
              Buscar en{" "}
              {categoryId
                ? selectCategoryName(categories.data, categoryId)
                : "el catálogo"}
            </label>
            <input
              id="catalog-search"
              type="search"
              placeholder="Escribe un título o autor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button className="text-link" onClick={() => setSearch("")}>
                Limpiar búsqueda
              </button>
            )}
          </div>
          <RequestState resource={books} label="los libros" />
          {visibleBooks?.length === 0 && !books.isFetching && (
            <div className="empty-state">
              <StateArt kind="empty" />
              <h2>
                {search
                  ? "No encontramos ese libro"
                  : "No hay libros en esta categoría"}
              </h2>
              <p>
                {search
                  ? "Prueba con otro título o con el nombre del autor."
                  : "Puedes consultar otra categoría o ver el catálogo completo."}
              </p>
              <Link className="button secondary" to="/catalogo">
                Ver todos los libros
              </Link>
            </div>
          )}
          <div className="book-grid">
            {visibleBooks?.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                categoryName={selectCategoryName(
                  categories.data,
                  book.categoryId,
                )}
              />
            ))}
          </div>
          <ServiceControls resource={books} />
        </section>
      </div>
    </div>
  );
}
