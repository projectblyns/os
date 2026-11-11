(() => {
  "use strict";

  const STORAGE_KEY = "blynsos-v1-profile";
  const currentPage = document.body.dataset.page;
  const params = new URLSearchParams(window.location.search);

  function readSavedProfile() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      console.warn("Blyns OS could not read the saved profile.", error);
      return null;
    }
  }

  /* ==============================================================
     BOOT SCREEN JS
     index.html is the entry point. The boot display lasts 3 seconds,
     then opens setup.html for a new profile or lockscreen.html if
     setup has already been completed.
     ============================================================== */
  if (currentPage === "boot") {
    if (params.get("reset") === "1") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Blyns OS could not clear saved setup data.", error);
      }
    }

    window.setTimeout(() => {
      const savedProfile = readSavedProfile();
      window.location.replace(
        savedProfile?.setupCompleted ? "lockscreen.html" : "setup.html"
      );
    }, 3000);
    return;
  }

  /* ==============================================================
     LOCKSCREEN JS PLACEHOLDER
     The screen is intentionally black and empty. Click, Enter or
     Space moves to desktop.html. Add future lock behaviour here.
     ============================================================== */
  if (currentPage === "lockscreen") {
    const lockScreen = document.getElementById("lock-screen");
    const enterDesktop = () => window.location.assign("desktop.html");

    lockScreen?.addEventListener("click", enterDesktop);
    lockScreen?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enterDesktop();
      }
    });
    lockScreen?.focus({ preventScroll: true });
    return;
  }

  /* ==============================================================
     DESKTOP JS PLACEHOLDER
     Add desktop interactions here in a later update.
     Version 1.0 desktop remains completely empty.
     ============================================================== */
  if (currentPage === "desktop") {
    // Intentionally empty in Blyns OS 1.0.
    return;
  }

  if (currentPage !== "setup") return;

  const screens = {
    setup: document.getElementById("setup-screen"),
    welcome: document.getElementById("welcome-screen")
  };

  const stepContent = document.getElementById("step-content");
  const stepCounter = document.getElementById("step-counter");
  const stepTrackFill = document.getElementById("step-track-fill");
  const continueButton = document.getElementById("continue-button");
  const backButton = document.getElementById("back-button");
  const setupError = document.getElementById("setup-error");
  const welcomeHello = document.getElementById("welcome-hello");
  const welcomeSubtitle = document.getElementById("welcome-subtitle");

  const state = {
    step: 1,
    language: "ms",
    name: "",
    password: "",
    confirmPassword: "",
    helloTimer: null,
    preparingTimer: null,
    welcomeTimer: null
  };

  const copy = {
    ms: {
      continue: "Teruskan",
      back: "Kembali",
      step: "Langkah",
      helloCaption: "Satu permulaan baharu.",
      chooseLanguage: "Pilih bahasa anda",
      chooseLanguageDesc: "Anda boleh menukar pilihan ini kemudian.",
      nameTitle: "Siapa nama anda?",
      nameDesc: "Nama ini akan digunakan untuk menyambut anda di Blyns OS.",
      nameLabel: "Nama anda",
      namePlaceholder: "Masukkan nama",
      passwordTitle: "Cipta kata laluan",
      passwordDesc: "Gunakan kata laluan yang mudah anda ingat.",
      passwordLabel: "Kata laluan",
      passwordPlaceholder: "Masukkan kata laluan",
      confirmTitle: "Sahkan kata laluan",
      confirmDesc: "Masukkan semula kata laluan anda untuk pengesahan.",
      confirmLabel: "Ulang kata laluan",
      confirmPlaceholder: "Masukkan semula kata laluan",
      themeTitle: "Pilih tema anda",
      themeDesc: "Pilihan tema akan tersedia dalam kemas kini akan datang.",
      wallpaperTitle: "Jadikan ia ruang anda",
      wallpaperDesc: "Pilihan wallpaper akan ditambah kemudian.",
      colourTitle: "Pilih warna profil",
      colourDesc: "Tetapan warna profil belum tersedia buat masa ini.",
      recoveryTitle: "Pemulihan akaun",
      recoveryDesc: "Pilihan pemulihan akaun akan tersedia kemudian.",
      comingSoon: "Akan datang",
      preparingTitle: "Menyiapkan akaun anda",
      preparingDesc: "Blyns OS sedang menyediakan ruang baharu untuk anda...",
      preparingStatus: "Menyediakan profil dan tetapan asas",
      hello: "Hello",
      welcome: "Selamat datang ke",
      errorName: "Sila masukkan nama anda dahulu.",
      errorPassword: "Sila masukkan kata laluan dahulu.",
      errorConfirm: "Sila masukkan semula kata laluan anda.",
      errorMismatch: "Kata laluan tidak sepadan. Cuba sekali lagi."
    },
    en: {
      continue: "Continue",
      back: "Back",
      step: "Step",
      helloCaption: "A beautiful new beginning.",
      chooseLanguage: "Choose your language",
      chooseLanguageDesc: "You can change this selection later.",
      nameTitle: "What should we call you?",
      nameDesc: "This name will be used to welcome you to Blyns OS.",
      nameLabel: "Your name",
      namePlaceholder: "Enter your name",
      passwordTitle: "Create a password",
      passwordDesc: "Choose a password that you can remember.",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter a password",
      confirmTitle: "Confirm your password",
      confirmDesc: "Enter your password one more time to confirm it.",
      confirmLabel: "Confirm password",
      confirmPlaceholder: "Enter your password again",
      themeTitle: "Choose your theme",
      themeDesc: "Theme options will be available in a future update.",
      wallpaperTitle: "Make it your space",
      wallpaperDesc: "Wallpaper options will be added later.",
      colourTitle: "Choose a profile colour",
      colourDesc: "Profile colour settings are not available yet.",
      recoveryTitle: "Account recovery",
      recoveryDesc: "Account recovery options will be available later.",
      comingSoon: "Coming soon",
      preparingTitle: "Setting up your account",
      preparingDesc: "Blyns OS is preparing a new space for you...",
      preparingStatus: "Preparing your profile and basic settings",
      hello: "Hello",
      welcome: "Welcome to",
      errorName: "Please enter your name first.",
      errorPassword: "Please enter a password first.",
      errorConfirm: "Please enter your password again.",
      errorMismatch: "The passwords do not match. Please try again."
    }
  };

  const greetings = [
    "Hello", "你好", "Bonjour", "Hola", "こんにちは", "안녕하세요",
    "Hallo", "Ciao", "Olá", "Привет", "مرحبا", "Selamat Datang"
  ];

  function text(key) {
    return copy[state.language][key];
  }

  function showScreen(screenName) {
    Object.entries(screens).forEach(([name, element]) => {
      const isTarget = name === screenName;
      if (isTarget) {
        element.hidden = false;
        // Trigger the CSS transition after the element becomes displayable.
        requestAnimationFrame(() => element.classList.add("active"));
      } else {
        element.classList.remove("active");
        window.setTimeout(() => {
          if (!element.classList.contains("active")) element.hidden = true;
        }, 720);
      }
    });
  }

  function stopHelloAnimation() {
    if (state.helloTimer) {
      window.clearInterval(state.helloTimer);
      state.helloTimer = null;
    }
  }

  function startHelloAnimation() {
    stopHelloAnimation();
    let index = 0;
    const helloWord = document.getElementById("hello-word");
    if (!helloWord) return;

    state.helloTimer = window.setInterval(() => {
      if (!document.getElementById("hello-word")) {
        stopHelloAnimation();
        return;
      }
      index = (index + 1) % greetings.length;
      const currentWord = document.getElementById("hello-word");
      if (!currentWord) return;
      currentWord.textContent = greetings[index];
      currentWord.style.animation = "none";
      void currentWord.offsetWidth;
      currentWord.style.animation = "hello-word-in 700ms cubic-bezier(.2, .8, .2, 1) both";
    }, 1450);
  }

  function renderStep() {
    stopHelloAnimation();
    setupError.textContent = "";
    stepCounter.textContent = `${state.step} / 10`;
    stepTrackFill.style.width = `${state.step * 10}%`;
    continueButton.disabled = false;
    continueButton.innerHTML = `${text("continue")} <span aria-hidden="true">→</span>`;
    backButton.textContent = text("back");
    backButton.hidden = state.step === 1 || state.step === 10;
    continueButton.hidden = state.step === 10;

    let html = "";

    switch (state.step) {
      case 1:
        html = `
          <div class="hello-stage">
            <div class="hello-orb" aria-hidden="true"></div>
            <div>
              <p class="hello-word" id="hello-word">Hello</p>
              <p class="hello-caption">${text("helloCaption")}</p>
            </div>
          </div>`;
        break;

      case 2:
        html = `
          <p class="step-eyebrow">${text("step")} 02</p>
          <h1 class="step-title">${text("chooseLanguage")}</h1>
          <p class="step-description">${text("chooseLanguageDesc")}</p>
          <div class="language-options" role="group" aria-label="Language">
            <button class="language-option ${state.language === "ms" ? "selected" : ""}" type="button" data-language="ms" aria-pressed="${state.language === "ms"}">
              <span><span class="language-name">Bahasa Melayu</span><span class="language-native">Malaysia</span></span>
              <span class="language-check" aria-hidden="true">✓</span>
            </button>
            <button class="language-option ${state.language === "en" ? "selected" : ""}" type="button" data-language="en" aria-pressed="${state.language === "en"}">
              <span><span class="language-name">English</span><span class="language-native">United Kingdom</span></span>
              <span class="language-check" aria-hidden="true">✓</span>
            </button>
          </div>`;
        break;

      case 3:
        html = `
          <p class="step-eyebrow">${text("step")} 03</p>
          <h1 class="step-title">${text("nameTitle")}</h1>
          <p class="step-description">${text("nameDesc")}</p>
          <div class="setup-input-wrap">
            <label class="setup-label" for="name-input">${text("nameLabel")}</label>
            <input class="setup-input" id="name-input" type="text" maxlength="32" autocomplete="name" placeholder="${text("namePlaceholder")}" value="${escapeAttribute(state.name)}" />
          </div>`;
        break;

      case 4:
        html = `
          <p class="step-eyebrow">${text("step")} 04</p>
          <h1 class="step-title">${text("passwordTitle")}</h1>
          <p class="step-description">${text("passwordDesc")}</p>
          <div class="setup-input-wrap">
            <label class="setup-label" for="password-input">${text("passwordLabel")}</label>
            <input class="setup-input" id="password-input" type="password" autocomplete="new-password" placeholder="${text("passwordPlaceholder")}" />
          </div>`;
        break;

      case 5:
        html = `
          <p class="step-eyebrow">${text("step")} 05</p>
          <h1 class="step-title">${text("confirmTitle")}</h1>
          <p class="step-description">${text("confirmDesc")}</p>
          <div class="setup-input-wrap">
            <label class="setup-label" for="confirm-password-input">${text("confirmLabel")}</label>
            <input class="setup-input" id="confirm-password-input" type="password" autocomplete="new-password" placeholder="${text("confirmPlaceholder")}" />
          </div>`;
        break;

      case 6:
        html = emptyStep("✦", text("themeTitle"), text("themeDesc"));
        break;

      case 7:
        html = emptyStep("▧", text("wallpaperTitle"), text("wallpaperDesc"));
        break;

      case 8:
        html = emptyStep("◉", text("colourTitle"), text("colourDesc"));
        break;

      case 9:
        html = emptyStep("⌁", text("recoveryTitle"), text("recoveryDesc"));
        break;

      case 10:
        html = `
          <div class="preparing-icon" aria-hidden="true"></div>
          <h1 class="step-title">${text("preparingTitle")}</h1>
          <p class="step-description">${text("preparingDesc")}</p>
          <div class="preparing-track" aria-hidden="true"><div class="preparing-fill"></div></div>
          <p class="step-description" style="margin-top:12px;font-size:11px">${text("preparingStatus")}</p>`;
        backButton.hidden = true;
        continueButton.hidden = true;
        beginAccountPreparation();
        break;
    }

    stepContent.classList.remove("step-changing");
    stepContent.innerHTML = html;
    void stepContent.offsetWidth;
    stepContent.classList.add("step-changing");

    if (state.step === 1) startHelloAnimation();

    const languageButtons = stepContent.querySelectorAll("[data-language]");
    languageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.language = button.dataset.language;
        renderStep();
      });
    });

    const nameInput = document.getElementById("name-input");
    if (nameInput) {
      nameInput.addEventListener("input", (event) => {
        state.name = event.target.value;
      });
      nameInput.focus({ preventScroll: true });
    }

    const passwordInput = document.getElementById("password-input");
    if (passwordInput) {
      passwordInput.addEventListener("input", (event) => {
        state.password = event.target.value;
      });
      passwordInput.focus({ preventScroll: true });
    }

    const confirmInput = document.getElementById("confirm-password-input");
    if (confirmInput) {
      confirmInput.addEventListener("input", (event) => {
        state.confirmPassword = event.target.value;
      });
      confirmInput.focus({ preventScroll: true });
    }
  }

  function emptyStep(symbol, title, description) {
    return `
      <div class="empty-step-symbol" aria-hidden="true">${symbol}</div>
      <p class="step-eyebrow">${text("step")} ${String(state.step).padStart(2, "0")}</p>
      <h1 class="step-title">${title}</h1>
      <p class="step-description">${description}</p>
      <div class="empty-placeholder">${text("comingSoon")}</div>`;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function beginAccountPreparation() {
    if (state.preparingTimer) window.clearTimeout(state.preparingTimer);
    state.preparingTimer = window.setTimeout(() => {
      finishSetup();
    }, 5000);
  }

  function finishSetup() {
    const profile = {
      name: state.name.trim(),
      language: state.language,
      setupCompleted: true,
      version: "1.0"
    };

    // Demo mode saves the display name and language only, not the password.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn("Blyns OS could not save the profile in this browser.", error);
    }

    welcomeHello.textContent = `${text("hello")}, ${profile.name || "User"}...`;
    welcomeSubtitle.textContent = text("welcome");
    showScreen("welcome");

    state.welcomeTimer = window.setTimeout(() => {
      window.location.replace("lockscreen.html");
    }, 4500);
  }

  function goForward() {
    setupError.textContent = "";

    if (state.step === 3) {
      state.name = (document.getElementById("name-input")?.value || state.name).trim();
      if (!state.name) {
        setupError.textContent = text("errorName");
        document.getElementById("name-input")?.focus();
        return;
      }
    }

    if (state.step === 4) {
      state.password = document.getElementById("password-input")?.value || state.password;
      if (!state.password) {
        setupError.textContent = text("errorPassword");
        document.getElementById("password-input")?.focus();
        return;
      }
    }

    if (state.step === 5) {
      state.confirmPassword = document.getElementById("confirm-password-input")?.value || state.confirmPassword;
      if (!state.confirmPassword) {
        setupError.textContent = text("errorConfirm");
        document.getElementById("confirm-password-input")?.focus();
        return;
      }
      if (state.password !== state.confirmPassword) {
        setupError.textContent = text("errorMismatch");
        document.getElementById("confirm-password-input")?.focus();
        return;
      }
    }

    if (state.step < 10) {
      state.step += 1;
      renderStep();
    }
  }

  function goBack() {
    if (state.step > 1 && state.step < 10) {
      state.step -= 1;
      renderStep();
    }
  }

  continueButton.addEventListener("click", goForward);
  backButton.addEventListener("click", goBack);

  // setup.html is now independent from boot, lockscreen and desktop.
  renderStep();
})();
