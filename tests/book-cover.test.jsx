import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookCover from "../src/components/BookCover.jsx";

describe("Portadas remotas y alternativa local", () => {
  it("muestra la portada recibida por REST y recupera título y autor si falla", () => {
    const book = {
      id: "ejemplo",
      title: "Frankenstein",
      author: "Mary Shelley",
      coverImage:
        "https://covers.openlibrary.org/b/id/15266215-L.jpg?default=false",
    };
    const { container, rerender } = render(<BookCover book={book} />);
    expect(container.querySelector("img").src).toBe(book.coverImage);
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Frankenstein")).toBeTruthy();
    expect(screen.getByText("Mary Shelley")).toBeTruthy();
    const next = {
      ...book,
      coverImage:
        "https://covers.openlibrary.org/b/id/12356249-L.jpg?default=false",
    };
    rerender(<BookCover book={next} />);
    expect(container.querySelector("img").src).toBe(next.coverImage);
  });
});
