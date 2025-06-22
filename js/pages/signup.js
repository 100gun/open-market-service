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
      console.log("API 요청:", url, config); // 디버깅용
      const response = await fetch(url, config);
      const data = await response.json();
      console.log("API 응답:", response.status, data); // 디버깅용
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

  // 아이디 중복확인 - 더 안전한 버전
  async checkUserIdDuplicate(userId) {
    try {
      // 현재 시각과 랜덤값을 조합해서 고유값 생성
      const now = new Date();
      const uniqueSuffix =
        now.getTime().toString() + Math.random().toString(36).substr(2, 5);

      const testData = {
        username: userId,
        password: "testpass123a",
        name: "test" + uniqueSuffix,
        phone_number: "010" + uniqueSuffix.slice(-8).padStart(8, "0"),
        company_registration_number: uniqueSuffix
          .slice(0, 10)
          .padStart(10, "1"),
        store_name: "teststore" + uniqueSuffix,
      };

      console.log("중복확인 테스트 데이터:", testData); // 디버깅용

      const { response, data } = await this.request(
        API_ENDPOINTS.SELLER_SIGNUP,
        {
          method: "POST",
          body: JSON.stringify(testData),
        }
      );

      console.log("중복확인 응답:", response.status, data);

      // username 필드에 에러가 있는지 확인
      if (data.username && Array.isArray(data.username)) {
        const usernameError = data.username[0];
        if (
          usernameError.includes("이미 존재") ||
          usernameError.includes("already exists")
        ) {
          return {
            isDuplicate: true,
            message: "이미 사용중인 아이디입니다.",
          };
        } else {
          return {
            isDuplicate: false,
            isValid: false,
            message: usernameError,
          };
        }
      }

      // username 관련 에러가 없으면 사용 가능
      return { isDuplicate: false, isValid: true };
    } catch (error) {
      console.error("아이디 중복확인 에러:", error);
      return {
        isDuplicate: false,
        isValid: false,
        message: "중복확인 중 오류가 발생했습니다.",
      };
    }
  },

  // 판매자 회원가입 수정
  async submitSellerSignup(userData) {
    try {
      console.log("회원가입 데이터 검증:");
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
        console.error("회원가입 실패:", data);
        return { success: false, errors: data };
      }
    } catch (error) {
      console.error("회원가입 API 에러:", error);
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

  // 필수 입력 필드들
  const requiredFields = [
    { element: userIdInput, name: "아이디" },
    { element: passwordInput, name: "비밀번호" },
    { element: passwordCheckInput, name: "비밀번호 재확인" },
    { element: userNameInput, name: "이름" },
    { element: phoneMiddleInput, name: "휴대폰번호" },
    { element: phoneLastInput, name: "휴대폰번호" },
  ];

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
    hideError(passwordCheckInput);
    if (passwordCheck && password !== passwordCheck) {
      showError(passwordCheckInput, "비밀번호가 일치하지 않습니다.");
      return false;
    }
    return true;
  }

  // 전체 폼 유효성 검사
  function validateForm() {
    let isValid = true;
    const fieldsToCheck =
      currentUserType === "seller"
        ? [
            ...requiredFields,
            { element: businessNumberInput },
            { element: storeNameInput },
          ]
        : requiredFields;

    for (let field of fieldsToCheck) {
      if (!field.element.value.trim()) {
        isValid = false;
        break;
      }
    }

    if (!isUserIdChecked || !isUserIdValid) isValid = false;
    if (
      currentUserType === "seller" &&
      (!isBusinessNumberChecked || !isBusinessNumberValid)
    )
      isValid = false;
    if (!validatePassword(passwordInput.value)) isValid = false;
    if (!validatePasswordMatch()) isValid = false;
    if (!termsCheckbox.checked) isValid = false;

    if (isValid) {
      submitBtn.classList.add("active");
      submitBtn.disabled = false;
    } else {
      submitBtn.classList.remove("active");
      submitBtn.disabled = true;
    }
    return isValid;
  }

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

  // 아이디 중복확인
  duplicateBtn.addEventListener("click", async function () {
    const userId = userIdInput.value.trim();
    if (!userId) {
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
      const result = await apiUtils.checkUserIdDuplicate(userId);
      if (result.isDuplicate) {
        showError(userIdInput, result.message);
        isUserIdValid = false;
        userIdSuccess.style.display = "none";
      } else if (result.isValid === false) {
        showError(userIdInput, result.message);
        isUserIdValid = false;
        userIdSuccess.style.display = "none";
      } else {
        hideError(userIdInput);
        userIdSuccess.style.display = "block";
        isUserIdValid = true;
      }
      isUserIdChecked = true;
      validateForm();
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

  // 가입하기 버튼
  submitBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      alert("모든 필수 정보를 입력하고 약관에 동의해주세요.");
      return;
    }

    if (currentUserType === "buyer") {
      alert("구매자 회원가입이 완료되었습니다!");
      window.location.href = "./index.html";
      return;
    }

    const phoneNumber =
      phonePrefixSelect.value + phoneMiddleInput.value + phoneLastInput.value;
    const userData = {
      username: userIdInput.value.trim(),
      password: passwordInput.value,
      name: userNameInput.value.trim(),
      phone_number: phoneNumber,
      company_registration_number: businessNumberInput.value.trim(),
      store_name: storeNameInput.value.trim(),
    };

    submitBtn.textContent = "가입 중...";
    submitBtn.disabled = true;

    try {
      const result = await apiUtils.submitSellerSignup(userData);
      if (result.success) {
        alert("판매자 회원가입이 완료되었습니다!");
        window.location.href = "./product.html";
      } else {
        if (result.errors) {
          handleApiErrors(result.errors);
        } else {
          alert(result.error || "회원가입 중 오류가 발생했습니다.");
        }
      }
    } finally {
      submitBtn.textContent = "가입하기";
      submitBtn.disabled = false;
      validateForm();
    }
  });

  // 입력 이벤트들
  requiredFields.forEach((field) => {
    field.element.addEventListener("input", function () {
      hideError(this);
      if (this === userIdInput) {
        isUserIdChecked = false;
        isUserIdValid = false;
        userIdSuccess.style.display = "none";
      }
      validateForm();
    });
  });

  passwordInput.addEventListener("input", function () {
    hideError(this);
    if (this.value && !validatePassword(this.value)) {
      showError(this, "8자 이상의 영소문자, 숫자를 포함해주세요.");
    }
    validatePasswordMatch();
    validateForm();
  });

  passwordCheckInput.addEventListener("input", function () {
    hideError(this);
    validatePasswordMatch();
    validateForm();
  });

  if (businessNumberInput) {
    businessNumberInput.addEventListener("input", function () {
      let value = this.value.replace(/[^0-9]/g, "");
      if (value.length > 10) value = value.slice(0, 10);
      this.value = value;
      isBusinessNumberChecked = false;
      isBusinessNumberValid = false;
      if (businessNumberSuccess) businessNumberSuccess.style.display = "none";
      hideError(this);
      validateForm();
    });
  }

  if (storeNameInput) {
    storeNameInput.addEventListener("input", validateForm);
  }

  [phoneMiddleInput, phoneLastInput].forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
      validateForm();
    });
  });

  termsCheckbox.addEventListener("change", validateForm);
  validateForm();
});
