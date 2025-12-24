(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const introOverlay = document.getElementById('intro-overlay');
  const introVideo = document.getElementById('intro-video');
  const introTrigger = document.getElementById('intro-trigger');

  if (introOverlay && introVideo) {
    const url = new URL(window.location.href);
    const skipByParam = url.searchParams.has('skipIntro');
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

    if (skipByParam || isInternalReferrer) {
      document.body.classList.remove('intro-active');
      introVideo.muted = true;
      introVideo.pause();
      introVideo.currentTime = 0;
    }

    const finishIntro = () => {
      introOverlay.classList.add('is-hidden');
      introOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('intro-active');
      document.body.classList.add('intro-ended');
      introVideo.pause();
    };

    const startIntro = () => {
      introOverlay.classList.remove('is-hidden');
      introOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('intro-active');
      document.body.classList.remove('intro-ended');
      introVideo.muted = false;
      introVideo.currentTime = 0;
      const attempt = introVideo.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => {
          finishIntro();
        });
      }
      window.setTimeout(() => {
        if (!introOverlay.classList.contains('is-hidden')) {
          finishIntro();
        }
      }, 3800);
    };

    introVideo.addEventListener('ended', finishIntro);
    introVideo.addEventListener('error', finishIntro);
    introVideo.addEventListener('timeupdate', () => {
      if (introVideo.currentTime >= 3.5) {
        finishIntro();
      }
    });

    window.addEventListener('load', () => {
      if (skipByParam || isInternalReferrer) {
        introVideo.muted = true;
        introVideo.pause();
        introVideo.currentTime = 0;
        finishIntro();
        if (skipByParam) {
          url.searchParams.delete('skipIntro');
          const cleanUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
        return;
      }
      introVideo.muted = false;
      startIntro();
    });

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
