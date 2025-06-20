export function createFooter() {
  const footer = document.createElement("footer");

  const container = document.createElement("div");
  container.className = "footer-container";

  const footerTop = document.createElement("div");
  footerTop.className = "footer-top";

  // 📌 네비게이션
  const nav = document.createElement("nav");
  nav.className = "footer-nav";

  const navList = document.createElement("ul");

  const navLinks = [
    { href: "#", text: "호두샵 소개" },
    { href: "#", text: "이용약관" },
    { href: "#", text: "개인정보처리방침", spanClass: "personal-data" },
    { href: "#", text: "전자금융거래약관" },
    { href: "#", text: "청소년보호정책" },
    { href: "#", text: "제휴문의" },
  ];

  navLinks.forEach(({ href, text, spanClass }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.className = "footer-link";

    if (spanClass) {
      const span = document.createElement("span");
      span.className = spanClass;
      span.textContent = text;
      a.appendChild(span);
    } else {
      a.textContent = text;
    }

    li.appendChild(a);
    navList.appendChild(li);
  });

  nav.appendChild(navList);

  // 📌 소셜 링크
  const socialList = document.createElement("ul");
  socialList.className = "social-links";

  const socialLinks = [
    {
      href: "https://instagram.com/hodu",
      icon: "images/icon-insta.svg",
      label: "인스타그램으로 이동",
    },
    {
      href: "https://facebook.com/hodu",
      icon: "images/icon-fb.svg",
      label: "페이스북으로 이동",
    },
    {
      href: "https://youtube.com/hodu",
      icon: "images/icon-yt.svg",
      label: "유튜브로 이동",
    },
  ];

  socialLinks.forEach(({ href, icon, label }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.className = "social-link";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", label);

    const img = document.createElement("img");
    img.src = icon;
    img.alt = "";
    img.className = "social-icon";

    a.appendChild(img);
    li.appendChild(a);
    socialList.appendChild(li);
  });

  footerTop.appendChild(nav);
  footerTop.appendChild(socialList);

  // 📌 주소
  const address = document.createElement("address");
  address.className = "footer-bottom";

  const companyName = document.createElement("strong");
  companyName.className = "company-name";
  companyName.textContent = "(주)HODU SHOP";

  address.appendChild(companyName);
  address.appendChild(document.createElement("br"));
  address.append("제주특별자치도 제주시 동광고 137 제주코딩베이스캠프");
  address.appendChild(document.createElement("br"));
  address.append("사업자 번호 : 000-0000-0000 | 통신판매업");
  address.appendChild(document.createElement("br"));
  address.append("대표 : 김호두");

  container.appendChild(footerTop);
  container.appendChild(address);
  footer.appendChild(container);

  return footer;
}
