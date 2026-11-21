/* igi-egg.js - the I.G.I. easter egg (Up, Up, Down, Down) for pages that do not load script.js */
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
