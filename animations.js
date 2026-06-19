// ============================================================
// STAL CREATIEF BUREAU — animations.js
// ============================================================


// ── Plugin- & ease-registratie (één keer, vóór alle inits) ──

gsap.registerPlugin(
  ...[
    window.ScrollTrigger,
    window.Draggable,
    window.InertiaPlugin,
    window.SplitText,
    window.CustomEase,
  ].filter(Boolean)
);

CustomEase.create('textHoverEase', '0.625, 0.05, 0, 1');


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
    const radiusLg = parseFloat(section.dataset.radiusLg);
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

    gsap.set(tag, { opacity: 0, scale: 0, force3D: true });

    // QuickSetters: directe property-writes zonder tween-overhead
    const setX   = gsap.quickSetter(tag, 'x', 'px');
    const setY   = gsap.quickSetter(tag, 'y', 'px');
    const setRot = gsap.quickSetter(tag, 'rotation', 'deg');

    let rect     = null;
    let currentX = 0, currentY = 0;
    let targetX  = 0, targetY  = 0;

    function tick() {
      // deltaRatio maakt de lerp framerate-onafhankelijk (genormaliseerd op 60fps)
      const factor = 1 - Math.pow(1 - 0.08, gsap.ticker.deltaRatio(60));
      const dx     = targetX - currentX;

      currentX += dx * factor;
      currentY += (targetY - currentY) * factor;

      setX(currentX);
      setY(currentY);
      setRot(dx * 0.08);
    }

    const updateRect = () => { rect = link.getBoundingClientRect(); };

    link.addEventListener('mouseenter', (e) => {
      gsap.killTweensOf(tag);
      updateRect();

      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      targetX  = currentX;
      targetY  = currentY;

      setX(currentX);
      setY(currentY);
      setRot(0);

      gsap.to(tag, { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      marquee.play();

      gsap.ticker.add(tick);
      window.addEventListener('scroll', updateRect, { passive: true });
    });

    link.addEventListener('mouseleave', () => {
      gsap.killTweensOf(tag);
      gsap.ticker.remove(tick);
      window.removeEventListener('scroll', updateRect);

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
      if (!rect) return;
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    }, { passive: true });
  });
}


// ── Overlapping slider ─────────────────────────────────────

