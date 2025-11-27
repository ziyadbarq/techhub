(function () {
  var d = document.documentElement;
  try {
    var theme = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "dark" || (theme !== "light" && prefersDark);
    if (!isDark) {
      d.classList.remove("dark");
      d.style.backgroundColor = "#fcfcfc";
      d.style.colorScheme = "light";
    }
  } catch (_e) {
    // Silently fail if localStorage is not available
  }
})();
