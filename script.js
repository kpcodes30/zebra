function getAnalysisElements() {
  return {
    charCount: document.querySelector('#char-count span:last-child'),
    entropy: document.querySelector('#entropy span:last-child'),
    charTypes: document.querySelector('#char-types span:last-child')
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password-input');
  const checkButton = document.getElementById('check-button');
  const visibilityToggle = document.getElementById('password-visibility-toggle');
  const privacyInfo = document.getElementById('privacy-info');
  const resultsPanels = document.getElementById('results-panels');

  if (passwordInput && privacyInfo && resultsPanels) {
    passwordInput.addEventListener('focus', () => {
      privacyInfo.classList.add("hidden");
      resultsPanels.classList.remove("hidden");
      if (visibilityToggle && passwordInput.value.length > 0) {
        visibilityToggle.classList.remove('hidden');
        visibilityToggle.tabIndex = 0;
      }
    });

    passwordInput.addEventListener('input', () => {
      updatePasswordAnalysis(passwordInput.value);
      if (visibilityToggle) {
        if (passwordInput.value.length > 0 && document.activeElement === passwordInput) {
          visibilityToggle.classList.remove('hidden');
          visibilityToggle.tabIndex = 0;
        } else if (passwordInput.value.length === 0) {
          visibilityToggle.classList.add('hidden');
          visibilityToggle.tabIndex = -1;
          passwordInput.type = 'password';
          visibilityToggle.setAttribute('aria-pressed','false');
          visibilityToggle.setAttribute('aria-label','Show password');
        }
      }
    });

    if (visibilityToggle) {
      visibilityToggle.addEventListener('mousedown', e => e.preventDefault()); // prevent focus loss
      visibilityToggle.addEventListener('click', () => {
        const showing = passwordInput.type === 'text';
        passwordInput.type = showing ? 'password' : 'text';
        visibilityToggle.setAttribute('aria-pressed', String(!showing));
        visibilityToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
        // swap icon (simple stroke path toggle)
        const icon = visibilityToggle.querySelector('#eye-icon');
        if (icon) {
          if (showing) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
          } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a10.47 10.47 0 012.223-3.592M6.223 6.223A10.05 10.05 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.45 10.45 0 01-4.132 5.411M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3-3L3 3m9 9l9 9" />';
          }
        }
      });

      passwordInput.addEventListener('blur', () => {
        // hide button if neither input nor button are focused and input not empty focus left
        setTimeout(() => {
          if (document.activeElement !== passwordInput && document.activeElement !== visibilityToggle) {
            visibilityToggle.classList.add('hidden');
            visibilityToggle.tabIndex = -1;
          }
        }, 100);
      });

      visibilityToggle.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement !== passwordInput && document.activeElement !== visibilityToggle) {
            visibilityToggle.classList.add('hidden');
            visibilityToggle.tabIndex = -1;
          }
        }, 100);
      });
    }

    if (checkButton) {
      checkButton.addEventListener('click', (e) => {
        e.preventDefault();
        updatePasswordAnalysis(passwordInput.value);
      });
    }
  } else {
    console.warn("Password analysis initialization failed: missing elements");
  }

  setupInfoPopovers();
});
function setupInfoPopovers() {
  const infoBtns = document.querySelectorAll(".info-popover-btn");
  const popovers = document.querySelectorAll(".info-popover");
  const closeBtns = document.querySelectorAll(".close-popover-btn");
  let activePopover = null;

  infoBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const popoverId = btn.getAttribute("data-popover");
      const popover = document.getElementById(popoverId);
      if (popover) {
        if (activePopover && activePopover !== popover) {
          activePopover.classList.add("hidden");
        }
        const rect = btn.getBoundingClientRect();
        popover.style.top = rect.bottom + window.scrollY + "px";
        popover.style.left = rect.left + window.scrollX + "px";
        popover.classList.remove("hidden");
        activePopover = popover;
      }
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      btn.closest(".info-popover").classList.add("hidden");
      activePopover = null;
    });
  });

  document.addEventListener("click", function () {
    if (activePopover) {
      activePopover.classList.add("hidden");
      activePopover = null;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && activePopover) {
      activePopover.classList.add("hidden");
      activePopover = null;
    }
  });
}
function updatePasswordAnalysis(password) {
  if (password.length === 0) {
    resetAnalysis();
    return;
  }

  const analysis = calculatePasswordStrength(password);
  const strengthIndicator = document.getElementById("strength-indicator");
  const strengthText = document.getElementById("strength-text");
  const crackTimeText = document.getElementById("crack-time-text");

  if (strengthIndicator && strengthText && crackTimeText) {
    const progressPercentage = (analysis.score / 4) * 100;
    strengthIndicator.style.width = `${progressPercentage}%`;
    strengthIndicator.className = `h-2.5 rounded-full transition-all duration-500 ${analysis.color}`;
    strengthText.textContent = analysis.strength;
    crackTimeText.textContent = analysis.crackTimes.slow || analysis.crackTimes.fast || "";
    const ct = analysis.crackTimes;
    crackTimeText.title = `Slow offline (1e4/s): ${ct.slow}\nFast offline (1e10/s): ${ct.fast}\nOnline (no throttle ~10/s): ${ct.onlineFast}\nOnline (throttled ~100/hr): ${ct.onlineThrottled}`;
  }

  const { charCount, entropy, charTypes } = getAnalysisElements();
  if (charCount) charCount.textContent = analysis.length;
  if (entropy) entropy.textContent = `${analysis.entropy.toFixed(2)} bits`;
  if (charTypes) charTypes.textContent = analysis.characterTypes.count;
}

