// ---------- helpers ----------
const PI2 = Math.PI * 2;
const random = (min, max) => (Math.random() * (max - min + 1) + min) | 0;
const timestamp = _ => new Date().getTime();

// ---------- setup ----------
const canvas = document.getElementById('birthday');
const ctx = canvas.getContext('2d', { alpha: true });

// DPR + resize management
function resizeCanvas() {
  canvas.style.width = '100vw';
  canvas.style.height = '100svh';

  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);

  canvas.width = w;
  canvas.height = h;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  birthday.resize(window.innerWidth, window.innerHeight);
}

// ---------- fireworks engine ----------
class Birthday {
  constructor() {
    this.fireworks = [];
    this.counter = 0;
  }

  resize(width, height) {
    this.width = width;
    const center = (this.width / 2) | 0;
    this.spawnA = center - (center / 4) | 0;
    this.spawnB = center + (center / 4) | 0;

    this.height = height;
    this.spawnC = (this.height * 0.1) | 0;
    this.spawnD = (this.height * 0.5) | 0;
  }

  onClick(evt) {
    const t = evt.touches && evt.touches[0];
    const x = (t ? t.pageX : evt.clientX);
    const y = (t ? t.pageY : evt.clientY);

    const count = random(3, 5);
    for (let i = 0; i < count; i++) {
      this.fireworks.push(
        new Firework(
          random(this.spawnA, this.spawnB),
          this.height,
          x,
          y,
          random(0, 260),
          random(30, 110)
        )
      );
    }
    this.counter = -1;
  }

  update(delta) {
    // clear frame with trailing fade
    ctx.globalCompositeOperation = 'hard-light';
    ctx.fillStyle = `rgba(20,20,20,${7 * delta})`;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalCompositeOperation = 'lighter';
    for (let fw of this.fireworks) fw.update(delta);

    // auto-spawn
    this.counter += delta * 3;
    if (this.counter >= 1) {
      this.fireworks.push(
        new Firework(
          random(this.spawnA, this.spawnB),
          this.height,
          random(0, this.width),
          random(this.spawnC, this.spawnD),
          random(0, 360),
          random(30, 110)
        )
      );
      this.counter = 0;
    }

    // cleanup
    if (this.fireworks.length > 1000)
      this.fireworks = this.fireworks.filter(fw => !fw.dead);
  }
}

class Firework {
  constructor(x, y, targetX, targetY, shade, offsprings) {
    this.dead = false;
    this.offsprings = offsprings;
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.shade = shade;
    this.history = [];
    this.madeChilds = false;
  }

  update(delta) {
    if (this.dead) return;

    const xDiff = this.targetX - this.x;
    const yDiff = this.targetY - this.y;

    if (Math.abs(xDiff) > 3 || Math.abs(yDiff) > 3) {
      this.x += xDiff * 2 * delta;
      this.y += yDiff * 2 * delta;
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > 20) this.history.shift();
    } else {
      if (this.offsprings && !this.madeChilds) {
        const babies = this.offsprings / 2;
        for (let i = 0; i < babies; i++) {
          const targetX = (this.x + this.offsprings * Math.cos(PI2 * i / babies)) | 0;
          const targetY = (this.y + this.offsprings * Math.sin(PI2 * i / babies)) | 0;
          birthday.fireworks.push(new Firework(this.x, this.y, targetX, targetY, this.shade, 0));
        }
      }
      this.madeChilds = true;
      this.history.shift();
    }

    if (this.history.length === 0) {
      this.dead = true;
    } else if (this.offsprings) {
      for (let i = 0; i < this.history.length; i++) {
        const p = this.history[i];
        ctx.beginPath();
        ctx.fillStyle = `hsl(${this.shade},100%,${i}%)`;
        ctx.arc(p.x, p.y, 1, 0, PI2, false);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.fillStyle = `hsl(${this.shade},100%,50%)`;
      ctx.arc(this.x, this.y, 1, 0, PI2, false);
      ctx.fill();
    }
  }
}

// ---------- run ----------
let then = timestamp();
const birthday = new Birthday();

function onResize() {
  resizeCanvas();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

document.addEventListener('click', e => birthday.onClick(e), { passive: true });
document.addEventListener('touchstart', e => birthday.onClick(e), { passive: true });

// first layout + loop
resizeCanvas();
(function loop () {
  requestAnimationFrame(loop);
  const now = timestamp();
  const delta = (now - then) / 1000;
  then = now;
  birthday.update(delta);
})();
