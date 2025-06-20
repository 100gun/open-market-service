import { API_ENDPOINTS } from "../config.js";

let currentProduct = null;
let currentQuantity = 1;

document.addEventListener("DOMContentLoaded", function () {
  const productId = getProductIdFromURL();

  if (productId) {
    fetchProductDetail(productId);
  } else {
    showError("잘못된 상품 주소입니다.");
  }

  setupQuantityControls();
  setupTabNavigation();
});

// 📌 현재 웹페이지 주소에서 상품 ID를 추출
function getProductIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// 📌 API에서 상품 상세 정보 호출
async function fetchProductDetail(productId) {
  try {
    const apiUrl = API_ENDPOINTS.PRODUCT_DETAIL.replace(
      "<int:product_id>",
      productId
    );

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (response.ok && data.id) {
      currentProduct = data;
      renderProductDetail(data);
    } else {
      showError("상품을 찾을 수 없습니다.");
    }
  } catch (error) {
    showError("상품 정보를 불러오는 중에 문제가 발생했습니다.");
  }
}

// 📌 상품 정보
function renderProductDetail(product) {
  const productImage = document.querySelector(".detail-image img");
  if (productImage) {
    productImage.src = product.image;
    productImage.alt = product.name;
    productImage.onerror = function () {
      this.src = "./images/preparing-img.png";
      this.alt = "상품 이미지 준비 중";
    };
  }

  const storeName = document.querySelector(".detail-store-name");
  if (storeName) {
    storeName.textContent =
      product.seller.store_name ||
      product.seller.name ||
      product.seller.username;
  }

  const productTitle = document.querySelector(".detail-title");
  if (productTitle) {
    productTitle.textContent = product.name;
    document.title = `${product.name} - 상품 상세`;
  }

  const productPrice = document.querySelector(".detail-price");
  if (productPrice) {
    productPrice.innerHTML = `${product.price.toLocaleString()}<span class="detail-currency">원</span>`;
  }

  const shippingInfo = document.querySelector(".detail-shipping-info");
  if (shippingInfo) {
    const shippingText =
      product.shipping_method === "PARCEL" ? "택배배송" : "직접배송";
    const shippingFee =
      product.shipping_fee === 0
        ? "무료배송"
        : `${product.shipping_fee.toLocaleString()}원`;
    shippingInfo.textContent = `${shippingText} / ${shippingFee}`;
  }

  const quantityInput = document.getElementById("detail-quantity-input");
  if (quantityInput) {
    quantityInput.value = currentQuantity;
    quantityInput.max = product.stock;
  }

  updateTotalPrice();
}

