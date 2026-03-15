


// Shorter code: up, up, down, down
const konamiCode = [38, 38, 40, 40];
let konamiIndex = 0;

document.addEventListener('keydown', function(e) {
    if (e.keyCode === konamiCode[konamiIndex]) {
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

function showEasterEggModal() {
    let modal = document.getElementById('easterEggModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'easterEggModal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.background = 'rgba(0,0,0,0.97)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.innerHTML = `
            <style>
                #closeEasterEggModal {
                    padding:0.7rem 2.2rem;
                    font-size:1.1rem;
                    background:none;
                    border:2px solid var(--term-green);
                    color:var(--term-green);
                    border-radius:6px;
                    font-family:var(--font-mono);
                    cursor:pointer;
                    transition:all 0.2s;
                }
                #closeEasterEggModal:hover, #closeEasterEggModal:focus {
                    background:var(--term-green);
                    color:#000;
                    box-shadow:0 0 16px var(--term-green);
                    border-color:var(--term-green);
                }
            </style>
            <div style="color:var(--term-green); font-family:var(--font-heading); font-size:2.2rem; letter-spacing:0.12em; text-shadow:0 0 18px #0f0; margin-bottom:1.5rem;">EASTER EGG UNLOCKED!</div>
            <div style="color:#fff; font-size:1.1rem; font-family:var(--font-mono); margin-bottom:2rem; text-align:center;">You found the secret!<br>Keep gaming, agent.<br><br><span style='color:var(--term-green); font-size:1.5rem;'>✔️</span></div>
            <button id="closeEasterEggModal">[CLOSE]</button>
            <audio id="easterEggSound" src="assets/games/igi-alarm.mp3" preload="auto"></audio>
        `;
        document.body.appendChild(modal);
        // Only add the ESC handler once
        modal._escHandler = function(e) {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        };
        document.addEventListener('keydown', modal._escHandler);
        document.getElementById('closeEasterEggModal').onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
    } else {
        modal.style.display = 'flex';
    }
    document.body.style.overflow = 'hidden';
    // Play sound
    const snd = document.getElementById('easterEggSound');
    if (snd) {
        snd.currentTime = 0;
        snd.volume = 0.5;
        snd.play().catch(()=>{});
    }
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


// Attach hover/click/cursor listeners to interactive elements (including dynamically created ones)
function attachInteractableHoverSound() {
    const interactables = document.querySelectorAll('a, button, input, textarea, .weapon-card, .mission-row, .intel-photo-frame, .contact-card, .artwork-card, .filter-chip, .game-library-card');
    interactables.forEach(el => {
        // Prevent duplicate listeners
        if (el._hoverSoundAttached) return;
        el._hoverSoundAttached = true;
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hover-target');
            const hoverSound = document.getElementById('sndHover');
            if (hoverSound) {
                hoverSound.currentTime = 0;
                hoverSound.volume = 0.2;
                hoverSound.play().catch(e => { });
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

        // Toggle NV with 'N' key
        document.addEventListener('keydown', (e) => {
            if(e.key.toLowerCase() === 'n'){
                document.body.classList.toggle('night-vision');
                nvToggle.classList.toggle('active');
                localStorage.setItem('nightVisionMode', String(document.body.classList.contains('night-vision')));
            }
        });
    }
});
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