function initOverlappingSlider() {
  const inits = document.querySelectorAll('[data-overlap-slider-init]');
  if (!inits.length) return;

  inits.forEach(setupOverlappingSlider);

  function setupOverlappingSlider(init) {
    // --- attributes with defaults
    const minScale = +(init.getAttribute('data-scale')  ?? 0.45);
    const maxRotation = +(init.getAttribute('data-rotate') ?? -8);
    const inertia = true;

    const wrap = init.querySelector('[data-overlap-slider-collection]');
    const slider = init.querySelector('[data-overlap-slider-list]');
    const slides = Array.from(init.querySelectorAll('[data-overlap-slider-item]'));

    // --- prev / next buttons (optional)
    // Buttons may live INSIDE [data-overlap-slider-init] or OUTSIDE it.
    // Lookup order: inside the init container first, then within an
    // optional [data-overlap-slider-wrap] ancestor (use this when you have
    // multiple sliders on one page), then fall back to the whole document
    // (fine when there's a single slider).
    const scope = init.closest('[data-overlap-slider-wrap]') || document;
    const prevBtn = init.querySelector('[data-overlap-slider-prev]') || scope.querySelector('[data-overlap-slider-prev]');
    const nextBtn = init.querySelector('[data-overlap-slider-next]') || scope.querySelector('[data-overlap-slider-next]');

    if (!wrap || !slider || !slides.length) {
      console.warn("OverlappingSlider: missing required structure. Check Osmo Vault documentation please.");
      return;
    }

    wrap.style.touchAction = 'none';
    wrap.style.userSelect = 'none';

    let spacing = 0;
    let slideW = 0;
    let maxDrag = 0;
    let dragX = 0;
    let draggable;

    // simple clamp that always uses latest maxDrag
    function clamp(value) {
      if (maxDrag <= 0) return 0;
      return Math.min(Math.max(value, 0), maxDrag);
    }

    function update() {
      // move the whole list
      gsap.set(slider, { x: -dragX });

      // update each slide's overlap transform
      slides.forEach((slide, i) => {
        const threshold = i * spacing;
        const local = Math.max(0, dragX - threshold);
        const t = spacing > 0 ? Math.min(local / spacing, 1) : 0;

        gsap.set(slide, {
          x: local,
          scale: 1 - (1 - minScale) * t,
          rotation: maxRotation * t,
          transformOrigin: '75% center'
        });
      });
    }

    function recalc() {
      if (!slides.length) return;

      // measure one slide to get width + margin-right as "gap"
      const style = getComputedStyle(slides[0]);
      const gapRight = parseFloat(style.marginRight) || 0;

      slideW = slides[0].offsetWidth;
      spacing = slideW + gapRight;
      maxDrag = spacing * (slides.length - 1);

      // keep dragX within new bounds
      dragX = clamp(dragX);
      update();

      if (draggable) {
        draggable.applyBounds({ minX: -maxDrag, maxX: 0 });
      }

      // keep index + buttons in sync after a resize
      syncIndexFromDrag();
    }

    // create draggable
    draggable = Draggable.create(slider, {
      type: 'x',
      bounds: { minX: -maxDrag, maxX: 0 }, // will be updated after recalc
      inertia,
      maxDuration: 1,
      snap: (raw) => {
        // raw is the x value
        const d = clamp(-raw);
        const idx = spacing > 0 ? Math.round(d / spacing) : 0;
        return -idx * spacing;
      },
      onDrag() {
        dragX = clamp(-this.x);
        update();
      },
      onThrowUpdate() {
        dragX = clamp(-this.x);
        update();
      },
      // sync currentIndex after the user lets go / throw settles,
      // so buttons + keyboard continue from the correct slide
      onDragEnd() {
        syncIndexFromDrag();
      },
      onThrowComplete() {
        syncIndexFromDrag();
      }
    })[0];

    // recalc on resize
    const ro = new ResizeObserver(() => {
      recalc();
    });
    ro.observe(init);

    // keyboard navigation (arrow left/right)
    let active = false;
    let currentIndex = 0;

    // derive the active index from the current drag position
    function syncIndexFromDrag() {
      currentIndex = spacing > 0 ? Math.round(dragX / spacing) : 0;
      currentIndex = Math.max(0, Math.min(currentIndex, slides.length - 1));
      updateButtons();
    }

    // enable/disable buttons at the start/end of the slider.
    // uses aria-disabled + .is-disabled so it also works on Webflow
    // links/divs (where the native `disabled` property is ignored).
    function updateButtons() {
      if (prevBtn) {
        const atStart = currentIndex <= 0;
        prevBtn.disabled = atStart;
        prevBtn.setAttribute('aria-disabled', atStart);
        prevBtn.classList.toggle('is-disabled', atStart);
      }
      if (nextBtn) {
        const atEnd = currentIndex >= slides.length - 1;
        nextBtn.disabled = atEnd;
        nextBtn.setAttribute('aria-disabled', atEnd);
        nextBtn.classList.toggle('is-disabled', atEnd);
      }
    }

    // helper function to switch slides
    function goToSlide(idx) {
      idx = Math.max(0, Math.min(idx, slides.length - 1));
      currentIndex = idx;

      const targetX = idx * spacing;

      gsap.to({ value: dragX }, {
        value: targetX,
        duration: 0.6,
        ease: "power4.out",
        onUpdate: function () {
          dragX = this.targets()[0].value;
          gsap.set(slider, { x: -dragX });
          update(); // animate overlap transforms properly
        }
      });

      updateButtons();
      wrap.setAttribute("aria-label", `Slide ${idx + 1} of ${slides.length}`);
    }

    // Observe visibility
    const io = new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
    }, {
      threshold: 0.25 // slider must be at least 25% visible
    });

    io.observe(init);

    // Aria labels for accessibility
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-roledescription", "carousel");
    wrap.setAttribute("aria-label", "Testimonial slider");

    // --- button controls
    if (prevBtn) {
      prevBtn.setAttribute('aria-label', 'Previous slide');
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.setAttribute('aria-label', 'Next slide');
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentIndex + 1);
      });
    }

    // key listener
    function onKey(e) {
      if (!active) return; // only respond when slider in view

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(currentIndex - 1);
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide(currentIndex + 1);
      }
    }
    window.addEventListener("keydown", onKey);

    // initial layout
    recalc();
    updateButtons();
  }
}


