/* =====================================================================
   igi-audio.js - UI hover / click sounds for the whole site.

   One global listener handles every page, including things created after the page
   loaded (artwork cards, filter chips, modals...). Nothing needs to be wired per
   element. Browsers only allow sound after a click / key press / tap, so nothing
   plays before the first of those.

   Sounds: hover = the original Mixkit hover file, click = assets/click.wav.
   Nothing is generated: if a file cannot be loaded, that action is silent.
   The map computer (#igiMap) plays its own sounds and is skipped here.
   ===================================================================== */
(function () {
    'use strict';

    /* paths are resolved from this script's own location, so they also work on 404.html */
    var base = '';
    try { base = document.currentScript.src.replace(/[^\/]*$/, ''); } catch (e) { base = ''; }

    var FILES = {
        hover: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        click: base + 'assets/click.wav'
    };
    var VOLUME = { hover: 0.7, click: 0.7 };
    var els = {};

    function fileFor(kind) {
        if (!FILES[kind]) return null;
        if (!els[kind]) {
            var a = new Audio(FILES[kind]);
            a.preload = 'auto';
            els[kind] = a;
        }
        return els[kind];
    }

    function play(kind) {
        var a = fileFor(kind);
        if (!a) return;
        try {
            a.volume = VOLUME[kind] || 0.3;
            a.currentTime = 0;
            var p = a.play();
            if (p && p.catch) p.catch(function () { /* blocked or file unavailable: stay silent */ });
        } catch (e) { /* silent */ }
    }

    /* load the files early so the first hover / click is instant */
    function preload() { Object.keys(FILES).forEach(fileFor); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preload); else preload();

    window.igiSound = { play: play };

    /* ---------- which elements make a sound ---------- */
    var HOVER_SEL = [
        'a[href]', 'button', 'summary', 'select', 'textarea', 'input:not([type="hidden"])', 'label[for]', '[role="button"]',
        '.weapon-card', '.mission-row', '.intel-photo-frame', '.contact-card', '.artwork-card', '.filter-chip',
        '.game-library-card', '.vault', '.plat', '.obj', '.credit-card', '.honor', '.freq', '.record-tile', '.rank-tile'
    ].join(',');
    var CLICK_SEL = [
        'a[href]', 'button', 'summary', 'select', 'input[type="submit"]', 'input[type="button"]', 'input[type="checkbox"]',
        'input[type="radio"]', 'label[for]', '[role="button"]', '.weapon-card[data-link]', '.artwork-card', '.game-library-card',
        '.filter-chip'
    ].join(',');
    var SKIP = '#igiMap, #igiMapBtn, #igiToast';

    function pick(target, sel) {
        if (!target || !target.closest) return null;
        var el = target.closest(sel);
        if (!el || el.closest(SKIP) || el.disabled) return null;
        return el;
    }

    /* hover: once each time the pointer enters a new element (not for every child it crosses) */
    document.addEventListener('mouseover', function (e) {
        var el = pick(e.target, HOVER_SEL);
        if (!el) return;
        if (e.relatedTarget && el.contains(e.relatedTarget)) return;
        play('hover');
    }, true);

    /* click: capture phase, so it plays even if the page stops the event later */
    document.addEventListener('click', function (e) {
        if (!pick(e.target, CLICK_SEL)) return;
        play('click');
    }, true);

    /* links that open the next page in the same tab would cut the sound off, so the
       navigation is held back for a moment (only ordinary same-site links, and only when
       nothing else on the page already handled the click) */
    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = pick(e.target, 'a[href]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (a.target && a.target !== '_self') return;
        if (a.hasAttribute('download') || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;
        if (a.origin !== location.origin) return;
        e.preventDefault();
        var url = a.href;
        setTimeout(function () { location.href = url; }, 140);
    });
})();
