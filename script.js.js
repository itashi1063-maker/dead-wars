/* JS: برمجة اللعبة */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 450;

const images = {
    idle: new Image(), atk1: new Image(), atk2: new Image(), combo: new Image()
};

// روابط الصور
images.idle.src = 'https://i.postimg.cc/Sxc2K2Qv/Gemini-Generated-Image-nsp4aansp4aansp4-removebg-preview.png';
images.atk1.src = 'https://i.postimg.cc/hPTTX324/Gemini-Generated-Image-r7zbknr7zbknr7zb-removebg-preview.png';
images.atk2.src = 'https://i.postimg.cc/3x9ypMpC/Gemini-Generated-Image-p33pc6p33pc6p33p-removebg-preview.png';
images.combo.src = 'https://i.postimg.cc/TPLRPBcY/Gemini-Generated-Image-d9ok8gd9ok8gd9ok-removebg-preview.png';

let damageTexts = [];
let isGameOver = false;

class Character {
    constructor(x, isPlayer) {
        this.startX = x;
        this.isPlayer = isPlayer;
        this.reset();
    }

    reset() {
        this.x = this.startX; this.y = 100;
        this.w = 180; this.h = 230; 
        this.vx = 0; this.vy = 0; this.hp = 100;
        this.facing = this.isPlayer ? 1 : -1;
        this.img = images.idle; this.canAtk = true; this.combo = 0;
        this.isAtkActive = false;
    }

    draw() {
        ctx.save();
        if (!this.isPlayer) {
            ctx.filter = "sepia(1) saturate(4) hue-rotate(-50deg)";
        }

        let dw = this.w, dh = this.h, dy = this.y;
        if (this.img === images.combo) {
            dw *= 1.8; dh *= 1.8; dy -= 100;
        }

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
        if (this.y + this.h < canvas.height) this.vy += 0.9;
        else { this.vy = 0; this.y = canvas.height - this.h; }
        this.draw();
    }

    attack() {
        if (!this.canAtk || isGameOver) return;
        this.canAtk = false;
        this.isAtkActive = true;
        this.combo++;
        
        const btn = document.getElementById('attack');
        if(this.isPlayer) btn.classList.add('cooldown');

        if (this.combo >= 3) {
            this.img = images.combo;
            setTimeout(() => { 
                this.img = images.idle; this.combo = 0; 
                document.getElementById('combo-txt').innerText = "COMBO: 0";
            }, 850);
        } else {
            this.img = images.atk1;
            setTimeout(() => { if(!isGameOver) this.img = images.atk2; }, 250); 
            setTimeout(() => { if(!isGameOver) this.img = images.idle; }, 600);
        }

        document.getElementById('combo-txt').innerText = "COMBO: " + this.combo;

        setTimeout(() => {
            this.canAtk = true;
            if(this.isPlayer) btn.classList.remove('cooldown');
        }, 2000);
    }
}

const p = new Character(100, true);
const b = new Character(750, false);

function showDmg(x, y, txt, col) {
    damageTexts.push({ x, y, txt, col, life: 45 });
}

function resetGame() {
    p.reset(); b.reset();
    damageTexts = []; isGameOver = false;
    document.getElementById('msg-overlay').style.display = 'none';
    document.getElementById('p1-fill').style.width = "100%";
    document.getElementById('p2-fill').style.width = "100%";
    document.getElementById('combo-txt').innerText = "COMBO: 0";
    document.getElementById('attack').classList.remove('cooldown');
    requestAnimationFrame(loop);
}

document.getElementById('reset-btn').addEventListener('click', resetGame);

function loop() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, 1000, 450);
    
    p.update(); b.update();

    // ذكاء البوت
    if(b.x > p.x + 150) b.vx = -3;
    else if(b.x < p.x - 150) b.vx = 3;
    else { b.vx = 0; if(Math.random() < 0.02) b.attack(); }

    // التحقق من الضربات
    if (p.img !== images.idle && p.isAtkActive && Math.abs(p.x - b.x) < 200) {
        let d = p.combo >= 3 ? 25 : 10;
        b.hp -= d; p.isAtkActive = false;
        showDmg(b.x + 50, b.y, `-${d}`, "#00ffff");
        document.getElementById('p2-fill').style.width = Math.max(0, b.hp) + "%";
    }
    if (b.img !== images.idle && b.isAtkActive && Math.abs(b.x - p.x) < 200) {
        p.hp -= 5; b.isAtkActive = false;
        showDmg(p.x + 50, p.y, "-5", "#ff3333");
        document.getElementById('p1-fill').style.width = Math.max(0, p.hp) + "%";
    }

    // رسم أرقام الضرر
    damageTexts.forEach((t, i) => {
        ctx.fillStyle = t.col; ctx.font = "bold 45px Arial";
        ctx.fillText(t.txt, t.x, t.y); t.y -= 2; t.life--;
        if(t.life <= 0) damageTexts.splice(i, 1);
    });

    if (p.hp <= 0 || b.hp <= 0) {
        isGameOver = true;
        document.getElementById('msg-overlay').style.display = 'flex';
        document.getElementById('win-txt').innerText = p.hp <= 0 ? "GAME OVER" : "VICTORY!";
    } else {
        requestAnimationFrame(loop);
    }
}

const setupControl = (id, start, end) => {
    const el = document.getElementById(id);
    const handleStart = (e) => { e.preventDefault(); start(); };
    const handleEnd = (e) => { e.preventDefault(); if(end) end(); };
    el.addEventListener('touchstart', handleStart, {passive: false});
    el.addEventListener('touchend', handleEnd, {passive: false});
    el.addEventListener('mousedown', handleStart);
    el.addEventListener('mouseup', handleEnd);
};

setupControl('left', () => { p.vx = -7; p.facing = -1; }, () => p.vx = 0);
setupControl('right', () => { p.vx = 7; p.facing = 1; }, () => p.vx = 0);
setupControl('up', () => { if(p.vy === 0) p.vy = -20; });
setupControl('attack', () => p.attack());

loop();