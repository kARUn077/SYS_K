/* =====================================================================
   igi-ui.js - shared HUD behaviour:
   - collapsible menu (burger) for tablets / phones
   - mission clock in the header (keeps running across pages)
   - map / night-vision buttons moved into the header (no floating overlap)
   - IGI-style "MISSION n" briefing banner the first time a page is opened
   ===================================================================== */
(function () {
    'use strict';

    var doc = document;
    var page = (location.pathname.split('/').pop() || '').toLowerCase();

    function el(tag, cls, text) {
        var e = doc.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }
    function store(key, val) {
        try {
            if (val === undefined) return sessionStorage.getItem(key);
            sessionStorage.setItem(key, val);
        } catch (e) { return null; }
    }

    /* crosshair appears only after a real mouse moves */
    doc.addEventListener('pointermove', function onMove(e) {
        if (e.pointerType === 'mouse') {
            doc.body.classList.add('has-mouse');
            doc.removeEventListener('pointermove', onMove);
        }
    }, { passive: true });

    /* ---------- mission clock ---------- */
    function startTime() {
        var t = Number(store('igiMissionStart'));
        if (!t) { t = Date.now(); store('igiMissionStart', String(t)); }
        return t;
    }
    function fmt(ms) {
        var s = Math.max(0, Math.floor(ms / 1000));
        var h = String(Math.floor(s / 3600)).padStart(2, '0');
        var m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        var sec = String(s % 60).padStart(2, '0');
        return h + ':' + m + ':' + sec;
    }

    /* ---------- header ---------- */
    function setupHeader(header) {
        var nav = header.querySelector('.hud-nav');
        var cta = header.querySelector('.contact-cta');
        var status = header.querySelector('.hud-status');

        /* status block: first line as before, second line = mission clock */
        if (status) {
            var line = el('div', 'hud-status-line');
            while (status.firstChild) line.appendChild(status.firstChild);
            var timer = el('div', 'hud-timer', 'MISSION TIME 00:00:00');
            status.append(line, timer);
            var start = startTime();
            var tick = function () { timer.textContent = 'MISSION TIME ' + fmt(Date.now() - start); };
            tick();
            setInterval(tick, 1000);
        }

        /* burger */
        var burger = el('button', 'hud-burger');
        burger.type = 'button';
        burger.setAttribute('aria-label', 'Open menu');
        burger.setAttribute('aria-expanded', 'false');
        if (nav) { nav.id = nav.id || 'hudNav'; burger.setAttribute('aria-controls', nav.id); }
        burger.append(el('span'), el('span'), el('span'));
        header.appendChild(burger);

        function setOpen(open) {
            header.classList.toggle('menu-open', open);
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }
        burger.addEventListener('click', function () { setOpen(!header.classList.contains('menu-open')); });
        doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
        doc.addEventListener('click', function (e) {
            if (header.classList.contains('menu-open') && !header.contains(e.target)) setOpen(false);
        });

        /* contact link inside the dropdown (the header button is hidden on small screens) */
        if (nav && cta) {
            var c = el('a', 'hud-nav-contact', '[CONTACT]');
            c.href = cta.getAttribute('href') || 'comms.html';
            if (cta.classList.contains('text-green') || page === 'comms.html') c.classList.add('text-green');
            nav.appendChild(c);
        }

        /* map + night-vision buttons */
        var tools = el('div', 'hud-tools');
        var nv = doc.getElementById('nvToggle');
        var map = doc.getElementById('igiMapBtn');
        if (nv) { nv.textContent = 'NV [N]'; nv.title = 'Night vision (N)'; tools.appendChild(nv); }
        if (map) { map.textContent = 'MAP [M]'; map.title = 'Map computer (M)'; tools.insertBefore(map, tools.firstChild); }

        var mq = window.matchMedia('(max-width: 1180px)');
        function place() {
            if (mq.matches && nav) nav.appendChild(tools);
            else header.insertBefore(tools, cta || burger);
            if (!mq.matches) setOpen(false);
        }
        place();
        if (mq.addEventListener) mq.addEventListener('change', place); else mq.addListener(place);
    }

    /* ---------- toolbar for pages without a header ---------- */
    function setupToolbar() {
        var nv = doc.getElementById('nvToggle');
        var map = doc.getElementById('igiMapBtn');
        if (!nv && !map) return;
        var bar = el('div', 'hud-toolbar');
        if (nv) { nv.textContent = 'NV [N]'; nv.title = 'Night vision (N)'; bar.appendChild(nv); }
        if (map) { map.textContent = 'MAP [M]'; map.title = 'Map computer (M)'; bar.insertBefore(map, bar.firstChild); }
        var wrapper = doc.querySelector('.hud-wrapper');
        if (wrapper) {
            wrapper.insertBefore(bar, wrapper.firstChild);
        } else {
            bar.classList.add('hud-toolbar--float');
            doc.body.appendChild(bar);
            doc.body.classList.add('igi-has-toolbar');
        }
    }

    /* ---------- mission briefing banner ---------- */
    var BRIEF = {
        'dossier.html':      ['02', 'DOSSIER', 'Infiltrate the Dossier room.'],
        'level_select.html': ['03', 'TECH OPS BASE', 'Reach the Tech Ops base.'],
        'achievements.html': ['04', 'ACHIEVEMENTS VAULT', 'Enter the combat record vault.'],
        'extras.html':       ['05', 'EXTRAS COMPOUND', 'Reach the off-duty archives.'],
        'artworks.html':     ['06', 'ART REPOSITORY', 'Break into the art repository.'],
        'gaming.html':       ['07', 'GAME LIBRARY', 'Enter the game library.'],
        'comms.html':        ['08', 'COMMS TOWER', 'Reach the secure uplink.'],
        'objectives.html':   ['09', 'OBJECTIVES ROOM', 'Read the mission objectives.'],
        'credits.html':      ['10', 'CREDITS CHECKPOINT', 'Roll the credits.']
    };
    function briefing() {
        var b = BRIEF[page];
        if (!b) return;
        if (store('igiBrief:' + page)) return;
        store('igiBrief:' + page, '1');
        var box = el('div', 'igi-brief');
        box.setAttribute('role', 'status');
        box.append(el('div', 'igi-brief-no', 'MISSION ' + b[0]), el('div', 'igi-brief-title', b[1]), el('div', 'igi-brief-obj', 'OBJECTIVE: ' + b[2]));
        doc.body.appendChild(box);
        setTimeout(function () { box.remove(); }, 3600);
    }

    function init() {
        var header = doc.querySelector('.hud-header');
        if (header) setupHeader(header); else setupToolbar();
        briefing();
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
