import { Link } from "react-router";
import { useScenarioResource } from "../hooks/useScenarioResource.js";
import { isCategoryList } from "../services/validators.js";
import usePageTitle from "../hooks/usePageTitle.js";
import RequestState from "../components/RequestState.jsx";
import ServiceControls from "../components/ServiceControls.jsx";
import StateArt from "../components/StateArt.jsx";
import CategoryImage from "../components/CategoryImage.jsx";

export default function Categories() {
  usePageTitle("Categorías");
  const categories = useScenarioResource("categories", {
    validate: isCategoryList,
  });
  return (
    <div className="wrap page-content">
      <p className="breadcrumbs">
        <Link to="/">Inicio</Link> / Categorías
      </p>
      <div className="page-heading">
        <h1>Categorías</h1>
        <p>Encuentra tu género y consulta los libros disponibles.</p>
      </div>
      <section
        aria-label="Categorías disponibles"
        aria-busy={categories.isFetching}
      >
        <RequestState resource={categories} label="las categorías" />
        {categories.data?.length === 0 && !categories.isFetching && (
          <div className="empty-state">
            <StateArt kind="empty" />
            <h2>No hay categorías disponibles</h2>
            <p>Vuelve a consultar el servicio o explora todos los libros.</p>
            <button className="button" onClick={categories.retry}>
              Reintentar
            </button>
          </div>
        )}
        <div className="category-grid">
          {categories.data?.map((category) => (
            <Link
              className={`category-card ${category.accent}`}
              key={category.id}
              to={`/categorias/${category.id}`}
            >
              <CategoryImage category={category} />
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <span className="category-cta">Explorar libros</span>
            </Link>
          ))}
        </div>
        <ServiceControls resource={categories} />
      </section>
    </div>
  );
}
