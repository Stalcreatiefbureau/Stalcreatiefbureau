// ============================================================
// STAL CREATIEF BUREAU — animations.js
// ============================================================


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
  const radius = parseFloat(section.dataset.radius ?? 700);

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

  gsap.ticker.add((_, dt) => {
    angle -= degsPerSec * (dt / 1000);
    positionCards(angle);
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
