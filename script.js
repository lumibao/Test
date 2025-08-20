/* ========= PANEL LOGIC ========= */
let current = 1;
const panels = [...document.querySelectorAll(".panel")];
const loading = document.getElementById("loading");
const themeSwitch = document.getElementById("theme-switch");
const body = document.body;

// Lightning sound element (intro only)
const lightningSound = document.getElementById("lightning-sound");
let introSoundPlayed = false; // ensure it plays only once

function showPanel(n) {
  // Pause any playing videos from previous panel
  panels.forEach(p => {
    p.classList.remove("active");
    const v = p.querySelector("video");
    if (v) { v.pause(); }
  });

  const panel = document.getElementById(`panel${n}`);
  panel.classList.add("active");
  current = n;

  // Start per-word typewriter on any text-box in this panel
  const tb = panel.querySelector(".text-box");
  if (tb) startTypewriter(tb);

  // Play lightning sound only once in Panel 1 (intro)
  if (n === 1 && !introSoundPlayed) {
    lightningSound.currentTime = 0;
    lightningSound.play().catch(e => console.log("Intro lightning audio blocked", e));
    introSoundPlayed = true;
  }

  // Restart credits roll if outro
  if (n === 8) startCreditsRoll();
}

function withLoader(next) {
  loading.classList.add("active");
  setTimeout(() => {
    loading.classList.remove("active");
    next();
  }, 1200);
}

document.addEventListener("click", (e) => {
  const next = e.target.closest("[data-next]");
  if (!next) return;
  const target = parseInt(next.getAttribute("data-next"), 10);
  withLoader(() => showPanel(target));
});

/* ========= THEME TOGGLE ========= */
themeSwitch.addEventListener("change", () => {
  body.classList.toggle("light", themeSwitch.checked);
  updatePalette();
});

/* ========= TYPEWRITER (per word, supports paragraphs) ========= */
function startTypewriter(el) {
  const text = el.getAttribute("data-text") || "";
  const lines = text.split("\n"); // split by actual line breaks
  el.innerHTML = ""; // clear existing content

  let lineIndex = 0;
  let wordIndex = 0;
  let words = lines[lineIndex].trim().split(/\s+/);

  function step() {
    if (lineIndex >= lines.length) return;

    if (wordIndex < words.length) {
      el.innerHTML += (wordIndex === 0 && lineIndex === 0 ? "" : " ") + words[wordIndex];
      wordIndex++;
      setTimeout(step, 220); // typing speed per word
    } else {
      // end of line: add paragraph break and go to next line
      el.innerHTML += "<br><br>";
      lineIndex++;
      if (lineIndex < lines.length) {
        words = lines[lineIndex].trim().split(/\s+/);
        wordIndex = 0;
        setTimeout(step, 220);
      }
    }
  }

  step();
}

/* ========= OUTRO CREDITS ========= */
function startCreditsRoll() {
  const roll = document.getElementById("credits-roll");
  const creditsText = (
    "Especially to you, Ma'am Fortuno.\n\n" +
    "Creator: Me\n" +
    "Video Editor: Me\n" +
    "Editing: Me\n" +
    "Storyline: Him\n" +
    "Upload: Him\n\n" +
    "— The End —"
  );
  roll.style.animation = "none";
  roll.offsetHeight; // reflow to restart animation
  roll.textContent = creditsText;
  roll.style.animation = "";
}

/* ========= WEATHER CANVAS ========= */
const canvas = document.getElementById("weather-canvas");
const flash = document.getElementById("lightning-flash");
const ctx = canvas.getContext("2d", { alpha: true });

let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let W = 0, H = 0;

function sizeCanvas() {
  W = canvas.clientWidth = window.innerWidth;
  H = canvas.clientHeight = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
sizeCanvas();
window.addEventListener("resize", sizeCanvas);

/* Palettes for themes */
const palette = {
  dark: {
    skyTop: "#0b0f14",
    skyBot: "#101823",
    cloud: "rgba(200,220,255,0.06)",
    rain: "rgba(200,230,255,0.55)",
    bolt: "#f8fbff"
  },
  light: {
    skyTop: "#e8f1fb",
    skyBot: "#cfe3f7",
    cloud: "rgba(30,40,60,0.07)",
    rain: "rgba(40,60,90,0.55)",
    bolt: "#ffffff"
  }
};
let colors = palette.dark;
function updatePalette() {
  colors = body.classList.contains("light") ? palette.light : palette.dark;
}
updatePalette();

/* Clouds */
const cloudPuffs = [];
function makeClouds() {
  cloudPuffs.length = 0;
  const bands = Math.max(18, Math.floor(W / 70));
  for (let i = 0; i < bands; i++) {
    cloudPuffs.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.6,
      r: 80 + Math.random() * 180,
      s: 0.15 + Math.random() * 0.35
    });
  }
}
makeClouds();
window.addEventListener("resize", makeClouds);

/* Rain drops */
const drops = [];
function makeRain() {
  drops.length = 0;
  const density = Math.floor((W * H) / 12000);
  for (let i = 0; i < density; i++) {
    drops.push({
      x: Math.random() * W,
      y: Math.random() * H,
      l: 8 + Math.random() * 16,
      vx: -2,
      vy: 18 + Math.random() * 14
    });
  }
}
makeRain();
window.addEventListener("resize", makeRain);

/* Lightning */
let nextStrike = 2000 + Math.random() * 8000;
let sinceStrike = 0;

function lightning(dt) {
  sinceStrike += dt;
  if (sinceStrike < nextStrike) return;

  flash.style.opacity = "1";
  setTimeout(() => (flash.style.opacity = "0"), 90);

  const segments = 12 + Math.floor(Math.random() * 10);
  let x = Math.random() * W;
  let y = -20;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = colors.bolt;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < segments; i++) {
    x += (Math.random() - 0.5) * 50;
    y += H / segments;
    ctx.lineTo(x, y);
    if (Math.random() < 0.18) ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  sinceStrike = 0;
  nextStrike = 2500 + Math.random() * 9000;
}

/* Main animation loop */
let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, colors.skyTop);
  sky.addColorStop(1, colors.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Clouds
  for (const p of cloudPuffs) {
    p.x -= p.s;
    if (p.x < -p.r * 1.5) p.x = W + p.r * 1.5;

    const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r);
    grad.addColorStop(0, colors.cloud);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rain
  ctx.strokeStyle = colors.rain;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const d of drops) {
    d.x += d.vx;
    d.y += d.vy;
    if (d.y > H + 20 || d.x < -20) {
      d.x = Math.random() * W + 40;
      d.y = -20;
    }
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.vx * 0.8, d.y - d.l);
  }
  ctx.stroke();

  // Lightning (visual only)
  lightning(dt);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ========= STARTUP ========= */
showPanel(1);
