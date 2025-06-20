import { API_ENDPOINTS } from "../config.js";

// 슬라이더 기능
let currentSlide = 0;
const totalSlides = 5;
const sliderContainer = document.getElementById("sliderContainer");
const indicators = document.querySelectorAll(".indicator");

function moveSlide(direction) {
  currentSlide += direction;

  if (currentSlide >= totalSlides) {
    currentSlide = 0;
  } else if (currentSlide < 0) {
    currentSlide = totalSlides - 1;
  }

  updateSlider();
}

// 특정 슬라이드로 이동
function goToSlide(slideIndex) {
  currentSlide = slideIndex;
  updateSlider();
}

function updateSlider() {
  const translateX = -currentSlide * 20;
  sliderContainer.style.transform = `translateX(${translateX}%)`;

  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === currentSlide);
  });
}

setInterval(() => {
  moveSlide(1);
}, 5000);

// 슬라이드 버튼
document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.querySelector(".slider-nav.prev");
  const nextBtn = document.querySelector(".slider-nav.next");
  const indicators = document.querySelectorAll(".indicator");

  prevBtn.addEventListener("click", () => moveSlide(-1));
  nextBtn.addEventListener("click", () => moveSlide(1));

  indicators.forEach((btn, index) => {
    btn.addEventListener("click", () => goToSlide(index));
  });
});

// API에서 상품 데이터를 가져오는 함수
async function fetchProducts() {
  try {
    const response = await fetch(API_ENDPOINTS.PRODUCTS);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      renderProducts(data.results);
    } else {
      showNoProducts();
    }
  } catch (error) {
    console.error("상품을 가져오는 중에 문제가 생겼습니다.", error);
    showError();
  }
}

// 📦 DOM API
function renderProducts(products) {
  const productsGrid = document.getElementById("productsGrid");

  const loadingState = document.getElementById("loadingState");
  if (loadingState) loadingState.remove();

  const reversedProducts = [...products].reverse();

  reversedProducts.forEach((product) => {
    const productItem = document.createElement("li");

    const productCard = document.createElement("article");
    productCard.className = "product-card";

    const productLink = document.createElement("a");
    productLink.href = `/productDetail.html?id=${product.id}`;
    productLink.className = "product-link";
    productLink.setAttribute("aria-label", `${product.name} 상품 상세보기`);

    const productImg = document.createElement("img");
    productImg.src = product.image;
    productImg.alt = product.name;
    productImg.className = "product-image";
    productImg.loading = "lazy";
    productImg.onerror = function () {
      this.src =
        "https://via.placeholder.com/280x220/f0f0f0/999?text=이미지+없음";
    };

    const productInfo = document.createElement("div");
    productInfo.className = "product-info";

    const sellerName = document.createElement("p");
    sellerName.className = "seller-name";
    sellerName.textContent =
      product.seller.store_name ||
      product.seller.name ||
      product.seller.username;

    const productName = document.createElement("h3");
    productName.className = "product-name";
    productName.textContent = product.name;

    const productPrice = document.createElement("p");
    productPrice.className = "product-price";
    productPrice.innerHTML = `
      ${product.price.toLocaleString()}
      <span class="price-won">원</span>
    `;
    productInfo.appendChild(sellerName);
    productInfo.appendChild(productName);
    productInfo.appendChild(productPrice);

    productLink.appendChild(productImg);
    productLink.appendChild(productInfo);
    productCard.appendChild(productLink);

    productItem.appendChild(productCard);
    productsGrid.appendChild(productItem);
  });

  console.log(`총 ${products.length}개의 상품 로드`);
}

// 상품이 하나도 없을 때
function showNoProducts() {
  const productsGrid = document.getElementById("productsGrid");
  const loadingState = document.getElementById("loadingState");

  if (loadingState) {
    loadingState.remove();
  }

  const noProductsMessage = document.createElement("li");
  noProductsMessage.className = "loading";
  noProductsMessage.textContent =
    "아직 등록된 상품이 없습니다. 조금 후에 다시 확인해주세요!";
  productsGrid.appendChild(noProductsMessage);
}

// 웹페이지가 완전히 로드되면 상품을 가져옴
document.addEventListener("DOMContentLoaded", function () {
  fetchProducts();
});
