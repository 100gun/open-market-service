console.log("404 Error: Page not found -", window.location.href);

// 뒤로가기 버튼
const backButton = document.getElementById("backButton");

if (backButton) {
  backButton.addEventListener("click", function () {
    if (window.history.length <= 1) {
      window.location.href = "/";
    } else {
      window.history.back();
    }
  });
}