// 📌 수량 조절 버튼 이벤트
function setupQuantityControls() {
  const minusBtn = document.querySelector(".detail-quantity-btn.minus");
  const plusBtn = document.querySelector(".detail-quantity-btn.plus");
  const quantityInput = document.getElementById("detail-quantity-input");

  if (minusBtn) {
    minusBtn.addEventListener("click", function () {
      decreaseQuantity();
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener("click", function () {
      increaseQuantity();
    });
  }

  // 📌 입력 필드에 직접 숫자를 입력하는 것 방지
  if (quantityInput) {
    quantityInput.addEventListener("keydown", function (e) {
      e.preventDefault();
    });

    quantityInput.addEventListener("paste", function (e) {
      e.preventDefault();
    });
  }
}

function decreaseQuantity() {
  if (currentQuantity > 1) {
    currentQuantity--;
    updateQuantityDisplay();
    updateTotalPrice();
  } else {
  }
}

function increaseQuantity() {
  if (currentProduct && currentQuantity < currentProduct.stock) {
    currentQuantity++;
    updateQuantityDisplay();
    updateTotalPrice();
  } else if (currentProduct) {
    alert(`이 상품의 최대 구매 가능 수량은 ${currentProduct.stock}개입니다.`);
  }
}

// 📌 화면 수량 표시 업데이트, 버튼 상태를 조절
function updateQuantityDisplay() {
  const quantityInput = document.getElementById("detail-quantity-input");
  if (quantityInput) {
    quantityInput.value = currentQuantity;
  }

  updateButtonStates();
}

// 📌 수량 조절 버튼 활성화/비활성화 상태
function updateButtonStates() {
  const minusBtn = document.querySelector(".detail-quantity-btn.minus");
  const plusBtn = document.querySelector(".detail-quantity-btn.plus");

  // - 버튼 비활성화: 수량이 1일 경우
  if (minusBtn) {
    if (currentQuantity <= 1) {
      minusBtn.disabled = true;
      minusBtn.style.opacity = "0.5";
      minusBtn.style.cursor = "not-allowed";
    } else {
      minusBtn.disabled = false;
      minusBtn.style.opacity = "1";
      minusBtn.style.cursor = "pointer";
    }
  }

  // + 버튼 비활성화: 재고와 구매 물건 숫자가 동일할 경우
  if (plusBtn && currentProduct) {
    if (currentQuantity >= currentProduct.stock) {
      plusBtn.disabled = true;
      plusBtn.style.opacity = "0.5";
      plusBtn.style.cursor = "not-allowed";
    } else {
      plusBtn.disabled = false;
      plusBtn.style.opacity = "1";
      plusBtn.style.cursor = "pointer";
    }
  }
}

// 📌 총 가격 계산
function updateTotalPrice() {
  if (!currentProduct) return;

  const totalAmount = currentProduct.price * currentQuantity;

  const totalQuantityElement = document.querySelector(".detail-total-num");
  if (totalQuantityElement) {
    totalQuantityElement.textContent = currentQuantity;
  }

  const totalAmountElement = document.querySelector(".detail-total-amount");
  if (totalAmountElement) {
    totalAmountElement.innerHTML = `${totalAmount.toLocaleString()}<span class="detail-currency">원</span>`;
  }
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".detail-tab-btn");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // 클릭된 탭으로 전환
      const targetTabId = this.getAttribute("aria-controls");
      switchTab(targetTabId, this);
    });
  });
}

// 📌 탭 전환
function switchTab(targetTabId, clickedButton) {
  const allTabButtons = document.querySelectorAll(".detail-tab-btn");
  allTabButtons.forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });

  clickedButton.classList.add("active");
  clickedButton.setAttribute("aria-selected", "true");

  const allTabPanels = document.querySelectorAll(".detail-tab-panel");
  allTabPanels.forEach((panel) => {
    panel.classList.remove("active");
    panel.style.display = "none";
  });

  const targetPanel = document.getElementById(targetTabId);
  if (targetPanel) {
    targetPanel.classList.add("active");
    targetPanel.style.display = "block";
  }
}

// 📌 오류 발생 시 표시
function showError(message) {
  const productPurchase = document.querySelector(".detail-purchase");
  if (!productPurchase) return;

  productPurchase.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.style.textAlign = "center";
  wrapper.style.padding = "4rem 2rem";

  // 오류 메시지 제목
  const title = document.createElement("h2");
  title.textContent = "상품 정보를 불러올 수 없습니다!";
  title.style.color = "var(--point-txt-color)";
  title.style.marginBottom = "3rem";
  title.style.fontSize = "3.6rem";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  paragraph.style.color = "#666";
  paragraph.style.marginBottom = "2rem";

  const button = document.createElement("button");
  button.textContent = "다시 시도하기";
  button.style.background = "var(--main-color)";
  button.style.color = "white";
  button.style.border = "none";
  button.style.padding = "1rem 2rem";
  button.style.borderRadius = "0.5rem";
  button.style.cursor = "pointer";
  button.style.fontSize = "1.4rem";
  button.addEventListener("click", () => {
    location.reload();
  });

  wrapper.appendChild(title);
  wrapper.appendChild(paragraph);
  wrapper.appendChild(button);

  productPurchase.appendChild(wrapper);
}
