import { Link } from "react-router";
import BookCover from "./BookCover.jsx";
import { formatPrice } from "../utils/formatPrice.js";

export default function BookCard({ book, categoryName }) {
  return (
    <article className="book-card">
      <Link
        className="cover-link"
        tabIndex={-1}
        aria-hidden="true"
        to={`/libros/${book.id}`}
      >
        <BookCover book={book} />
      </Link>
      <p className="book-category">{categoryName}</p>
      <h2>
        <Link to={`/libros/${book.id}`}>{book.title}</Link>
      </h2>
      <p className="book-author">{book.author}</p>
      <div className="book-card-bottom">
        <p className="book-price">
          {formatPrice(book.price)} <span>CLP</span>
        </p>
        <Link
          className="book-card-link"
          to={`/libros/${book.id}`}
          aria-label={`Ver libro: ${book.title}`}
        >
          Ver libro
        </Link>
      </div>
    </article>
  );
}
