import { API_ENDPOINTS } from "../config.js";

let currentLoginType = "buyer";

const LOGIN_ENDPOINT = API_ENDPOINTS.LOGIN;

// 📌 페이지 로드가 완료 > 메인 초기화 함수
document.addEventListener("DOMContentLoaded", function () {
  initializeLoginPage();
});

function initializeLoginPage() {
  const buyerTab = document.getElementById("buyerTab");
  const sellerTab = document.getElementById("sellerTab");
  const loginForm = document.getElementById("loginForm");
  const inputFields = document.querySelectorAll(".input-field");

  buyerTab.addEventListener("click", () => switchTab("buyer"));
  sellerTab.addEventListener("click", () => switchTab("seller"));

  loginForm.addEventListener("submit", handleLogin);

  inputFields.forEach((field) => {
    field.addEventListener("input", hideErrorMessage);
  });
}

// 📌 탭 관리
function switchTab(tabType) {
  const buyerTab = document.getElementById("buyerTab");
  const sellerTab = document.getElementById("sellerTab");

  if (tabType === "buyer") {
    buyerTab.classList.add("active");
    buyerTab.setAttribute("aria-selected", "true");
    sellerTab.classList.remove("active");
    sellerTab.setAttribute("aria-selected", "false");
    currentLoginType = "buyer";
  } else {
    sellerTab.classList.add("active");
    sellerTab.setAttribute("aria-selected", "true");
    buyerTab.classList.remove("active");
    buyerTab.setAttribute("aria-selected", "false");
    currentLoginType = "seller";
  }

  resetForm();
}

// 📌 로그인 처리
function handleLogin(event) {
  event.preventDefault();

  const userId = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!validateInputs(userId, password)) {
    return;
  }

  performLogin(userId, password);
}

// 📌 입력값 검증
function validateInputs(userId, password) {
  const userIdField = document.getElementById("userId");
  const passwordField = document.getElementById("password");

  if (!userId && !password) {
    showErrorMessage("아이디와 비밀번호를 입력해주세요.");
    userIdField.focus();
    return false;
  }

  if (!userId) {
    showErrorMessage("아이디를 입력해주세요.");
    userIdField.focus();
    return false;
  }

  if (!password) {
    showErrorMessage("비밀번호를 입력해주세요.");
    passwordField.focus();
    return false;
  }

  return true;
}

// 📌 실제 로그인 처리 함수
async function performLogin(userId, password) {
  const loginButton = document.querySelector(".login-btn");
  const originalButtonText = loginButton.textContent;

  loginButton.disabled = true;
  loginButton.textContent = "로그인 중...";

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: userId,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      handleLoginSuccess(data);
    } else {
      handleLoginFailure(data);
    }
  } catch (error) {
    showErrorMessage("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = originalButtonText;
  }
}

// 📌 로그인 성공
function handleLoginSuccess(data) {
  const { access, refresh, user } = data;
  const expectedUserType = currentLoginType === "buyer" ? "BUYER" : "SELLER";

  if (user.user_type !== expectedUserType) {
    const wrongTypeMessage =
      currentLoginType === "buyer"
        ? "구매회원 계정이 아닙니다. 판매회원 탭에서 로그인해주세요."
        : "판매회원 계정이 아닙니다. 구매회원 탭에서 로그인해주세요.";

    showErrorMessage(wrongTypeMessage);
    return;
  }

  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  localStorage.setItem("userInfo", JSON.stringify(user));

  window.dispatchEvent(new CustomEvent("loginSuccess", { detail: user }));

  alert(`${user.name}님, 로그인 성공!`);

  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
  } else {
    window.location.href = "./index.html";
  }
}

// ===== 유틸리티 함수 =====

function requireLogin(redirectUrl = "./login.html") {
  if (!isLoggedIn()) {
    alert("로그인이 필요한 서비스입니다.");
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

function handleLoginFailure(data) {
  const errorMessage =
    data.error || "아이디 또는 비밀번호가 일치하지 않습니다.";

  showErrorMessage(errorMessage);

  const passwordField = document.getElementById("password");
  passwordField.value = "";
  passwordField.focus();
}

// ===== 토큰 관리 함수 =====

function isLoggedIn() {
  const token = localStorage.getItem("accessToken");
  return token !== null && token !== "";
}

// 📌 로그아웃
function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userInfo");

  window.location.href = "./login.html";
}

function showErrorMessage(message) {
  const errorElement = document.getElementById("errorMessage");
  errorElement.textContent = message;
  errorElement.classList.add("show");
}

function hideErrorMessage() {
  const errorElement = document.getElementById("errorMessage");
  errorElement.classList.remove("show");
  errorElement.textContent = "";
}

function resetForm() {
  document.getElementById("loginForm").reset();
  hideErrorMessage();
}

// ===== 페이지 로드 시 로그인 상태 확인 =====
document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn()) {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (
      confirm(
        `${userInfo.name}님으로 이미 로그인되어 있습니다. 메인 페이지로 이동하시겠습니까?`
      )
    ) {
      window.location.href = "./product.html";
    }
  }
});