// ── CSS marquee ─────────────────────────────────────

function initCSSMarquee() {
  const pixelsPerSecond = 75; // Set the marquee speed (pixels per second)
  const marquees = document.querySelectorAll('[data-css-marquee]');

  // Duplicate each [data-css-marquee-list] element inside its container
  marquees.forEach(marquee => {
    marquee.querySelectorAll('[data-css-marquee-list]').forEach(list => {
      const duplicate = list.cloneNode(true);
      marquee.appendChild(duplicate);
    });
  });

  // Create an IntersectionObserver to check if the marquee container is in view
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.querySelectorAll('[data-css-marquee-list]').forEach(list =>
        list.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused'
      );
    });
  }, { threshold: 0 });

  // Calculate the width and set the animation duration accordingly
  marquees.forEach(marquee => {
    marquee.querySelectorAll('[data-css-marquee-list]').forEach(list => {
      list.style.animationDuration = (list.offsetWidth / pixelsPerSecond) + 's';
      list.style.animationPlayState = 'paused';
    });
    observer.observe(marquee);
  });
}


// ── Load Reveal ─────────────────────────────────────────────────────

function initLoadReveal(scope = document) {
  const targets = scope.querySelectorAll('[data-load-reveal]');
  if (!targets.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.fonts.ready.then(() => {
    targets.forEach((el) => {
      const type = el.dataset.loadReveal || 'lines';
      const delay = parseFloat(el.dataset.loadDelay) || 0;

      if (reducedMotion) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }

      // ── Tekst per regel ──
      if (type === 'lines') {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { visibility: 'visible' });
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.4,
              ease: 'textHoverEase',
              stagger: 0.08,
              delay,
            });
          },
        });
        return;
      }

      // ── Heel element (div, image, button) ──
      if (type === 'element') {
        gsap.set(el, { visibility: 'visible' });
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 0.4,
          ease: 'textHoverEase',
          delay,
        });
        return;
      }

      // ── Children van een wrapper gestaggerd ──
      if (type === 'group') {
        const children = el.children;
        gsap.set(el, { visibility: 'visible' });
        gsap.from(children, {
          y: 40,
          autoAlpha: 0,
          duration: 0.4,
          ease: 'textHoverEase',
          stagger: 0.1,
          delay,
        });
        return;
      }
    });
  });
}


// ── Text hover ────────────────────────────────────────────────────

function initTextHover() {
  document.querySelectorAll('[data-text-hover]').forEach(el => {
    if (el.dataset.textHoverInit) return;
    el.dataset.textHoverInit = 'true';

    const duration = parseFloat(el.getAttribute('data-text-hover-duration')) || 0.4;
    const stagger  = parseFloat(el.getAttribute('data-text-hover-stagger'))  || 0.02;
    const type     = el.getAttribute('data-text-hover-type') || 'chars';
    const bleed    = el.getAttribute('data-text-hover-bleed') || '0.11em';
    const outScale = parseFloat(el.getAttribute('data-text-hover-out-scale')) || 1.5;
    const trigger  = el.closest('[data-text-hover-trigger]') || el;

    const restHeight = el.offsetHeight;

    const original = document.createElement('div');
    original.classList.add('text-hover__original');
    while (el.firstChild) original.appendChild(el.firstChild);

    const clone = original.cloneNode(true);
    clone.classList.add('text-hover__clone');
    clone.setAttribute('aria-hidden', 'true');

    el.appendChild(original);
    el.appendChild(clone);

    gsap.set(el, {
      position : 'relative',
      height   : restHeight,
      clipPath : `inset(-${bleed} 0)`
    });

    const splitOriginal = new SplitText(original, { type });
    const splitClone    = new SplitText(clone,    { type });

    const dist = () => clone.offsetTop - original.offsetTop;

    const tl = gsap.timeline({
      paused: true,
      defaults: { duration, ease: 'textHoverEase' }
    });
    tl.to(splitOriginal[type], { y: () => -dist(), stagger }, 0)
      .to(splitClone[type],    { y: () => -dist(), stagger }, 0);

    trigger.addEventListener('mouseenter', () => tl.timeScale(1).play());
    trigger.addEventListener('mouseleave', () => tl.timeScale(outScale).reverse());

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (tl.progress() !== 0) return;
        gsap.set(clone, { display: 'none' });
        gsap.set(el, { height: 'auto' });
        const h = el.offsetHeight;
        gsap.set(clone, { clearProps: 'display' });
        gsap.set(el, { height: h });
        tl.invalidate();
      }, 200);
    });
  });
}


