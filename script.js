// A self-contained particle heart: no WebGL or remote JavaScript required.
const canvas = document.getElementById('heart-canvas');
const ctx = canvas.getContext('2d');
const scene = document.getElementById('heart-scene');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.getElementById('toggle-motion');
const palettes = [
  { hue: 25, text: 'Trái tim màu cam' },
  { hue: 278, text: 'Trái tim màu tím' },
  { hue: 343, text: 'Trái tim màu hồng' }
];
let morph = 0, morphTarget = 0;
const sparks = [];
let palette = 0, width = 0, height = 0, time = 0, lastTime = 0;
let paused = motionQuery.matches, frame = null, burst = 0;
const particles = Array.from({ length: 2300 }, () => {
  const a = Math.random() * Math.PI * 2;
  const b = Math.acos(2 * Math.random() - 1);
  const x = Math.sin(b) * Math.cos(a);
  const z = Math.sin(b) * Math.sin(a);
  const y = Math.cos(b);
  // A rounded, volumetric heart, with a cleft and a tapered point.
  return { x: x * 16, y: y * 13 + Math.sqrt(Math.abs(x)) * 8 - 3,
    z: z * 6 * (.65 + (y + 1) * .18), size: .35 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2, light: 46 + Math.random() * 32 };
});
// Each particle owns both destinations; morphing moves the same particles.
particles.forEach(p => {
  let x, y;
  do {
    x = (Math.random() - .5) * 27;
    y = (Math.random() - .5) * 33;
    const cranium = (x / 12.7) ** 2 + ((y - 4) / 12.2) ** 2 < 1 && y > -5;
    const jaw = y < -3 && y > -14 && Math.abs(x) < 7.5 + (y + 4) * .16;
    const eyes = ((Math.abs(x) - 5.4) / 3.7) ** 2 + ((y - 2) / 3.8) ** 2 < 1;
    const nose = y < -.8 && y > -5.7 && Math.abs(x) < (1 + (-y) * .25);
    const teeth = y < -8 && y > -12.8 && Math.abs(x % 2.15) < .32;
    if ((cranium || jaw) && !eyes && !nose && !teeth) break;
  } while (true);
  p.sx = x; p.sy = y; p.sz = Math.random() * 2 + 2 * Math.sqrt(Math.max(0, 1 - (x / 13) ** 2));
});
const stars = Array.from({ length: 95 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 1.2 + .2, phase: Math.random() * 6 }));
function resize() {
  width = scene.clientWidth;
  height = scene.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}
