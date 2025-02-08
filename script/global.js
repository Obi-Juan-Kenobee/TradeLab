const hamburger = document.querySelector("#hamburger");
const navLinks = document.querySelector(".nav-links");
const navbar = document.querySelector(".navbar");

hamburger.addEventListener("click", () => {
    if (navLinks.style.display === "none") {
        navLinks.style.display = "flex";
        navbar.style.height = "fit-content";
    } else {
        navLinks.style.display = "none";
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 992) {
        if (navLinks.style.display === "none") {
            navLinks.style.display = "flex";
            navbar.style.height = "fit-content";
        }
    } else {
        navLinks.style.display = "none";
    }
});