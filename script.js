// Shorter code: up, up, down, down
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown'];
let konamiIndex = 0;

document.addEventListener('keydown', function(e) {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            showIgiEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

// IGI Easter Egg: Show villains image and play audio
function showIgiEasterEgg() {
    // Remove any existing overlay
    const oldOverlay = document.getElementById('igi-easter-egg-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'igi-easter-egg-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = 9999;

    // Add image
    const img = document.createElement('img');
    img.src = 'assets/igi-guards.jpg';
    img.alt = 'IGI Villains';
    img.style.maxWidth = '90vw';
    img.style.maxHeight = '80vh';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.border = '5px solid #fff';
    img.style.borderRadius = '16px';
    img.style.boxShadow = '0 0 40px #000';
    img.style.background = '#222';
    img.style.marginBottom = '32px';
    img.onerror = function() {
        img.alt = 'Image not found';
        img.style.display = 'none';
        console.error('IGI image not found at assets/igi-guards.jpg');
    };
    overlay.appendChild(img);

    // (No caption, only image)

    // Add overlay to body
    document.body.appendChild(overlay);

    // Play audio
    const audio = new Audio('assets/hey-you-stop-there.mp3');
    audio.volume = 1.0;
    audio.play().then(() => {
        console.log('IGI audio played');
    }).catch((err) => {
        console.error('Audio play failed:', err);
        // Show a message if audio fails
        const errMsg = document.createElement('div');
        errMsg.textContent = 'Audio could not be played.';
        errMsg.style.color = 'red';
        errMsg.style.marginTop = '20px';
        overlay.appendChild(errMsg);
    });

    // Remove overlay when audio ends or on click
    function removeOverlay() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    audio.addEventListener('ended', removeOverlay);
    overlay.addEventListener('click', () => {
        audio.pause();
        removeOverlay();
    });
    // Debug log
    console.log('IGI Easter Egg triggered!');
}

// Custom Crosshair Logic
const cursor = document.querySelector('.cursor-crosshair');

// IMMEDIATELY apply Night Vision Mode if saved (before rendering begins)
if(localStorage.getItem('nightVisionMode') === 'true'){
    document.body.classList.add('night-vision');
}

// Localhost-only background video guard (audio remains active)
(function localhostVideoGuard() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) return;

    const path = window.location.pathname.toLowerCase();
    const isTargetPage = path.endsWith('/dossier.html') || path.endsWith('/artworks.html') || path.endsWith('/success.html') || path.endsWith('/credits.html') ||
                         path.endsWith('dossier.html') || path.endsWith('artworks.html') || path.endsWith('success.html') || path.endsWith('credits.html');
    if (!isTargetPage) return;

    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) {
        const container = bgVideo.closest('.video-bg-container');
        if (container) {
            container.style.display = 'none';
        } else {
            bgVideo.remove();
        }
    }
})();

// Optimized cursor movement with GPU acceleration
let cursorX = 0, cursorY = 0;
let isMoving = false;

document.addEventListener('mousemove', (e) => {
    if (!cursor) return;
    cursorX = e.clientX;
    cursorY = e.clientY;
    
    if (!isMoving) {
        isMoving = true;
        requestAnimationFrame(() => {
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
            isMoving = false;
        });
    }
});

// Skill Card Click Handler - single delegated listener (works for dynamic cards too)
document.addEventListener('click', function (e) {
    const card = e.target.closest('.weapon-card[data-link]');
    if (!card) return;
    const link = card.getAttribute('data-link');
    if (link) window.open(link, '_blank', 'noopener');
});

// Attach hover/click/cursor listeners to interactive elements (including dynamically created ones)
function attachInteractableHoverSound() {
    const interactables = document.querySelectorAll('a, button, input, textarea, .weapon-card, .mission-row, .intel-photo-frame, .contact-card, .artwork-card, .filter-chip, .game-library-card');
    interactables.forEach(el => {
        // Prevent duplicate listeners
        if (el._hoverSoundAttached) return;
        el._hoverSoundAttached = true;
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hover-target');
            if (window.igiSound) igiSound.play('hover');
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hover-target');
        });
        el.addEventListener('click', () => {
            if (window.igiSound) igiSound.play('click');
        });
    });
}

