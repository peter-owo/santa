(function () {
  const W = 900, H = 600;
  const card = document.getElementById('card');
  const canvas = document.getElementById('drawing');
  const ctx = canvas.getContext('2d');
  const itemsEl = document.getElementById('items');
  const initialText = '親愛的聖誕老公公：\n今年我希望…';
  const state = { tool: 'select', color: '#d4483d', size: 8, items: [], selected: null, history: [], drawing: false, gesture: null, busy: false };
  const $ = id => document.getElementById(id);
  let toastTimer;

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }
  const challenge = { question: 1, yesChecks: 0, noPresses: 0, afterConfirm: null };
  const yesAnswer = $('answer-yes'), noAnswer = $('answer-no');
  function showScreen(name) {
    $('home-screen').hidden = name !== 'home';
    $('quiz-screen').hidden = name !== 'quiz';
    $('make-card').hidden = name !== 'editor';
    window.scrollTo(0, 0);
  }
  function showQuestion(number) {
    challenge.question = number;
    $('quiz-screen').classList.toggle('question-two', number === 2);
    $('quiz-kicker').textContent = number === 1 ? '第一題' : '第二題';
    $('quiz-emoji').textContent = number === 1 ? '🎅🏻' : '👑';
    $('quiz-question').textContent = number === 1 ? '你今年是好孩子嗎？' : '邱秉鈞是好國王嗎？';
    $('progress-one').classList.toggle('done', number === 2);
    $('progress-one').classList.toggle('active', number === 1);
    $('progress-two').classList.toggle('active', number === 2);
    noAnswer.disabled = false;
    yesAnswer.style.setProperty('--yes-scale', '1');
    yesAnswer.style.setProperty('--yes-rotate', '0deg');
    yesAnswer.textContent = '是';
  }
  function startWish() {
    challenge.yesChecks = 0;
    challenge.noPresses = 0;
    showQuestion(1);
    showScreen('quiz');
    $('quiz-question').focus();
  }
  function openChallenge(kind) {
    const dialog = $('challenge-dialog');
    dialog.className = 'challenge-dialog';
    if (kind === 'food') {
      $('challenge-icon').textContent = '🥕';
      $('challenge-title').textContent = '你確定嗎？';
      $('challenge-message').textContent = '聽說好孩子是不挑食的(荔枝、木瓜、菜梗、紅蘿蔔...)';
      $('challenge-confirm').textContent = '確定';
      challenge.afterConfirm = () => yesAnswer.focus();
    } else if (kind === 'sleep') {
      dialog.classList.add('large');
      $('challenge-icon').textContent = '🌙';
      $('challenge-title').textContent = '你確定嗎？';
      $('challenge-message').textContent = '好孩子是不會熬夜的喔';
      $('challenge-confirm').textContent = '確定';
      challenge.afterConfirm = () => yesAnswer.focus();
    } else {
      dialog.classList.add('bad');
      $('challenge-icon').textContent = '🎁';
      $('challenge-title').textContent = '壞孩子不能有禮物';
      $('challenge-message').textContent = '明年再來挑戰聖誕老公公吧！';
      $('challenge-confirm').textContent = '返回主頁';
      challenge.afterConfirm = () => { showScreen('home'); $('start-wish').focus(); };
    }
    $('challenge-modal').hidden = false;
    $('challenge-confirm').focus();
  }
  $('start-wish').addEventListener('click', startWish);
  $('quiz-home').addEventListener('click', () => showScreen('home'));
  $('editor-home').addEventListener('click', () => showScreen('home'));
  yesAnswer.addEventListener('click', () => {
    if (challenge.question === 2) { showScreen('editor'); return; }
    challenge.yesChecks += 1;
    if (challenge.yesChecks === 1) openChallenge('food');
    else if (challenge.yesChecks === 2) openChallenge('sleep');
    else { showQuestion(2); $('quiz-question').focus(); }
  });
  noAnswer.addEventListener('click', () => {
    if (challenge.question === 1) { openChallenge('bad'); return; }
    challenge.noPresses += 1;
    if (challenge.noPresses <= 5) {
      const previous = 1 + (challenge.noPresses - 1) * .32;
      const next = 1 + challenge.noPresses * .32;
      const previousAngle = challenge.noPresses === 1 ? 0 : (challenge.noPresses % 2 === 0 ? -1 : 1) * (challenge.noPresses - 1) * 4;
      const nextAngle = (challenge.noPresses % 2 === 0 ? 1 : -1) * challenge.noPresses * 4;
      yesAnswer.style.setProperty('--yes-scale', String(next));
      yesAnswer.style.setProperty('--yes-rotate', nextAngle + 'deg');
      if (yesAnswer.animate) yesAnswer.animate([
        { transform: 'scale(' + previous + ') rotate(' + previousAngle + 'deg)' },
        { transform: 'scale(' + (next + .18) + ') rotate(' + (nextAngle * 1.25) + 'deg)' },
        { transform: 'scale(' + next + ') rotate(' + nextAngle + 'deg)' },
      ], { duration: 520, easing: 'cubic-bezier(.2,1.4,.3,1)' });
    } else {
      noAnswer.disabled = true;
      yesAnswer.focus();
    }
  });
  $('challenge-confirm').addEventListener('click', () => {
    $('challenge-modal').hidden = true;
    const next = challenge.afterConfirm;
    challenge.afterConfirm = null;
    if (next) next();
  });
  function setTool(name) {
    state.tool = name;
    card.classList.toggle('draw', name === 'pen' || name === 'eraser');
    document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === name));
    if (name !== 'select') { state.selected = null; updateSelection(); }
  }
  function addItem(item) {
    item.id = crypto.randomUUID();
    state.items.push(item);
    state.selected = item.id;
    setTool('select');
    renderItems();
    return item;
  }
  function itemById(id) { return state.items.find(i => i.id === id); }
  function updateSelection() {
    itemsEl.querySelectorAll('.item').forEach(el => el.classList.toggle('selected', el.dataset.id === state.selected));
    $('remove-item').disabled = !state.selected;
  }
  function applyItemStyle(el, item) {
    el.style.left = item.x + '%'; el.style.top = item.y + '%';
    el.style.width = item.w + '%'; el.style.height = item.h + '%';
    el.style.setProperty('--rotate', (item.rotate || 0) + 'deg');
    if (item.type === 'sticker') el.style.fontSize = item.w * .75 + 'cqw';
    el.classList.toggle('rotate-below', item.y < 10);
  }
  function renderItems() {
    itemsEl.textContent = '';
    state.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'item ' + item.type;
      applyItemStyle(el, item);
      el.dataset.id = item.id;
      if (item.type === 'text') {
        const ta = document.createElement('textarea');
        ta.value = item.text;
        ta.maxLength = 1000;
        ta.setAttribute('aria-label', '卡片文字');
        ta.addEventListener('input', () => { item.text = ta.value; });
        ta.addEventListener('focus', () => { state.selected = item.id; updateSelection(); });
        el.appendChild(ta);
      } else if (item.type === 'photo' || item.type === 'image-sticker') {
        const img = document.createElement('img');
        img.src = item.src; img.alt = item.type === 'photo' ? '上傳的照片' : '角色貼紙'; el.appendChild(img);
      } else {
        el.textContent = item.text;
      }
      if (item.type === 'text') {
        const handle = document.createElement('button');
        handle.type = 'button'; handle.className = 'drag-handle'; handle.textContent = '✥';
        handle.setAttribute('aria-label', '拖動文字');
        handle.addEventListener('pointerdown', event => startGesture(event, item, 'move'));
        el.appendChild(handle);
        el.addEventListener('pointerdown', () => { if (state.tool === 'select') { state.selected = item.id; updateSelection(); } });
      } else {
        for (const [corner, sx, sy] of [['nw', -1, -1], ['ne', 1, -1], ['sw', -1, 1], ['se', 1, 1]]) {
          const handle = document.createElement('button');
          handle.type = 'button'; handle.className = 'resize-handle ' + corner;
          handle.setAttribute('aria-label', '拖曳縮放');
          handle.addEventListener('pointerdown', event => startGesture(event, item, 'resize', sx, sy));
          el.appendChild(handle);
        }
        const rotateHandle = document.createElement('button');
        rotateHandle.type = 'button'; rotateHandle.className = 'rotate-handle'; rotateHandle.textContent = '↻';
        rotateHandle.setAttribute('aria-label', '拖曳旋轉');
        rotateHandle.addEventListener('pointerdown', event => startGesture(event, item, 'rotate'));
        el.appendChild(rotateHandle);
        el.addEventListener('pointerdown', event => { if (state.tool === 'select') startGesture(event, item, 'move'); });
      }
      itemsEl.appendChild(el);
    });
    updateSelection();
  }
  function startGesture(event, item, kind, sx = 0, sy = 0) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    state.selected = item.id; updateSelection();
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + (item.x + item.w / 2) / 100 * rect.width;
    const centerY = rect.top + (item.y + item.h / 2) / 100 * rect.height;
    state.gesture = {
      id: item.id, kind, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: item.x, y: item.y, w: item.w, h: item.h, rotate: item.rotate || 0,
      rect, centerX, centerY, widthPx: item.w / 100 * rect.width, heightPx: item.h / 100 * rect.height,
      sx, sy, pointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  window.addEventListener('pointermove', event => {
    const m = state.gesture;
    if (!m || event.pointerId !== m.pointerId) return;
    const item = itemById(m.id);
    if (!item) return;
    if (m.kind === 'move') {
      item.x = Math.max(0, Math.min(100 - item.w, m.x + (event.clientX - m.startX) / m.rect.width * 100));
      item.y = Math.max(0, Math.min(100 - item.h, m.y + (event.clientY - m.startY) / m.rect.height * 100));
    } else if (m.kind === 'rotate') {
      const angle = Math.atan2(event.clientY - m.centerY, event.clientX - m.centerX) - m.pointerAngle;
      const degrees = m.rotate + angle * 180 / Math.PI;
      item.rotate = event.shiftKey ? Math.round(degrees / 15) * 15 : Math.round(degrees * 10) / 10;
    } else {
      const radians = m.rotate * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
      const dx = event.clientX - m.startX, dy = event.clientY - m.startY;
      const localX = dx * cos + dy * sin, localY = -dx * sin + dy * cos;
      const projected = (m.sx * localX * m.widthPx + m.sy * localY * m.heightPx) / (m.widthPx ** 2 + m.heightPx ** 2);
      const minScale = Math.max(.15, 28 / m.widthPx, 28 / m.heightPx);
      const maxScale = Math.min(80 / m.w, 80 / m.h);
      const scale = Math.max(minScale, Math.min(maxScale, 1 + projected));
      item.w = m.w * scale; item.h = m.h * scale;
      const localShiftX = m.sx * (item.w - m.w) / 200 * m.rect.width;
      const localShiftY = m.sy * (item.h - m.h) / 200 * m.rect.height;
      const centerX = m.centerX + localShiftX * cos - localShiftY * sin;
      const centerY = m.centerY + localShiftX * sin + localShiftY * cos;
      item.x = Math.max(0, Math.min(100 - item.w, (centerX - m.rect.left) / m.rect.width * 100 - item.w / 2));
      item.y = Math.max(0, Math.min(100 - item.h, (centerY - m.rect.top) / m.rect.height * 100 - item.h / 2));
    }
    const el = itemsEl.querySelector('[data-id="' + item.id + '"]');
    if (el) applyItemStyle(el, item);
  });
  const endGesture = event => { if (state.gesture && event.pointerId === state.gesture.pointerId) state.gesture = null; };
  window.addEventListener('pointerup', endGesture);
  window.addEventListener('pointercancel', endGesture);

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }
  canvas.addEventListener('pointerdown', event => {
    if (state.tool !== 'pen' && state.tool !== 'eraser') return;
    event.preventDefault();
    state.history.push(ctx.getImageData(0, 0, W, H));
    if (state.history.length > 12) state.history.shift();
    state.drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Number(state.size);
    ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = state.color;
    ctx.lineTo(p.x + .01, p.y + .01); ctx.stroke();
  });
  canvas.addEventListener('pointermove', event => {
    if (!state.drawing) return;
    const p = point(event); ctx.lineTo(p.x, p.y); ctx.stroke();
  });
  function endDraw() { state.drawing = false; ctx.globalCompositeOperation = 'source-over'; }
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);
  document.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  document.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', () => {
    state.color = b.dataset.color;
    document.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('active', x === b));
    setTool('pen');
  }));
  $('brush-size').addEventListener('input', event => { state.size = event.target.value; $('brush-value').textContent = state.size + ' px'; });
  $('add-text').addEventListener('click', () => {
    const item = addItem({ type: 'text', x: 15, y: 31, w: 56, h: 30, text: '在這裡寫下你的心願…' });
    setTimeout(() => { const el = itemsEl.querySelector('[data-id="' + item.id + '"] textarea'); if (el) { el.focus(); el.select(); } }, 0);
  });
  $('add-photo').addEventListener('click', () => $('photo-input').click());
  $('photo-input').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('請選擇照片檔案'); return; }
    if (file.size > 12 * 1024 * 1024) { toast('照片請小於 12MB'); return; }
    try {
      const src = await shrinkImage(file);
      addItem({ type: 'photo', x: 57, y: 35, w: 30, h: 33, src, rotate: 4 });
      toast('照片已貼上！拖動紅點可以移動');
    } catch { toast('照片讀取失敗，請換一張試試'); }
    event.target.value = '';
  });
  function shrinkImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', .84));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }
  document.querySelectorAll('[data-sticker]').forEach(b => b.addEventListener('click', () => addItem({ type: 'sticker', x: 37, y: 45, w: 9, h: 13, text: b.dataset.sticker, rotate: -8 })));
  document.querySelectorAll('[data-image-sticker]').forEach(button => button.addEventListener('click', async () => {
    try {
      const src = button.dataset.imageSticker;
      const img = await loadImage(src);
      const w = 20;
      const h = Math.min(34, w * W / H * img.height / img.width);
      const count = state.items.filter(item => item.type === 'image-sticker').length;
      addItem({ type: 'image-sticker', x: 35 + count % 4 * 7, y: 38 + count % 3 * 5, w, h, src, rotate: count % 2 ? 5 : -5 });
    } catch { toast('貼紙載入失敗，請重新整理後再試一次'); }
  }));
  $('undo').addEventListener('click', () => { const snap = state.history.pop(); if (snap) ctx.putImageData(snap, 0, 0); else toast('目前沒有可以復原的筆畫'); });
  $('remove-item').addEventListener('click', () => { if (!state.selected) return; state.items = state.items.filter(i => i.id !== state.selected); state.selected = null; renderItems(); });

  function wrapText(c, text, width) {
    const rows = [];
    String(text).split('\n').forEach(line => {
      if (!line) { rows.push(''); return; }
      let current = '';
      for (const char of line) {
        if (c.measureText(current + char).width > width && current) { rows.push(current); current = char; }
        else current += char;
      }
      rows.push(current);
    });
    return rows;
  }
  function loadImage(src) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; }); }
  async function snapshot() {
    await document.fonts.ready;
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const c = out.getContext('2d');
    c.fillStyle = '#fff9e8'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#dfb68f'; c.lineWidth = 2; c.setLineDash([7, 6]); c.strokeRect(22, 14, 856, 572); c.setLineDash([]);
    c.fillStyle = '#c84c3e'; c.font = '900 40px "Noto Sans TC", sans-serif'; c.fillText('Dear Santa,', 63, 75);
    c.fillStyle = '#8caa8e'; c.font = '800 14px "DM Sans", sans-serif'; c.fillText('M Y   C H R I S T M A S   W I S H', 64, 112);
    c.save(); c.translate(793, 77); c.rotate(8 * Math.PI / 180); c.strokeStyle = '#c86a54'; c.lineWidth = 2; c.setLineDash([4, 4]); c.strokeRect(-47, -41, 94, 82); c.setLineDash([]); c.fillStyle = '#c86a54'; c.font = '50px sans-serif'; c.fillText('★', -23, 19); c.restore();
    for (const item of state.items) {
      const x = item.x / 100 * W, y = item.y / 100 * H, w = item.w / 100 * W, h = item.h / 100 * H;
      if (item.type === 'text') {
        c.fillStyle = '#31564b'; c.font = '700 23px "Noto Sans TC", sans-serif'; c.textBaseline = 'top';
        wrapText(c, item.text, w).slice(0, Math.floor(h / 35)).forEach((line, n) => c.fillText(line, x, y + n * 35));
      } else if (item.type === 'image-sticker') {
        const img = await loadImage(item.src);
        c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((item.rotate || 0) * Math.PI / 180);
        c.drawImage(img, -w / 2, -h / 2, w, h); c.restore();
      } else if (item.type === 'photo') {
        const img = await loadImage(item.src);
        c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((item.rotate || 0) * Math.PI / 180);
        c.fillStyle = '#fff'; c.shadowColor = '#4b534c55'; c.shadowBlur = 14; c.fillRect(-w / 2, -h / 2, w, h); c.shadowBlur = 0;
        const pad = w * .04, iw = w - pad * 2, ih = h - pad * 2, ratio = Math.max(iw / img.width, ih / img.height), sw = iw / ratio, sh = ih / ratio;
        c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, -w / 2 + pad, -h / 2 + pad, iw, ih); c.restore();
      } else {
        c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((item.rotate || 0) * Math.PI / 180);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = Math.round(Math.min(w, h) * .75) + 'px sans-serif'; c.fillText(item.text, 0, 0); c.restore();
      }
    }
    c.drawImage(canvas, 0, 0);
    return out;
  }
  function blobFromCanvas(c) { return new Promise(resolve => c.toBlob(resolve, 'image/png')); }
  $('download').addEventListener('click', async () => {
    try {
      const c = await snapshot(), blob = await blobFromCanvas(c), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = '我的聖誕許願卡.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { toast('下載失敗，請再試一次'); }
  });
  function resetSend() {
    state.busy = false;
    $('send').disabled = false;
    $('send').textContent = '✉　寄給聖誕老公公';
  }
  window.addEventListener('pageshow', resetSend);
  $('send').addEventListener('click', async () => {
    if (state.busy) return;
    if (!$('email').reportValidity()) return;
    const text = state.items.filter(i => i.type === 'text').map(i => i.text.trim()).join('\n').trim();
    if (!text || text === initialText || text === '在這裡寫下你的心願…') { toast('先寫下你的願望，再寄出去喔！'); setTool('select'); return; }
    state.busy = true; $('send').disabled = true; $('send').textContent = '✉　正在寄送…';
    try {
      const c = await snapshot(), blob = await blobFromCanvas(c);
      if (!blob || blob.size > 4 * 1024 * 1024) throw new Error('卡片圖片太大，請換較小的照片');
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], 'santa-card.png', { type: 'image/png' }));
      $('mail-attachment').files = transfer.files;
      $('mail-name').value = $('sender').value.trim().slice(0, 40) || '匿名許願人';
      $('mail-email').value = $('email').value.trim();
      $('mail-message').value = text.slice(0, 2000);
      $('mail-next').value = new URL('./thanks.html', location.href).href;
      $('mail-url').value = location.href.split('#')[0];
      $('mail-form').submit();
      setTimeout(resetSend, 10000);
    } catch (error) { toast(error.message || '寄送失敗，請再試一次'); resetSend(); }
  });
  addItem({ type: 'text', x: 12, y: 29, w: 57, h: 32, text: initialText });
  state.selected = null; renderItems();
})();
