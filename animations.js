// ============================================================
// STAL CREATIEF BUREAU — animations.js
// ============================================================


// ── Footer Parallax Animatie ─────────────────────────────────────

gsap.registerPlugin(ScrollTrigger);

function initFooterParallax(){
  document.querySelectorAll('[data-footer-parallax]').forEach(el => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'top top',
        scrub: true
      }
    });
  
    const inner = el.querySelector('[data-footer-parallax-inner]');
    const dark  = el.querySelector('[data-footer-parallax-dark]');
  
    if (inner) {
      tl.from(inner, {
        yPercent: -50,
        ease: 'linear'
      });
    }
  
    if (dark) {
      tl.from(dark, {
        opacity: 0.5,
        ease: 'linear'
      }, '<');
    }
  });
}
// Initialize Footer with Parallax Effect
document.addEventListener('DOMContentLoaded', () => {
  initFooterParallax();
});


// ── Footer Tekst Animatie ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  const footerTop = document.querySelector('.footer_top');
  if (!footerTop) return;

  const wraps = footerTop.querySelectorAll('.footer-top_text-wrap');
  if (wraps.length < 2) return;

  const heading1 = wraps[0].querySelector('.heading-style-footer');
  const heading2 = wraps[1].querySelector('.heading-style-footer');

  if (!heading1 || !heading2) return;

  const h = heading1.offsetHeight;
  gsap.set([heading1, heading2], { y: h });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger      : footerTop,
      start        : 'top top+=200px',
      toggleActions: 'play none none none',
    }
  });

  tl.to(heading1, {
    y        : 0,
    duration : 0.5,
    ease     : 'power3.out',
  });

  tl.to(heading2, {
    y        : 0,
    duration : 0.5,
    ease     : 'power3.out',
  }, '-=0.35');

});


// ── Footer Cursor ───────────────────────────────────────────

