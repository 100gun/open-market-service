import { API_ENDPOINTS } from "../config.js";

// API 유틸리티 함수 수정
const apiUtils = {
  // 기본 fetch 래퍼
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      console.log("API 요청:", url, config);
      const response = await fetch(url, config);
      const data = await response.json();
      console.log("API 응답:", response.status, data);
      return { response, data };
    } catch (error) {
      console.error("API 요청 실패:", error);
      throw error;
    }
  },

  // 사업자등록번호 검증
  async validateBusinessNumber(businessNumber) {
    try {
      const { response, data } = await this.request(
        API_ENDPOINTS.VALIDATE_BUSINESS_NUMBER,
        {
          method: "POST",
          body: JSON.stringify({
            company_registration_number: businessNumber,
          }),
        }
      );

      if (response.ok && data.message) {
        return { isValid: true, message: data.message };
      } else if (data.error) {
        return { isValid: false, message: data.error };
      } else {
        return { isValid: false, message: "검증 중 오류가 발생했습니다." };
      }
    } catch (error) {
      console.error("사업자등록번호 검증 에러:", error);
      return { isValid: false, message: "검증 중 오류가 발생했습니다." };
    }
  },

  // 아이디 중복확인 - 구매자용과 판매자용 분리
  async checkUserIdDuplicate(userId, userType = "seller") {
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const uniqueId = timestamp + randomString;

      let testData;
      let endpoint;

      if (userType === "buyer") {
        testData = {
          username: userId,
          password: "TempPass123a",
          name: `temp_${uniqueId}`,
          phone_number: `010${String(
            Math.floor(Math.random() * 100000000)
          ).padStart(8, "0")}`,
        };
        endpoint = API_ENDPOINTS.BUYER_SIGNUP;
      } else {
        testData = {
          username: userId,
          password: "TempPass123a",
          name: `temp_${uniqueId}`,
          phone_number: `010${String(
            Math.floor(Math.random() * 100000000)
          ).padStart(8, "0")}`,
          company_registration_number: String(
            Math.floor(Math.random() * 10000000000)
          ).padStart(10, "0"),
          store_name: `temp_store_${uniqueId}`,
        };
        endpoint = API_ENDPOINTS.SELLER_SIGNUP;
      }

      console.log("중복확인 테스트 데이터:", testData);

      const { response, data } = await this.request(endpoint, {
        method: "POST",
        body: JSON.stringify(testData),
      });

      console.log("중복확인 API 응답:", response.status, data);

      // 400 에러인 경우 에러 내용 분석
      if (response.status === 400 && data) {
        // username 필드에 에러가 있는지 확인
        if (data.username && Array.isArray(data.username)) {
          const usernameErrors = data.username;
          console.log("Username 에러들:", usernameErrors);

          // 각 에러 메시지를 확인하여 중복 관련 에러인지 판단
          for (const error of usernameErrors) {
            console.log("에러 메시지 분석:", error);

            // 중복 관련 에러 체크 (더 정확한 패턴 매칭)
            if (
              error.includes("이미 존재") ||
              error.includes("already exists") ||
              error.includes("이미 등록") ||
              error.includes("이미 사용") ||
              error.toLowerCase().includes("duplicate") ||
              error.toLowerCase().includes("already taken") ||
              (error.toLowerCase().includes("username") &&
                error.toLowerCase().includes("already")) ||
              (error.toLowerCase().includes("user") &&
                error.toLowerCase().includes("exists"))
            ) {
              console.log("중복 에러로 판단:", error);
              return {
                isDuplicate: true,
                message: "중복된 아이디입니다.",
              };
            }

            // 포맷 관련 에러 (길이, 특수문자 등)
            if (
              error.includes("길이") ||
              error.includes("문자") ||
              error.includes("특수문자") ||
              error.includes("영문") ||
              error.includes("숫자") ||
              error.toLowerCase().includes("length") ||
              error.toLowerCase().includes("character") ||
              error.toLowerCase().includes("invalid")
            ) {
              console.log("포맷 에러로 판단:", error);
              return {
                isDuplicate: false,
                isValid: false,
                message: error,
              };
            }
          }

          // username 에러가 있지만 중복/포맷 에러가 아닌 경우
          console.log("기타 username 에러:", usernameErrors);
          return {
            isDuplicate: false,
            isValid: false,
            message: usernameErrors[0], // 첫 번째 에러 메시지 사용
          };
        }

        // username 에러가 없으면 다른 필드 에러만 있는 것이므로 아이디는 사용 가능
        console.log("username 필드 에러 없음 - 사용 가능한 아이디");
        console.log("다른 필드 에러들:", data);
        return { isDuplicate: false, isValid: true };
      }

      // 200/201 성공 응답 (실제로 계정이 생성된 경우)
      if (response.status === 200 || response.status === 201) {
        console.warn(
          "예상치 못한 성공 응답 - 임시 계정이 생성됨, 아이디는 사용 가능"
        );
        return { isDuplicate: false, isValid: true };
      }

      // 500 등 서버 에러
      if (response.status >= 500) {
        console.error("서버 에러:", response.status, data);
        return {
          isDuplicate: false,
          isValid: false,
          message: "서버 오류로 중복확인을 할 수 없습니다.",
        };
      }

      // 기타 응답 상태 (401, 403 등)
      console.log("기타 응답 상태:", response.status, "- 사용 가능으로 처리");
      return { isDuplicate: false, isValid: true };
    } catch (error) {
      console.error("아이디 중복확인 에러:", error);
      return {
        isDuplicate: false,
        isValid: false,
        message: "네트워크 오류로 중복확인을 할 수 없습니다.",
      };
    }
  },

  // 전화번호 중복확인
  async checkPhoneNumberDuplicate(phoneNumber, userType = "buyer") {
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const uniqueId = timestamp + randomString;

      let testData;
      let endpoint;

      if (userType === "buyer") {
        testData = {
          username: `temp_${uniqueId}`,
          password: "TempPass123a",
          name: `temp_${uniqueId}`,
          phone_number: phoneNumber,
        };
        endpoint = API_ENDPOINTS.BUYER_SIGNUP;
      } else {
        testData = {
          username: `temp_${uniqueId}`,
          password: "TempPass123a",
          name: `temp_${uniqueId}`,
          phone_number: phoneNumber,
          company_registration_number: String(
            Math.floor(Math.random() * 10000000000)
          ).padStart(10, "0"),
          store_name: `temp_store_${uniqueId}`,
        };
        endpoint = API_ENDPOINTS.SELLER_SIGNUP;
      }

      console.log("전화번호 중복확인 테스트 데이터:", testData);

      const { response, data } = await this.request(endpoint, {
        method: "POST",
        body: JSON.stringify(testData),
      });

      console.log("전화번호 중복확인 API 응답:", response.status, data);

      if (response.status === 400 && data) {
        // phone_number 중복 체크
        if (data.phone_number && Array.isArray(data.phone_number)) {
          const phoneErrors = data.phone_number;

          const duplicateError = phoneErrors.find(
            (error) =>
              error.includes("이미 존재") ||
              error.includes("already exists") ||
              error.includes("이미 등록") ||
              error.toLowerCase().includes("duplicate")
          );

          if (duplicateError) {
            return {
              isDuplicate: true,
              message: "해당 전화번호는 이미 존재합니다.",
            };
          }

          const formatError = phoneErrors.find(
            (error) =>
              !error.includes("이미 존재") && !error.includes("already exists")
          );

          if (formatError) {
            return {
              isDuplicate: false,
              isValid: false,
              message: formatError,
            };
          }
        }

        console.log("phone_number 에러 없음 - 사용 가능한 전화번호");
        return { isDuplicate: false, isValid: true };
      }

      return { isDuplicate: false, isValid: true };
    } catch (error) {
      console.error("전화번호 중복확인 에러:", error);
      return {
        isDuplicate: false,
        isValid: false,
        message: "전화번호 확인 중 오류가 발생했습니다.",
      };
    }
  },

  // 구매자 회원가입
  async submitBuyerSignup(userData) {
    try {
      console.log("구매자 회원가입 데이터 검증:");
      console.log("- username:", userData.username);
      console.log("- password 길이:", userData.password.length);
      console.log("- password 영소문자:", /[a-z]/.test(userData.password));
      console.log("- password 숫자:", /\d/.test(userData.password));
      console.log("- phone_number 길이:", userData.phone_number.length);
      console.log(
        "- phone_number 형식:",
        /^010\d{8}$/.test(userData.phone_number)
      );

      const { response, data } = await this.request(
        API_ENDPOINTS.BUYER_SIGNUP,
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        return { success: true, data };
      } else {
        console.error("구매자 회원가입 실패:", data);
        return { success: false, errors: data };
      }
    } catch (error) {
      console.error("구매자 회원가입 API 에러:", error);
      return { success: false, error: "서버 연결에 실패했습니다." };
    }
  },

  // 판매자 회원가입
  async submitSellerSignup(userData) {
    try {
      console.log("판매자 회원가입 데이터 검증:");
      console.log("- username:", userData.username);
      console.log("- password 길이:", userData.password.length);
      console.log("- password 영소문자:", /[a-z]/.test(userData.password));
      console.log("- password 숫자:", /\d/.test(userData.password));
      console.log("- phone_number 길이:", userData.phone_number.length);
      console.log(
        "- phone_number 형식:",
        /^010\d{8}$/.test(userData.phone_number)
      );
      console.log(
        "- company_registration_number 길이:",
        userData.company_registration_number.length
      );

      const { response, data } = await this.request(
        API_ENDPOINTS.SELLER_SIGNUP,
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        return { success: true, data };
      } else {
        console.error("판매자 회원가입 실패:", data);
        return { success: false, errors: data };
      }
    } catch (error) {
      console.error("판매자 회원가입 API 에러:", error);
      return { success: false, error: "서버 연결에 실패했습니다." };
    }
  },
};

