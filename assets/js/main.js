"use strict";

(function () {

    /* ---- Menu mobile ---- */
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#site-navigation");
    const label = toggle ? toggle.querySelector(".menu-label") : null;

    const setMenu = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("is-open", open);
        document.body.style.overflow = open ? "hidden" : "";
        if (label) label.textContent = open ? "Chiudi" : "Menu";
    };

    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            setMenu(toggle.getAttribute("aria-expanded") !== "true");
        });
        nav.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => setMenu(false));
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false);
        });
    }

    /* ---- Header: bordo quando si scorre ---- */
    const header = document.querySelector("#site-header");
    if (header) {
        const onScroll = () => {
            header.classList.toggle("scrolled", window.scrollY > 10);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---- Comparsa morbida delle sezioni ---- */
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
            }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
            reveals.forEach((el) => io.observe(el));
        } else {
            reveals.forEach((el) => el.classList.add("visible"));
        }
    }

    /* ---- Email (indirizzo non in chiaro nel sorgente) ---- */
    const emailReveal = document.querySelector("#email-reveal");
    const emailContainer = document.querySelector("#email-container");
    if (emailReveal && emailContainer) {
        emailReveal.addEventListener("click", () => {
            const user = ["consulting", "fanelli"].join(".");
            const domain = ["gmail", "com"].join(".");
            const address = user + "@" + domain;
            const link = document.createElement("a");
            link.href = "mailto:" + address;
            link.textContent = address;
            emailContainer.replaceChildren(link);
            emailReveal.remove();
        }, { once: true });
    }

})();
