// ============================================================
// STAL CREATIEF BUREAU — animations.js
// ============================================================


// ── Accordions ─────────────────────────────────────

function initAccordionCSS() {
  document.querySelectorAll('[data-accordion-css-init]').forEach((accordion) => {
    const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

    accordion.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-accordion-toggle]');
      if (!toggle) return;

      const singleAccordion = toggle.closest('[data-accordion-status]');
      if (!singleAccordion) return;

      const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
      singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== singleAccordion) sibling.setAttribute('data-accordion-status', 'not-active');
        });
      }
    });
  });
}


// ── Draggable marquee ─────────────────────────────────────

function initDraggableMarquee() {
  const ROTATION_PATTERN = [-3, 2, -4, 4];

  const wrappers = document.querySelectorAll("[data-draggable-marquee-init]");
  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (wrapper.getAttribute("data-draggable-marquee-init") === "initialized") return;
    const collection = wrapper.querySelector("[data-draggable-marquee-collection]");
    const list = wrapper.querySelector("[data-draggable-marquee-list]");
    if (!collection || !list) return;

    const duration    = getNumberAttr(wrapper, "data-duration", 20);
    const multiplier  = getNumberAttr(wrapper, "data-multiplier", 40);
    const sensitivity = getNumberAttr(wrapper, "data-sensitivity", 0.01);
    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth    = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      collection.appendChild(listClone);
    }

    const items = Array.from(collection.querySelectorAll('[data-draggable-marquee-item]'));
    items.forEach(item => { item.style.willChange = 'transform'; });

    function animateToRest() {
      items.forEach(item => {
        gsap.to(item, { rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.35)', overwrite: true });
      });
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);
    gsap.set(collection, { x: 0 });

    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,
      onReverseComplete: () => marqueeLoop.progress(1),
      modifiers: {
        x: (x) => wrapX(parseFloat(x)) + "px"
      },
    });

    const initialDirectionAttr = (wrapper.getAttribute("data-direction") || "left").toLowerCase();
    const baseDirection = initialDirectionAttr === "right" ? -1 : 1;

    function applyTimeScale(val) {
      marqueeLoop.timeScale(val);
    }
    applyTimeScale(baseDirection);

    let isDragging     = false;
    let rawVelocity    = 0;
    let smoothVelocity = 0;
    let smoothRotation = 0;
    let lastMouseX     = 0;
    let tickerAdded    = false;
    let throwTween     = null;

    function onTick() {
      smoothVelocity += (rawVelocity - smoothVelocity) * 0.15;

      const raw = gsap.utils.clamp(-multiplier * 40, multiplier * 40, smoothVelocity * sensitivity * -60);
      applyTimeScale(raw || baseDirection);

      const rotTarget = smoothVelocity * 0.03;
      smoothRotation += (rotTarget - smoothRotation) * 0.1;

      items.forEach((item, i) => {
        const base = ROTATION_PATTERN[i % ROTATION_PATTERN.length];
        gsap.set(item, { rotation: base * smoothRotation });
      });
    }

    wrapper.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      rawVelocity = 0;
      smoothVelocity = 0;
      wrapper.style.cursor = 'grabbing';

      if (throwTween) { throwTween.kill(); throwTween = null; }

      if (!tickerAdded) {
        gsap.ticker.add(onTick);
        tickerAdded = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      rawVelocity = e.clientX - lastMouseX;
      lastMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.style.cursor = 'grab';

      gsap.ticker.remove(onTick);
      tickerAdded = false;

      const throwTimeScale = gsap.utils.clamp(-multiplier * 40, multiplier * 40, smoothVelocity * sensitivity * -60);

      items.forEach((item, i) => {
        const base = ROTATION_PATTERN[i % ROTATION_PATTERN.length];
        const peak = base * smoothRotation * 1.4;
        gsap.timeline()
          .to(item, { rotation: peak, duration: 0.25, ease: 'power2.out' })
          .to(item, { rotation: 0, duration: 1.4, ease: 'elastic.out(1, 0.4)' });
      });

      const proxy = { value: throwTimeScale };
      throwTween = gsap.to(proxy, {
        value: baseDirection,
        duration: 2.0,
        ease: "power4.out",
        onUpdate: () => applyTimeScale(proxy.value),
        onComplete: () => { throwTween = null; }
      });

      rawVelocity = 0;
      smoothVelocity = 0;
      smoothRotation = 0;
    });

    wrapper.style.cursor = 'grab';

    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => marqueeLoop.resume(),
      onEnterBack: () => marqueeLoop.resume(),
      onLeave: () => marqueeLoop.pause(),
      onLeaveBack: () => marqueeLoop.pause()
    });

    wrapper.setAttribute("data-draggable-marquee-init", "initialized");
  });
}


