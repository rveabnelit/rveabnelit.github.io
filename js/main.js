/* ==========================================================================
   LANI LOUD — интерактив главной страницы
   Без сборки и без зависимостей: чистый JS, работает и по file://, и с хостинга
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');
  window.__laniLoudReady = true;   // страховка от инлайн-скрипта в index.html

  /* ---------- 1. Волновая дорожка плеера (декоративная) ---------- */
  var wave = doc.getElementById('waveform');
  if (wave) {
    var BARS = 96;
    var frag = doc.createDocumentFragment();
    for (var i = 0; i < BARS; i++) {
      var t = i / BARS;
      var h =
        0.22 +
        0.34 * Math.abs(Math.sin(i * 0.55)) +
        0.26 * Math.abs(Math.sin(i * 0.17 + 1.2)) +
        0.18 * Math.abs(Math.sin(i * 1.31));
      var bar = doc.createElement('span');
      bar.style.height = Math.max(2, Math.round(h * 40)) + 'px';
      if (t > 0.14 && t < 0.2) bar.className = 'is-ember';
      frag.appendChild(bar);
    }
    wave.appendChild(frag);
  }

  /* ---------- 2. Шапка: состояние после скролла ---------- */
  var header = doc.getElementById('site-header');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Мобильное меню ---------- */
  var burger = doc.getElementById('burger');
  var menu = doc.getElementById('mobile-menu');

  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    doc.body.classList.toggle('is-locked', open);
    if (open) {
      var first = menu.querySelector('a');
      if (first) first.focus();
    }
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        burger.focus();
      }
    });
  }

  /* ---------- 4. Модалка «где слушать» ---------- */
  var modal = doc.getElementById('listen-modal');
  var modalCover = doc.getElementById('listen-cover');
  var modalTitle = doc.getElementById('listen-title');
  var modalMeta = doc.getElementById('listen-meta');
  var platformList = doc.getElementById('listen-platforms');
  var lastFocused = null;

  var PLATFORMS = [
    { key: 'spotify', label: 'Spotify', icon: 'i-spotify' },
    { key: 'apple', label: 'Apple Music', icon: 'i-apple' },
    { key: 'yandex', label: 'Яндекс Музыка', icon: 'i-yandex' },
    { key: 'vk', label: 'VK Музыка', icon: 'i-vk' },
    { key: 'youtube', label: 'Клип на YouTube', icon: 'i-yt' },
    { key: 'bandlink', label: 'Все площадки', icon: 'i-link' }
  ];

  function buildPlatforms(item) {
    platformList.innerHTML = '';
    PLATFORMS.forEach(function (p) {
      var url = item.getAttribute('data-' + p.key) || '';
      var isPlaceholder = !url || url.indexOf('PLACEHOLDER') !== -1;
      var el = doc.createElement(isPlaceholder ? 'span' : 'a');
      el.className = 'platform-link' + (isPlaceholder ? ' is-disabled' : '');
      var name = doc.createElement('span');
      name.className = 'pla';
      name.innerHTML = '<svg class="ico"><use href="#' + p.icon + '"></use></svg>';
      var text = doc.createElement('span');
      text.textContent = p.label;
      name.appendChild(text);
      el.appendChild(name);
      if (!isPlaceholder) {
        el.href = url;
        el.target = '_blank';
        el.rel = 'noopener';
        el.insertAdjacentHTML('beforeend', '<svg class="ico ico-arrow"><use href="#i-arrow"></use></svg>');
      } else {
        var note = doc.createElement('span');
        note.textContent = 'скоро';
        note.style.cssText = 'font-size:10px;letter-spacing:.14em;opacity:.7';
        el.appendChild(note);
      }
      var li = doc.createElement('li');
      li.appendChild(el);
      platformList.appendChild(li);
    });
  }

  function openModal(item) {
    if (!modal) return;
    lastFocused = doc.activeElement;
    var cover = item.querySelector('img');
    if (cover) {
      modalCover.src = cover.currentSrc || cover.src;
      modalCover.alt = cover.alt || '';
    }
    modalTitle.textContent = item.getAttribute('data-track') || '';
    modalMeta.textContent = (item.getAttribute('data-duration') || '') +
      ' · ' + (item.getAttribute('data-type') || 'Сингл');
    buildPlatforms(item);
    modal.hidden = false;
    doc.body.classList.add('is-locked');
    var close = modal.querySelector('.modal-close');
    if (close) close.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (!doc.getElementById('mobile-menu') || doc.getElementById('mobile-menu').hidden) {
      doc.body.classList.remove('is-locked');
    }
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (modal) {
    doc.querySelectorAll('.track').forEach(function (item, index) {
      var card = item.querySelector('.track-card');
      if (card) card.addEventListener('click', function () { openModal(item); });
      if (index === 0) item.setAttribute('data-default', 'true');
    });

    var playBtn = doc.getElementById('player-play');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        var first = doc.querySelector('.track[data-default="true"]') || doc.querySelector('.track');
        if (first) openModal(first);
      });
    }

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeModal();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab' && !modal.hidden) {
        var focusables = modal.querySelectorAll('a[href], button:not([disabled])');
        if (!focusables.length) return;
        var firstEl = focusables[0];
        var lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && doc.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    });
  }

  /* ---------- 5. Клип: постер превращается во встроенный плеер YouTube ---------- */
  doc.querySelectorAll('.video-embed').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-video-id');
      if (!id) return;
      var frame = doc.createElement('iframe');
      frame.className = 'video-iframe';
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      frame.title = btn.getAttribute('aria-label') || 'Видео на YouTube';
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('loading', 'lazy');
      btn.innerHTML = '';
      btn.appendChild(frame);
      btn.classList.add('is-playing');
      btn.removeAttribute('aria-label');
    });
  });

  /* ---------- 6. Появление блоков при скролле ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-visible'); }, i * 70);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 7. Почта: копирование адреса по клику ----------
     Ссылка mailto: открывает почтовую программу, но если она в системе
     не настроена, браузер молча ничего не делает — посетитель решает,
     что кнопка не работает. Поэтому адрес дополнительно копируется
     в буфер, а на экране появляется подтверждение. */
  var toast = null;
  var toastTimer = null;

  function fallbackCopy(text) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand('copy'); } catch (err) {}
    doc.body.removeChild(ta);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)['catch'](function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function showToast(html) {
    if (!toast) {
      toast = doc.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      doc.body.appendChild(toast);
    }
    toast.innerHTML = html;
    /* перезапускаем анимацию, если тост уже был показан */
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 4200);
  }

  doc.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
    if (!link) return;
    var address = link.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
    copyText(address);
    showToast('Адрес скопирован: <b>' + address + '</b><br>Открываем почтовую программу…');
  });

  /* ---------- 8. Текущий год в подвале ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
