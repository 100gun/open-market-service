export const API_BASE_URL = "https://api.wenivops.co.kr/services/open-market";

export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/products/`,
  LOGIN: `${API_BASE_URL}/accounts/login/`,
  PRODUCT_DETAIL:
    "https://api.wenivops.co.kr/services/open-market/products/<int:product_id>/",
  SELLER_SIGNUP: `${API_BASE_URL}/accounts/seller/signup/`,
  BUYER_SIGNUP: `${API_BASE_URL}/accounts/buyer/signup/`,
  VALIDATE_BUSINESS_NUMBER: `${API_BASE_URL}/accounts/seller/validate-registration-number/`,
};
