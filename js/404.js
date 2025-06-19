console.log("404 Error: Page not found -", window.location.href);

// 뒤로가기 버튼
const backButton = document.querySelector(".btn-secondary");
if (backButton && window.history.length <= 1) {
  backButton.textContent = "이전 페이지";
  backButton.onclick = () => (window.location.href = "/");
}
