import { icons } from "../icon-library.js";

let isHeaderUpdating = false;
let globalClickListener = null; // 전역 클릭 리스너 관리

// 📌 로그인 확인
function isLoggedIn() {
  try {
    const token = localStorage.getItem("accessToken");
    return token !== null && token !== "";
  } catch (e) {
    console.warn("localStorage 접근 실패:", e);
    return false;
  }
}

// 📌 사용자 정보 호출
function getUserInfo() {
  try {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (e) {
    console.warn("localStorage 접근 실패:", e);
    return null;
  }
}

// 📌 헤더 버튼 클릭 이벤트
function initializeHeaderEvents() {
  console.log("=== 헤더 이벤트 초기화 시작 ===");

  // 기존 전역 클릭 리스너 제거
  if (globalClickListener) {
    document.removeEventListener("click", globalClickListener);
    globalClickListener = null;
  }

  const mypageButton = document.querySelector("#mypageButton");
  const userDropdown = document.querySelector("#userDropdown");
  const menuItem = mypageButton?.closest(".menu-item");

  console.log("마이페이지 버튼:", mypageButton);
  console.log("드롭다운 메뉴:", userDropdown);
  console.log("메뉴 아이템:", menuItem);

  if (mypageButton && userDropdown && menuItem) {
    // 마이페이지 버튼 클릭 이벤트
    mypageButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isActive = menuItem.classList.contains("active");

      // 모든 드롭다운 닫기
      document.querySelectorAll(".menu-item.active").forEach((item) => {
        if (item !== menuItem) {
          item.classList.remove("active");
        }
      });
      document.querySelectorAll(".dropdown-menu.show").forEach((dropdown) => {
        if (dropdown !== userDropdown) {
          dropdown.classList.remove("show");
        }
      });

      // 현재 드롭다운 토글
      if (isActive) {
        menuItem.classList.remove("active");
        userDropdown.classList.remove("show");
        mypageButton.setAttribute("aria-expanded", "false");
      } else {
        menuItem.classList.add("active");
        userDropdown.classList.add("show");
        mypageButton.setAttribute("aria-expanded", "true");
      }
    });

    // 전역 클릭 리스너 (드롭다운 외부 클릭 시 닫기)
    globalClickListener = function (e) {
      if (!menuItem.contains(e.target)) {
        menuItem.classList.remove("active");
        userDropdown.classList.remove("show");
        mypageButton.setAttribute("aria-expanded", "false");
      }
    };

    document.addEventListener("click", globalClickListener);

    // 드롭다운 내부 클릭 시 이벤트 버블링 방지
    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // 로그아웃 버튼 이벤트
    const logoutBtn = userDropdown.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        handleLogout();
      });
    }

    // 마이페이지 버튼 이벤트
    const mypageBtn = userDropdown.querySelector(
      ".dropdown-item:not(.logout-btn)"
    );
    if (mypageBtn) {
      mypageBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        // 마이페이지로 이동
        window.location.href = "./mypage.html";
      });
    }
  }
}

// 📌 로그아웃
function handleLogout() {
  if (confirm("로그아웃 하시겠습니까?")) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");

    // 헤더 업데이트
    updateHeader();

    // 페이지 이동 처리
    if (
      window.location.pathname === "/" ||
      window.location.pathname.includes("index.html")
    ) {
      window.location.reload();
    } else {
      window.location.href = "./index.html";
    }
  }
}

// 📌 헤더 업데이트
function updateHeader() {
  if (isHeaderUpdating) {
    return;
  }

  isHeaderUpdating = true;

  const headerElement = document.getElementById("header");

  if (!headerElement) {
    return;
  }

  // 기존 전역 리스너 정리
  if (globalClickListener) {
    document.removeEventListener("click", globalClickListener);
    globalClickListener = null;
  }

  // 기존 헤더 내용 제거
  headerElement.innerHTML = "";

  // 새 헤더 생성
  const newHeader = createHeader();
  headerElement.appendChild(newHeader);

  // 이벤트 초기화를 위한 딜레이
  setTimeout(() => {
    initializeHeaderEvents();
    isHeaderUpdating = false;
  }, 150);
}

