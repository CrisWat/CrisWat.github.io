"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-navigation");

if (menuToggle && navigation) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            menuToggle.getAttribute("aria-expanded") === "true";

        menuToggle.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        navigation.classList.toggle("is-open");

    });

}


const emailReveal = document.querySelector("#email-reveal");
const emailContainer = document.querySelector("#email-container");

if (emailReveal && emailContainer) {

    emailReveal.addEventListener(
        "click",
        () => {

            const user = [
                "fanelli",
                "cristiano"
            ].join(".");

            const domain = [
                "gmail",
                "com"
            ].join(".");

            const address =
                `${user}@${domain}`;

            const link =
                document.createElement("a");

            link.href =
                `mailto:${address}`;

            link.textContent =
                address;

            emailContainer.replaceChildren(link);

            emailReveal.remove();

        },
        { once: true }
    );

}
