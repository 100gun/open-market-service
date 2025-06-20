export const API_BASE_URL = "https://api.wenivops.co.kr/services/open-market";

export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/products/`,
  LOGIN: `${API_BASE_URL}/accounts/login/`,
  PRODUCT_DETAIL:
    "https://api.wenivops.co.kr/services/open-market/products/<int:product_id>/",
};
