// Custom Crosshair Logic
const cursor = document.querySelector('.cursor-crosshair');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// Hover states for Crosshair (turn red on clickable elements)
const interactables = document.querySelectorAll('a, button, input, textarea, .weapon-card, .mission-row, .intel-photo-frame, .contact-card, .artwork-card');

interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        document.body.classList.add('hover-target');
        // Optional: play subtle UI hover sound
        const hoverSound = document.getElementById('sndHover');
        if (hoverSound) {
            hoverSound.currentTime = 0;
            hoverSound.volume = 0.2;
            hoverSound.play().catch(e => { }); // Catch autoplay restrictions
        }
    });

    el.addEventListener('mouseleave', () => {
        document.body.classList.remove('hover-target');
    });

    el.addEventListener('click', () => {
        const clickSound = document.getElementById('sndClick');
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.volume = 0.5;
            clickSound.play().catch(e => { });
        }
    });
});

// Scroll Reveal Logic (Mission Briefing Style)
const sectors = document.querySelectorAll('.sector');

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const sectorObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);

            // Trigger Typewriter if it's the hero
            if (entry.target.id === 'hero') {
                typeWriterEffect();
            }
        }
    });
}, revealOptions);

sectors.forEach(sector => {
    sectorObserver.observe(sector);
});

// Retro Typewriter Effect for Hero Text
function typeWriterEffect() {
    const textElement = document.querySelector('.typewriter');
    if (!textElement) return;

    const textStr = textElement.innerHTML;
    textElement.innerHTML = '';
    textElement.style.visibility = 'visible';

    let i = 0;
    const speed = 30; // ms per char

    function type() {
        if (i < textStr.length) {
            textElement.innerHTML += textStr.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    setTimeout(type, 1000); // 1s initial delay matching CSS
}

// Ensure hero text starts hidden if JS is active so typewriter can take over
document.addEventListener('DOMContentLoaded', () => {
    const tw = document.querySelector('.typewriter');
    if (tw) tw.style.visibility = 'hidden';
});

// Level Redirect system
function loadLevel(targetUrl) {
    const clickSound = document.getElementById('sndClick');
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.volume = 0.5;
        clickSound.play().catch(e => { });
    }

    // Redirect through the fake loading screen
    setTimeout(() => {
        window.location.href = 'loading.html?target=' + encodeURIComponent(targetUrl);
    }, 200);
}

// Form Submission Styling (Native Submit)
const intelForm = document.getElementById('intelForm');
if (intelForm) {
    intelForm.addEventListener('submit', function (e) {
        // No e.preventDefault() here so the mailto: action triggers natively 
        const btn = this.querySelector('button');
        const originalText = btn.innerHTML;

        btn.innerHTML = '> ENCRYPTING...';
        btn.style.color = 'var(--alert-red)';
        btn.style.borderColor = 'var(--alert-red)';
        btn.style.boxShadow = '0 0 15px var(--alert-red)';

        // After a brief pause, show transmission sent, then revert
        setTimeout(() => {
            btn.innerHTML = '> PREPARING UPLINK...';
            btn.style.color = 'var(--term-green)';
            btn.style.borderColor = 'var(--term-green)';
            btn.style.boxShadow = '0 0 15px var(--term-green)';

            // Revert button text after 3 seconds without resetting form so input persists for mailclient
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.style.boxShadow = '';
            }, 3000);
        }, 1500);
    });
}

// Text Scramble Effect for Tactical Feel
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Apply Scramble to Headers on Load
document.addEventListener('DOMContentLoaded', () => {
    const titles = document.querySelectorAll('.sector-title, .target-name, .hud-logo span');
    titles.forEach(title => {
        const fx = new TextScramble(title);
        const originalText = title.innerText;
        fx.setText(originalText);
    });

    const tw = document.querySelector('.typewriter');
    if (tw) tw.style.visibility = 'hidden';

    // Restored Background Music Toggle system
    const bgTrack = document.getElementById('sndBgTrack');
    const audioToggle = document.getElementById('audio-toggle');

    if (bgTrack && audioToggle) {
        const isAudioOn = localStorage.getItem('tactical_audio_playing') === 'true';

        if (isAudioOn) {
            bgTrack.volume = 0.15;
            bgTrack.play().then(() => {
                audioToggle.innerText = '[AUDIO: ON]';
                audioToggle.classList.replace('text-green', 'text-yellow');
                audioToggle.classList.add('blink');
            }).catch(e => {
                localStorage.setItem('tactical_audio_playing', 'false');
                audioToggle.innerText = '[AUDIO: OFF]';
            });
        }

        audioToggle.addEventListener('click', () => {
            if (bgTrack.paused) {
                bgTrack.volume = 0.15;
                bgTrack.play();
                localStorage.setItem('tactical_audio_playing', 'true');
                audioToggle.innerText = '[AUDIO: ON]';
                audioToggle.classList.replace('text-green', 'text-yellow');
                audioToggle.classList.add('blink');
            } else {
                bgTrack.pause();
                localStorage.setItem('tactical_audio_playing', 'false');
                audioToggle.innerText = '[AUDIO: OFF]';
                audioToggle.classList.replace('text-yellow', 'text-green');
                audioToggle.classList.remove('blink');
            }
        });
    }
});

// Global Night Vision Mode (Persistent across all pages)
const nvToggle = document.getElementById('nvToggle');
if(nvToggle){
    // Check localStorage on load
    if(localStorage.getItem('nightVisionMode') === 'true'){
        document.body.classList.add('night-vision');
        nvToggle.classList.add('active');
    }

    nvToggle.addEventListener('click', () => {
        document.body.classList.toggle('night-vision');
        nvToggle.classList.toggle('active');
        localStorage.setItem('nightVisionMode', document.body.classList.contains('night-vision'));
    });

    // Toggle NV with 'N' key
    document.addEventListener('keydown', (e) => {
        if(e.key.toLowerCase() === 'n'){
            document.body.classList.toggle('night-vision');
            nvToggle.classList.toggle('active');
            localStorage.setItem('nightVisionMode', document.body.classList.contains('night-vision'));
        }
    });
}
