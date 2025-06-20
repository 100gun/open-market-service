import { icons } from "../icon-library.js";

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

  const mypageButton = document.querySelector("#mypageButton");
  const userDropdown = document.querySelector("#userDropdown");
  const menuItem = mypageButton?.closest(".menu-item"); // 부모 menu-item 요소 찾기

  console.log("마이페이지 버튼:", mypageButton);
  console.log("드롭다운 메뉴:", userDropdown);
  console.log("메뉴 아이템:", menuItem);

  if (mypageButton && userDropdown && menuItem) {
    mypageButton.addEventListener("click", function (e) {
      console.log("🎯 마이페이지 버튼 클릭됨!");
      e.preventDefault();
      e.stopPropagation();

      const isActive = menuItem.classList.contains("active");

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

    document.addEventListener("click", function (e) {
      if (!menuItem.contains(e.target) && !userDropdown.contains(e.target)) {
        menuItem.classList.remove("active");
        userDropdown.classList.remove("show");
        mypageButton.setAttribute("aria-expanded", "false");
      }
    });

    userDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
}

// 📌 로그아웃
function handleLogout() {
  if (confirm("로그아웃 하시겠습니까?")) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");

    updateHeader();

    if (
      window.location.pathname === "/" ||
      window.location.pathname.includes("./index.html")
    ) {
      window.location.reload();
    } else {
      window.location.href = "./index.html";
    }
  }
}

// 📌 헤더 업데이트
function updateHeader() {
  const headerElement = document.getElementById("header");

  if (!headerElement) {
    return;
  }

  headerElement.innerHTML = "";

  const newHeader = createHeader();
  headerElement.appendChild(newHeader);

  const WAIT_TIME = 100; // 브라우저 > 새 요소 준비할 시간
  setTimeout(initializeHeaderEvents, WAIT_TIME);
}

// 📌 로그인 상태에 따른 메뉴 변화
function createUserButton() {
  const isUserLoggedIn = isLoggedIn();

  if (isUserLoggedIn) {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item user-menu-dropdown";

    const button = document.createElement("button");
    button.className = "user-menu-button";
    button.setAttribute("aria-label", "마이페이지 메뉴 열기");
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

    const mypageItem = document.createElement("button");
    mypageItem.className = "dropdown-item";
    mypageItem.textContent = "마이페이지";

    const logoutItem = document.createElement("button");
    logoutItem.className = "dropdown-item logout-btn";
    logoutItem.textContent = "로그아웃";
    logoutItem.addEventListener("click", handleLogout);

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
  cartLink.href = "#";
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
export function createHeader() {
  const header = document.createElement("header");
  header.className = "header";
  header.setAttribute("role", "banner");

  const headerContainer = document.createElement("div");
  headerContainer.className = "header-container";

  const headerWrap = document.createElement("div");
  headerWrap.className = "header-wrap";

  const logoHeading = document.createElement("h1");

  const logoLink = document.createElement("a");
  logoLink.href = "/";
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

  // 브라우저 > 새 요소 준비할 시간
  setTimeout(() => {
    initializeHeaderEvents();
  }, 100);

  return header;
}

window.handleLogout = handleLogout;
window.updateHeader = updateHeader;
window.initializeHeaderEvents = initializeHeaderEvents;

window.addEventListener("loginSuccess", function (e) {
  console.log("로그인 성공 이벤트 감지:", e.detail);
  updateHeader();
});
