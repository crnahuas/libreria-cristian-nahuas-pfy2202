export function selectCategory(categories, categoryId) {
  return categories?.find((category) => category.id === categoryId);
}

export function selectCategoryName(categories, categoryId) {
  return (
    selectCategory(categories, categoryId)?.name ||
    categoryId?.replaceAll("-", " ") ||
    "Sin categoría"
  );
}