// ── Scaling Hamburger Navigation ─────────────────────────────

function initScalingHamburgerNavigation() {
  // Toggle Navigation
  document.querySelectorAll('[data-navigation-toggle="toggle"]').forEach(toggleBtn => {
    toggleBtn.addEventListener('click', () => {
      const navStatusEl = document.querySelector('[data-navigation-status]');
      if (!navStatusEl) return;
      if (navStatusEl.getAttribute('data-navigation-status') === 'not-active') {
        navStatusEl.setAttribute('data-navigation-status', 'active');
        // If you use Lenis you can 'stop' Lenis here: Example Lenis.stop();
      } else {
        navStatusEl.setAttribute('data-navigation-status', 'not-active');
        // If you use Lenis you can 'start' Lenis here: Example Lenis.start();
      }
    });
  });

  // Close Navigation
  document.querySelectorAll('[data-navigation-toggle="close"]').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      const navStatusEl = document.querySelector('[data-navigation-status]');
      if (!navStatusEl) return;
      navStatusEl.setAttribute('data-navigation-status', 'not-active');
      // If you use Lenis you can 'start' Lenis here: Example Lenis.start();
    });
  });

  // Key ESC - Close Navigation
  document.addEventListener('keydown', e => {
    if (e.keyCode === 27) {
      const navStatusEl = document.querySelector('[data-navigation-status]');
      if (!navStatusEl) return;
      if (navStatusEl.getAttribute('data-navigation-status') === 'active') {
        navStatusEl.setAttribute('data-navigation-status', 'not-active');
       // If you use Lenis you can 'start' Lenis here: Example Lenis.start();
      }
    }
  });
}


// ── Momentum based hover ─────────────────────────────────────────────────────

function initMomentumBasedHover() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const xyMultiplier       = 30;
  const rotationMultiplier = 20;
  const inertiaResistance  = 200;

  const clampXY  = gsap.utils.clamp(-1080, 1080);
  const clampRot = gsap.utils.clamp(-60, 60);

  document.querySelectorAll('[data-momentum-hover-init]').forEach(root => {
    let prevX = 0, prevY = 0;
    let velX  = 0, velY  = 0;
    let rafId = null;

    root.addEventListener('mousemove', e => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        velX = e.clientX - prevX;
        velY = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;
        rafId = null;
      });
    });

    root.querySelectorAll('[data-momentum-hover-element]').forEach(el => {
      const target = el.querySelector('[data-momentum-hover-target]');
      if (!target) return;

      // Originele positie eenmalig opslaan na load
      const originX        = gsap.getProperty(target, 'x');
      const originY        = gsap.getProperty(target, 'y');
      const originRotation = gsap.getProperty(target, 'rotation');

      el.addEventListener('mouseenter', e => {
        const { left, top, width, height } = target.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const offsetX = e.clientX - centerX;
        const offsetY = e.clientY - centerY;

        const rawTorque    = offsetX * velY - offsetY * velX;
        const leverDist    = Math.hypot(offsetX, offsetY) || 1;
        const angularForce = rawTorque / leverDist;

        const velocityX        = clampXY(velX * xyMultiplier);
        const velocityY        = clampXY(velY * xyMultiplier);
        const rotationVelocity = clampRot(angularForce * rotationMultiplier);

        gsap.to(target, {
          inertia: {
            x        : { velocity: velocityX,        end: originX },
            y        : { velocity: velocityY,        end: originY },
            rotation : { velocity: rotationVelocity, end: originRotation },
            resistance: inertiaResistance
          },
          onComplete: () => {
            gsap.set(target, { x: originX, y: originY, rotation: originRotation });
          }
        });
      });
    });
  });
}


