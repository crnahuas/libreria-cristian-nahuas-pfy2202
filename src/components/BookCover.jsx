import { useState } from "react";

export default function BookCover({ book, large = false }) {
  const [failedImage, setFailedImage] = useState(null);
  const showImage = book.coverImage && failedImage !== book.coverImage;
  return (
    <div
      aria-hidden="true"
      className={`book-cover ${book.accent || "wine"} ${book.title.length > 40 ? "long-title" : ""} ${large ? "large" : ""} ${showImage ? "book-cover--image" : ""}`}
    >
      {showImage ? (
        <img
          src={book.coverImage}
          alt=""
          loading={large ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedImage(book.coverImage)}
        />
      ) : (
        <>
          <span className="cover-author">{book.author}</span>
          <span className="cover-title">{book.title}</span>
          <span className="cover-art" />
          <span className="cover-publisher">entre líneas</span>
        </>
      )}
    </div>
  );
}