// Initial attach for static elements
document.addEventListener('DOMContentLoaded', attachInteractableHoverSound);

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

        }
    });
}, revealOptions);

sectors.forEach(sector => {
    sectorObserver.observe(sector);
});

// Retro Typewriter Effect - types every .typewriter element one after another
function typeWriterEffect() {
    const elements = Array.from(document.querySelectorAll('.typewriter'));
    if (!elements.length) return;

    const speed = 30; // ms per char
    const texts = elements.map(el => el.textContent);
    elements.forEach(el => { el.textContent = ''; el.style.visibility = 'visible'; });

    let line = 0;
    let i = 0;
    function type() {
        if (line >= elements.length) return;
        const text = texts[line];
        if (i < text.length) {
            elements[line].textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            line++;
            i = 0;
            setTimeout(type, 200);
        }
    }

    setTimeout(type, 1000); // 1s initial delay
}

// Ensure hero text starts hidden if JS is active so typewriter can take over
document.addEventListener('DOMContentLoaded', () => {
    const hasTypewriter = document.querySelector('.typewriter');
    document.querySelectorAll('.typewriter').forEach(el => { el.style.visibility = 'hidden'; });
    if (hasTypewriter) typeWriterEffect();

    // Global Night Vision Mode (Persistent across all pages)
    const nvToggle = document.getElementById('nvToggle');
    if(nvToggle){
        // If already applied from immediate check, update button state
        if(document.body.classList.contains('night-vision')){
            nvToggle.classList.add('active');
        }

        nvToggle.addEventListener('click', () => {
            document.body.classList.toggle('night-vision');
            nvToggle.classList.toggle('active');
            localStorage.setItem('nightVisionMode', String(document.body.classList.contains('night-vision')));
        });

        // Toggle NV with 'N' key (ignored while typing in a form field)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
            const t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
            if (e.key.toLowerCase() === 'n') {
                document.body.classList.toggle('night-vision');
                nvToggle.classList.toggle('active');
                localStorage.setItem('nightVisionMode', String(document.body.classList.contains('night-vision')));
            }
        });
    }
});
function loadLevel(targetUrl) {
    if (window.igiSound) igiSound.play('click');

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
        this.chars = '!<>-_\\/[]{}-=+*^?#________';
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
                audioToggle.innerText = '[AUDIO: TAP]';
                const gestures = ['pointerdown', 'keydown', 'touchstart'];
                const startOnGesture = (ev) => {
                    gestures.forEach(t => document.removeEventListener(t, startOnGesture, true));
                    if (localStorage.getItem('tactical_audio_playing') !== 'true') return;
                    if (audioToggle.contains(ev.target)) return;   /* the toggle handles its own click */
                    bgTrack.play().then(() => {
                        audioToggle.innerText = '[AUDIO: ON]';
                        audioToggle.classList.replace('text-green', 'text-yellow');
                        audioToggle.classList.add('blink');
                    }).catch(() => { audioToggle.innerText = '[AUDIO: OFF]'; });
                };
                gestures.forEach(t => document.addEventListener(t, startOnGesture, true));
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

// Animate combat stats bars on dossier.html (percent next to label)
window.addEventListener('DOMContentLoaded', function() {
    const statLabels = document.querySelectorAll('.stat-label .stat-percent');
    const bars = document.querySelectorAll('.stat-bar .fill');
    const percents = [95, 90, 85];
    bars.forEach((bar, i) => {
        if (!statLabels[i] || percents[i] === undefined) return;
        bar.style.transition = 'none';
        bar.style.width = '0%';
        void bar.offsetWidth;
        bar.style.transition = 'width 3.5s linear';
        setTimeout(() => {
            bar.style.width = percents[i] + '%';
            // Animate percentage count-up next to label
            let current = 0;
            const target = percents[i];
            const duration = 3500;
            const start = performance.now();
            function animatePercent(now) {
                const elapsed = now - start;
                const progress = Math.min(Math.max(elapsed / duration, 0), 1);
                const value = Math.floor(progress * target);
                statLabels[i].textContent = value + '%';
                if (progress < 1) {
                    requestAnimationFrame(animatePercent);
                } else {
                    statLabels[i].textContent = target + '%';
                }
            }
            requestAnimationFrame(animatePercent);
        }, 500 + i * 500);
    });
});