// ── CTA Load animation ─────────────────────────────────────────────────────

function initCtaAnimation() {
  const section = document.querySelector('.section_cta');
  if (!section) return;

  const images      = Array.from(section.querySelectorAll('.cta_image'));
  const tag         = section.querySelector('.text-label');
  const heading     = section.querySelector('.text-align-center');
  const buttonGroup = section.querySelector('.button-group');

  if (images.length < 3) return;

  const left   = images[0];
  const middle = images[1];
  const right  = images[2];

  // Eindposities op basis van Webflow transforms
  // left:  x: 2rem, rotation: -10deg
  // middle: x: 0, rotation: 0
  // right: x: -2rem, rotation: 10deg
  const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize);

  gsap.set(middle, { y: '+=60', autoAlpha: 0 });
  gsap.set(left,   { x: '+=80', y: '+=40', autoAlpha: 0 });
  gsap.set(right,  { x: '-=80', y: '+=40', autoAlpha: 0 });
  gsap.set(tag,         { y: 16, autoAlpha: 0 });
  gsap.set(buttonGroup, { y: 16, autoAlpha: 0 });

  const split = new SplitText(heading, { type: 'lines' });
  gsap.set(split.lines, { y: 40, autoAlpha: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger      : section,
      start        : 'top 75%',
      toggleActions: 'play none none none',
    }
  });

  tl.to(middle, {
    y        : 0,
    autoAlpha: 1,
    duration : 0.4,
    ease     : 'power3.out',
  })

  .to(left, {
    x        : 2 * remToPx,   // 2rem naar rechts
    y        : 0,
    rotation : -10,
    autoAlpha: 1,
    duration : 0.35,
    ease     : 'power3.out',
  }, '-=0.35')

  .to(right, {
    x        : -2 * remToPx,  // 2rem naar links
    y        : 0,
    rotation : 10,
    autoAlpha: 1,
    duration : 0.35,
    ease     : 'power3.out',
  }, '<')

  .to(tag, {
    y        : 0,
    autoAlpha: 1,
    duration : 0.25,
    ease     : 'power2.out',
  }, '-=0.25')

  .to(split.lines, {
    y        : 0,
    autoAlpha: 1,
    duration : 0.35,
    ease     : 'power3.out',
    stagger  : 0.06,
  }, '-=0.25')

  .to(buttonGroup, {
    y        : 0,
    autoAlpha: 1,
    duration : 0.25,
    ease     : 'power2.out',
  }, '-=0.25');
}


// ── Init ─────────────────────────────────────────────────────
//
// Eén entry-point. We wachten eerst tot de DOM klaar is en daarna tot de
// fonts geladen zijn (document.fonts.ready) — niet tot 'load', zodat reveals
// niet hoeven te wachten op de Vimeo-video, terwijl tekstmetingen toch
// kloppen. Elke functie wordt hier exact één keer aangeroepen.

function initAnimations() {
  // Interactie + niet-tekst-afhankelijke visuals
  initAccordionCSS();
  initScalingHamburgerNavigation();
  initNavbarColor();
  initDrawPathCursorEffect();
  initMomentumBasedHover();
  initPreviewFollower();
  initHoverCursorMarquee();
  initDraggableMarquee();
  initRadialMarquee();
  initLogoWallCycle();
  initCSSMarquee();
  initOverlappingSlider();
  initFooterParallax();

  // Tekst- / meet-afhankelijke animaties
  initFooterTekstAnimatie();
  initLoadReveal();
  initTextHover();
  initCtaAnimation();
}

function bootAnimations() {
  document.fonts.ready.then(initAnimations);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAnimations);
} else {
  bootAnimations();
}
