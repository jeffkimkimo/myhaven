(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const introHeroOverlay = document.getElementById('intro-hero-overlay');
  const introHeroFrame = document.getElementById('intro-hero-frame');
  const introOverlay = document.getElementById('intro-overlay');
  const introFrame = document.getElementById('intro-frame');
  const introEnter = document.getElementById('intro-enter');
  const introTrigger = document.getElementById('intro-trigger');

  if (introOverlay || introHeroOverlay) {
    const url = new URL(window.location.href);
    const skipByParam = url.searchParams.has('skipIntro');
    let heroFallbackTimer = null;
    let heroLoaderCompleted = false;

    const isInternalReferrer = (() => {
      if (!document.referrer) return false;
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          return refUrl.pathname !== window.location.pathname;
        }
      } catch (error) {
        if (document.referrer.includes('/myhaven/') && !document.referrer.includes('portfolio.html')) {
          return true;
        }
      }
      return false;
    })();

    const hideOverlay = (overlay) => {
      if (!overlay) return;
      overlay.classList.add('is-hidden');
      overlay.setAttribute('aria-hidden', 'true');
    };

    const showOverlay = (overlay) => {
      if (!overlay) return;
      overlay.classList.remove('is-hidden');
      overlay.setAttribute('aria-hidden', 'false');
    };

    const reloadFrame = (frame) => {
      if (!frame) return;
      const src = frame.getAttribute('src');
      if (src) {
        frame.setAttribute('src', src);
      }
    };

    const clearHeroFallback = () => {
      if (!heroFallbackTimer) return;
      window.clearTimeout(heroFallbackTimer);
      heroFallbackTimer = null;
    };

    const isMessageFromFrame = (event, frame, messageType) => {
      if (!frame || event.source !== frame.contentWindow) {
        return false;
      }
      if (!event.data || event.data.type !== messageType) {
        return false;
      }
      if (event.origin && event.origin !== 'null' && event.origin !== window.location.origin) {
        return false;
      }
      return true;
    };

    const hideIntroEnter = () => {
      if (!introEnter) return;
      introEnter.classList.remove('is-visible');
      introEnter.disabled = true;
    };

    const showIntroEnter = () => {
      if (!introEnter) return;
      introEnter.classList.add('is-visible');
      introEnter.disabled = false;
    };

    const finishIntro = () => {
      clearHeroFallback();
      hideOverlay(introHeroOverlay);
      hideOverlay(introOverlay);
      document.body.classList.remove('intro-active');
      document.body.classList.add('intro-ended');
      hideIntroEnter();
    };

    const startIntro = () => {
      clearHeroFallback();
      hideOverlay(introHeroOverlay);
      showOverlay(introOverlay);
      document.body.classList.add('intro-active');
      document.body.classList.remove('intro-ended');
      hideIntroEnter();
      reloadFrame(introFrame);
    };

    const finishHeroLoader = () => {
      if (heroLoaderCompleted) return;
      heroLoaderCompleted = true;
      startIntro();
    };

    const startHeroLoader = () => {
      heroLoaderCompleted = false;
      document.body.classList.add('intro-active');
      document.body.classList.remove('intro-ended');
      hideIntroEnter();
      showOverlay(introHeroOverlay);
      hideOverlay(introOverlay);
      reloadFrame(introHeroFrame);
      clearHeroFallback();
      heroFallbackTimer = window.setTimeout(() => {
        finishHeroLoader();
      }, 13000);
    };

    hideIntroEnter();

    window.addEventListener('message', (event) => {
      if (isMessageFromFrame(event, introHeroFrame, 'intro-hero-complete')) {
        finishHeroLoader();
        return;
      }
      if (isMessageFromFrame(event, introFrame, 'intro-scroll-end')) {
        showIntroEnter();
      }
    });

    window.addEventListener('load', () => {
      if (skipByParam || isInternalReferrer) {
        finishIntro();
        if (skipByParam) {
          url.searchParams.delete('skipIntro');
          const cleanUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
        return;
      }
      startHeroLoader();
    });

    if (introEnter) {
      introEnter.addEventListener('click', finishIntro);
    }

    if (introTrigger) {
      introTrigger.addEventListener('click', () => {
        startIntro();
      });
    }
  } else {
    document.body.classList.remove('intro-active');
  }

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');

  const projectDetails = {
    film1: {
      title: 'Short Film - Echoes',
      body: [
        'A coming-of-age short exploring family, memory, and second chances.',
        'Shot on a hybrid DSLR/phone setup with a four-person crew. Edited in DaVinci Resolve with original score cues.',
        'Festival submissions in progress; private screener link available on request.'
      ],
    },
    script1: {
      title: 'Script - Midnight Circuit',
      body: [
        'Feature-length thriller (96 pages) following a young engineer who hijacks a smart-city grid to expose corruption.',
        'Written in Arc Studio; features clean act breaks and a lean character roster for production feasibility.',
        'PDF sample and lookbook available; open for notes and coverage.'
      ],
    },
    code1: {
      title: 'Code - ReelTracker',
      body: [
        'Python tool that tags footage, syncs notes, and exports edit-ready CSV/HTML reports for small crews.',
        'CLI prototype built with Typer; planned web UI using FastAPI + HTMX. Demo repo available on request.',
        'Focus areas: fast ingest, resilient metadata, and simple handoff to editors.'
      ],
    },
  };

  function openModal(id) {
    if (!modal || !modalContent) return;
    const detail = projectDetails[id];
    if (!detail) {
      modalContent.innerHTML = '<p>More details coming soon.</p>';
    } else {
      const paragraphs = detail.body.map((p) => `<p>${p}</p>`).join('');
      modalContent.innerHTML = `<h4>${detail.title}</h4>${paragraphs}`;
    }
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.details-btn').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    if (!id) return;
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      openModal(id);
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
})();
