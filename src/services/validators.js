export const isCategory = (item) =>
  item !== null &&
  typeof item === "object" &&
  typeof item.id === "string" &&
  typeof item.name === "string" &&
  typeof item.description === "string";

export const isBook = (item) =>
  item !== null &&
  typeof item === "object" &&
  typeof item.id === "string" &&
  typeof item.title === "string" &&
  typeof item.author === "string" &&
  typeof item.categoryId === "string" &&
  Number.isFinite(item.price) &&
  item.price >= 0 &&
  typeof item.description === "string";

const listOf = (validate) => (data) =>
  Array.isArray(data) && data.every(validate);

export const isCategoryList = listOf(isCategory);
export const isBookList = listOf(isBook);
