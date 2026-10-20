/* ======================================================================
   GRADUATION INVITATION · SCRIPT
   User design: 945 × 2048 px. Giữ đúng vị trí ảnh theo bố cục gốc.

   ĐỔI GOOGLE FORM TẠI ĐÂY:
   Ví dụ: GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/.../viewform',
   ====================================================================== */
const CONFIG = {
  DESIGN_WIDTH: 945,
  DESIGN_HEIGHT: 2048,
  GOOGLE_FORM_URL: '', // <-- DÁN LINK GOOGLE FORM CỦA M VÀO ĐÂY
  SHOW_RSVP: true,    // false = ẩn nút RSVP, giữ bố cục y hình m vẽ
  ANIMATION: {
    title: 350,
    details: 1050,
    sticker1: 1570,
    sticker3: 1760,
    sticker5: 1930,
    sticker4: 2110,
    sticker2: 2300,
    rsvp: 2700,
  },
};

// Các đơn vị (x, y, width) là PIXEL TRÊN FILE BACKGROUND 945 × 2048.
// Chỉnh số ở đây khi m muốn di chuyển/đổi kích thước TRƯỚC khi người xem tương tác.
// Góc xoay là độ, số âm = nghiêng ngược kim đồng hồ.
// Sticker 1 = ngôi sao; 2 = mèo lớn; 3 = thỏ; 4 = chibi; 5 = @torutr.
const LAYOUT = {
  title: { x: 244, y: 695, width: 462 },
  details: { x: 204, y: 1170, width: 300 },
  stickers: [
    { id: 1, x: 108, y: 559, width: 165, rotation: 34 },
    { id: 2, x: 195, y: 1510, width: 427, rotation: 0 },
    { id: 3, x: 581, y: 196, width: 232, rotation: 0 },
    { id: 4, x: 625, y: 1021, width: 281, rotation: 0 },
    { id: 5, x: 49, y: 252, width: 317, rotation: -11 },
  ],
};

