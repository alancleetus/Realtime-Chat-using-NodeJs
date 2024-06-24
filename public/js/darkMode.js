const toggleButton = document.getElementById("dark-mode-toggle");
const htmlElement = document.documentElement;

toggleButton.addEventListener("click", function () {
  if (htmlElement.classList.contains("dark")) {
    htmlElement.classList.remove("dark");
    sessionStorage.setItem("theme", "light");
  } else {
    htmlElement.classList.add("dark");
    sessionStorage.setItem("theme", "dark");
  }
});

// Set the theme on initial load based on sessionStorage
document.addEventListener("DOMContentLoaded", () => {
  if (
    sessionStorage.getItem("theme") === "dark" ||
    (!("theme" in sessionStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }
});
