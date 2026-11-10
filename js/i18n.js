/* ===========================================================
   JEFFSON LUIZ — i18n.js
   Bilingual engine:
   - Default language: Portuguese (pt)
   - URL parameter support: ?l=eng or ?lang=en forces English
   - Minimalist navbar toggle (PT | EN) switches live without reload
   =========================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'jeffson_portfolio_lang';

  function detectInitialLang() {
    try {
      var params = new URLSearchParams(window.location.search);
      var lParam = (params.get('l') || params.get('lang') || '').toLowerCase();
      if (lParam === 'eng' || lParam === 'en' || lParam === 'english') {
        localStorage.setItem(STORAGE_KEY, 'en');
        return 'en';
      }
      if (lParam === 'pt' || lParam === 'pt-br' || lParam === 'por') {
        localStorage.setItem(STORAGE_KEY, 'pt');
        return 'pt';
      }
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'pt') return saved;
    } catch (e) {}
    return 'pt';
  }

  function updateUrlParam(lang) {
    try {
      var url = new URL(window.location.href);
      if (lang === 'en') {
        url.searchParams.set('l', 'eng');
      } else {
        url.searchParams.delete('l');
        url.searchParams.delete('lang');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }

  function decorateInternalLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var raw = a.getAttribute('href');
      if (!raw || raw.indexOf('mailto:') === 0 || raw.indexOf('tel:') === 0 || raw.indexOf('http') === 0 || raw.indexOf('#') === 0) {
        return;
      }
      var hashIndex = raw.indexOf('#');
      var hash = hashIndex !== -1 ? raw.slice(hashIndex) : '';
      var base = hashIndex !== -1 ? raw.slice(0, hashIndex) : raw;
      base = base.replace(/\?l=eng(&)?/g, '').replace(/\?$/, '');
      if (lang === 'en') {
        a.setAttribute('href', base + (base.indexOf('?') === -1 ? '?l=eng' : '&l=eng') + hash);
      } else {
        a.setAttribute('href', base + hash);
      }
    });
  }

  function applyLanguage(lang, isDynamicToggle) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}

    // Cache original PT markup on first pass and swap content
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-pt')) {
        el.setAttribute('data-pt', el.innerHTML);
      }
      var targetHtml = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-pt');
      if (targetHtml !== null) {
        el.innerHTML = targetHtml;
        if (isDynamicToggle && el.hasAttribute('data-split') && window.splitPortfolioWords) {
          var spans = window.splitPortfolioWords(el);
          spans.forEach(function (s) { s.style.transform = 'translateY(0%)'; });
        }
      }
    });

    // Update page title if data-title-en exists on body
    var body = document.body;
    if (body) {
      if (!body.hasAttribute('data-title-pt')) {
        body.setAttribute('data-title-pt', document.title);
      }
      if (lang === 'en' && body.getAttribute('data-title-en')) {
        document.title = body.getAttribute('data-title-en');
      } else if (lang === 'pt' && body.getAttribute('data-title-pt')) {
        document.title = body.getAttribute('data-title-pt');
      }
    }

    // Update toggle buttons state
    document.querySelectorAll('.lang-switch').forEach(function (btn) {
      var ptSpan = btn.querySelector('[data-lang-opt="pt"]');
      var enSpan = btn.querySelector('[data-lang-opt="en"]');
      if (ptSpan) ptSpan.classList.toggle('is-active', lang === 'pt');
      if (enSpan) enSpan.classList.toggle('is-active', lang === 'en');
      btn.setAttribute('aria-label', lang === 'en' ? 'Mudar idioma para Português' : 'Switch language to English');
    });

    decorateInternalLinks(lang);
    if (isDynamicToggle && window.refreshPortfolioTimeline) {
      window.refreshPortfolioTimeline();
    }
  }

  var currentLang = detectInitialLang();

  // Apply synchronously when DOM is ready (before GSAP splits words)
  function initI18n() {
    applyLanguage(currentLang, false);
    if (currentLang === 'en') {
      updateUrlParam('en');
    }

    document.querySelectorAll('.lang-switch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentLang = currentLang === 'pt' ? 'en' : 'pt';
        applyLanguage(currentLang, true);
        updateUrlParam(currentLang);
      });
    });
  }

  window.PortfolioI18n = {
    init: initI18n,
    getLang: function () { return currentLang; },
    setLang: function (l) {
      currentLang = l === 'en' ? 'en' : 'pt';
      applyLanguage(currentLang, true);
      updateUrlParam(currentLang);
    }
  };
})();

