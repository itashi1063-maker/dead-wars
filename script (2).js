const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 450;

// روابط الصور الخاصة بك[cite: 1]
const imgUrls = {
    idle: 'https://i.postimg.cc/Sxc2K2Qv/Gemini-Generated-Image-nsp4aansp4aansp4-removebg-preview.png',
    atk1: 'https://i.postimg.cc/hPTTX324/Gemini-Generated-Image-r7zbknr7zbknr7zb-removebg-preview.png',
    atk2: 'https://i.postimg.cc/3x9ypMpC/Gemini-Generated-Image-p33pc6p33pc6p33p-removebg-preview.png',
    combo: 'https://i.postimg.cc/TPLRPBcY/Gemini-Generated-Image-d9ok8gd9ok8gd9ok-removebg-preview.png'
};

const images = {};
let loadedImages = 0;
const totalImages = Object.keys(imgUrls).length;

// التحقق من اكتمال تحميل كل الصور قبل بدء اللعبة
function checkLoad() {
    loadedImages++;
    if (loadedImages === totalImages) {
        // إخفاء شاشة التحميل بعد نصف ثانية من اكتمال الصور لضمان السلاسة
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
            loop(); 
        }, 600);
    }
}

// تحميل الصور فعلياً
for (let key in imgUrls) {
    images[key] = new Image();
    images[key].src = imgUrls[key];
    images[key].onload = checkLoad;
}

class Character {
    constructor(x, isPlayer) {
        this.startX = x; this.isPlayer = isPlayer;
        this.reset();
    }
    reset() {
        this.x = this.startX; this.y = 100; this.w = 180; this.h = 230;
        this.vx = 0; this.vy = 0; this.hp = 100;
        this.facing = this.isPlayer ? 1 : -1;
        this.img = images.idle; this.canAtk = true; this.combo = 0;
        this.isAtkActive = false;
    }
    draw() {
        ctx.save();
        if (!this.isPlayer) ctx.filter = "sepia(1) saturate(3) hue-rotate(-50deg)";
        let dw = this.w, dh = this.h, dy = this.y;
        if (this.img === images.combo) { dw *= 1.7; dh *= 1.7; dy -= 80; }
        if (this.facing === -1) {
            ctx.translate(this.x + dw, dy); ctx.scale(-1, 1);
            ctx.drawImage(this.img, 0, 0, dw, dh);
        } else {
            ctx.drawImage(this.img, this.x, dy, dw, dh);
        }
        ctx.restore();
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.y + this.h < canvas.height) this.vy += 0.8;
        else { this.vy = 0; this.y = canvas.height - this.h; }
        this.draw();
    }
    attack() {
        if (!this.canAtk) return;
        this.canAtk = false; this.isAtkActive = true; this.combo++;
        const btn = document.getElementById('attack');
        if(this.isPlayer) btn.classList.add('cooldown');
        if (this.combo >= 3) {
            this.img = images.combo;
            setTimeout(() => { this.img = images.idle; this.combo = 0; }, 800);
        } else {
            this.img = images.atk1;
            setTimeout(() => { this.img = images.atk2; }, 200);
            setTimeout(() => { this.img = images.idle; }, 500);
        }
        setTimeout(() => { this.canAtk = true; btn.classList.remove('cooldown'); }, 2000);
    }
}

const p = new Character(100, true);
const b = new Character(750, false);
let isGameOver = false;

function loop() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, 1000, 450);
    p.update(); b.update();

    if(b.x > p.x + 160) b.vx = -3;
    else if(b.x < p.x - 160) b.vx = 3;
    else { b.vx = 0; if(Math.random() < 0.02) b.attack(); }

    if (p.img !== images.idle && p.isAtkActive && Math.abs(p.x - b.x) < 180) {
        b.hp -= (p.combo >= 3 ? 20 : 10); p.isAtkActive = false;
        document.getElementById('p2-fill').style.width = Math.max(0, b.hp) + "%";
    }
    if (b.img !== images.idle && b.isAtkActive && Math.abs(b.x - p.x) < 180) {
        p.hp -= 5; b.isAtkActive = false;
        document.getElementById('p1-fill').style.width = Math.max(0, p.hp) + "%";
    }

    if (p.hp <= 0 || b.hp <= 0) {
        isGameOver = true;
        document.getElementById('msg-overlay').style.display = 'flex';
        document.getElementById('win-txt').innerText = p.hp <= 0 ? "GAME OVER" : "VICTORY!";
    } else {
        requestAnimationFrame(loop);
    }
}

// أزرار التحكم
const setup = (id, start, end) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); start(); });
    el.addEventListener('mousedown', start);
    if(end) {
        el.addEventListener('touchend', end);
        el.addEventListener('mouseup', end);
    }
};

setup('left', () => { p.vx = -7; p.facing = -1; }, () => p.vx = 0);
setup('right', () => { p.vx = 7; p.facing = 1; }, () => p.vx = 0);
setup('up', () => { if(p.vy === 0) p.vy = -18; });
setup('attack', () => p.attack());

document.getElementById('reset-btn').onclick = () => location.reload();