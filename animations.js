// ============================================================
// STAL CREATIEF BUREAU — animations.js
// ============================================================


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

  originals.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    list.appendChild(clone);
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
