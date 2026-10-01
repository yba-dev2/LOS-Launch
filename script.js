const welcome = document.getElementById('welcome');
const reveal = document.getElementById('reveal');
const celebration = document.getElementById('celebration');
const curtains = document.getElementById('curtainWrapper');
const enterButton = document.getElementById('losBtn');
const soundToggle = document.getElementById('soundToggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let soundEnabled = true;
const celebrationAudio = new Audio('gregorquendel_sounddesign-crowd-people-street-concert-crowd-applause-and-clapping-136318.mp3');
celebrationAudio.preload = 'auto';
celebrationAudio.volume = .8;
const curtainAudio = new Audio('emand_edroff-victory-bell-success-fanfare-576275.mp3');
curtainAudio.preload = 'auto';
curtainAudio.volume = .65;
let curtainFadeFrame;
let audioFade = 1;
let launched = false;
// Track pending work so a restored page cannot resume an old launch.
const pendingTimers = new Set();
const pendingFrames = new Set();
let cleanupConfetti = () => {};
function scheduleTimeout(callback, delay) {
    const id = setTimeout(() => {
        pendingTimers.delete(id);
        callback();
    }, delay);
    pendingTimers.add(id);
    return id;
}
function scheduleFrame(callback) {
    const id = requestAnimationFrame(now => {
        pendingFrames.delete(id);
        callback(now);
    });
    pendingFrames.add(id);
    return id;
}
function resetLaunch() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers.clear();
    pendingFrames.forEach(cancelAnimationFrame);
    pendingFrames.clear();
    cleanupConfetti();
    [curtainAudio, celebrationAudio].forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = !soundEnabled;
    });
    curtainAudio.volume = .65;
    celebrationAudio.volume = .8;
    launched = false;
    document.body.classList.remove('departing');
    welcome.hidden = false;
    welcome.classList.remove('leaving');
    reveal.hidden = true;
    reveal.classList.remove('visible');
    celebration.hidden = true;
    curtains.hidden = true;
    curtains.classList.remove('open', 'finished');
    document.getElementById('bubbles').hidden = false;
    document.getElementById('launchBtn').disabled = false;
    enterButton.disabled = true;
    const canvas = document.getElementById('confetti');
    const context = canvas.getContext('2d');
    if (context) {
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.restore();
    }
}
window.addEventListener('pagehide', resetLaunch);
window.addEventListener('pageshow', event => {
    if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
        resetLaunch();
    }
});
function prepareAudio() {
    celebrationAudio.load();
    curtainAudio.load();
}
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    celebrationAudio.muted = !soundEnabled;
    curtainAudio.muted = !soundEnabled;
});
document.getElementById('launchBtn').addEventListener('click', function () {
    if (this.disabled) return;
    this.disabled = true;
    prepareAudio();
    playCurtainSound();
    welcome.classList.add('leaving');
    scheduleTimeout(() => {
        welcome.hidden = true;
        reveal.hidden = false;
        curtains.hidden = false;
        scheduleFrame(() => scheduleFrame(() => {
            curtains.classList.add('open');
            reveal.classList.add('visible');
        }));
        scheduleTimeout(() => {
            curtains.classList.add('finished');
            enterButton.disabled = false;
            enterButton.focus({ preventScroll: true });
            scheduleTimeout(() => { curtains.hidden = true; }, 750);
        }, reducedMotion ? 100 : 3600);
    }, reducedMotion ? 50 : 450);
});
function playCurtainSound() {
    curtainAudio.currentTime = 0;
    curtainAudio.volume = .65;
    curtainAudio.muted = !soundEnabled;
    // Start within the button gesture so browsers permit audio playback.
    curtainAudio.play().catch(() => {});
    const started = performance.now();
    function fade(now) {
        const elapsed = now - started;
        curtainAudio.volume = .65 * Math.max(0, Math.min(1, (4050 - elapsed) / 650));
        if (elapsed < 4050) curtainFadeFrame = scheduleFrame(fade);
        else curtainAudio.pause();
    }
    curtainFadeFrame = scheduleFrame(fade);
}
function fanfare() {
    cancelAnimationFrame(curtainFadeFrame);
    curtainAudio.pause();
    celebrationAudio.currentTime = 0;
    celebrationAudio.muted = !soundEnabled;
    curtainAudio.muted = !soundEnabled;
    celebrationAudio.volume = .8;
    celebrationAudio.play().catch(() => {
        // Navigation and celebration still complete if playback is unavailable.
    });
    const started = performance.now();
    function fade(now) {
        const elapsed = now - started;
        audioFade = elapsed < 3700 ? 1 : Math.max(0, 1 - (elapsed - 3700) / 1100);
        celebrationAudio.volume = .8 * audioFade;
        if (elapsed < 4800) scheduleFrame(fade);
        else celebrationAudio.pause();
    }
    scheduleFrame(fade);
}
function confetti() {
    if (reducedMotion) return;
    const canvas = document.getElementById('confetti');
    const context = canvas.getContext('2d');
    if (!context) return;
    let width, height;
    function resize() {
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = width * scale; canvas.height = height * scale;
        context.setTransform(scale,0,0,scale,0,0);
    }
    resize(); window.addEventListener('resize',resize);
    cleanupConfetti = () => window.removeEventListener('resize', resize);
    const colors = ['#0b5bc6','#ffffff','#ffd166','#ef476f','#06d6a0','#a78bfa','#ff8c42','#4cc9f0'];
    const particles = Array.from({length:190}, () => ({x:Math.random()*width,y:-Math.random()*height*.9,w:5+Math.random()*7,h:4+Math.random()*6,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*.15,color:colors[Math.floor(Math.random()*colors.length)]}));
    const start = performance.now(); let previous = start;
    function frame(now) {
        const step = Math.min((now-previous)/16.67,3); previous=now;
        context.clearRect(0,0,width,height);
        context.globalAlpha = Math.min(1,(4800-(now-start))/700);
        particles.forEach(p => {
            p.x+=p.vx*step; p.y+=p.vy*step; p.rotation+=p.spin*step;
            context.save(); context.translate(p.x,p.y); context.rotate(p.rotation);
            context.fillStyle=p.color; context.fillRect(-p.w/2,-p.h/2,p.w,p.h); context.restore();
        });
        if(now-start<4800) scheduleFrame(frame);
        else {context.clearRect(0,0,width,height);window.removeEventListener('resize',resize);}
    }
    scheduleFrame(frame);
}
enterButton.addEventListener('click', () => {
    if (launched) return;
    launched = true; enterButton.disabled = true;
    document.getElementById('bubbles').hidden = true;
    reveal.hidden = true; celebration.hidden = false;
    celebration.setAttribute('tabindex','-1'); celebration.focus({preventScroll:true});
    fanfare(); confetti();
    scheduleTimeout(() => {document.body.classList.add('departing');}, 4800);
    scheduleTimeout(() => {window.location.assign('https://los.bil.bt');}, 5500);
});








