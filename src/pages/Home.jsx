import { Link } from "react-router";
import usePageTitle from "../hooks/usePageTitle.js";
import { useResource } from "../hooks/useResource.js";
import BookCard from "../components/BookCard.jsx";
import BookCover from "../components/BookCover.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { isBookList, isCategoryList } from "../services/validators.js";
import { selectCategoryName } from "../selectors/categories.js";
import RequestState from "../components/RequestState.jsx";

export default function Home() {
  usePageTitle("Inicio");
  const books = useResource("books?limit=4", { validate: isBookList });
  const categories = useResource("categories", { validate: isCategoryList });
  const featured = books.data?.[0];
  return (
    <div className="wrap home-page">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            ¿Qué te gustaría
            <br />
            <span>leer hoy?</span>
          </h1>
          <p>
            Novelas, poesía y ciencia ficción. Consulta las sinopsis y elige tu
            próximo libro.
          </p>
          <Link className="button" to="/catalogo">
            Explorar el catálogo
          </Link>
          <Link className="button secondary hero-secondary" to="/categorias">
            Prefiero buscar por categoría
          </Link>
        </div>
        {featured && (
          <Link
            className="hero-feature"
            to={`/libros/${featured.id}`}
            aria-label={`Ver ${featured.title}, de ${featured.author}`}
          >
            <div className="hero-cover">
              <BookCover book={featured} large />
            </div>
            <div className="hero-feature-caption">
              <div>
                <strong>{featured.title}</strong>
                <span>{featured.author}</span>
              </div>
              <span className="hero-feature-price">
                {formatPrice(featured.price)}
              </span>
            </div>
          </Link>
        )}
      </section>
      <section
        className="home-books"
        aria-labelledby="home-books-title"
        aria-busy={books.isFetching}
      >
        <div className="section-heading">
          <h2 id="home-books-title">Para empezar</h2>
          <Link className="text-link" to="/catalogo">
            Ver todos los libros
          </Link>
        </div>
        <RequestState resource={books} label="los libros" />
        <div className="book-grid home-book-grid">
          {books.data?.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              categoryName={selectCategoryName(categories.data, book.categoryId)}
            />
          ))}
        </div>
        {books.data?.length === 0 && (
          <p className="empty-state">El catálogo está vacío por el momento.</p>
        )}
      </section>
      <section
        className="home-categories"
        aria-labelledby="home-categories-title"
      >
        <div className="section-heading">
          <h2 id="home-categories-title">¿Tienes un género en mente?</h2>
          <Link className="text-link" to="/categorias">
            Ver categorías
          </Link>
        </div>
        <RequestState resource={categories} label="las categorías" />
        <div className="category-links">
          {categories.data?.map((category) => (
            <Link key={category.id} to={`/categorias/${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
