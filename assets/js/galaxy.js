"use strict";

/* =====================================================================
   Galassia a spirale + starfield per l'hero della home.
   Rispetta prefers-reduced-motion (in quel caso disegna un frame statico).
   ===================================================================== */

(function () {

    const galaxyCanvas = document.getElementById("galaxy");
    const starCanvas = document.getElementById("starfield");
    if (!galaxyCanvas || !starCanvas) return;

    const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    /* ---------------- SPIRAL GALAXY ---------------- */
    (function () {
        const canvas = galaxyCanvas;
        const ctx = canvas.getContext("2d");
        let stars = [];
        let dust = [];
        let cx, cy, scale;
        let rotation = 0;
        const armCount = 4;
        const armOffset = 0.4;
        const armTightness = 0.32;
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 800 : 1600;
        const dustCount = isMobile ? 260 : 520;

        function resize() {
            canvas.width = window.innerWidth * DPR;
            canvas.height = window.innerHeight * DPR;
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            cx = window.innerWidth / 2;
            cy = window.innerHeight / 2;
            scale = Math.min(window.innerWidth, window.innerHeight) * 0.45;
            if (window.innerWidth < 768) {
                // su smartphone: galassia più ampia e centrata nello spazio libero sotto il contenuto
                cy = window.innerHeight * 0.6;
                scale = window.innerWidth * 0.62;
            }
        }

        function createStar() {
            const r = Math.pow(Math.random(), 0.6);
            const arm = Math.floor(Math.random() * armCount);
            const armAngle = (arm * 2 * Math.PI / armCount) + Math.log(r + 0.05) / armTightness;
            const scatter = (Math.random() - 0.5) * armOffset * (1 - r * 0.5);
            const angle = armAngle + scatter;
            const isCore = r < 0.25;
            const roll = Math.random();
            let color;
            if (isCore) {
                color = roll < 0.7
                    ? "rgba(255, 220, 160, " + (0.7 + Math.random() * 0.3) + ")"
                    : "rgba(255, 180, 120, " + (0.6 + Math.random() * 0.3) + ")";
            } else if (roll < 0.6) {
                color = "rgba(200, 220, 255, " + (0.5 + Math.random() * 0.4) + ")";
            } else if (roll < 0.85) {
                color = "rgba(255, 245, 230, " + (0.5 + Math.random() * 0.4) + ")";
            } else {
                color = "rgba(255, 200, 150, " + (0.6 + Math.random() * 0.3) + ")";
            }
            return {
                r: r,
                angle: angle,
                size: isCore ? Math.random() * 1.4 + 0.6 : Math.random() * 1.2 + 0.3,
                color: color,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.02 + Math.random() * 0.04,
                rotSpeed: 0.0012 * (1 / (r + 0.2))
            };
        }

        function createDust() {
            const r = 0.15 + Math.pow(Math.random(), 0.5) * 0.75;
            const arm = Math.floor(Math.random() * armCount);
            const armAngle = (arm * 2 * Math.PI / armCount) + Math.log(r + 0.05) / armTightness;
            const scatter = (Math.random() - 0.5) * (armOffset * 1.8);
            return {
                r: r,
                angle: armAngle + scatter,
                size: 8 + Math.random() * 22,
                opacity: 0.015 + Math.random() * 0.04,
                rotSpeed: 0.0012 * (1 / (r + 0.2))
            };
        }

        function init() {
            stars = [];
            dust = [];
            for (let i = 0; i < starCount; i++) stars.push(createStar());
            for (let i = 0; i < dustCount; i++) dust.push(createDust());
        }

        function draw(advance) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.4);
            coreGrad.addColorStop(0, "rgba(255, 220, 160, 0.18)");
            coreGrad.addColorStop(0.3, "rgba(220, 180, 130, 0.08)");
            coreGrad.addColorStop(1, "rgba(220, 180, 130, 0)");
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
            ctx.fill();

            for (const d of dust) {
                if (advance) d.angle += d.rotSpeed;
                const x = cx + Math.cos(d.angle + rotation) * d.r * scale;
                const y = cy + Math.sin(d.angle + rotation) * d.r * scale * 0.55;
                const grad = ctx.createRadialGradient(x, y, 0, x, y, d.size);
                grad.addColorStop(0, "rgba(180, 140, 110, " + d.opacity + ")");
                grad.addColorStop(1, "rgba(180, 140, 110, 0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, d.size, 0, Math.PI * 2);
                ctx.fill();
            }

            for (const s of stars) {
                if (advance) {
                    s.angle += s.rotSpeed;
                    s.twinkle += s.twinkleSpeed;
                }
                const x = cx + Math.cos(s.angle + rotation) * s.r * scale;
                const y = cy + Math.sin(s.angle + rotation) * s.r * scale * 0.55;
                const tw = 0.7 + Math.sin(s.twinkle) * 0.3;
                const size = s.size * tw;
                if (s.size > 1.2) {
                    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
                    g.addColorStop(0, s.color);
                    g.addColorStop(1, s.color.replace(/[\d.]+\)$/, "0)"));
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(x, y, size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function animate() {
            rotation += 0.0003;
            draw(true);
            requestAnimationFrame(animate);
        }

        resize();
        init();
        if (reduceMotion) {
            draw(false);
        } else {
            animate();
        }
        window.addEventListener("resize", () => {
            resize();
            init();
            if (reduceMotion) draw(false);
        });
    })();

    /* ---------------- PARALLAX STARFIELD ---------------- */
    (function () {
        const canvas = starCanvas;
        const ctx = canvas.getContext("2d");
        let stars = [];
        const count = window.innerWidth < 768 ? 80 : 150;

        function resize() {
            canvas.width = window.innerWidth * DPR;
            canvas.height = window.innerHeight * DPR;
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }

        function init() {
            stars = [];
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    size: Math.random() * 1.2 + 0.2,
                    opacity: 0.2 + Math.random() * 0.5,
                    twinkle: Math.random() * Math.PI * 2,
                    speed: 0.015 + Math.random() * 0.03
                });
            }
        }

        function draw(advance) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (const s of stars) {
                if (advance) s.twinkle += s.speed;
                const op = s.opacity * (0.5 + Math.sin(s.twinkle) * 0.5);
                ctx.fillStyle = "rgba(245, 239, 227, " + op + ")";
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            if (advance) requestAnimationFrame(() => draw(true));
        }

        resize();
        init();
        draw(!reduceMotion);
        window.addEventListener("resize", () => {
            resize();
            init();
            if (reduceMotion) draw(false);
        });
    })();

})();