function initDrawPathCursorEffect() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Config
  const trailDuration = 1250; // how long the trail lingers in ms
  const trailColor = '#a8e943'; // hex color of the trail

  const strokeMinWidth = 5; // thinnest line (fast movement)
  const strokeMaxWidth = 16; // thickest line (slow movement)
  const strokeSmoothing = 0.1; // 0–1 — lower = smoother width transitions

  const velocitySlow = 0.08; // px/ms threshold for "slow"
  const velocityFast = 2.8; // px/ms threshold for "fast"

  const glowBlur = 10; // px — glow radius
  const glowIntensity = 0.25; // 0–1 — glow opacity

  const cursorLag = 0.15; // seconds — GSAP easing duration

  const dot = document.querySelector('[data-cursor-dot]');
  const canvas = document.querySelector('[data-cursor-canvas]');
  const ctx = canvas.getContext('2d');

  let points = [];
  let hasMouse = false;
  let runningWidth = strokeMinWidth;

  function hexToRgb(hex) {
    const m = hex.replace('#', '').match(/.{2}/g);
    return m.map(c => parseInt(c, 16));
  }

  const color = hexToRgb(trailColor);

  gsap.set(dot, { xPercent: -50, yPercent: -50, opacity: 0 });
  const xTo = gsap.quickTo(dot, 'x', { duration: cursorLag, ease: 'power3' });
  const yTo = gsap.quickTo(dot, 'y', { duration: cursorLag, ease: 'power3' });

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
  });
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
  });

  window.addEventListener('mousemove', (e) => {
    hasMouse = true;
    xTo(e.clientX);
    yTo(e.clientY);
  });

  gsap.ticker.add(() => {
    if (!hasMouse) return;

    const x = gsap.getProperty(dot, 'x');
    const y = gsap.getProperty(dot, 'y');

    if (points.length > 0) {
      const last = points[points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      if (dx * dx + dy * dy < 0.1) return;
    }

    points.push({ x, y, time: performance.now() });
  });

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function remap(v, inMin, inMax, outMin, outMax) {
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return outMin + t * (outMax - outMin);
  }

  function render() {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = points.filter(p => now - p.time < trailDuration);

    if (points.length >= 3) drawTrail(now);
    requestAnimationFrame(render);
  }

  function drawTrail(now) {
    const [r, g, b] = color;

    ctx.lineCap = 'butt';
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowIntensity})`;
    ctx.shadowBlur = glowBlur;

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const mx1 = (prev.x + curr.x) * 0.5;
      const my1 = (prev.y + curr.y) * 0.5;
      const mx2 = (curr.x + next.x) * 0.5;
      const my2 = (curr.y + next.y) * 0.5;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dt = curr.time - prev.time || 1;
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

      const targetWidth = remap(velocity, velocitySlow, velocityFast, strokeMaxWidth, strokeMinWidth);
      runningWidth += (targetWidth - runningWidth) * strokeSmoothing;

      const age = now - curr.time;
      const life = 1 - age / trailDuration;
      const alpha = life * life;
      if (alpha <= 0.005) continue;

      ctx.beginPath();
      ctx.moveTo(mx1, my1);
      ctx.quadraticCurveTo(curr.x, curr.y, mx2, my2);
      ctx.lineWidth = runningWidth;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(render);
}


// Initialize Draw Path Cursor Effect
document.addEventListener('DOMContentLoaded', () => {
  initDrawPathCursorEffect();
});


// ── Logo wall cycle ───────────────────────────────────────────

function initLogoWallCycle() {
  const loopDelay = 1.5;   // Loop Duration
  const duration  = 0.9;   // Animation Duration

  document.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
    const list   = root.querySelector('[data-logo-wall-list]');
    const items  = Array.from(list.querySelectorAll('[data-logo-wall-item]'));

    const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';
    const originalTargets = items
      .map(item => item.querySelector('[data-logo-wall-target]'))
      .filter(Boolean);

    let visibleItems   = [];
    let visibleCount   = 0;
    let pool           = [];
    let pattern        = [];
    let patternIndex   = 0;
    let tl;

    function isVisible(el) {
      return window.getComputedStyle(el).display !== 'none';
    }

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function setup() {
      if (tl) {
        tl.kill();
      }
      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;

      pattern = shuffleArray(
        Array.from({ length: visibleCount }, (_, i) => i)
      );
      patternIndex = 0;

      // remove all injected targets
      items.forEach(item => {
        item.querySelectorAll('[data-logo-wall-target]').forEach(old => old.remove());
      });

      pool = originalTargets.map(n => n.cloneNode(true));

      let front, rest;
      if (shuffleFront) {
        const shuffledAll = shuffleArray(pool);
        front = shuffledAll.slice(0, visibleCount);
        rest  = shuffleArray(shuffledAll.slice(visibleCount));
      } else {
        front = pool.slice(0, visibleCount);
        rest  = shuffleArray(pool.slice(visibleCount));
      }
      pool = front.concat(rest);

      for (let i = 0; i < visibleCount; i++) {
        const parent =
          visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
          visibleItems[i];
        parent.appendChild(pool.shift());
      }

      tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
      tl.call(swapNext);
      tl.play();
    }

    function swapNext() {
      const nowCount = items.filter(isVisible).length;
      if (nowCount !== visibleCount) {
        setup();
        return;
      }
      if (!pool.length) return;

      const idx = pattern[patternIndex % visibleCount];
      patternIndex++;

      const container = visibleItems[idx];
      const parent =
        container.querySelector('[data-logo-wall-target-parent]') ||
        container.querySelector('*:has(> [data-logo-wall-target])') ||
        container;
      const existing = parent.querySelectorAll('[data-logo-wall-target]');
      if (existing.length > 1) return;

      const current  = parent.querySelector('[data-logo-wall-target]');
      const incoming = pool.shift();

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: "expo.inOut",
          onComplete: () => {
            current.remove();
            pool.push(current);
          }
        });
      }

      gsap.to(incoming, {
        yPercent: 0,
        autoAlpha: 1,
        duration,
        delay: 0.1,
        ease: "expo.inOut"
      });
    }

    setup();

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter:     () => tl.play(),
      onLeave:     () => tl.pause(),
      onEnterBack: () => tl.play(),
      onLeaveBack: () => tl.pause()
    });

    document.addEventListener('visibilitychange', () =>
      document.hidden ? tl.pause() : tl.play()
    );
  });
}

// Initialize Logo Wall Cycle
document.addEventListener('DOMContentLoaded', () => {
  initLogoWallCycle();
});


// ── Radial Marquee ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  const section = document.querySelector('[data-radial-marquee]');
  if (!section) return;

  const speed  = parseFloat(section.dataset.speed  ?? 30);
  const repeat = parseInt(section.dataset.repeat   ?? 2);

  function getRadius() {
    const vw       = window.innerWidth;
    const radiusLg = parseFloat(section.dataset.radiusLg ?? null);
    if (radiusLg && vw >= 1600) return radiusLg;
    return parseFloat(section.dataset.radius ?? 2000);
  }

  const list      = section.querySelector('.reviews_list');
  const originals = Array.from(section.querySelectorAll('.reviews_item'));
  const count     = originals.length;
  if (!count) return;

  Array.from({ length: repeat - 1 }).forEach(() => {
    originals.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      list.appendChild(clone);
    });
  });

  const items      = section.querySelectorAll('.reviews_item');
  const total      = items.length;
  const collection = section.querySelector('.reviews_collection');

  let angle      = 0;
  let degsPerSec = 360 / speed;

  function positionCards(offsetDeg) {
    const radius  = getRadius();
    const cy      = radius;
    const stepDeg = 360 / total;

    items.forEach((item, i) => {
      const deg = stepDeg * i + offsetDeg;
      const rad = (deg * Math.PI) / 180;

      gsap.set(item, {
        x        : Math.sin(rad) * radius,
        y        : cy - Math.cos(rad) * radius,
        rotation : deg,
        xPercent : -50,
        yPercent : -50,
      });
    });
  }

  positionCards(0);

  const cardHeight = items[0].offsetHeight;
  gsap.set(collection, { y: cardHeight / 2 });

  const tick = (_, dt) => {
    angle -= degsPerSec * (dt / 1000);
    positionCards(angle);
  };

  ScrollTrigger.create({
    trigger     : section,
    start       : 'top bottom',
    end         : 'bottom top',
    onEnter     : () => gsap.ticker.add(tick),
    onLeave     : () => gsap.ticker.remove(tick),
    onEnterBack : () => gsap.ticker.add(tick),
    onLeaveBack : () => gsap.ticker.remove(tick),
  });

  window.addEventListener('resize', () => {
    gsap.set(collection, { y: items[0].offsetHeight / 2 });
    positionCards(angle);
  });

});


// ── Hover Cursor Marquee ─────────────────────────────────────

window.addEventListener('load', () => {
  const links = document.querySelectorAll('.project_link');

  links.forEach(link => {
    const tag = link.querySelector('.project_tag');
    if (!tag) return;

    const spans = tag.querySelectorAll('span');
    if (spans.length < 2) return;

    const headingDefault = link.closest('.project_card').querySelector('.heading-default');
    const headingHover   = link.closest('.project_card').querySelector('.heading-hover');
    const headingClip    = link.closest('.project_card').querySelector('.heading-clip');

    const splitDefault = new SplitText(headingDefault, { type: 'chars' });
    const splitHover   = new SplitText(headingHover,   { type: 'chars' });

    const headingHeight = headingClip.offsetHeight;

    gsap.set(splitHover.chars, { y: headingHeight });

    const marquee = gsap.to(spans, {
      xPercent : -100,
      repeat   : -1,
      duration : 2,
      ease     : 'none',
      paused   : true
    }).totalProgress(0.5);

    let currentX = 0;
    let currentY = 0;
    let targetX  = 0;
    let targetY  = 0;
    let rafId    = null;

    gsap.set(tag, { opacity: 0, scale: 0 });

    function lerp(start, end, factor) {
      return start + (end - start) * factor;
    }

    function loop() {
      const dx       = targetX - currentX;
      const rotation = dx * 0.08;

      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);

      gsap.set(tag, { x: currentX, y: currentY, rotation });

      rafId = requestAnimationFrame(loop);
    }

    link.addEventListener('mouseenter', (e) => {
      const rect = link.getBoundingClientRect();

      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      targetX  = currentX;
      targetY  = currentY;

      gsap.set(tag, { x: currentX, y: currentY });
      gsap.to(tag, { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });

      gsap.to(splitDefault.chars, { y: -headingHeight, duration: 0.4, ease: 'power2.inOut', stagger: 0.02 });
      gsap.to(splitHover.chars,   { y: 0,              duration: 0.4, ease: 'power2.inOut', stagger: 0.02 });

      marquee.play();
      rafId = requestAnimationFrame(loop);
    });

    link.addEventListener('mouseleave', () => {
      gsap.to(tag, {
        opacity  : 0,
        scale    : 0,
        rotation : 0,
        duration : 0.3,
        ease     : 'power3.in',
        onComplete: () => {
          marquee.pause();
          cancelAnimationFrame(rafId);
        }
      });

      gsap.to(splitDefault.chars, { y: 0,             duration: 0.4, ease: 'power2.inOut', stagger: 0.02 });
      gsap.to(splitHover.chars,   { y: headingHeight, duration: 0.4, ease: 'power2.inOut', stagger: 0.02 });
    });

    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      targetX    = e.clientX - rect.left;
      targetY    = e.clientY - rect.top;
    });
  });
});
