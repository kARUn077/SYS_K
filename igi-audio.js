/* =====================================================================
   igi-audio.js - UI hover / click sounds.
   Plays only the original sound files (the same ones the site always used).
   Nothing is generated: if a file cannot be loaded, that action is silent.
   Browsers only allow sound after a click / key press / tap, so nothing
   plays before the first of those.
   ===================================================================== */
(function () {
    'use strict';

    var FILES = {
        hover: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
    };
    var VOLUME = { hover: 0.25, click: 0.45 };
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

    /* load the files early so the first hover is instant */
    function preload() { Object.keys(FILES).forEach(fileFor); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preload); else preload();

    window.igiSound = { play: play };
})();