function calculatePasswordStrength(password) {
  if (typeof zxcvbn !== "function") {
    return {
      score: 0,
      strength: "Unavailable",
      color: "bg-gray-600",
      crackTimes: { fast: "", slow: "", onlineFast: "", onlineThrottled: "" },
      length: password.length,
      entropy: 0,
      characterTypes: { lowercase: false, uppercase: false, numbers: false, symbols: false, count: 0 },
      rawGuesses: 0,
    };
  }
  const result = zxcvbn(password);

  const SCORE_MAP = [
    { label: "Very Weak", color: "bg-red-700" },
    { label: "Weak",      color: "bg-red-500" },
    { label: "Fair",      color: "bg-yellow-500" },
    { label: "Good",      color: "bg-green-500" },
    { label: "Strong",    color: "bg-green-600" },
  ];
  const scoreMeta = SCORE_MAP[result.score] || SCORE_MAP[0];

  const characterTypes = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
  };
  const characterTypeCount = Object.values(characterTypes).filter(Boolean).length;

  const ctDisplay = result.crack_times_display || {};
  const crackTimes = {
    fast: ctDisplay.offline_fast_hashing_1e10_per_second || "",
    slow: ctDisplay.offline_slow_hashing_1e4_per_second || "",
    onlineFast: ctDisplay.online_no_throttling_10_per_second || "",
    onlineThrottled: ctDisplay.online_throttling_100_per_hour || "",
  };

  const entropyBits = typeof result.guesses_log10 === "number"
    ? result.guesses_log10 * Math.LOG2E * Math.log(10)
    : 0;

  return {
    score: result.score,
    strength: scoreMeta.label,
    color: scoreMeta.color,
    crackTimes,
    length: password.length,
    entropy: entropyBits,
    characterTypes: { ...characterTypes, count: characterTypeCount },
    rawGuesses: result.guesses,
  };
}

function resetAnalysis() {
  const strengthIndicator = document.getElementById("strength-indicator");
  const strengthText = document.getElementById("strength-text");
  const crackTimeText = document.getElementById("crack-time-text");

  if (strengthIndicator) {
    strengthIndicator.style.width = "0%";
    strengthIndicator.className = "h-2.5 rounded-full bg-red-600";
  }
  if (strengthText) strengthText.textContent = "";
  if (crackTimeText) crackTimeText.textContent = "";

  const elements = getAnalysisElements();
  if (elements.charCount) elements.charCount.textContent = "0";
  if (elements.entropy) elements.entropy.textContent = "0 bits";
  if (elements.charTypes) elements.charTypes.textContent = "0";
}
