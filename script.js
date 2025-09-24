function getAnalysisElements() {
  return {
    charCount: document.querySelector("#char-count span:last-child"),
    entropy: document.querySelector("#entropy span:last-child"),
    charTypes: document.querySelector("#char-types span:last-child"),
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password-input");
  const checkButton = document.getElementById("check-button");
  const privacyInfo = document.getElementById("privacy-info");
  const resultsPanels = document.getElementById("results-panels");

  if (passwordInput && privacyInfo && resultsPanels) {
    passwordInput.addEventListener("focus", () => {
      privacyInfo.classList.add("hidden");
      resultsPanels.classList.remove("hidden");
    });

    passwordInput.addEventListener("input", () => {
      updatePasswordAnalysis(passwordInput.value);
    });

    if (checkButton) {
      checkButton.addEventListener("click", (e) => {
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
        // Hide any open popover
        if (activePopover && activePopover !== popover) {
          activePopover.classList.add("hidden");
        }
        // Position popover next to button
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
