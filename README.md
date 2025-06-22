# 🛒 HODU 오픈마켓
## 🏠 메인 페이지 (index.html + index.js) <br>
- API를 통한 전체 상품 목록 호출
- 로그인 여부에 따라 헤더 메뉴가 자동으로 업데이트<br>
(로컬스토리지에 저장된 토큰 기반 동작)

## 🧾 회원가입 / 로그인 (signup.html / login.html)
- 가입 시 이메일 중복 확인, 비밀번호 유효성 검사가 실시간으로 적용<br>
(input 이벤트 + fetch API 활용)
- 회원 타입(구매자/판매자)에 따라 API 요청 주소가 다르게 설정
- 로그인 성공 시 `accessToken`을 저장하고, 메인 페이지로 리디렉션

## 📄 상품 상세 페이지 (productDetail.html + productDetail.js)
- URL의 쿼리 스트링(?id=상품번호)을 읽어와 해당 상품 정보를 API에서 호출
- 사용자가 선택한 수량에 따라 총 금액이 자동으로 계산되며,
잘못된 입력 방지를 위한 최소/최대 수량 제한도 구현

## 🔧 공통 기능 및 구조
- 모듈화된 `JavaScript: components/header.js`, `layout.js` 등을 통해 헤더와 푸터가 모든 페이지에서 재사용되며 유지보수 용이
- SVG 아이콘과 유틸 구성: `icon-library.js`로 공통 아이콘을 불러오고, `config.js`로 API 주소를 관리해 유지보수성과 가독성을 높임
