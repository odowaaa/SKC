/* SomaliKing College — shared site behaviour */
(() => {
  'use strict';

  /* ---------- Dark mode ---------- */
  const root = document.documentElement;
  const THEME_KEY = 'skc-theme';

  const applyTheme = (theme) => {
    root.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.themeIcon !== theme);
    });
  };

  const storedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuOpenIcon = document.getElementById('icon-menu-open');
  const menuCloseIcon = document.getElementById('icon-menu-close');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden', isOpen);
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
      menuOpenIcon?.classList.toggle('hidden', !isOpen);
      menuCloseIcon?.classList.toggle('hidden', isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuOpenIcon?.classList.remove('hidden');
        menuCloseIcon?.classList.add('hidden');
      });
    });

    document.querySelectorAll('[data-mobile-dropdown-toggle]').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const panel = document.getElementById(toggle.dataset.mobileDropdownToggle);
        panel?.classList.toggle('hidden');
        toggle.querySelector('[data-chevron]')?.classList.toggle('rotate-180');
      });
    });
  }

  /* ---------- Desktop dropdowns (click to toggle, close on outside click) ---------- */
  const dropdowns = document.querySelectorAll('[data-dropdown]');
  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('[data-dropdown-trigger]');
    const panel = dropdown.querySelector('[data-dropdown-panel]');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.classList.contains('opacity-0');
      dropdowns.forEach((d) => {
        d.querySelector('[data-dropdown-panel]')?.classList.add('opacity-0', 'invisible', '-translate-y-1');
        d.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
      });
      if (isHidden) {
        panel.classList.remove('opacity-0', 'invisible', '-translate-y-1');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', () => {
    dropdowns.forEach((d) => {
      d.querySelector('[data-dropdown-panel]')?.classList.add('opacity-0', 'invisible', '-translate-y-1');
      d.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Sticky header shadow ---------- */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('shadow-lg', window.scrollY > 8);
      header.classList.toggle('bg-white/95', window.scrollY > 8);
      header.classList.toggle('backdrop-blur', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Active nav link ---------- */
  const currentPage = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('opacity-0', window.scrollY < 400);
      backToTop.classList.toggle('invisible', window.scrollY < 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
          entry.target.style.opacity = '1';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => {
      el.style.opacity = '0';
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => { el.style.opacity = '1'; });
  }

  /* ---------- Animated stat counters ---------- */
  const counters = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window && counters.length) {
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.counter, 10) || 0;
      const suffix = el.dataset.counterSuffix || '';
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + suffix;
      };
      requestAnimationFrame(step);
    };
    const cIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => cIo.observe(el));
  }

  /* ---------- Testimonial / hero carousel ---------- */
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const dotsWrap = carousel.querySelector('[data-carousel-dots]');
    if (!track || slides.length === 0) return;
    let index = 0;
    let dots = [];

    if (dotsWrap) {
      dots = slides.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.className = 'h-2.5 w-2.5 rounded-full bg-white/40 transition data-[active=true]:bg-gold-400 data-[active=true]:w-6';
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
        return dot;
      });
    }

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, i) => dot.setAttribute('data-active', String(i === index)));
    };
    const goTo = (i) => { index = (i + slides.length) % slides.length; render(); };

    prevBtn?.addEventListener('click', () => goTo(index - 1));
    nextBtn?.addEventListener('click', () => goTo(index + 1));
    render();

    if (carousel.dataset.carouselAuto) {
      setInterval(() => goTo(index + 1), parseInt(carousel.dataset.carouselAuto, 10) || 6000);
    }
  });

  /* ---------- Accordion (FAQ) ---------- */
  document.querySelectorAll('[data-accordion-item]').forEach((item) => {
    const trigger = item.querySelector('[data-accordion-trigger]');
    const panel = item.querySelector('[data-accordion-panel]');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';
      item.closest('[data-accordion-group]')?.querySelectorAll('[data-accordion-item]').forEach((sib) => {
        sib.setAttribute('data-open', 'false');
        sib.querySelector('[data-accordion-panel]').style.maxHeight = null;
        sib.querySelector('[data-chevron]')?.classList.remove('rotate-180');
      });
      if (!isOpen) {
        item.setAttribute('data-open', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        trigger.querySelector('[data-chevron]')?.classList.add('rotate-180');
      }
    });
  });

  /* ---------- Generic filter (news / gallery / programs) ---------- */
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter-value]');
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(`${targetSelector} [data-filter-tags]`);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => {
          b.classList.remove('bg-primary-800', 'text-white');
          b.classList.add('bg-white', 'text-primary-800');
        });
        btn.classList.add('bg-primary-800', 'text-white');
        btn.classList.remove('bg-white', 'text-primary-800');
        const value = btn.dataset.filterValue;
        items.forEach((item) => {
          const tags = item.dataset.filterTags.split(',');
          const show = value === 'all' || tags.includes(value);
          item.classList.toggle('hidden', !show);
        });
      });
    });
  });

  /* ---------- Live search filter (programs) ---------- */
  const searchInput = document.querySelector('[data-search-input]');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      document.querySelectorAll(searchInput.dataset.searchTarget).forEach((item) => {
        const haystack = (item.dataset.searchText || item.textContent).toLowerCase();
        item.classList.toggle('hidden', !haystack.includes(term));
      });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxBody = document.getElementById('lightbox-body');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close');
    const openLightbox = (trigger) => {
      lightboxBody.innerHTML = trigger.querySelector('[data-gallery-visual]').outerHTML;
      lightboxCaption.textContent = trigger.dataset.galleryCaption || '';
      lightbox.classList.remove('hidden', 'opacity-0');
      document.body.classList.add('overflow-hidden');
    };
    const closeLightbox = () => {
      lightbox.classList.add('hidden', 'opacity-0');
      document.body.classList.remove('overflow-hidden');
    };
    document.querySelectorAll('[data-gallery-item]').forEach((trigger) => {
      trigger.addEventListener('click', () => openLightbox(trigger));
    });
    closeBtn?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ---------- Form handling (contact / admissions / newsletter / portals) ---------- */
  const showFormMessage = (form, text, isError = false) => {
    let msg = form.querySelector('[data-form-message]');
    if (!msg) {
      msg = document.createElement('p');
      msg.setAttribute('data-form-message', '');
      msg.className = 'mt-4 rounded-lg px-4 py-3 text-sm font-medium';
      form.appendChild(msg);
    }
    msg.textContent = text;
    msg.className = `mt-4 rounded-lg px-4 py-3 text-sm font-medium ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`;
  };

  document.querySelectorAll('[data-demo-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const successText = form.dataset.demoForm || 'Thank you! Your submission has been received.';
      showFormMessage(form, successText);
      form.reset();
    });
  });

  document.querySelectorAll('[data-portal-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      showFormMessage(form, 'This is a demo portal. Live sign-in will be enabled once the student information system is connected.');
    });
  });

  /* ---------- Password visibility toggle ---------- */
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.classList.toggle('text-primary-700');
    });
  });
})();