function draw() {
  ctx.clearRect(0, 0, width, height);
  const hue = palettes[palette].hue;
  const blend = morph * morph * (3 - 2 * morph);
  const scatter = Math.sin(Math.PI * morph) * 7;
  const cx = width * .5, cy = height * .46;
  const scale = Math.min(width / 43, height / 43);
  const beat = 1 + Math.pow((Math.sin(time * 2.7) + 1) / 2, 5) * .045;
  const rotation = Math.sin(time * .3) * .35;
  const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, scale * 21);
  glow.addColorStop(0, `hsla(${hue},90%,50%,.09)`);
  glow.addColorStop(1, `hsla(${hue},90%,50%,0)`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
  stars.forEach(s => {
    ctx.fillStyle = `hsla(${hue + 20},65%,78%,${.15 + (Math.sin(time + s.phase) + 1) * .16})`;
    ctx.beginPath();ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);ctx.fill();
  });
  // Fine elliptical trails make the heart feel suspended in a night sky.
  for (let j = 0; j < 3; j++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + scale * 4, scale * (21 + j * .7), scale * (6 + j * .7), -.27, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue + 15},60%,65%,${.07 - j * .015})`;ctx.lineWidth = .7;ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  particles.forEach(p => {
    const tx = p.sx + (p.x - p.sx) * blend + Math.sin(p.phase + time) * scatter;
    const ty = p.sy + (p.y - p.sy) * blend + Math.cos(p.phase * 2 + time) * scatter;
    const tz = p.sz + (p.z - p.sz) * blend + Math.sin(p.phase * 3) * scatter;
    const x = tx * Math.cos(rotation) + tz * Math.sin(rotation);
    const z = tz * Math.cos(rotation) - tx * Math.sin(rotation);
    const perspective = 65 / (65 - z);
    const spread = 1 + burst * .18;
    const px = cx + x * scale * beat * perspective * spread;
    const py = cy - ty * scale * beat * perspective * spread;
    const alpha = (.35 + (z + 9) / 32) * (.8 + Math.sin(time * 1.4 + p.phase) * .2);
    ctx.fillStyle = `hsla(${hue + p.z * 1.3},95%,${p.light}%,${alpha})`;
    ctx.beginPath();ctx.arc(px, py, p.size * perspective * (width < 400 ? .75 : 1), 0, Math.PI * 2);ctx.fill();
  });
  // Floating embers orbit the heart.
  for (let i = 0; i < 45; i++) {
    const a = i * 2.399 + time * .13;
    const r = scale * (18 + Math.sin(i * 12.1) * 4);
    const x = Math.cos(a) * r, y = Math.sin(a) * r * .32;
    ctx.fillStyle = `hsla(${hue},85%,75%,${.3 + (i % 4) * .15})`;
    ctx.beginPath();ctx.arc(cx + x, cy + scale * 4 + y - x * .25, i % 5 === 0 ? 1.6 : .7, 0, Math.PI * 2);ctx.fill();
  }
  sparks.forEach(s => {
    ctx.fillStyle = `hsla(${s.hue},95%,78%,${s.life})`;
    ctx.beginPath(); ctx.arc(s.x * width, s.y * height, s.size * s.life, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}
function animate(timestamp) {
  frame = null;
  if (paused || document.hidden) return;
  const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, .05) : 0;
  lastTime = timestamp; time += delta; burst = Math.max(0, burst - delta * .8);
  const step = delta / 0.65;
  morph += Math.sign(morphTarget - morph) * Math.min(Math.abs(morphTarget - morph), step);
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.life -= delta * 1.4; s.x += s.vx * delta; s.y += s.vy * delta;
    if (s.life <= 0) sparks.splice(i, 1);
  }
  draw(); frame = requestAnimationFrame(animate);
}
function schedule() {
  lastTime = 0;
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  if (!paused && !document.hidden) frame = requestAnimationFrame(animate);
}
function syncMotion() {
  document.body.classList.toggle('paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Tiếp tục hiệu ứng' : 'Tạm dừng hiệu ứng');
  document.getElementById('motion-icon').textContent = paused ? '▷' : 'Ⅱ';

  if (paused) { morph = morphTarget; sparks.length = 0; draw(); }
  schedule();
}
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
document.getElementById('cast-spell').addEventListener('click', () => {
  palette = (palette + 1) % palettes.length;
  burst = paused ? 0 : 1;
  document.getElementById('spell-status').textContent = palettes[palette].text;
  draw();
});
motionQuery.addEventListener('change', event => { paused = event.matches; syncMotion(); });
document.addEventListener('visibilitychange', schedule);
new ResizeObserver(resize).observe(scene);
resize(); syncMotion();


const ghost = document.getElementById('ghost');
const startButton = document.getElementById('start-game');
const nameInput = document.getElementById('player-name');
const heartView = document.getElementById('heart-view');
const backButton = document.getElementById('back-to-game');
let playerName = '';
function setPlayerName(name) {
  playerName = name.trim().slice(0, 24);
  document.getElementById('brand-name').textContent = playerName || 'PLAYER';
  document.getElementById('hero-name').textContent = (playerName || 'Player') + '.';
  document.getElementById('heart-winner-name').textContent = playerName;
}
function showHeartView() {
  heartView.inert = false;
  heartView.setAttribute('aria-hidden', 'false');
  heartView.classList.add('visible');
  document.body.classList.add('showing-heart');
  window.dispatchEvent(new Event('heart-view-open'));
}
function hideHeartView() {
  heartView.classList.remove('visible');
  heartView.inert = true;
  heartView.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('showing-heart');
  window.dispatchEvent(new Event('heart-view-close'));
}
backButton.addEventListener('click', () => {
  hideHeartView();
  startButton.focus({preventScroll:true});
});
nameInput.addEventListener('input', () => setPlayerName(nameInput.value));

const overlay = document.getElementById('game-overlay');
const result = document.getElementById('game-result');
const hud = document.getElementById('game-hud');
let playing = false, score = 0, misses = 0, remaining = 15000, tick = null, previousTick = 0, gameStartedAt = 0;
function placeGhost() {
  // Keep the entire tap target inside the arena, below the score.
  ghost.style.left = `${8 + Math.random() * 70}%`;
  ghost.style.top = `${20 + Math.random() * 48}%`;
  playLaugh();
  if (!paused) ghost.animate([{opacity:0,scale:'.45',filter:'blur(9px)'},{opacity:1,scale:'1',filter:'blur(0)'}], {duration:420,easing:'ease-out'});
}
function finishGame(won) {
  playing = false;
  clearInterval(tick);
  ghost.hidden = true;
  overlay.hidden = false;
  scene.classList.remove('playing');
  result.textContent = won ? 'Xuất sắc! Đã bắt đủ 10 con ma.' : (misses >= 3 ? 'Hụt 3 lần rồi! Chơi lại nhé?' : `Được ${score}/10 rồi. Thử lại nhé?`);
  startButton.innerHTML = 'Chơi lại <span aria-hidden="true">↗</span>';
  if (won) {
    palette = 2; morphTarget = 1; if (paused) morph = 1;
    canvas.setAttribute('aria-label', 'Các hạt sáng biến thành trái tim');
    playWin(); draw();
  }
  if (!won) startButton.focus({preventScroll:true});
}
function updateGame() {
  const now = performance.now();
  if (!document.hidden) remaining = Math.max(0, remaining - (now - previousTick));
  previousTick = now;
  document.getElementById('timer').textContent = `${Math.ceil(remaining / 1000)}s`;
  if (remaining <= 0) finishGame(false);
}
startButton.addEventListener('click', (event) => {
  event.stopPropagation(); // Prevent the start click from counting as a miss.
  clearInterval(tick);
  if (!nameInput.value.trim()) {
    nameInput.focus();
    nameInput.classList.add('name-error');
    return;
  }
  nameInput.classList.remove('name-error');
  setPlayerName(nameInput.value);
  playing = true; score = 0; misses = 0; remaining = 15000;
  morphTarget = 0; if (paused) morph = 0;
  palette = 0;
  canvas.setAttribute('aria-label', 'Đầu lâu tạo từ những hạt sáng');
  if (!soundChosen) { soundEnabled = true; syncSound(); }
  if (soundEnabled) startAudio();
  document.getElementById('score').textContent = '♡ 0 / 10';
  document.getElementById('misses').textContent = 'Hụt 0 / 3';
  document.getElementById('timer').textContent = '15s';
  result.textContent = '';
  overlay.hidden = true; hud.hidden = false; ghost.hidden = false;
  scene.classList.add('playing');
  placeGhost(); ghost.focus({preventScroll:true});
  previousTick = performance.now();
  gameStartedAt = previousTick;
  tick = setInterval(updateGame, 100);
});
ghost.addEventListener('click', () => {
  if (!playing) return;
  updateGame();
  if (!playing) return;
  const ghostRect = ghost.getBoundingClientRect();
  const sceneRect = scene.getBoundingClientRect();
  const hitX = (ghostRect.left - sceneRect.left + ghostRect.width / 2) / width;
  const hitY = (ghostRect.top - sceneRect.top + ghostRect.height / 2) / height;
  if (!paused) {
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2, velocity = .06 + Math.random() * .2;
      sparks.push({x:hitX,y:hitY,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,life:1,size:1+Math.random()*3,hue:30+Math.random()*25});
    }
  }
  const ring = document.createElement('span'); ring.className = 'hit-ring';
  ring.style.left = `${hitX * 100}%`; ring.style.top = `${hitY * 100}%`; ring.textContent = '+1 ♡';
  scene.appendChild(ring); setTimeout(() => ring.remove(), 800);
  playHit();
  score += 1;
  document.getElementById('score').textContent = `♡ ${score} / 10`;
  if (score === 10) { finishGame(true); window.setTimeout(showHeartView, 400); }
  else placeGhost();
});
// A click on the arena that does not hit the ghost costs one miss.
scene.addEventListener('click', (event) => {
  if (!playing || event.target.closest('#ghost, #game-overlay, #game-hud') || performance.now() - gameStartedAt < 250) return;
  updateGame();
  if (!playing) return;
  misses++;
  document.getElementById('misses').textContent = `Hụt ${misses} / 3`;
  if (misses >= 3) finishGame(false);
});
document.addEventListener('visibilitychange', () => { previousTick = performance.now(); });


// A translucent spirit made from the same luminous dots as the main sculpture.
const ghostCanvas = document.getElementById('ghost-canvas');
const ghostCtx = ghostCanvas.getContext('2d');
const silhouette = new Path2D('M35 230 L35 110 C35 10 205 10 205 110 L205 230 Q185 195 165 225 Q145 250 125 222 Q105 197 85 225 Q60 248 35 230 Z');
for (let i = 0; i < 4500; i++) {
  const x = Math.random() * 240, y = Math.random() * 280;
  if (!ghostCtx.isPointInPath(silhouette, x, y)) continue;
  if (((x - 92) / 14) ** 2 + ((y - 113) / 22) ** 2 < 1 || ((x - 153) / 14) ** 2 + ((y - 113) / 22) ** 2 < 1) continue;
  ghostCtx.fillStyle = `hsla(${32 + Math.random()*25},85%,${70+Math.random()*25}%,${.2+Math.random()*.7})`;
  ghostCtx.beginPath(); ghostCtx.arc(x,y,.5+Math.random()*1.7,0,Math.PI*2); ghostCtx.fill();
}

// Original procedural music and effects, generated locally after a user gesture.
let audioCtx, master, reverb, musicTimer, musicStep = 0;
let soundEnabled = false, soundChosen = false;
const soundButton = document.getElementById('toggle-sound');
function syncSound() {
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  soundButton.setAttribute('aria-label', soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh');
  soundButton.textContent = soundEnabled ? '♫' : '♪';
  soundButton.classList.toggle('sound-on', soundEnabled);
  if (master) master.gain.setTargetAtTime(soundEnabled ? .38 : 0, audioCtx.currentTime, .06);
}
function tone(frequency, when, duration, volume = .12, type = 'sine', endFrequency) {
  if (!audioCtx || !soundEnabled) return;
  const oscillator = audioCtx.createOscillator(), envelope = audioCtx.createGain();
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, when);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, when + duration);
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(volume, when + .015);
  envelope.gain.exponentialRampToValueAtTime(.0001, when + duration);
  oscillator.connect(envelope); envelope.connect(master); envelope.connect(reverb);
  oscillator.start(when); oscillator.stop(when + duration + .02);
}
function startAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain(); master.gain.value = .38; master.connect(audioCtx.destination);
      reverb = audioCtx.createDelay(1); reverb.delayTime.value = .31;
      const wet = audioCtx.createGain(); wet.gain.value = .18; reverb.connect(wet); wet.connect(master);
      const melody = [440,0,523.25,659.25,622.25,0,523.25,415.3,440,0,329.63,0,392,415.3,329.63,0];
      const playBar = () => {
        if (!soundEnabled || document.hidden || audioCtx.state !== 'running') return;
        const now = audioCtx.currentTime;
        const note = melody[musicStep % melody.length];
        if (note) { tone(note,now,1.6,.07); tone(note*2,now,1,.018); }
        if (musicStep % 4 === 0) tone(musicStep % 16 < 8 ? 110 : 103.83,now,2.8,.12,'sine');
        musicStep++;
      };
      musicTimer = setInterval(playBar, 420);
    }
    audioCtx.resume().catch(() => {}); syncSound();
  } catch {
    soundEnabled = false; syncSound(); soundButton.setAttribute('aria-label','Âm thanh không khả dụng');
  }
}
function playLaugh() {
  if (!audioCtx || !soundEnabled) return;
  const now = audioCtx.currentTime;
  // Falling voiced syllables: a short, ghostly "ha-ha-ha".
  [0,.17,.36,.57].forEach((delay,i) => {
    tone(310-i*31, now+delay,.15,.10,'triangle',125-i*9);
    tone(620-i*55, now+delay,.12,.025,'sine',250);
  });
}
function playHit() {
  if (!audioCtx || !soundEnabled) return;
  const now = audioCtx.currentTime;
  tone(740 + score * 30,now,.28,.22,'sine',1500 + score*20);
  tone(1480,now+.04,.4,.055);
}
function playWin() {
  if (!audioCtx || !soundEnabled) return;
  [440,554.37,659.25,880].forEach((note,i) => tone(note,audioCtx.currentTime+i*.18,1.4,.15));
}
soundButton.addEventListener('click', () => {
  soundChosen = true; soundEnabled = !soundEnabled;
  if (soundEnabled) startAudio();
  syncSound();
});
document.addEventListener('visibilitychange', () => {
  if (!audioCtx) return;
  if (document.hidden) audioCtx.suspend().catch(() => {});
  else if (soundEnabled) audioCtx.resume().catch(() => {});
});
