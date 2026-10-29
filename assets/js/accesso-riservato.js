/*
 * Area riservata con password.
 *
 * Il contenuto protetto NON è nel sito in chiaro: è cifrato con AES-GCM
 * (chiave ricavata dalla password con PBKDF2-SHA256) dallo script
 * _materiali/didattica/cifra.py. Qui il browser ricava la chiave dalla
 * password inserita e decifra. Con la password sbagliata la decifratura
 * fallisce: la password non è scritta da nessuna parte nel sito.
 *
 * modo "pagina":    il contenuto decifrato compare dentro la pagina.
 * modo "documento": il contenuto decifrato è una pagina HTML intera
 *                   (uno strumento) e sostituisce la pagina corrente.
 *
 * Dopo il primo accesso la chiave resta in sessionStorage fino alla
 * chiusura della scheda, così non si riscrive la password a ogni pagina.
 */
(function () {
    "use strict";

    var area = document.getElementById("accesso-riservato");
    var datiEl = document.getElementById("contenuto-cifrato");
    if (!area || !datiEl) return;

    var form = document.getElementById("accesso-form");
    var campo = document.getElementById("accesso-password");
    var messaggio = document.getElementById("accesso-messaggio");
    var bottone = form ? form.querySelector("button[type=submit]") : null;
    var modo = area.getAttribute("data-modo") || "pagina";

    function avvisa(testo, errore) {
        if (!messaggio) return;
        messaggio.textContent = testo;
        messaggio.classList.toggle("errore", !!errore);
    }

    var cfg;
    try {
        cfg = JSON.parse(datiEl.textContent);
    } catch (e) {
        avvisa("Contenuto non leggibile.", true);
        return;
    }

    if (!window.crypto || !window.crypto.subtle || !window.TextDecoder) {
        if (form) form.hidden = false;
        if (bottone) bottone.disabled = true;
        avvisa("Il browser non supporta la decifratura: prova con una versione aggiornata di Chrome, Firefox, Safari o Edge.", true);
        return;
    }

    var subtle = window.crypto.subtle;
    var CHIAVE_SESSIONE = "accesso-riservato:" + cfg.salt;

    function daBase64(s) {
        var bin = atob(s);
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function aBase64(bytes) {
        var bin = "";
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    function leggiSessione() {
        try { return sessionStorage.getItem(CHIAVE_SESSIONE); } catch (e) { return null; }
    }

    function scriviSessione(valore) {
        try { sessionStorage.setItem(CHIAVE_SESSIONE, valore); } catch (e) { /* modalità privata */ }
    }

    function cancellaSessione() {
        try { sessionStorage.removeItem(CHIAVE_SESSIONE); } catch (e) { /* niente */ }
    }

    function ricavaChiave(password) {
        return subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"])
            .then(function (base) {
                return subtle.deriveBits(
                    { name: "PBKDF2", hash: "SHA-256", salt: daBase64(cfg.salt), iterations: cfg.iter },
                    base,
                    256
                );
            })
            .then(function (bits) { return new Uint8Array(bits); });
    }

    function decifra(chiaveGrezza) {
        return subtle.importKey("raw", chiaveGrezza, { name: "AES-GCM" }, false, ["decrypt"])
            .then(function (chiave) {
                return subtle.decrypt({ name: "AES-GCM", iv: daBase64(cfg.iv) }, chiave, daBase64(cfg.dati));
            })
            .then(function (buf) { return new TextDecoder("utf-8").decode(buf); });
    }

    function mostra(html) {
        if (modo === "documento") {
            // Lo strumento è una pagina completa: prende il posto di questa.
            document.open();
            document.write(html);
            document.close();
            return;
        }
        area.innerHTML = html;
        area.classList.add("sbloccato");
        var esci = area.querySelectorAll("[data-accesso-esci]");
        for (var i = 0; i < esci.length; i++) {
            esci[i].addEventListener("click", function () {
                cancellaSessione();
                window.location.reload();
            });
        }
    }

    function mostraForm() {
        if (!form) return;
        form.hidden = false;
        if (campo) campo.focus();
    }

    // 1. Accesso già fatto in questa scheda: decifra subito.
    var salvata = leggiSessione();
    if (salvata) {
        decifra(daBase64(salvata)).then(mostra, function () {
            cancellaSessione();
            mostraForm();
        });
    } else {
        mostraForm();
    }

    // 2. Inserimento della password.
    if (form) {
        form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            var password = campo ? campo.value : "";
            if (!password) {
                avvisa("Scrivi la password.", true);
                return;
            }
            if (bottone) bottone.disabled = true;
            avvisa("Verifica in corso…", false);
            var chiaveGrezza;
            ricavaChiave(password)
                .then(function (k) {
                    chiaveGrezza = k;
                    return decifra(k);
                })
                .then(function (html) {
                    scriviSessione(aBase64(chiaveGrezza));
                    avvisa("", false);
                    mostra(html);
                }, function () {
                    if (bottone) bottone.disabled = false;
                    avvisa("Password non corretta. Riprova.", true);
                    if (campo) { campo.select(); campo.focus(); }
                });
        });
    }
})();
