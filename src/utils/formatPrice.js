const priceFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
});

export const formatPrice = (price) => priceFormatter.format(price);
