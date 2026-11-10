/* ===========================================================
   JEFFSON LUIZ — main.js
   Vanilla scroll choreography + GSAP reveals (loaded locally).
   Everything degrades gracefully: if GSAP fails to load, all
   content is forced visible and the site still works.
   =========================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* -------------------------------------------------------
     0. Safety net — never let content stay invisible
  ------------------------------------------------------- */
  function revealEverything() {
    document.querySelectorAll('.fade-up').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    document.querySelectorAll('.timeline-dot').forEach(function (el) {
      el.style.transform = 'scale(1)';
    });
    var fill = document.querySelector('.timeline-progress-fill');
    if (fill) fill.style.height = '100%';
    document.querySelectorAll('.about-figure .barline').forEach(function (el) {
      el.style.transform = 'scaleX(1)';
    });
    document.body.style.opacity = 1;
  }

  window.addEventListener('load', function () {
    setTimeout(function () {
      if (typeof gsap === 'undefined') revealEverything();
    }, 900);
  });

  /* -------------------------------------------------------
     1. Custom cursor (desktop, fine pointer only)
  ------------------------------------------------------- */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    var dot = document.getElementById('cursor');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('has-cursor');

    var mx = -200, my = -200, rx = -200, ry = -200;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    (function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, .case-gallery')) document.body.classList.add('cursor-hot');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, .case-gallery')) document.body.classList.remove('cursor-hot');
    });
  }

  /* -------------------------------------------------------
     2. Nav — mobile menu + scrolled state + active link
  ------------------------------------------------------- */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    var nav = document.getElementById('site-nav');
    if (!nav) return;

    var current = document.body.dataset.page;
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      if (a.dataset.page && a.dataset.page === current) a.classList.add('active');
    });

    if (!toggle || !links) return;

    function open() {
      document.body.appendChild(links);
      toggle.setAttribute('aria-expanded', 'true');
      links.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (toggle.getAttribute('aria-expanded') === 'false' && links.parentNode !== nav) {
          nav.insertBefore(links, toggle);
        }
      }, 420);
    }

    toggle.addEventListener('click', function () {
      toggle.getAttribute('aria-expanded') === 'true' ? close() : open();
    });
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) close(); });
  }

  /* -------------------------------------------------------
     3. Scroll-driven sections (pure math — no GSAP needed)
  ------------------------------------------------------- */
  function initScrollEngine() {
    var nav = document.getElementById('site-nav');
    var progressFill = document.querySelector('.scroll-progress-fill');

    var heroWrap = document.querySelector('.hero-wrap');
    var heroBg = document.querySelector('.hero-bg');
    var heroInner = document.querySelector('.hero-inner');
    var heroFades = document.querySelectorAll('[data-hero-fade]');

    var pinWrap = document.querySelector('.pin-wrap');
    var track = document.querySelector('.htrack');
    var hcards = track ? Array.prototype.slice.call(track.querySelectorAll('.hcard')) : [];
    var pinDots = document.querySelectorAll('.pin-dots i');
    var pinCount = document.querySelector('.pin-count');
    var pinHint = document.querySelector('.pin-hint');

    var stackWrap = document.querySelector('.stack-wrap');
    var stackItems = stackWrap ? Array.prototype.slice.call(stackWrap.querySelectorAll('.stack-item')) : [];

    var vh = 0, vw = 0, stacked = false;
    var heroTop = 0, pinTop = 0, stackTop = 0;

    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

    var PIN_RUNWAY = 1;
    var PIN_HOLD = 0.35;
    var STACK_RUNWAY = 1;
    var STACK_HOLD = 0.55;

    function pinRunway(n) { return vh * n * PIN_RUNWAY; }
    function stackRunway(n) { return vh * ((n - 1) * STACK_RUNWAY + 0.35); }
    function outExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function measure() {
      vh = Math.max(560, window.innerHeight);
      vw = window.innerWidth;
      stacked = vw <= 900;

      if (heroWrap) heroWrap.style.height = stacked ? '' : (vh * 1.8) + 'px';

      if (pinWrap && hcards.length) {
        if (stacked) {
          pinWrap.style.height = '';
          if (track) track.style.transform = '';
        } else {
          pinWrap.style.height = (pinRunway(hcards.length) + vh + vh * PIN_HOLD) + 'px';
        }
      }

      if (stackWrap && stackItems.length) {
        stackWrap.style.height = stacked
          ? ''
          : (stackRunway(stackItems.length) + vh + vh * STACK_HOLD) + 'px';
      }

      var sy = window.pageYOffset;
      if (heroWrap) heroTop = heroWrap.getBoundingClientRect().top + sy;
      if (pinWrap) pinTop = pinWrap.getBoundingClientRect().top + sy;
      if (stackWrap) stackTop = stackWrap.getBoundingClientRect().top + sy;
    }

    function render() {
      var y = window.pageYOffset;

      if (nav) nav.classList.toggle('is-scrolled', y > 50);

      if (progressFill) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progressFill.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
      }

      /* ---- Hero parallax ---- */
      if (heroWrap && !stacked && !reduceMotion) {
        var hp = clamp((y - heroTop) / vh, 0, 1);
        if (heroBg) heroBg.style.transform = 'translateY(' + ((y - heroTop) * 0.18) + 'px)';
        if (heroInner) heroInner.style.transform = 'translateY(' + (-(y - heroTop) * 0.09) + 'px)';
        heroFades.forEach(function (el) {
          el.style.opacity = clamp(1 - hp * 3.2, 0, 1);
        });
      } else if (heroWrap) {
        if (heroBg) heroBg.style.transform = '';
        if (heroInner) heroInner.style.transform = '';
        heroFades.forEach(function (el) { el.style.opacity = ''; });
      }

      /* ---- Horizontal case track ---- */
      if (pinWrap && track && hcards.length) {
        if (stacked) {
          hcards.forEach(function (c) { c.classList.add('on'); });
        } else {
          var runway = pinRunway(hcards.length);
          var into = clamp(y - pinTop, 0, runway);
          var p = runway > 0 ? into / runway : 0;
          var travel = Math.max(0, track.scrollWidth - vw);
          track.style.transform = 'translateX(' + (-p * travel) + 'px)';

          var active = Math.min(hcards.length - 1, Math.round(p * (hcards.length - 1)));
          hcards.forEach(function (c, i) { c.classList.toggle('on', i === active); });
          pinDots.forEach(function (d, i) { d.classList.toggle('on', i === active); });
          if (pinCount) {
            pinCount.textContent = String(active + 1).padStart(2, '0') + ' / ' +
              String(hcards.length).padStart(2, '0');
          }
          if (pinHint) pinHint.style.opacity = p < 0.04 ? 1 : 0;
        }
      }

      /* ---- Sticky stacking cards ---- */
      if (stackWrap && stackItems.length) {
        if (stacked) {
          stackItems.forEach(function (it) { it.classList.add('on'); });
        } else {
          var sInto = Math.max(0, y - stackTop);
          var idx = Math.min(stackItems.length - 1, Math.floor(sInto / vh));
          stackItems.forEach(function (item, i) {
            var raw = (sInto - i * vh) / vh;
            var prog = clamp(raw, 0, 1);
            var visible = raw > -0.02;

            if (!visible) {
              item.style.transform = 'translateY(105%)';
              item.style.opacity = '0';
            } else if (prog < 0.35) {
              var e = outExpo(prog / 0.35);
              item.style.transform = 'translateY(' + ((1 - e) * 100) + '%)';
              item.style.opacity = String(clamp(prog * 4, 0, 1));
            } else {
              var behind = Math.max(0, sInto / vh - i - 0.35);
              var scale = Math.max(0.86, 1 - behind * 0.05);
              var lift = -behind * 30;
              item.style.transform = 'translateY(' + lift + 'px) scale(' + scale + ')';
              item.style.opacity = '1';
            }
            item.classList.toggle('on', i === idx);
          });
        }
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { render(); ticking = false; });
    }

    measure();
    render();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); render(); });
    window.addEventListener('load', function () { measure(); render(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); render(); });
    }
  }

  /* -------------------------------------------------------
     4. Case study galleries
  ------------------------------------------------------- */
  function initGalleries() {
    document.querySelectorAll('.case-gallery').forEach(function (gallery) {
      var wrapId = gallery.getAttribute('data-dots');
      var dotsWrap = wrapId ? document.getElementById(wrapId) : gallery.nextElementSibling;
      var slides = gallery.querySelectorAll('.case-gallery-slide');
      if (!slides.length || !dotsWrap) return;
      var dots = dotsWrap.querySelectorAll('button');
      var active = 0, timer = null;

      function goTo(i) {
        slides[active].classList.remove('is-active');
        if (dots[active]) dots[active].classList.remove('is-active');
        active = (i + slides.length) % slides.length;
        slides[active].classList.add('is-active');
        if (dots[active]) dots[active].classList.add('is-active');
      }
      function stop() { clearInterval(timer); }
      function start() { stop(); if (!reduceMotion) timer = setInterval(function () { goTo(active + 1); }, 5000); }

      dots.forEach(function (d, i) {
        d.addEventListener('click', function (e) { e.stopPropagation(); goTo(i); start(); });
      });
      gallery.addEventListener('click', function () { goTo(active + 1); start(); });
      gallery.addEventListener('mouseenter', stop);
      gallery.addEventListener('mouseleave', start);

      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
        }, { threshold: 0.25 });
        obs.observe(gallery);
      } else {
        start();
      }
    });
  }

  /* -------------------------------------------------------
     5. GSAP layer — reveals, counters, parallax, timeline
  ------------------------------------------------------- */
  function splitWords(el) {
    var inners = [];

    function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          var text = child.nodeValue;
          if (!text || !text.trim()) return;
          var frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach(function (part) {
            if (part === '') return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            var mask = document.createElement('span');
            mask.className = 'reveal-line';
            var inner = document.createElement('span');
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
            inners.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          if (child.tagName === 'BR' || child.classList.contains('reveal-line')) return;
          walk(child);
        }
      });
    }

    walk(el);
    return inners;
  }

  window.splitPortfolioWords = splitWords;

  function initGsap() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      revealEverything();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) {
      revealEverything();
      return;
    }

    gsap.set('body', { opacity: 1 });
    gsap.from('body', { opacity: 0, duration: 0.45, ease: 'power2.out' });

    document.querySelectorAll('a[data-transition]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
        e.preventDefault();
        gsap.to('body', {
          opacity: 0, duration: 0.35, ease: 'power2.inOut',
          onComplete: function () { window.location.href = href; }
        });
      });
    });

    /* Hero load-in */
    var heroKicker = document.querySelector('.hero-kicker');
    var heroName = document.querySelector('.hero-name');
    if (heroName) {
      document.body.classList.add('is-loaded');
      var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      if (heroKicker) {
        gsap.set(heroKicker, { yPercent: 110, opacity: 0 });
        tl.to(heroKicker, { yPercent: 0, opacity: 1, duration: 0.8 }, 0.15);
      }
      gsap.set(heroName, { yPercent: 110, opacity: 0 });
      tl.to(heroName, { yPercent: 0, opacity: 1, duration: 1 }, 0.3);
      tl.from('.hero-tag, .hero-blurb, .hero-actions', {
        opacity: 0, y: 22, duration: 0.8, stagger: 0.08
      }, 0.7);
      tl.from('.hero-status, .hero-place, .hero-scroll', {
        opacity: 0, duration: 0.7, stagger: 0.08
      }, 1.1);
    } else {
      document.body.classList.add('is-loaded');
    }

    /* Split heading reveals */
    document.querySelectorAll('[data-split]').forEach(function (el) {
      var spans = splitWords(el);
      if (!spans.length) return;
      gsap.set(spans, { yPercent: 120 });
      gsap.to(spans, {
        yPercent: 0, duration: 0.9, stagger: 0.03, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* Generic fade ups */
    gsap.utils.toArray('.fade-up').forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        delay: (i % 3) * 0.06,
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    /* Counters */
    gsap.utils.toArray('[data-value]').forEach(function (el) {
      var target = parseFloat(el.dataset.value);
      if (isNaN(target)) return;
      var suffix = el.dataset.suffix || '';
      var prefix = el.dataset.prefix || '';
      var whole = target % 1 === 0;
      var c = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () {
          gsap.to(c, {
            v: target, duration: 1, ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + (whole ? Math.floor(c.v) : c.v.toFixed(1)) + suffix;
            }
          });
        }
      });
    });

    /* Generic parallax */
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var amount = parseFloat(el.dataset.parallax) || 8;
      gsap.fromTo(el, { yPercent: -amount / 2 }, {
        yPercent: amount / 2, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.45 }
      });
    });

    /* About figure bar */
    var barline = document.querySelector('.about-figure .barline');
    if (barline) {
      gsap.to(barline, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.about-figure', start: 'top 80%', end: 'bottom 60%', scrub: 0.4 }
      });
    }

    /* Timeline: continuous rule + real-time scroll progress + dot pop-in */
    var list = document.getElementById('timeline-list');
    if (list) {
      var trackEl = list.querySelector('.timeline-progress');
      var fillEl = list.querySelector('.timeline-progress-fill');
      var items = Array.prototype.slice.call(list.querySelectorAll('.timeline-item'));
      var dots = Array.prototype.slice.call(list.querySelectorAll('.timeline-dot'));

      if (trackEl && fillEl && items.length && dots.length) {
        var updateTimeline = function () {
          var firstOffset = items[0].offsetTop + 11.5;
          var lastOffset = items[items.length - 1].offsetTop + 11.5;
          var totalHeight = Math.max(0, lastOffset - firstOffset);

          trackEl.style.left = '17px';
          trackEl.style.top = firstOffset + 'px';
          trackEl.style.height = totalHeight + 'px';

          var listRect = list.getBoundingClientRect();
          var firstDotViewportY = listRect.top + firstOffset;
          var triggerY = window.innerHeight * 0.68;

          var currentPx = Math.max(0, Math.min(totalHeight, triggerY - firstDotViewportY));
          fillEl.style.height = currentPx.toFixed(1) + 'px';

          items.forEach(function (item, idx) {
            var dotDist = (item.offsetTop + 11.5) - firstOffset;
            var reached = (idx === 0 && triggerY >= firstDotViewportY - 24) || (currentPx >= dotDist - 4);
            if (dots[idx]) dots[idx].classList.toggle('is-reached', reached);
          });
        };

        window.refreshPortfolioTimeline = updateTimeline;
        updateTimeline();
        window.addEventListener('scroll', updateTimeline, { passive: true });
        window.addEventListener('resize', updateTimeline);
        window.addEventListener('load', updateTimeline);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateTimeline);
      }
    }

    /* Magnetic buttons (desktop only) */
    if (finePointer) {
      document.querySelectorAll('.btn, .arrow-circle').forEach(function (btn) {
        var mx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        var my = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          mx((e.clientX - r.left - r.width / 2) * 0.28);
          my((e.clientY - r.top - r.height / 2) * 0.28);
        });
        btn.addEventListener('mouseleave', function () { mx(0); my(0); });
      });
    }

    var imgs = Array.prototype.slice.call(document.images);
    var pending = imgs.filter(function (i) { return !i.complete; }).length;
    if (pending === 0) {
      ScrollTrigger.refresh();
    } else {
      imgs.forEach(function (img) {
        if (img.complete) return;
        var done = function () { pending--; if (pending === 0) ScrollTrigger.refresh(); };
        img.addEventListener('load', done);
        img.addEventListener('error', done);
      });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* -------------------------------------------------------
     6. Smooth in-page anchors accounting for the fixed nav
  ------------------------------------------------------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 10;
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* -------------------------------------------------------
     Boot
  ------------------------------------------------------- */
  function boot() {
    if (window.PortfolioI18n) window.PortfolioI18n.init();
    initCursor();
    initNav();
    initScrollEngine();
    initGalleries();
    initAnchors();
    initGsap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

