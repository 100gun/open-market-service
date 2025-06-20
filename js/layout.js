import { createHeader } from "./components/header.js";
import { createFooter } from "./components/footer.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 로드됨");

  const headerElement = document.getElementById("header");
  if (headerElement) {
    const headerContent = createHeader();
    headerElement.appendChild(headerContent);
    console.log("헤더 삽입 완료");
  } else {
    console.log("헤더 요소를 찾을 수 없음");
  }

  const footerElement = document.getElementById("footer");
  if (footerElement) {
    footerElement.replaceChildren(createFooter());
    console.log("푸터 삽입 완료");
  }
});
