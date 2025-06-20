import { createFooter } from "./components/footer.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 로드됨");

  const footerElement = document.getElementById("footer");
  if (footerElement) {
    footerElement.replaceChildren(createFooter());
    console.log("푸터 삽입 완료");
  }
});