(() => {
  'use strict';
  const artboard = document.getElementById('artboard');
  const viewport = document.getElementById('viewport');
  const rsvpButton = document.getElementById('rsvp-button');
  const toast = document.getElementById('toast');
  const elements = new Map();
  let currentScale = 1;
  let topZ = 10;
  let toastTimer;

  function setBox(el, def, aspectRatio = null) {
    const width = def.width;
    const height = aspectRatio ? (width / aspectRatio) : def.height;
    el.style.left = `${def.x}px`;
    el.style.top = `${def.y}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    if (def.rotation) el.style.rotate = `${def.rotation}deg`;
    el.dataset.x = `${def.x}`;
    el.dataset.y = `${def.y}`;
    el.dataset.width = `${width}`;
    el.dataset.height = `${height}`;
  }

  function assetRatio(el) {
    const img = el.querySelector('img');
    return img.naturalWidth && img.naturalHeight
      ? img.naturalWidth / img.naturalHeight
      : 1;
  }

  function positionElements() {
    const title = document.getElementById('title-element');
    const details = document.getElementById('details-element');
    setBox(title, LAYOUT.title, assetRatio(title));
    setBox(details, LAYOUT.details, assetRatio(details));
    for (const config of LAYOUT.stickers) {
      const el = document.querySelector(`[data-sticker="${config.id}"]`);
      setBox(el, config, assetRatio(el));
      elements.set(config.id, el);
    }
  }

  // Scale toàn bộ artwork theo CÙNG MỘT tỷ lệ, tránh chữ/sticker lệch
  // vị trí hoặc phóng to quá mức trên iPhone và Android.
  function fitArtwork() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    if (!w || !h) return;
    currentScale = Math.min(w / CONFIG.DESIGN_WIDTH, h / CONFIG.DESIGN_HEIGHT);
    const renderedW = CONFIG.DESIGN_WIDTH * currentScale;
    const renderedH = CONFIG.DESIGN_HEIGHT * currentScale;
    artboard.style.left = `${(w - renderedW) / 2}px`;
    artboard.style.top = `${(h - renderedH) / 2}px`;
    artboard.style.transform = `scale(${currentScale})`;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4000);
  }

  function setupRSVP() {
    if (!CONFIG.SHOW_RSVP) {
      rsvpButton.style.display = 'none';
      return;
    }
    const url = CONFIG.GOOGLE_FORM_URL.trim();
    if (/^https:\/\//i.test(url)) rsvpButton.href = url;
    else {
      rsvpButton.removeAttribute('target');
      rsvpButton.addEventListener('click', (event) => {
        event.preventDefault();
        showToast('Chưa có link Google Form. Mở js/app.js và điền GOOGLE_FORM_URL nhé!');
      });
    }
  }

  function setupDrag(el) {
    let state = null;

    el.addEventListener('pointerdown', (event) => {
      // Không kéo nếu sticker chưa hiện; chỉ nhận thao tác chính.
      if (!el.classList.contains('is-visible') || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      state = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: parseFloat(el.dataset.x),
        startY: parseFloat(el.dataset.y),
      };
      el.style.zIndex = `${++topZ}`;
      el.classList.add('is-dragging');
      // capture giúp sticker vẫn đi theo ngón tay khi kéo ra ngoài vùng ảnh.
      el.setPointerCapture(event.pointerId);
    });

    el.addEventListener('pointermove', (event) => {
      if (!state || event.pointerId !== state.pointerId) return;
      event.preventDefault();
      const width = parseFloat(el.dataset.width);
      const height = parseFloat(el.dataset.height);
      const dx = (event.clientX - state.startClientX) / currentScale;
      const dy = (event.clientY - state.startClientY) / currentScale;
      // Không để sticker bị kéo biến mất khỏi màn hình.
      const x = Math.min(Math.max(state.startX + dx, 0), CONFIG.DESIGN_WIDTH - width);
      const y = Math.min(Math.max(state.startY + dy, 0), CONFIG.DESIGN_HEIGHT - height);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.dataset.x = `${x}`;
      el.dataset.y = `${y}`;
    });

    function endDrag(event) {
      if (!state || event.pointerId !== state.pointerId) return;
      state = null;
      el.classList.remove('is-dragging');
      if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('lostpointercapture', () => {
      state = null;
      el.classList.remove('is-dragging');
    });
    el.addEventListener('dragstart', event => event.preventDefault());
    el.addEventListener('contextmenu', event => event.preventDefault());
  }

  function startAnimations() {
    const schedule = [
      [document.getElementById('title-element'), CONFIG.ANIMATION.title],
      [document.getElementById('details-element'), CONFIG.ANIMATION.details],
      [elements.get(1), CONFIG.ANIMATION.sticker1],
      [elements.get(3), CONFIG.ANIMATION.sticker3],
      [elements.get(5), CONFIG.ANIMATION.sticker5],
      [elements.get(4), CONFIG.ANIMATION.sticker4],
      [elements.get(2), CONFIG.ANIMATION.sticker2],
    ];
    if (CONFIG.SHOW_RSVP) schedule.push([rsvpButton, CONFIG.ANIMATION.rsvp]);
    for (const [el, delay] of schedule) {
      window.setTimeout(() => {
        el?.classList.add('is-visible');
        // Sau khi pop xong, trả ảnh về trạng thái tĩnh để kéo/thả không bật lại animation.
        if (el?.classList.contains('art-element')) {
          window.setTimeout(() => el.classList.add('has-arrived'), 750);
        }
      }, delay);
    }
  }

  async function ready() {
    // Chờ ảnh load để lấy được tỷ lệ gốc, không làm méo PNG.
    const imgs = [...artboard.querySelectorAll('img:not(.background)')];
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
      img.addEventListener('load', resolve, {once:true});
      img.addEventListener('error', resolve, {once:true});
    })));
    positionElements();
    fitArtwork();
    setupRSVP();
    elements.forEach(setupDrag);
    startAnimations();
  }

  window.addEventListener('resize', fitArtwork, {passive:true});
  window.visualViewport?.addEventListener('resize', fitArtwork, {passive:true});
  document.addEventListener('gesturestart', e => e.preventDefault(), {passive:false});
  document.addEventListener('dragstart', e => e.preventDefault());
  // Desktop: nhấn R để reload thiệp và reset vị trí sticker.
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'r' && !event.repeat && !event.metaKey && !event.ctrlKey) window.location.reload();
  });
  ready();
})();