// 📌 로그인 상태에 따른 메뉴 변화
function createUserButton() {
  const isUserLoggedIn = isLoggedIn();

  if (isUserLoggedIn) {
    const userInfo = getUserInfo();
    const userName = userInfo ? userInfo.name : "사용자";

    const menuItem = document.createElement("div");
    menuItem.className = "menu-item user-menu-dropdown";

    const button = document.createElement("button");
    button.className = "user-menu-button";
    button.setAttribute("aria-label", "마이페이지 메뉴 열기");
    button.setAttribute("aria-expanded", "false");
    button.id = "mypageButton";

    const defaultIcon = document.createElement("span");
    defaultIcon.className = "user-icon icon-default";
    defaultIcon.innerHTML = icons.user;

    const hoverIcon = defaultIcon.cloneNode(true);
    hoverIcon.className = "user-icon icon-hover";

    const menuText = document.createElement("span");
    menuText.className = "menu-text";
    menuText.textContent = "마이페이지";

    button.appendChild(defaultIcon);
    button.appendChild(hoverIcon);
    button.appendChild(menuText);

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "dropdown-menu";
    dropdownMenu.id = "userDropdown";

    // 사용자 인사말 추가
    const userGreeting = document.createElement("div");
    userGreeting.className = "user-greeting";
    userGreeting.textContent = `${userName}님`;
    userGreeting.style.padding = "8px 16px";
    userGreeting.style.borderBottom = "1px solid #eee";
    userGreeting.style.fontWeight = "bold";

    const mypageItem = document.createElement("button");
    mypageItem.className = "dropdown-item";
    mypageItem.textContent = "마이페이지";

    const logoutItem = document.createElement("button");
    logoutItem.className = "dropdown-item logout-btn";
    logoutItem.textContent = "로그아웃";

    dropdownMenu.appendChild(userGreeting);
    dropdownMenu.appendChild(mypageItem);
    dropdownMenu.appendChild(logoutItem);

    menuItem.appendChild(button);
    menuItem.appendChild(dropdownMenu);

    return menuItem;
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "./login.html";
    loginLink.className = "menu-item";
    loginLink.setAttribute("aria-label", "로그인 페이지로 이동");

    const defaultIcon = document.createElement("span");
    defaultIcon.className = "user-icon icon-default";
    defaultIcon.innerHTML = icons.user;

    const hoverIcon = defaultIcon.cloneNode(true);
    hoverIcon.className = "user-icon icon-hover";

    const menuText = document.createElement("span");
    menuText.className = "menu-text";
    menuText.textContent = "로그인";

    loginLink.appendChild(defaultIcon);
    loginLink.appendChild(hoverIcon);
    loginLink.appendChild(menuText);

    return loginLink;
  }
}

// 📌 검색
function createSearchSection() {
  const searchSection = document.createElement("section");
  searchSection.className = "search-section";
  searchSection.setAttribute("role", "search");
  searchSection.setAttribute("aria-label", "상품 검색");

  const searchForm = document.createElement("form");
  searchForm.className = "search-form";
  searchForm.action = "#";
  searchForm.method = "get";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "search-input";
  searchInput.name = "query";
  searchInput.placeholder = "상품을 검색해보세요!";
  searchInput.setAttribute("aria-label", "검색어 입력");
  searchInput.autocomplete = "off";

  const searchButton = document.createElement("button");
  searchButton.type = "submit";
  searchButton.className = "search-button";
  searchButton.setAttribute("aria-label", "검색 실행");

  const searchIcon = document.createElement("img");
  searchIcon.src = "images/search.png";
  searchIcon.alt = "";

  searchButton.appendChild(searchIcon);
  searchForm.appendChild(searchInput);
  searchForm.appendChild(searchButton);
  searchSection.appendChild(searchForm);

  return searchSection;
}

function createUserMenu() {
  const userMenu = document.createElement("nav");
  userMenu.className = "user-menu";
  userMenu.setAttribute("role", "navigation");
  userMenu.setAttribute("aria-label", "사용자 메뉴");

  const cartLink = document.createElement("a");
  cartLink.href = "./cart.html";
  cartLink.className = "menu-item";
  cartLink.setAttribute("aria-label", "장바구니 페이지로 이동");

  const cartDefaultIcon = document.createElement("span");
  cartDefaultIcon.className = "icon-default";
  cartDefaultIcon.innerHTML = icons.cart;

  const cartHoverIcon = cartDefaultIcon.cloneNode(true);
  cartHoverIcon.className = "icon-hover";

  const cartText = document.createElement("span");
  cartText.className = "menu-text";
  cartText.textContent = "장바구니";

  cartLink.appendChild(cartDefaultIcon);
  cartLink.appendChild(cartHoverIcon);
  cartLink.appendChild(cartText);

  const userButton = createUserButton();
  userMenu.appendChild(cartLink);
  userMenu.appendChild(userButton);

  return userMenu;
}

// 📌 전체 헤더 만들기
function createHeader() {
  const header = document.createElement("header");
  header.className = "header";
  header.setAttribute("role", "banner");

  const headerContainer = document.createElement("div");
  headerContainer.className = "header-container";

  const headerWrap = document.createElement("div");
  headerWrap.className = "header-wrap";

  const logoHeading = document.createElement("h1");

  const logoLink = document.createElement("a");
  logoLink.href = "./index.html";
  logoLink.className = "logo";
  logoLink.setAttribute("aria-label", "HODU 홈페이지로 이동");

  const logoImg = document.createElement("img");
  logoImg.className = "top-logo";
  logoImg.src = "images/Logo-hodu.png";
  logoImg.alt = "HODU";

  logoLink.appendChild(logoImg);
  logoHeading.appendChild(logoLink);

  const searchSection = createSearchSection();

  headerWrap.appendChild(logoHeading);
  headerWrap.appendChild(searchSection);

  const userMenu = createUserMenu();

  headerContainer.appendChild(headerWrap);
  headerContainer.appendChild(userMenu);

  header.appendChild(headerContainer);

  return header;
}

// 전역 함수로 노출
window.handleLogout = handleLogout;
window.updateHeader = updateHeader;
window.initializeHeaderEvents = initializeHeaderEvents;

// 📌 초기 헤더 로드 (중복 실행 방지)
let headerInitialized = false;

document.addEventListener("DOMContentLoaded", function () {
  if (!headerInitialized) {
    headerInitialized = true;
    setTimeout(() => {
      updateHeader();
    }, 50);
  }
});

// 페이지 표시 시 헤더 업데이트 (뒤로가기 등)
window.addEventListener("pageshow", function (event) {
  if (event.persisted && !isHeaderUpdating) {
    updateHeader();
  }
});

export { updateHeader, createHeader };
