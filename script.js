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

  setupTooltips();
});

function setupTooltips() {
  const tooltips = document.querySelectorAll(".tooltip");
  const infoButtons = document.querySelectorAll(".modal-open");
  let activeTooltip = null;

  tooltips.forEach((tooltip) => {
    document.body.appendChild(tooltip);
  });

  infoButtons.forEach((button) => {
    const targetId = button.getAttribute("data-target");
    const tooltip = document.getElementById(targetId);

    if (!tooltip) return;

    const showTooltip = () => {
      if (activeTooltip && activeTooltip !== tooltip) {
        activeTooltip.classList.add("hidden");
      }

      const buttonRect = button.getBoundingClientRect();
      tooltip.style.top = `${buttonRect.bottom + window.scrollY + 10}px`;
      tooltip.style.left = `${buttonRect.left + window.scrollX - 10}px`;
      tooltip.classList.remove("hidden");
      activeTooltip = tooltip;
    };

    const hideTooltip = () => {
      setTimeout(() => {
        if (!tooltip.matches(":hover")) {
          tooltip.classList.add("hidden");
          if (activeTooltip === tooltip) {
            activeTooltip = null;
          }
        }
      }, 200);
    };

    button.addEventListener("mouseenter", showTooltip);
    button.addEventListener("mouseleave", hideTooltip);
    tooltip.addEventListener("mouseleave", hideTooltip);

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tooltip.classList.contains("hidden")) {
        showTooltip();
      } else {
        tooltip.classList.add("hidden");
        activeTooltip = null;
      }
    });
  });

  document.addEventListener("click", () => {
    if (activeTooltip) {
      activeTooltip.classList.add("hidden");
      activeTooltip = null;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeTooltip) {
      activeTooltip.classList.add("hidden");
      activeTooltip = null;
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
    strengthIndicator.style.width = `${(analysis.score / 4) * 100}%`;
    strengthIndicator.className = `h-2.5 rounded-full ${analysis.color}`;
    strengthText.textContent = analysis.strength;
    crackTimeText.textContent = analysis.crackTime;
  }

  const { charCount, entropy, charTypes } = getAnalysisElements();
  if (charCount) charCount.textContent = analysis.length;
  if (entropy) entropy.textContent = `${analysis.entropy.toFixed(2)} bits`;
  if (charTypes) charTypes.textContent = analysis.characterTypes.count;
}

function calculatePasswordStrength(password) {
  let score = 0;
  let characterTypes = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
    count: 0,
  };

  characterTypes.count = Object.values(characterTypes).filter(
    (v) => v === true
  ).length;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (characterTypes.count >= 2) score++;
  if (characterTypes.count >= 4) score++;

  let strength = "";
  let color = "bg-red-600";
  switch (score) {
    case 0:
    case 1:
      strength = "Weak";
      break;
    case 2:
      strength = "Moderate";
      color = "bg-yellow-500";
      break;
    case 3:
      strength = "Strong";
      color = "bg-green-500";
      break;
    case 4:
      strength = "Very Strong";
      color = "bg-blue-500";
      break;
  }

  let charsetSize = 0;
  if (characterTypes.lowercase) charsetSize += 26;
  if (characterTypes.uppercase) charsetSize += 26;
  if (characterTypes.numbers) charsetSize += 10;
  if (characterTypes.symbols) charsetSize += 32;

  const entropyValue = password.length * (Math.log(charsetSize) / Math.log(2));
  const guessesPerSecond = 1e9;
  const crackTimeSeconds = Math.pow(2, entropyValue) / guessesPerSecond;
  const crackTime = formatCrackTime(crackTimeSeconds);

  return {
    score,
    strength,
    color,
    crackTime,
    length: password.length,
    entropy: isNaN(entropyValue) ? 0 : entropyValue,
    characterTypes,
  };
}

function formatCrackTime(seconds) {
  if (seconds < 1) return "Instantly";
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""}`;
    }
  }
  return "Instantly";
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