// ── Portfolio list ─────────────────────────────────────

function initPreviewFollower() {
  const wrappers = document.querySelectorAll('[data-follower-wrap]');
  wrappers.forEach(wrap => {
    const collection    = wrap.querySelector('[data-follower-collection]');
    const items         = wrap.querySelectorAll('[data-follower-item]');
    const follower      = wrap.querySelector('[data-follower-cursor]');
    const followerInner = wrap.querySelector('[data-follower-cursor-inner]');
    if (!follower) return;

    // Follower uit de (mogelijk getransformeerde) sectie halen en aan de body
    // hangen, zodat position:fixed weer t.o.v. de viewport werkt.
    document.body.appendChild(follower);

    let prevIndex  = null;
    let firstEntry = true;
    const offset   = 100;
    const duration = 0.5;
    const ease     = 'power2.inOut';
    gsap.set(follower, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });
    window.addEventListener('mousemove', e => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        const forward = prevIndex === null || index > prevIndex;
        prevIndex = index;
        follower.querySelectorAll('[data-follower-visual]').forEach(el => {
          gsap.killTweensOf(el);
          gsap.to(el, {
            yPercent: forward ? -offset : offset,
            duration,
            ease,
            overwrite: 'auto',
            onComplete: () => el.remove()
          });
        });
        const visual = item.querySelector('[data-follower-visual]');
        if (!visual) return;
        const clone = visual.cloneNode(true);
        followerInner.appendChild(clone);
        if (!firstEntry) {
          gsap.fromTo(clone,
            { yPercent: forward ? offset : -offset },
            { yPercent: 0, duration, ease, overwrite: 'auto' }
          );
        } else {
          firstEntry = false;
        }
      });
      item.addEventListener('mouseleave', () => {
        const el = follower.querySelector('[data-follower-visual]');
        if (!el) return;
        gsap.killTweensOf(el);
        gsap.to(el, {
          yPercent: -offset,
          duration,
          ease,
          overwrite: 'auto',
          onComplete: () => el.remove()
        });
      });
    });
    collection.addEventListener('mouseleave', () => {
      follower.querySelectorAll('[data-follower-visual]').forEach(el => {
        gsap.killTweensOf(el);
        gsap.delayedCall(duration, () => el.remove());
      });
      firstEntry = true;
      prevIndex  = null;
    });
  });
}


// ── Navbar color ─────────────────────────────────────

