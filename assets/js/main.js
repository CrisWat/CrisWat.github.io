"use strict";

(function () {

    /* ---- Mobile menu ---- */
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#site-navigation");

    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            const open = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!open));
            nav.classList.toggle("is-open");
        });
        nav.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                nav.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* ---- Header scrolled state ---- */
    const header = document.querySelector("#site-header");
    if (header) {
        const onScroll = () => {
            header.classList.toggle("scrolled", window.scrollY > 50);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---- Reveal on scroll ---- */
    const reveals = document.querySelectorAll(".reveal");
    if (reveals.length) {
        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
            reveals.forEach((el) => io.observe(el));
        } else {
            reveals.forEach((el) => el.classList.add("visible"));
        }
    }

    /* ---- Cosmic loader (home only) ---- */
    const loader = document.getElementById("loader");
    if (loader) {
        const hide = () => loader.classList.add("done");
        window.addEventListener("load", () => setTimeout(hide, 500));
        setTimeout(hide, 3000); // fallback in caso di load lento
    }

    /* ---- Email reveal (indirizzo non in chiaro nel sorgente) ---- */
    const emailReveal = document.querySelector("#email-reveal");
    const emailContainer = document.querySelector("#email-container");
    if (emailReveal && emailContainer) {
        emailReveal.addEventListener("click", () => {
            const user = ["cristiano", "fanelli"].join(".");
            const domain = ["inaf", "it"].join(".");
            const address = user + "@" + domain;
            const link = document.createElement("a");
            link.href = "mailto:" + address;
            link.textContent = address;
            emailContainer.replaceChildren(link);
            emailReveal.remove();
        }, { once: true });
    }

})();