// HODU 회원가입 JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // DOM 요소들
  const buyerTab = document.getElementById("buyerTab");
  const sellerTab = document.getElementById("sellerTab");
  const sellerFields = document.querySelector(".seller-only-fields");
  const submitBtn = document.querySelector(".signup-submit-btn");
  const termsCheckbox = document.getElementById("terms");

  // 입력 필드들
  const userIdInput = document.getElementById("user-id");
  const passwordInput = document.getElementById("password");
  const passwordCheckInput = document.getElementById("password-check");
  const userNameInput = document.getElementById("user-name");
  const phoneMiddleInput = document.getElementById("phone-middle");
  const phoneLastInput = document.getElementById("phone-last");
  const phonePrefixSelect = document.getElementById("phone-prefix");
  const businessNumberInput = document.getElementById("business-number");
  const storeNameInput = document.getElementById("store-name");

  // 버튼들
  const duplicateBtn = document.querySelector(".signup-duplicate-btn");
  const businessValidateBtn = document.querySelectorAll(
    ".signup-duplicate-btn"
  )[1];

  // 메시지 요소들
  const userIdSuccess = document.getElementById("user-id-success");
  const businessNumberSuccess = document.getElementById(
    "business-number-success"
  );

  // 상태 변수들
  let currentUserType = "buyer";
  let isUserIdChecked = false;
  let isUserIdValid = false;
  let isBusinessNumberChecked = false;
  let isBusinessNumberValid = false;

  // 필드 터치 상태 추적 (사용자가 한 번이라도 필드를 건드렸는지)
  const fieldTouchedState = new Map();

  // 필수 입력 필드들
  const requiredFields = [
    { element: userIdInput, name: "아이디" },
    { element: passwordInput, name: "비밀번호" },
    { element: passwordCheckInput, name: "비밀번호 재확인" },
    { element: userNameInput, name: "이름" },
    { element: phoneMiddleInput, name: "휴대폰번호" },
    { element: phoneLastInput, name: "휴대폰번호" },
  ];

  // 필드가 터치되었는지 확인하는 함수
  function isFieldTouched(element) {
    return fieldTouchedState.get(element) || false;
  }

  // 필드 터치 상태 설정
  function setFieldTouched(element, touched = true) {
    fieldTouchedState.set(element, touched);
  }

  // 탭 전환 기능
  function switchTab(tabType) {
    if (tabType === "buyer") {
      buyerTab.classList.add("active");
      sellerTab.classList.remove("active");
      buyerTab.setAttribute("aria-selected", "true");
      sellerTab.setAttribute("aria-selected", "false");
      sellerFields.style.display = "none";
      currentUserType = "buyer";
    } else {
      sellerTab.classList.add("active");
      buyerTab.classList.remove("active");
      sellerTab.setAttribute("aria-selected", "true");
      buyerTab.setAttribute("aria-selected", "false");
      sellerFields.style.display = "block";
      currentUserType = "seller";
    }

    // 탭 전환 시 아이디 확인 상태 초기화
    isUserIdChecked = false;
    isUserIdValid = false;
    userIdSuccess.style.display = "none";
    hideError(userIdInput);

    // 탭 전환 시 터치 상태 초기화
    fieldTouchedState.clear();

    validateForm();
  }

  // 탭 클릭 이벤트
  buyerTab.addEventListener("click", () => switchTab("buyer"));
  sellerTab.addEventListener("click", () => switchTab("seller"));

  // 에러 메시지 표시
  function showError(inputElement, message) {
    hideError(inputElement);
    const errorMsg = document.createElement("p");
    errorMsg.className = "signup-error-msg";
    errorMsg.textContent = message;
    errorMsg.style.display = "block";

    if (
      inputElement.id === "phone-middle" ||
      inputElement.id === "phone-last"
    ) {
      const phoneGroup = inputElement.closest(".signup-phone-group");
      const formGroup = phoneGroup.closest(".signup-form-group");
      formGroup.appendChild(errorMsg);
    } else if (
      inputElement.parentNode.classList.contains("signup-input-with-button")
    ) {
      const formGroup = inputElement.closest(".signup-form-group");
      formGroup.appendChild(errorMsg);
    } else {
      inputElement.parentNode.insertBefore(errorMsg, inputElement.nextSibling);
    }
    inputElement.setAttribute("aria-invalid", "true");
  }

  // 에러 메시지 숨기기
  function hideError(inputElement) {
    const formGroup = inputElement.closest(".signup-form-group");
    if (formGroup) {
      const existingErrors = formGroup.querySelectorAll(".signup-error-msg");
      existingErrors.forEach((error) => error.remove());
    }
    inputElement.removeAttribute("aria-invalid");
  }

  // 비밀번호 유효성 검사
  function validatePassword(password) {
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= minLength && hasLowerCase && hasNumber;
  }

  // 비밀번호 확인
  function validatePasswordMatch() {
    const password = passwordInput.value;
    const passwordCheck = passwordCheckInput.value;

    // 비밀번호 확인 필드가 터치되었고 값이 있을 때만 검증
    if (isFieldTouched(passwordCheckInput) && passwordCheck) {
      hideError(passwordCheckInput);
      if (password !== passwordCheck) {
        showError(passwordCheckInput, "비밀번호가 일치하지 않습니다.");
        return false;
      }
    }
    return true;
  }

  // 전체 폼 유효성 검사 - 개선된 버전
  function validateForm() {
    let isValid = true;
    const fieldsToCheck =
      currentUserType === "seller"
        ? [
            ...requiredFields,
            { element: businessNumberInput, name: "사업자등록번호" },
            { element: storeNameInput, name: "스토어명" },
          ]
        : requiredFields;

    // 각 필드별로 개별 검증 (터치된 필드만)
    fieldsToCheck.forEach((field) => {
      // 필드가 터치되었고 비어있는 경우에만 에러 표시
      if (isFieldTouched(field.element) && !field.element.value.trim()) {
        showError(field.element, `필수 정보입니다.`);
        isValid = false;
      }
      // 필드가 비어있으면 (터치 여부 관계없이) 폼은 유효하지 않음
      else if (!field.element.value.trim()) {
        isValid = false;
      }
    });

    // 판매자인 경우 사업자등록번호 검증 체크 (입력되어 있을 때만)
    if (currentUserType === "seller" && businessNumberInput.value.trim()) {
      if (!isBusinessNumberChecked || !isBusinessNumberValid) {
        if (isFieldTouched(businessNumberInput)) {
          showError(businessNumberInput, "사업자등록번호 인증을 해주세요.");
        }
        isValid = false;
      }
    } else if (currentUserType === "seller") {
      isValid = false;
    }

    // 비밀번호 검증 (터치된 경우에만 에러 표시)
    if (passwordInput.value) {
      if (!validatePassword(passwordInput.value)) {
        if (isFieldTouched(passwordInput)) {
          showError(passwordInput, "8자 이상의 영소문자, 숫자를 포함해주세요.");
        }
        isValid = false;
      }
    } else {
      isValid = false;
    }

    // 비밀번호 확인 검증
    if (!validatePasswordMatch()) {
      isValid = false;
    }

    // 전화번호 검증 (터치된 경우에만 에러 표시)
    const phoneNumber =
      phonePrefixSelect.value + phoneMiddleInput.value + phoneLastInput.value;
    if (phoneMiddleInput.value || phoneLastInput.value) {
      if (phoneNumber.length !== 11) {
        if (
          isFieldTouched(phoneMiddleInput) ||
          isFieldTouched(phoneLastInput)
        ) {
          showError(phoneMiddleInput, "휴대폰번호는 11자리여야 합니다.");
        }
        isValid = false;
      }
    } else if (!phoneMiddleInput.value.trim() || !phoneLastInput.value.trim()) {
      isValid = false;
    }

    // 약관 동의 체크
    if (!termsCheckbox.checked) {
      isValid = false;
    }

    // 버튼 상태 업데이트
    if (isValid) {
      submitBtn.classList.add("active");
      submitBtn.disabled = false;
    } else {
      submitBtn.classList.remove("active");
      submitBtn.disabled = true;
    }
    return isValid;
  }

  // 각 입력 필드에 이벤트 추가 - 개선된 버전
  requiredFields.forEach((field) => {
    // input 이벤트 - 즉시 에러 숨김, 터치 상태 설정
    field.element.addEventListener("input", function () {
      setFieldTouched(this, true);
      hideError(this);

      if (this === userIdInput) {
        isUserIdChecked = false;
        isUserIdValid = false;
        userIdSuccess.style.display = "none";
      }

      validateForm();
    });

    // focus 이벤트 - 터치 상태 설정
    field.element.addEventListener("focus", function () {
      setFieldTouched(this, true);
      hideError(this);
    });

    // blur 이벤트 - 터치된 필드만 검증
    field.element.addEventListener("blur", function () {
      if (isFieldTouched(this)) {
        validateForm();
      }
    });
  });

  // 사업자등록번호와 스토어명에도 같은 이벤트 적용
  if (businessNumberInput) {
    businessNumberInput.addEventListener("input", function () {
      let value = this.value.replace(/[^0-9]/g, "");
      if (value.length > 10) value = value.slice(0, 10);
      this.value = value;

      setFieldTouched(this, true);
      isBusinessNumberChecked = false;
      isBusinessNumberValid = false;
      if (businessNumberSuccess) businessNumberSuccess.style.display = "none";
      hideError(this);
      validateForm();
    });

    businessNumberInput.addEventListener("focus", function () {
      setFieldTouched(this, true);
      hideError(this);
    });

    businessNumberInput.addEventListener("blur", function () {
      if (isFieldTouched(this)) {
        validateForm();
      }
    });
  }

  if (storeNameInput) {
    storeNameInput.addEventListener("input", function () {
      setFieldTouched(this, true);
      hideError(this);
      validateForm();
    });

    storeNameInput.addEventListener("focus", function () {
      setFieldTouched(this, true);
      hideError(this);
    });

    storeNameInput.addEventListener("blur", function () {
      if (isFieldTouched(this)) {
        validateForm();
      }
    });
  }

  // 전화번호 필드들에 대한 특별 처리
  [phoneMiddleInput, phoneLastInput].forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");

      setFieldTouched(phoneMiddleInput, true);
      setFieldTouched(phoneLastInput, true);

      // 전화번호 입력 시 기존 에러 메시지 제거
      hideError(phoneMiddleInput);
      hideError(phoneLastInput);

      validateForm();

      // 전화번호 완성 시 자동 중복확인
      if (
        phoneMiddleInput.value.length === 4 &&
        phoneLastInput.value.length === 4
      ) {
        setTimeout(() => checkPhoneNumberOnComplete(), 500);
      }
    });

    input.addEventListener("focus", function () {
      setFieldTouched(phoneMiddleInput, true);
      setFieldTouched(phoneLastInput, true);
      hideError(phoneMiddleInput);
      hideError(phoneLastInput);
    });

    input.addEventListener("blur", function () {
      if (isFieldTouched(phoneMiddleInput) || isFieldTouched(phoneLastInput)) {
        validateForm();
      }
    });
  });

  // 약관 체크박스 검증
  termsCheckbox.addEventListener("change", function () {
    validateForm();
  });

  // API 에러 처리
  function handleApiErrors(errorData) {
    Object.keys(errorData).forEach((field) => {
      const errorArray = errorData[field];
      if (Array.isArray(errorArray) && errorArray.length > 0) {
        const errorMessage = errorArray[0];
        switch (field) {
          case "username":
            showError(userIdInput, errorMessage);
            break;
          case "password":
            showError(passwordInput, errorMessage);
            break;
          case "name":
            showError(userNameInput, errorMessage);
            break;
          case "phone_number":
            showError(phoneMiddleInput, errorMessage);
            break;
          case "company_registration_number":
            showError(businessNumberInput, errorMessage);
            break;
          case "store_name":
            showError(storeNameInput, errorMessage);
            break;
        }
      }
    });
  }

  // 전화번호 입력 완료 시 자동 중복확인
  async function checkPhoneNumberOnComplete() {
    const phoneNumber =
      phonePrefixSelect.value + phoneMiddleInput.value + phoneLastInput.value;

    if (phoneNumber.length === 11 && phoneNumber.startsWith("010")) {
      try {
        const result = await apiUtils.checkPhoneNumberDuplicate(
          phoneNumber,
          currentUserType
        );
        if (result.isDuplicate) {
          showError(phoneMiddleInput, result.message);
        } else if (result.isValid === false) {
          showError(phoneMiddleInput, result.message);
        } else {
          hideError(phoneMiddleInput);
          hideError(phoneLastInput);
        }
      } catch (error) {
        console.error("전화번호 자동 체크 에러:", error);
      }
    }
  }

  // 아이디 중복확인
  duplicateBtn.addEventListener("click", async function () {
    const userId = userIdInput.value.trim();
    if (!userId) {
      setFieldTouched(userIdInput, true);
      showError(userIdInput, "아이디를 입력해주세요.");
      return;
    }
    if (userId.length < 4) {
      showError(userIdInput, "아이디는 4자 이상이어야 합니다.");
      return;
    }

    duplicateBtn.textContent = "확인중...";
    duplicateBtn.disabled = true;

    try {
      console.log("아이디 중복확인 시작:", userId, currentUserType);
      const result = await apiUtils.checkUserIdDuplicate(
        userId,
        currentUserType
      );

      console.log("중복확인 결과:", result);

      if (result.isDuplicate) {
        console.log("중복된 아이디 - 에러 표시");
        showError(userIdInput, "중복된 아이디입니다.");
        isUserIdValid = false;
        isUserIdChecked = true;
        userIdSuccess.style.display = "none";
      } else if (result.isValid === false) {
        console.log("포맷 에러 - 에러 표시");
        showError(userIdInput, result.message);
        isUserIdValid = false;
        isUserIdChecked = true;
        userIdSuccess.style.display = "none";
      } else {
        console.log("사용 가능한 아이디 - 성공 표시");
        hideError(userIdInput);
        userIdSuccess.style.display = "block";
        isUserIdValid = true;
        isUserIdChecked = true;
      }

      validateForm();
    } catch (error) {
      console.error("중복확인 오류:", error);
      showError(userIdInput, "중복확인 중 오류가 발생했습니다.");
      isUserIdValid = false;
      isUserIdChecked = false;
      userIdSuccess.style.display = "none";
    } finally {
      duplicateBtn.textContent = "중복확인";
      duplicateBtn.disabled = false;
    }
  });

  // 사업자등록번호 검증
  if (businessValidateBtn) {
    businessValidateBtn.addEventListener("click", async function () {
      const businessNumber = businessNumberInput.value.trim();
      if (!businessNumber) {
        setFieldTouched(businessNumberInput, true);
        showError(businessNumberInput, "사업자등록번호를 입력해주세요.");
        return;
      }
      if (businessNumber.length !== 10 || !/^\d{10}$/.test(businessNumber)) {
        showError(
          businessNumberInput,
          "사업자등록번호는 10자리 숫자여야 합니다."
        );
        return;
      }

      businessValidateBtn.textContent = "검증중...";
      businessValidateBtn.disabled = true;

      try {
        const result = await apiUtils.validateBusinessNumber(businessNumber);
        if (result.isValid) {
          hideError(businessNumberInput);
          if (businessNumberSuccess)
            businessNumberSuccess.style.display = "block";
          isBusinessNumberValid = true;
        } else {
          showError(businessNumberInput, result.message);
          isBusinessNumberValid = false;
          if (businessNumberSuccess)
            businessNumberSuccess.style.display = "none";
        }
        isBusinessNumberChecked = true;
        validateForm();
      } finally {
        businessValidateBtn.textContent = "인증";
        businessValidateBtn.disabled = false;
      }
    });
  }

  // 비밀번호 입력 이벤트 - 개선된 버전
  passwordInput.addEventListener("input", function () {
    setFieldTouched(this, true);
    hideError(this);

    // 입력 중일 때는 에러 표시하지 않고, blur 시에만 검증
    validatePasswordMatch();
    validateForm();
  });

  passwordInput.addEventListener("blur", function () {
    if (isFieldTouched(this) && this.value && !validatePassword(this.value)) {
      showError(this, "8자 이상의 영소문자, 숫자를 포함해주세요.");
    }
    validateForm();
  });

  passwordCheckInput.addEventListener("input", function () {
    setFieldTouched(this, true);
    hideError(this);
    validatePasswordMatch();
    validateForm();
  });

  // 전화번호 prefix 변경 시에도 체크
  phonePrefixSelect.addEventListener("change", function () {
    if (isFieldTouched(phoneMiddleInput) || isFieldTouched(phoneLastInput)) {
      hideError(phoneMiddleInput);
      hideError(phoneLastInput);
      validateForm();

      if (
        phoneMiddleInput.value.length === 4 &&
        phoneLastInput.value.length === 4
      ) {
        setTimeout(() => checkPhoneNumberOnComplete(), 500);
      }
    }
  });

  // 가입하기 버튼
  submitBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    // 제출 시 모든 필드를 터치된 것으로 처리하고 검증
    const allFields =
      currentUserType === "seller"
        ? [
            ...requiredFields,
            { element: businessNumberInput },
            { element: storeNameInput },
          ]
        : requiredFields;

    allFields.forEach((field) => {
      if (field.element) {
        setFieldTouched(field.element, true);
      }
    });

    if (!validateForm()) {
      alert("모든 필수 정보를 입력하고 약관에 동의해주세요.");
      return;
    }

    const phoneNumber =
      phonePrefixSelect.value + phoneMiddleInput.value + phoneLastInput.value;

    submitBtn.textContent = "가입 중...";
    submitBtn.disabled = true;

    try {
      if (currentUserType === "buyer") {
        const userData = {
          username: userIdInput.value.trim(),
          password: passwordInput.value,
          name: userNameInput.value.trim(),
          phone_number: phoneNumber,
        };

        const result = await apiUtils.submitBuyerSignup(userData);
        if (result.success) {
          alert("구매자 회원가입이 완료되었습니다!");
          window.location.href = "./index.html";
        } else {
          if (result.errors) {
            handleApiErrors(result.errors);
          } else {
            alert(result.error || "회원가입 중 오류가 발생했습니다.");
          }
        }
      } else {
        const userData = {
          username: userIdInput.value.trim(),
          password: passwordInput.value,
          name: userNameInput.value.trim(),
          phone_number: phoneNumber,
          company_registration_number: businessNumberInput.value.trim(),
          store_name: storeNameInput.value.trim(),
        };

        const result = await apiUtils.submitSellerSignup(userData);
        if (result.success) {
          alert("판매자 회원가입이 완료되었습니다!");
          window.location.href = "./index.html";
        } else {
          if (result.errors) {
            handleApiErrors(result.errors);
          } else {
            alert(result.error || "회원가입 중 오류가 발생했습니다.");
          }
        }
      }
    } finally {
      submitBtn.textContent = "가입하기";
      submitBtn.disabled = false;
      validateForm();
    }
  });

  // 초기 폼 검증
  validateForm();
});