function initNavbarColor() {
  const nav = document.querySelector('[data-nav-component]');
  if (!nav) return;

  // Basiskleur van de pagina (optioneel). data-nav-start="light" ergens op de
  // pagina (body of page-wrapper) = navbar start licht, ook zonder dark-section.
  const startEl = document.querySelector('[data-nav-start]');
  const pageStartsLight =
    (startEl?.getAttribute('data-nav-start') || '').toLowerCase() === 'light';

  const darkSections = document.querySelectorAll('[data-nav-theme="dark"]');
  const activeDarkSections = new Set();

  const applyColor = () => {
    nav.classList.toggle('nav--light', activeDarkSections.size > 0 || pageStartsLight);
  };

  // Geen dark-sections: alleen de basiskleur zetten en stoppen
  if (!darkSections.length) {
    applyColor();
    return;
  }

  let observer;

  // Synchrone meting bij load → voorkomt de kleurflits voordat de observer draait
  const measureInitial = () => {
    const navHeight = nav.offsetHeight;
    activeDarkSections.clear();
    darkSections.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top <= navHeight + 2 && r.bottom >= navHeight) {
        activeDarkSections.add(el);
      }
    });
    applyColor();
  };

  function buildObserver() {
    if (observer) observer.disconnect();
    measureInitial(); // set + kleur meteen herijken
    const navHeight = nav.offsetHeight;
    const viewportHeight = window.innerHeight;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeDarkSections.add(entry.target);
          else activeDarkSections.delete(entry.target);
        });
        applyColor();
      },
      {
        rootMargin: `-${navHeight}px 0px -${viewportHeight - navHeight - 2}px 0px`,
        threshold: 0,
      }
    );
    darkSections.forEach((el) => observer.observe(el));
  }

  buildObserver();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildObserver, 150);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavbarColor);
} else {
  initNavbarColor();
}


// ── Footer Parallax Animatie ─────────────────────────────────────

function initFooterParallax() {
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
      tl.from(inner, { yPercent: -25, ease: 'linear' });
    }

    if (dark) {
      tl.from(dark, { opacity: 0.5, ease: 'linear' }, '<');
    }
  });
}


// ── Footer Tekst Animatie ─────────────────────────────────────

function initFooterTekstAnimatie() {
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

  tl.to(heading1, { y: 0, duration: 0.5, ease: 'power3.out' });
  tl.to(heading2, { y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.35');
}


// ── Footer Cursor ───────────────────────────────────────────

function initDrawPathCursorEffect() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const trailDuration  = 1250;
  const trailColor     = '#a8e943';
  const strokeMinWidth = 5;
  const strokeMaxWidth = 16;
  const strokeSmoothing = 0.1;
  const velocitySlow   = 0.08;
  const velocityFast   = 2.8;
  const glowBlur       = 10;
  const glowIntensity  = 0.25;
  const cursorLag      = 0.15;

  const dot    = document.querySelector('[data-cursor-dot]');
  const canvas = document.querySelector('[data-cursor-canvas]');
  if (!dot || !canvas) return;
  const ctx = canvas.getContext('2d');

  let points       = [];
  let hasMouse     = false;
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
    const dpr    = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });

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
    ctx.lineCap      = 'butt';
    ctx.shadowColor  = `rgba(${r}, ${g}, ${b}, ${glowIntensity})`;
    ctx.shadowBlur   = glowBlur;

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const mx1 = (prev.x + curr.x) * 0.5;
      const my1 = (prev.y + curr.y) * 0.5;
      const mx2 = (curr.x + next.x) * 0.5;
      const my2 = (curr.y + next.y) * 0.5;

      const dx  = curr.x - prev.x;
      const dy  = curr.y - prev.y;
      const dt  = curr.time - prev.time || 1;
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

      const targetWidth = remap(velocity, velocitySlow, velocityFast, strokeMaxWidth, strokeMinWidth);
      runningWidth += (targetWidth - runningWidth) * strokeSmoothing;

      const age   = now - curr.time;
      const life  = 1 - age / trailDuration;
      const alpha = life * life;
      if (alpha <= 0.005) continue;

      ctx.beginPath();
      ctx.moveTo(mx1, my1);
      ctx.quadraticCurveTo(curr.x, curr.y, mx2, my2);
      ctx.lineWidth    = runningWidth;
      ctx.strokeStyle  = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
  }

  requestAnimationFrame(render);
}


// ── Logo wall cycle ───────────────────────────────────────────

