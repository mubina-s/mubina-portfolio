(() => {
  'use strict';

  // --- Portfolio UI & Interactions ---
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const menuButton = document.getElementById("menuButton");
  const nav = document.getElementById("siteNav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
  }

  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        reveal.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(el => reveal.observe(el));

  const panel = document.getElementById("aiPanel");
  const backdrop = document.getElementById("aiBackdrop");
  if (panel && backdrop) {
    const close = () => {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
    };
    const open = () => {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      backdrop.hidden = false;
      setTimeout(() => {
        const input = document.getElementById("aiInput");
        if (input) input.focus();
      }, 150);
    };
    document.querySelectorAll("[data-open-ai]").forEach(b => b.addEventListener("click", open));
    const closeBtn = document.getElementById("closeAI");
    if (closeBtn) closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

    document.querySelectorAll(".prompt-chips button").forEach(button => {
      button.addEventListener("click", () => {
        const aiInput = document.getElementById("aiInput");
        const aiForm = document.getElementById("aiForm");
        if (aiInput && aiForm) {
          aiInput.value = button.textContent;
          aiForm.requestSubmit();
        }
      });
    });
  }

  // --- Contact form: compose an email in the visitor's email app ---
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("contactName")?.value.trim() || "Portfolio visitor";
      const email = document.getElementById("contactEmail")?.value.trim() || "";
      const message = document.getElementById("contactMessage")?.value.trim() || "";
      const subject = `Portfolio message from ${name}`;
      const body = `Hi Mubina,\n\n${message}\n\nFrom: ${name}${email ? ` (${email})` : ""}`;
      window.location.href = `mailto:mubish@iastate.edu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // --- Large Cinematic Scroll-Driven Frame Animation Engine ---
  const TOTAL_FRAMES = 240;
  const FRAME_PREFIX = 'assests/ezgif-frame-';
  const FRAME_EXT = '.png';
  const LERP_FACTOR = 0.12;
  const MAX_PARALLAX_Y = 50; // subtle vertical parallax
  const MAX_SCALE = 1.035;   // gentle scale zoom

  const canvas = document.getElementById('hero-animation-canvas');
  const stage = document.getElementById('heroStage');
  const frameEl = document.getElementById('cinematicFrame');
  if (!canvas || !stage) return;

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;

  let currentFrame = 0;
  let targetFrame = 0;
  let currentTranslateY = 0;
  let targetTranslateY = 0;
  let currentScale = 1.0;
  let targetScale = 1.0;
  let lastDrawnIndex = -1;
  let lastTransformStr = '';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;

  motionQuery.addEventListener?.('change', (e) => {
    prefersReducedMotion = e.matches;
    if (prefersReducedMotion && frameEl) {
      frameEl.style.transform = 'none';
    }
  });

  function getFramePath(index) {
    const num = String(index).padStart(3, '0');
    return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
  }

  function getNearestLoadedFrame(targetIdx) {
    if (frames[targetIdx] && frames[targetIdx].complete && frames[targetIdx].naturalWidth > 0) {
      return frames[targetIdx];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && frames[prev] && frames[prev].complete && frames[prev].naturalWidth > 0) {
        return frames[prev];
      }
      const next = targetIdx + offset;
      if (next < TOTAL_FRAMES && frames[next] && frames[next].complete && frames[next].naturalWidth > 0) {
        return frames[next];
      }
    }
    return null;
  }

  function drawFrame(frameIdx) {
    const img = getNearestLoadedFrame(frameIdx);
    if (!img) return;

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const imgW = img.naturalWidth || 1280;
    const imgH = img.naturalHeight || 720;

    // Fill background color matching edge of image
    ctx.fillStyle = '#070208';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Cover calculation preserving aspect ratio without distortion
    const hRatio = canvasW / imgW;
    const vRatio = canvasH / imgH;
    const ratio = Math.max(hRatio, vRatio);

    const drawW = imgW * ratio;
    const drawH = imgH * ratio;
    const offsetX = (canvasW - drawW) / 2;
    const offsetY = (canvasH - drawH) / 2;

    ctx.drawImage(img, 0, 0, imgW, imgH, offsetX, offsetY, drawW, drawH);
    lastDrawnIndex = frameIdx;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const displayW = Math.round(rect.width || 1180);
    const displayH = Math.round(rect.height || 640);

    const targetW = Math.floor(displayW * dpr);
    const targetH = Math.floor(displayH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      drawFrame(Math.round(currentFrame));
    }
  }

  // Calculate progress as the large cinematic visual scrolls through the viewport
  function updateScrollTarget() {
    const rect = stage.getBoundingClientRect();
    const windowH = window.innerHeight;
    const stageH = stage.offsetHeight;

    // Calculate normalized progress as user scrolls past the visual stage
    const startScroll = windowH * 0.9;
    const endScroll = -stageH * 0.5;
    const totalDist = startScroll - endScroll;
    const currentDist = startScroll - rect.top;

    const progress = Math.max(0, Math.min(1, currentDist / totalDist));

    targetFrame = progress * (TOTAL_FRAMES - 1);

    if (!prefersReducedMotion) {
      // Subtle parallax vertical travel and gentle scale
      targetTranslateY = (progress - 0.5) * -MAX_PARALLAX_Y;
      targetScale = 1.0 + ((MAX_SCALE - 1.0) * Math.sin(progress * Math.PI));
    } else {
      targetTranslateY = 0;
      targetScale = 1.0;
    }
  }

  function renderLoop() {
    // 1. Smooth LERP for frames
    const frameDiff = targetFrame - currentFrame;
    if (Math.abs(frameDiff) > 0.005) {
      currentFrame += frameDiff * LERP_FACTOR;
    } else {
      currentFrame = targetFrame;
    }

    // 2. Smooth LERP for subtle transform
    if (!prefersReducedMotion && frameEl) {
      const transDiff = targetTranslateY - currentTranslateY;
      if (Math.abs(transDiff) > 0.01) {
        currentTranslateY += transDiff * LERP_FACTOR;
      } else {
        currentTranslateY = targetTranslateY;
      }

      const scaleDiff = targetScale - currentScale;
      if (Math.abs(scaleDiff) > 0.0001) {
        currentScale += scaleDiff * LERP_FACTOR;
      } else {
        currentScale = targetScale;
      }

      const transformStr = `translate3d(0, ${currentTranslateY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;
      if (transformStr !== lastTransformStr) {
        frameEl.style.transform = transformStr;
        lastTransformStr = transformStr;
      }
    }

    // 3. Render frame
    const roundedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrame)));
    if (roundedFrame !== lastDrawnIndex) {
      drawFrame(roundedFrame);
    }

    requestAnimationFrame(renderLoop);
  }

  function preloadImages() {
    const firstImg = new Image();
    firstImg.src = getFramePath(1);
    firstImg.onload = () => {
      frames[0] = firstImg;
      loadedCount++;
      drawFrame(0);
      loadRemainingFrames();
    };
    firstImg.onerror = () => {
      loadRemainingFrames();
    };
    frames[0] = firstImg;
  }

  function loadRemainingFrames() {
    let nextIndexToLoad = 1;
    const CONCURRENCY = 6;

    function loadNext() {
      if (nextIndexToLoad >= TOTAL_FRAMES) return;

      const idx = nextIndexToLoad++;
      const img = new Image();
      img.src = getFramePath(idx + 1);

      img.onload = () => {
        frames[idx] = img;
        loadedCount++;
        loadNext();
      };

      img.onerror = () => {
        loadedCount++;
        loadNext();
      };
    }

    for (let i = 0; i < CONCURRENCY; i++) {
      loadNext();
    }
  }

  window.addEventListener('scroll', updateScrollTarget, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    updateScrollTarget();
  }, { passive: true });

  function initAnimation() {
    resizeCanvas();
    updateScrollTarget();
    preloadImages();
    requestAnimationFrame(renderLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimation);
  } else {
    initAnimation();
  }
})();
