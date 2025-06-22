import { API_ENDPOINTS } from "../config.js";
import { updateHeader } from "../components/header.js";

let currentLoginType = "buyer";

const LOGIN_ENDPOINT = API_ENDPOINTS.LOGIN;

// 📌 페이지 로드가 완료 > 메인 초기화 함수
document.addEventListener("DOMContentLoaded", function () {
  initializeLoginPage();
  checkExistingLogin(); // 기존 로그인 확인을 별도 함수로 분리
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

// 📌 기존 로그인 상태 확인 (분리된 함수)
function checkExistingLogin() {
  if (isLoggedIn()) {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (
      confirm(
        `${userInfo.name}님으로 이미 로그인되어 있습니다. 메인 페이지로 이동하시겠습니까?`
      )
    ) {
      window.location.href = "./index.html";
    }
  }
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

    let data = {};
    try {
      // 204 또는 응답이 비어있을 수 있으므로 대비
      if (response.status !== 204) {
        data = await response.json();
      }
    } catch (jsonError) {
      console.warn("❗ 응답 JSON 파싱 실패:", jsonError);
      showErrorMessage("응답 데이터 처리 중 오류가 발생했습니다.");
      return;
    }

    if (response.ok) {
      handleLoginSuccess(data);
    } else {
      handleLoginFailure(data);
    }
  } catch (error) {
    console.error("❌ 로그인 요청 실패:", error);
    showErrorMessage("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = originalButtonText;
  }
}

// 📌 로그인 성공
function handleLoginSuccess(data) {
  console.log("로그인 응답 데이터:", data); // 디버깅용

  // 응답 데이터 구조 확인
  if (!data || !data.user) {
    console.error("사용자 정보가 응답에 없습니다:", data);
    showErrorMessage("로그인 처리 중 오류가 발생했습니다.");
    return;
  }

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

  // 토큰과 사용자 정보 저장
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  localStorage.setItem("userInfo", JSON.stringify(user));

  // 로그인 성공 플래그 설정
  sessionStorage.setItem("justLoggedIn", "true");

  alert(`${user.name}님, 로그인 성공!`);

  // 헤더 업데이트
  updateHeader();

  // 페이지 이동
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
  } else {
    window.location.href = "./index.html";
  }
}

// 📌 로그인 실패
function handleLoginFailure(data) {
  console.log("로그인 실패 데이터:", data); // 디버깅용

  const errorMessage =
    data.error || data.message || "아이디 또는 비밀번호가 일치하지 않습니다.";

  showErrorMessage(errorMessage);

  const passwordField = document.getElementById("password");
  passwordField.value = "";
  passwordField.focus();
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
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
}

function hideErrorMessage() {
  const errorElement = document.getElementById("errorMessage");
  if (errorElement) {
    errorElement.classList.remove("show");
    errorElement.textContent = "";
  }
}

function resetForm() {
  document.getElementById("loginForm").reset();
  hideErrorMessage();
}