function initLogoWallCycle() {
  const loopDelay = 1.5;
  const duration  = 0.9;

  document.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
    const list  = root.querySelector('[data-logo-wall-list]');
    const items = Array.from(list.querySelectorAll('[data-logo-wall-item]'));

    const shuffleFront    = root.getAttribute('data-logo-wall-shuffle') !== 'false';
    const originalTargets = items
      .map(item => item.querySelector('[data-logo-wall-target]'))
      .filter(Boolean);

    let visibleItems  = [];
    let visibleCount  = 0;
    let pool          = [];
    let pattern       = [];
    let patternIndex  = 0;
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
      if (tl) tl.kill();
      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;
      pattern      = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
      patternIndex = 0;

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
      if (nowCount !== visibleCount) { setup(); return; }
      if (!pool.length) return;

      const idx       = pattern[patternIndex % visibleCount];
      patternIndex++;

      const container = visibleItems[idx];
      const parent    =
        container.querySelector('[data-logo-wall-target-parent]') ||
        container.querySelector('*:has(> [data-logo-wall-target])') ||
        container;
      const existing  = parent.querySelectorAll('[data-logo-wall-target]');
      if (existing.length > 1) return;

      const current  = parent.querySelector('[data-logo-wall-target]');
      const incoming = pool.shift();

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent  : -50,
          autoAlpha : 0,
          duration,
          ease      : "expo.inOut",
          onComplete: () => { current.remove(); pool.push(current); }
        });
      }

      gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration, delay: 0.1, ease: "expo.inOut" });
    }

    setup();

    ScrollTrigger.create({
      trigger     : root,
      start       : 'top bottom',
      end         : 'bottom top',
      onEnter     : () => tl.play(),
      onLeave     : () => tl.pause(),
      onEnterBack : () => tl.play(),
      onLeaveBack : () => tl.pause()
    });

    document.addEventListener('visibilitychange', () =>
      document.hidden ? tl.pause() : tl.play()
    );
  });
}


// ── Radial Marquee ───────────────────────────────────────────

function initRadialMarquee() {
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
}


// ── Hover Cursor Marquee ─────────────────────────────────────

function initHoverCursorMarquee() {
  document.querySelectorAll('.project_link').forEach(link => {
    const tag = link.querySelector('.project_tag');
    if (!tag) return;

    const spans = tag.querySelectorAll('span');
    if (spans.length < 2) return;

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

    const lerp = (start, end, factor) => start + (end - start) * factor;

    function loop() {
      const dx       = targetX - currentX;
      const rotation = dx * 0.08;
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);
      gsap.set(tag, { x: currentX, y: currentY, rotation });
      rafId = requestAnimationFrame(loop);
    }

    link.addEventListener('mouseenter', (e) => {
      gsap.killTweensOf(tag);
      const rect = link.getBoundingClientRect();
      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      targetX  = currentX;
      targetY  = currentY;
      gsap.set(tag, { x: currentX, y: currentY });
      gsap.to(tag, { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      marquee.play();
      if (!rafId) rafId = requestAnimationFrame(loop);
    });

    link.addEventListener('mouseleave', () => {
      gsap.killTweensOf(tag);
      cancelAnimationFrame(rafId);
      rafId = null;
      gsap.to(tag, {
        opacity  : 0,
        scale    : 0,
        rotation : 0,
        duration : 0.3,
        ease     : 'power3.in',
        onComplete: () => { marquee.pause(); }
      });
    });

    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      targetX    = e.clientX - rect.left;
      targetY    = e.clientY - rect.top;
    });
  });
}

// ── Init ─────────────────────────────────────────────────────

window.addEventListener('load', () => {
  initAccordionCSS();
  initDraggableMarquee();
  initPreviewFollower();
  initNavbarColor();
  initFooterParallax();
  initFooterTekstAnimatie();
  initDrawPathCursorEffect();
  initLogoWallCycle();
  initRadialMarquee();
  initHoverCursorMarquee();
});
