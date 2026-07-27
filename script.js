/* Plan C — Agent Orchestrator */

// Theme color map for canvas grid/pulses
const themeColors = {
  matrix:      { r: 200, g: 255, b: 0   },
  bladerunner: { r: 255, g: 106, b: 0   },
  tron:        { r: 0,   g: 212, b: 255  },
  synth:       { r: 255, g: 45,  b: 149  },
  amber:       { r: 255, g: 179, b: 0    },
};
let currentColor = themeColors.matrix;

// Theme switcher
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentColor = themeColors[theme] || themeColors.matrix;
  });
});

// Grid background + mouse effects
// Guarded: this file is shared by index.html and projects.html, and an
// unguarded getContext() on a missing canvas throws and kills everything below.
const canvas = document.getElementById('gridCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let mouseX = -1000, mouseY = -1000;
let mouseTrail = [];
let clickRipples = [];
let sparkParticles = [];

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // Add trail point
  mouseTrail.push({ x: e.clientX, y: e.clientY, life: 1 });
  if (mouseTrail.length > 40) mouseTrail.shift();
  // Spawn spark particles on fast movement
  if (mouseTrail.length > 2) {
    const prev = mouseTrail[mouseTrail.length - 2];
    const speed = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
    if (speed > 8) {
      for (let i = 0; i < 2; i++) {
        sparkParticles.push({
          x: e.clientX, y: e.clientY,
          vx: (Math.random() - 0.5) * speed * 0.3,
          vy: (Math.random() - 0.5) * speed * 0.3,
          life: 1, size: Math.random() * 2.5 + 1
        });
      }
    }
  }
});

// Click ripple
document.addEventListener('click', (e) => {
  clickRipples.push({ x: e.clientX, y: e.clientY, radius: 0, life: 1 });
  // Burst of sparks
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    sparkParticles.push({
      x: e.clientX, y: e.clientY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 1, size: Math.random() * 3 + 1
    });
  }
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = 60;
  const { r, g, b } = currentColor;

  // Draw grid lines — brighten near mouse
  for (let x = 0; x <= canvas.width; x += size) {
    const dist = Math.abs(x - mouseX);
    const glow = dist < 200 ? 0.03 + 0.08 * (1 - dist / 200) : 0.03;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${glow})`;
    ctx.lineWidth = dist < 150 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += size) {
    const dist = Math.abs(y - mouseY);
    const glow = dist < 200 ? 0.03 + 0.08 * (1 - dist / 200) : 0.03;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${glow})`;
    ctx.lineWidth = dist < 150 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Grid intersections glow near mouse
  for (let x = 0; x <= canvas.width; x += size) {
    for (let y = 0; y <= canvas.height; y += size) {
      const dist = Math.hypot(x - mouseX, y - mouseY);
      if (dist < 180) {
        const intensity = (1 - dist / 180) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 2 + intensity * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
        ctx.fill();
      }
    }
  }

  // Mouse glow orb
  const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 120);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(mouseX - 120, mouseY - 120, 240, 240);

  drawTrail(r, g, b);
  drawSparks(r, g, b);
  drawRipples(r, g, b);
  drawPulses();
}

function drawTrail(r, g, b) {
  for (let i = mouseTrail.length - 1; i >= 0; i--) {
    const p = mouseTrail[i];
    p.life -= 0.03;
    if (p.life <= 0) { mouseTrail.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.life * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life * 0.25})`;
    ctx.fill();
    // Connect trail dots
    if (i > 0 && mouseTrail[i - 1]) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouseTrail[i - 1].x, mouseTrail[i - 1].y);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${p.life * 0.1})`;
      ctx.lineWidth = p.life * 1.5;
      ctx.stroke();
    }
  }
}

function drawSparks(r, g, b) {
  for (let i = sparkParticles.length - 1; i >= 0; i--) {
    const s = sparkParticles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.96;
    s.vy *= 0.96;
    s.life -= 0.025;
    if (s.life <= 0) { sparkParticles.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${s.life * 0.7})`;
    ctx.fill();
  }
}

function drawRipples(r, g, b) {
  for (let i = clickRipples.length - 1; i >= 0; i--) {
    const rp = clickRipples[i];
    rp.radius += 4;
    rp.life -= 0.015;
    if (rp.life <= 0) { clickRipples.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rp.life * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner ring
    if (rp.radius > 20) {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rp.life * 0.2})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

let pulses = [];
function spawnPulse() {
  const isHorizontal = Math.random() > 0.5;
  const size = 60;
  pulses.push({
    x: isHorizontal ? 0 : Math.round(Math.random() * (canvas.width / size)) * size,
    y: isHorizontal ? Math.round(Math.random() * (canvas.height / size)) * size : 0,
    dx: isHorizontal ? 2 : 0,
    dy: isHorizontal ? 0 : 2,
    life: 1
  });
}

function drawPulses() {
  const { r, g, b } = currentColor;
  pulses.forEach((p, i) => {
    p.x += p.dx;
    p.y += p.dy;
    p.life -= 0.003;
    if (p.life <= 0 || p.x > canvas.width || p.y > canvas.height) {
      pulses.splice(i, 1);
      return;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life * 0.3})`;
    ctx.fill();
  });
}

function animateGrid() {
  drawGrid();
  if (Math.random() > 0.97) spawnPulse();
  requestAnimationFrame(animateGrid);
}

// Every draw path dereferences `canvas`/`ctx`, so start the loop only when the
// canvas is actually on the page.
if (canvas) {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  animateGrid();
}

// Typed subtitle
const subtitle = document.getElementById('heroSubtitle');
const phrases = [
  'Agentic AI architect.',
  'Multi-agent orchestration.',
  'PhD — deep problem solver.',
  'From research to production.',
];
let phraseIdx = 0, charIdx = 0, deleting = false;

function typeLoop() {
  const phrase = phrases[phraseIdx];
  if (deleting) {
    subtitle.textContent = phrase.substring(0, --charIdx);
  } else {
    subtitle.textContent = phrase.substring(0, ++charIdx);
  }

  let speed = deleting ? 30 : 60;

  if (!deleting && charIdx === phrase.length) {
    speed = 2500;
    deleting = true;
  } else if (deleting && charIdx === 0) {
    deleting = false;
    phraseIdx = (phraseIdx + 1) % phrases.length;
    speed = 400;
  }
  setTimeout(typeLoop, speed);
}
// Only start typing where the hero exists — typeLoop() writes subtitle.textContent
// directly, so on a page without #heroSubtitle this threw a TypeError 2.5s in.
if (subtitle) setTimeout(typeLoop, 2500);

// Scroll reveal sections
const sections = document.querySelectorAll('.section');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
sections.forEach(s => observer.observe(s));

// Terminal lines in agent card — retrigger on scroll
const agentTerm = document.getElementById('agentTerm1');
if (agentTerm) {
  const termObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const lines = e.target.querySelectorAll('.term-line');
        lines.forEach((l, i) => {
          l.style.animation = 'none';
          l.offsetHeight; // force reflow
          l.style.animation = `termType 0.3s ${0.3 + i * 0.5}s ease forwards`;
        });
        termObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  termObserver.observe(agentTerm);
}
