/* ============================================================
   IGI-style map computer
   - Press M (or click [ MAP ]) to open, Esc / M to close
   - 1-9 / 0 select a location, Enter deploys, Tab works too
   - Uses the site's original UI sound (igi-audio.js); nothing is generated
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Locations (x / y are percentages of the map) ---------- */
    const NODES = [
        { id: 'hq', page: 'igi-intro.html', x: 11, y: 70, name: 'HQ // MAIN MENU',
          brief: 'Command base. Start of every operation. Return here to pick a new objective.' },
        { id: 'dossier', page: 'dossier.html', x: 27, y: 57, name: 'DOSSIER',
          brief: 'Operative profile: skills, combat stats and the classified resume (PDF).' },
        { id: 'techops', page: 'level_select.html', x: 46, y: 75, name: 'TECH OPS',
          brief: 'Field projects: Hirely, Learnfinity, WalletIQ, BiteSpeed, the AI Journal System and DeepDive AI, plus the weapon (skills) locker.' },
        { id: 'achievements', page: 'achievements.html', x: 52, y: 40, name: 'ACHIEVEMENTS',
          brief: 'Combat record: LeetCode, CodeChef, Codeforces, GeeksforGeeks and Code360 profiles.' },
        { id: 'extras', page: 'extras.html', x: 72, y: 56, name: 'EXTRAS',
          brief: 'Off-duty archives: creative work and the gaming library.' },
        { id: 'artworks', page: 'artworks.html', x: 86, y: 30, name: 'ARTWORKS',
          brief: 'Encrypted art repository: sketches, portraits and posters from earlier missions.' },
        { id: 'gaming', page: 'gaming.html', x: 84, y: 64, name: 'GAMING',
          brief: 'Game library: every title that shaped the operative, searchable by genre.' },
        { id: 'comms', page: 'comms.html', x: 69, y: 17, name: 'COMMS',
          brief: 'Secure uplink. Send a transmission or reach the operative on GitHub, LinkedIn or WhatsApp.' },
        { id: 'objectives', page: 'objectives.html', x: 24, y: 28, name: 'OBJECTIVES',
          brief: 'Mission objectives: what this operative is aiming for next.' },
        { id: 'credits', page: 'credits.html', x: 29, y: 90, name: 'CREDITS',
          brief: 'Tools, assets and tributes behind this portfolio.' }
    ];

    const ROUTES = [
        ['hq', 'dossier'], ['dossier', 'techops'], ['techops', 'achievements'],
        ['achievements', 'extras'], ['extras', 'artworks'], ['extras', 'gaming'],
        ['achievements', 'comms'], ['hq', 'objectives'], ['hq', 'credits'],
        ['dossier', 'objectives']
    ];

    const byId = Object.fromEntries(NODES.map(n => [n.id, n]));

    /* Optional real map picture. Leave false until assets/igi-map.jpg (or .png) exists, so the
       browser does not make (and log) a request for a file that is not there. */
    const USE_MAP_IMAGE = false;  /* true -> use assets/igi-map.jpg (or .png) as the map picture */

    /* The map has three layouts so labels never run off the edge or sit on top of each other:
       wide     - the normal map (desktop / tablet)
       portrait - zig-zag column for tall, narrow views (phones held upright)
       compact  - two flipped columns for short, narrow views (phones on their side) */
    const PORTRAIT = {
        hq: [8, 6], dossier: [44, 15], techops: [8, 24], achievements: [44, 33], extras: [8, 42],
        artworks: [44, 51], gaming: [8, 60], comms: [44, 69], objectives: [8, 78], credits: [44, 87]
    };
    const COMPACT = {
        achievements: [3, 12], dossier: [95, 12], credits: [3, 31], comms: [95, 31],
        extras: [3, 50], gaming: [95, 50], objectives: [3, 69], hq: [95, 69],
        artworks: [3, 88], techops: [95, 88]
    };
    let layout = 'wide';
    function pos(n) {
        if (layout === 'portrait') return PORTRAIT[n.id];
        if (layout === 'compact') return COMPACT[n.id];
        return [n.x, n.y];
    }

    /* ---------- Mission objectives (kind: visit = reach the page, need = visit other
       waypoints, flag = completed by an action, see CLICKS below) ---------- */
    const OBJ = {
        hq:           [{ t: 'Report to HQ', k: 'visit' }, { t: 'Open the map computer (press M)', k: 'flag' }],
        dossier:      [{ t: 'Infiltrate the Dossier room', k: 'visit' }, { t: 'Retrieve the classified resume', k: 'flag' }],
        techops:      [{ t: 'Reach the Tech Ops base', k: 'visit' }, { t: 'Inspect a project repository', k: 'flag' }, { t: 'Study a weapon (skill) manual', k: 'flag' }],
        achievements: [{ t: 'Enter the combat record vault', k: 'visit' }, { t: 'Verify a combat profile', k: 'flag' }],
        extras:       [{ t: 'Reach the off-duty archives', k: 'visit' }, { t: 'Secure both the Artworks and Gaming sites', k: 'need', need: ['artworks', 'gaming'] }],
        artworks:     [{ t: 'Break into the art repository', k: 'visit' }, { t: 'Examine one artwork', k: 'flag' }],
        gaming:       [{ t: 'Enter the game library', k: 'visit' }, { t: 'Use the scope on a game (preview)', k: 'flag' }],
        comms:        [{ t: 'Reach the secure uplink', k: 'visit' }, { t: 'Transmit a message to the operative', k: 'flag' }],
        objectives:   [{ t: 'Read the mission objectives', k: 'visit' }],
        credits:      [{ t: 'Roll the credits', k: 'visit' }]
    };

    /* flag objectives completed by clicking something on that page */
    const CLICKS = [
        { key: 'dossier:1', sel: 'a[href*="resume.pdf"]' },
        { key: 'techops:1', sel: 'a[href*="github.com/kARUn077/"]' },
        { key: 'techops:2', sel: '.weapon-card[data-link]' },
        { key: 'achievements:1', sel: 'a[href*="leetcode.com"], a[href*="codechef.com"], a[href*="codeforces.com"], a[href*="geeksforgeeks.org"], a[href*="naukri.com"]' },
        { key: 'artworks:1', sel: '.artwork-card' },
        { key: 'gaming:1', sel: '.preview-game-btn' }
    ];

    /* ---------- Which page are we on? ---------- */
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    const hereFile = (file === '' || file === 'index.html') ? 'igi-intro.html' : file;
    const visitNode = NODES.find(n => n.page === hereFile) || null;
    const hereNode = visitNode || (hereFile === 'success.html' ? byId.comms : null);

    /* ---------- Safe storage ---------- */
    function store(key, val) {
        try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
    }
    let sfxOn = store('igiMapSfx') !== 'off';

    /* ============================================================
       SOUND - the map uses the same original UI sound as the rest of the site (igi-audio.js).
       Nothing is generated here.
       ============================================================ */
    const sfx = {};
    ['open', 'close', 'hover', 'select', 'deploy', 'zoom', 'complete', 'mission'].forEach(name => {
        sfx[name] = function () { if (sfxOn && window.igiSound) igiSound.play('hover'); };
    });
    sfx.ping = function () {};   /* the repeating sonar ping was removed */

    /* ============================================================
       OBJECTIVE PROGRESS (saved in localStorage)
       ============================================================ */
    function loadSet(key) {
        try { return new Set(JSON.parse(store(key) || '[]')); } catch (e) { return new Set(); }
    }
    const visited = loadSet('igiVisited');
    const flags = loadSet('igiFlags');
    const announced = loadSet('igiAnnounced');
    function saveAll() {
        store('igiVisited', JSON.stringify([...visited]));
        store('igiFlags', JSON.stringify([...flags]));
        store('igiAnnounced', JSON.stringify([...announced]));
    }

    /* computer log: newest first */
    let logs;
    try { logs = JSON.parse(store('igiLog') || '[]'); } catch (e) { logs = []; }
    function pushLog(m) {
        logs.unshift({ t: Date.now(), m: m });
        if (logs.length > 80) logs.length = 80;
        store('igiLog', JSON.stringify(logs));
    }

    function isDone(id, i) {
        const o = OBJ[id][i];
        if (o.k === 'visit') return visited.has(id);
        if (o.k === 'need') return o.need.every(v => visited.has(v));
        return flags.has(id + ':' + i);
    }
    function nodeCount(id) {
        const total = OBJ[id].length;
        let done = 0;
        for (let i = 0; i < total; i++) if (isDone(id, i)) done++;
        return [done, total];
    }
    function allCount() {
        let done = 0, total = 0;
        NODES.forEach(n => { const c = nodeCount(n.id); done += c[0]; total += c[1]; });
        return [done, total];
    }

    function setFlag(key) {
        if (flags.has(key)) return;
        flags.add(key);
        saveAll();
        refresh();
    }

    /* announce anything that just became complete */
    function refresh() {
        let missionsDone = 0;
        NODES.forEach(n => {
            const c = nodeCount(n.id);
            OBJ[n.id].forEach((o, i) => {
                const k = n.id + ':' + i;
                if (isDone(n.id, i) && !announced.has(k)) { announced.add(k); pushLog('Objective complete: ' + o.t + '.'); toast('OBJECTIVE COMPLETE', o.t, 'complete'); }
            });
            if (c[0] === c[1]) {
                missionsDone++;
                if (!announced.has('m:' + n.id)) {
                    announced.add('m:' + n.id);
                    if (c[1] > 1) { pushLog('Mission complete: ' + LABEL[n.id] + '.'); toast('MISSION COMPLETE', n.name.split(' //')[0], 'mission'); }
                }
            }
        });
        if (missionsDone === NODES.length && !announced.has('all')) {
            announced.add('all');
            pushLog('All missions complete.');
            toast('ALL MISSIONS COMPLETE', 'Excellent work, agent. You found everything.', 'mission');
        }
        saveAll();
        if (root) renderAll();
    }

    /* ---------- toast queue ("OBJECTIVE COMPLETE") ---------- */
    let toastEl = null;
    const toastQueue = [];
    let toastBusy = false;
    function toast(title, text, sound) {
        toastQueue.push({ title: title, text: text, sound: sound });
        if (!toastBusy) nextToast();
    }
    function nextToast() {
        const item = toastQueue.shift();
        if (!item || !toastEl) { toastBusy = false; return; }
        toastBusy = true;
        toastEl.querySelector('.igit-title').textContent = item.title;
        toastEl.querySelector('.igit-text').textContent = item.text;
        toastEl.classList.add('show');
        sfx[item.sound]();
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(nextToast, 350);
        }, 2800);
    }

    /* ============================================================
       STYLES
       ============================================================ */
    const css = `
    #igiMapBtn{position:fixed;right:20px;padding:8px 12px;background:rgba(0,255,102,.1);border:1px solid rgba(0,255,102,.5);color:#00ff66;font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.05rem;z-index:50;transition:all .25s ease}
    #igiMapBtn:hover,#igiMapBtn:focus-visible{background:rgba(0,255,102,.25);box-shadow:0 0 12px rgba(0,255,102,.4)}
    #igiMap{position:fixed;inset:0;z-index:9000;display:none;background:#020503;color:#5bff7a;font-family:'VT323','Share Tech Mono',monospace;cursor:none}
    #igiMap.open{display:block;animation:igiMapIn .25s ease-out}
    @keyframes igiMapIn{from{opacity:0;transform:scale(1.02)}to{opacity:1;transform:none}}
    #igiMap *{cursor:none !important}
    .igim-device{position:absolute;inset:1.6vh 1.2vw;border-radius:58px;background:linear-gradient(165deg,#2b4030 0%,#101b13 42%,#1b2d20 100%);box-shadow:inset 0 0 0 2px rgba(130,210,150,.14),inset 0 8px 26px rgba(170,255,200,.1),inset 0 -10px 30px rgba(0,0,0,.6),0 0 70px rgba(0,0,0,.9)}
    .igim-screen{position:absolute;left:2.6%;right:2.6%;top:3.4%;bottom:12%;border-radius:40px;overflow:hidden;background:#000;box-shadow:0 0 0 4px #050a06,0 0 0 6px rgba(90,160,110,.28),inset 0 0 50px rgba(0,0,0,.9)}
    .igim-view{position:absolute;inset:0;overflow:hidden;touch-action:none}
    .igim-world{position:absolute;left:0;top:0;transform-origin:0 0}
    .igim-world canvas{display:block}
    .igim-world svg{position:absolute;left:0;top:0;width:100%;height:100%}
    .igim-route{stroke:rgba(110,255,140,.3);stroke-width:1;stroke-dasharray:5 6;fill:none;vector-effect:non-scaling-stroke}
    .igim-route.hot{stroke:rgba(255,235,120,.85);stroke-width:1.6}
    .igim-fx{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,10,3,.78) 100%),repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0,rgba(0,0,0,.28) 1px,transparent 1px,transparent 3px)}
    .igim-nodes{position:absolute;inset:0;pointer-events:none}
    .igim-node{position:absolute;pointer-events:auto;transform:translate(-8px,-50%);background:none;border:none;padding:4px 8px 4px 2px;display:flex;align-items:center;gap:6px;color:#ff3b3b;font-family:inherit;font-size:1.2rem;letter-spacing:.03rem;text-shadow:0 0 5px rgba(255,40,40,.55),0 0 2px #000;white-space:nowrap}
    .igim-tri{font-size:1rem;line-height:1}
    .igim-lbl{background:rgba(0,8,3,.6);padding:0 5px}
    .igim-node.done{color:#5bff7a;text-shadow:0 0 6px rgba(80,255,120,.5),0 0 2px #000}
    .igim-node.sel{color:#fff3a0;text-shadow:0 0 8px rgba(255,240,140,.9),0 0 2px #000;outline:1px dashed rgba(255,243,160,.9);outline-offset:2px}
    .igim-node:focus-visible{outline:2px solid #fff;outline-offset:2px}
    .igim-here{display:none;position:absolute;left:14px;top:-12px;font-size:.85rem;color:#5bff7a;text-shadow:0 0 4px #000}
    .igim-node.here .igim-here{display:block}
    .igim-node.here .igim-tri{color:#5bff7a}
    .igim-node.flip{flex-direction:row-reverse;transform:translate(calc(-100% + 8px),-50%);padding:4px 2px 4px 8px}
    .igim-node.flip .igim-tri{transform:scaleX(-1)}
    .igim-node.flip .igim-here{left:auto;right:14px}
    .igim-node.flip.here::before{left:auto;right:-4px}
    .igim-node.here::before{content:"";position:absolute;left:-4px;top:50%;width:22px;height:22px;margin-top:-11px;border:2px solid #5bff7a;border-radius:50%;animation:igimPing 1.8s ease-out infinite;pointer-events:none}
    @keyframes igimPing{from{transform:scale(1);opacity:1}to{transform:scale(2.6);opacity:0}}
    .igim-info{position:absolute;top:16px;left:16px;width:min(300px,40%);max-height:62%;overflow:auto;background:rgba(0,18,6,.84);border:1px solid rgba(91,255,122,.5);padding:.8rem .95rem;display:flex;flex-direction:column;gap:.5rem;font-size:1.1rem;line-height:1.2}
    .igim-info h3{margin:0;font-size:1.6rem;font-weight:400;letter-spacing:.06rem;color:#9dffb2}
    .igim-tag{font-size:.9rem;opacity:.7}
    .igim-info p{margin:0;color:#b8ffc8}
    .igim-mini{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.2rem;font-size:1rem}
    .igim-mini li{display:flex;gap:.45rem}
    .igim-mini .dn{color:#5bff7a;flex:none}
    .igim-mini li.done span:last-child{opacity:.55;text-decoration:line-through}
    .igim-btn{background:rgba(91,255,122,.08);border:1px solid rgba(91,255,122,.7);color:#5bff7a;font-family:inherit;font-size:1.1rem;letter-spacing:.06rem;padding:.15rem .8rem;align-self:flex-start}
    .igim-btn:hover,.igim-btn:focus-visible{background:#5bff7a;color:#001a08;box-shadow:0 0 14px rgba(91,255,122,.6)}
    .igim-help{font-size:.85rem;opacity:.6;line-height:1.25}
    .igim-menu{position:absolute;left:5%;bottom:5%;display:flex;flex-direction:column;gap:2px;z-index:5}
    .igim-tab{background:none;border:none;text-align:left;color:#5bff7a;font-family:inherit;font-size:1.8rem;line-height:1.1;padding:0;opacity:.7;text-shadow:0 0 6px rgba(91,255,122,.4)}
    .igim-tab:hover,.igim-tab:focus-visible{opacity:1}
    .igim-tab.act{opacity:1;color:#c8ffd2}
    .igim-tab.act::before{content:"> "}
    .igim-ctrl{position:absolute;right:4%;bottom:5%;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:5}
    .igim-dpad{width:96px;height:96px;display:block}
    .igim-dpad polygon{fill:rgba(91,255,122,.14);stroke:#5bff7a;stroke-width:1.5}
    .igim-dpad polygon:hover,.igim-dpad circle:hover{fill:rgba(91,255,122,.5)}
    .igim-dpad .ring{fill:none;pointer-events:none;stroke-width:2}
    .igim-dpad circle{fill:rgba(91,255,122,.1);stroke:#5bff7a;stroke-width:1.5}
    .igim-zoom{display:flex;gap:30px}
    .igim-zbtn{width:28px;height:28px;border:1px solid #5bff7a;background:rgba(91,255,122,.08);color:#5bff7a;font-family:inherit;font-size:1.5rem;line-height:1;padding:0;display:grid;place-items:center}
    .igim-zbtn:hover{background:#5bff7a;color:#001a08}
    .igim-pg{position:absolute;inset:0 0 calc(5% + 6.2rem + 14px) 0;display:none;padding:4.5% 5% 1% 6%;overflow:auto;background:#000;scrollbar-width:thin;scrollbar-color:#2c8f45 #000}
    .igim-screen[data-tab="objs"] .igim-pg-objs,.igim-screen[data-tab="log"] .igim-pg-log{display:block}
    .igim-screen:not([data-tab="map"]) .igim-view,.igim-screen:not([data-tab="map"]) .igim-ctrl{visibility:hidden}
    .igim-screen:not([data-tab="map"]) .igim-info{display:none}
    .igim-ob{display:flex;gap:.9rem;align-items:flex-start;margin-bottom:.95rem}
    .igim-ring{flex:none;width:32px;height:32px;border-radius:50%;border:2px solid #5bff7a;background:radial-gradient(circle,#000 52%,rgba(91,255,122,.55) 58%,#000 74%);box-shadow:0 0 8px rgba(91,255,122,.4)}
    .igim-ob.done .igim-ring{background:radial-gradient(circle,#5bff7a 62%,#000 68%)}
    .igim-ob h4{margin:0;font-size:1.8rem;font-weight:400;color:#7dff97;line-height:1}
    .igim-ob p{margin:3px 0 0;font-size:1.1rem;color:#46d663}
    .igim-log-row{font-size:1.3rem;margin-bottom:.4rem;color:#7dff97}
    .igim-log-row i{font-style:normal;opacity:.6;margin-right:.9rem}
    .igim-bez{position:absolute;left:0;right:0;bottom:0;height:12%;display:flex;align-items:center;justify-content:space-between;padding:0 5%}
    .igim-pills{display:flex;gap:20px}
    .igim-pill{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;font-family:inherit;font-size:.9rem;color:rgba(190,255,205,.7);padding:0}
    .igim-pill i{display:block;width:12px;height:34px;border-radius:7px;transform:rotate(25deg);box-shadow:0 2px 6px rgba(0,0,0,.6),inset 0 2px 3px rgba(255,255,255,.35)}
    .igim-pill.red i{background:linear-gradient(#ff6a5a,#8a1208)}
    .igim-pill.green i{background:linear-gradient(#8aff6a,#1a6a08)}
    .igim-pill:hover,.igim-pill:focus-visible{color:#fff}
    .igim-brand{font-family:'Orbitron',sans-serif;font-size:clamp(1.1rem,3.2vw,2.5rem);letter-spacing:.35em;color:rgba(170,215,180,.28);text-shadow:0 1px 0 rgba(255,255,255,.08),0 -1px 0 rgba(0,0,0,.7);font-weight:900}
    .igim-prog{font-size:1.2rem;color:rgba(190,255,205,.75);min-width:150px;text-align:right}
    #igiToast{position:fixed;top:78px;left:50%;transform:translate(-50%,-30px);opacity:0;pointer-events:none;z-index:9500;min-width:300px;max-width:90vw;text-align:center;background:rgba(0,25,10,.92);border:1px solid #ffd23f;box-shadow:0 0 22px rgba(255,210,63,.45);padding:.7rem 1.4rem;font-family:'Share Tech Mono',monospace;transition:all .35s ease}
    #igiToast.show{opacity:1;transform:translate(-50%,0)}
    .igit-title{font-family:'Orbitron',sans-serif;font-size:.95rem;letter-spacing:.18rem;color:#ffd23f}
    .igit-text{margin-top:.25rem;font-size:.85rem;color:#c8ffd8;letter-spacing:.04rem}
    #igiToast{visibility:hidden}#igiToast.show{visibility:visible}
    @media(max-width:700px){#igiToast{top:auto;bottom:1rem;left:1rem;right:1rem;width:auto;min-width:0;max-width:none;transform:translateY(30px)}#igiToast.show{transform:none}}
    /* ---- wide screens: the waypoint card is a side panel, so it never sits on top of the map ---- */
    .igim-screen{--ipw:300px;--ih:84px}
    .igim-view{inset:0 var(--ipw) 0 0}
    .igim-info{top:0;right:0;bottom:0;left:auto;width:var(--ipw);max-height:none;border-width:0 0 0 1px;padding:1rem}
    .igim-ctrl{right:calc(var(--ipw) + 3%)}
    @media(max-width:900px){.igim-screen{--ipw:250px}}
    /* ---- phones and portrait tablets: the menu becomes a bottom bar, the card sits under the map ---- */
    @media(max-width:700px),(max-height:480px),(max-aspect-ratio:1/1) and (max-width:1000px){
    .igim-device{inset:0;border-radius:0}
    .igim-screen{left:1.5%;right:1.5%;top:1.5%;bottom:12%;border-radius:22px}
    .igim-bez{height:12%;padding:0 4%}
    .igim-brand{display:none}
    .igim-prog{min-width:0;font-size:1rem}
    .igim-menu{left:0;right:0;bottom:0;height:52px;flex-direction:row;align-items:center;justify-content:flex-start;gap:1.1rem;padding:0 .9rem;background:rgba(0,10,3,.95);border-top:1px solid rgba(91,255,122,.4)}
    .igim-tab{font-size:1.35rem}
    .igim-tab.act::before{content:""}
    .igim-ctrl{right:.6rem;bottom:.5rem;flex-direction:row;gap:.4rem}
    .igim-dpad{display:none}
    .igim-zoom{gap:.4rem}
    .igim-zbtn{width:34px;height:34px}
    .igim-pg{inset:0 0 52px 0;padding:1rem}
    .igim-ob h4{font-size:1.45rem}
    .igim-ob p{font-size:1rem}
    .igim-ring{width:26px;height:26px}
    .igim-log-row{font-size:1.15rem}
    .igim-help{display:none}
    .igim-node{font-size:1rem}
    }
    @media(max-width:700px),(max-aspect-ratio:1/1) and (max-width:1000px){
    .igim-view{inset:0 0 calc(52px + var(--ih)) 0}
    .igim-info{left:0;right:0;top:auto;bottom:52px;width:auto;height:var(--ih);padding:.5rem .8rem;border-width:1px 0 0 0;display:grid;grid-template-columns:1fr auto;gap:.1rem .8rem;align-items:center;overflow:hidden;font-size:1rem}
    .igim-info .igim-tag,.igim-info .igim-mini{display:none}
    .igim-info h3{grid-column:1;font-size:1.35rem}
    .igim-info p{grid-column:1;font-size:.9rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .igim-info .igim-btn{grid-column:2;grid-row:1 / span 2;align-self:center}
    }
    /* ---- phones on their side: map on the left, waypoint card on the right ---- */
    @media(max-height:480px){
    .igim-screen{--ipw:40%;bottom:15%}
    .igim-bez{height:15%}
    .igim-pill span{display:none}
    .igim-pill i{height:22px}
    .igim-view{inset:0 var(--ipw) 48px 0}
    .igim-info{top:0;right:0;bottom:48px;left:auto;width:var(--ipw);height:auto;padding:.6rem .8rem;border-width:0 0 1px 1px;display:flex;overflow:auto}
    .igim-info .igim-mini{display:flex}
    .igim-info .igim-tag{display:block}
    .igim-info h3{font-size:1.3rem}
    .igim-info p{display:block;font-size:.9rem}
    .igim-menu{height:48px}
    .igim-pg{inset:0 0 48px 0}
    .igim-tab{font-size:1.2rem}
    .igim-ctrl{right:.6rem;bottom:.3rem}
    }
    @media(prefers-reduced-motion:reduce){.igim-node.here::before{animation:none}}
    `;

    /* ============================================================
       DOM  (an IGI-style handheld "map computer")
       ============================================================ */
    const LABEL = {
        hq: 'Headquarters', dossier: 'Dossier', techops: 'Tech Ops Base', achievements: 'Achievements Vault',
        extras: 'Extras Compound', artworks: 'Art Repository', gaming: 'Game Library', comms: 'Comms Tower',
        objectives: 'Objectives Room', credits: 'Credits Checkpoint'
    };
    const NS_SVG = 'http://www.w3.org/2000/svg';

    let root, screenEl, view, world, canvas, svg, infoTag, infoName, infoBrief, infoList, deployBtn;
    let sfxBtn, sfxCap, progText, objPage, logPage;
    const tabBtns = {};
    let tab = 'map';
    let mz = 1, mox = 0, moy = 0;
    let selected = hereNode ? hereNode.id : NODES[0].id;
    let isOpen = false;
    let lastFocus = null;
    const nodeEls = {};

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    function build() {
        if (!document.querySelector('link[href*="VT323"]')) {
            const f = document.createElement('link');
            f.rel = 'stylesheet';
            f.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
            document.head.appendChild(f);
        }
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        /* floating launcher buttons, stacked above the Night Vision button */
        const btn = el('button', null, '[ MAP: M ]');
        btn.id = 'igiMapBtn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Open map computer');
        const nv = document.getElementById('nvToggle');
        let bottom = 60;
        if (nv) bottom = (parseFloat(getComputedStyle(nv).bottom) || 20) + 40;
        btn.style.bottom = bottom + 'px';
        btn.addEventListener('click', open);
        hoverFx(btn);
        document.body.appendChild(btn);

        /* ---- the computer ---- */
        root = el('div');
        root.id = 'igiMap';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-label', 'Map computer');

        const device = el('div', 'igim-device');
        screenEl = el('div', 'igim-screen');
        screenEl.dataset.tab = 'map';

        /* map page */
        view = el('div', 'igim-view');
        world = el('div', 'igim-world');
        canvas = document.createElement('canvas');
        svg = document.createElementNS(NS_SVG, 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        ROUTES.forEach(([a, b]) => {
            const l = document.createElementNS(NS_SVG, 'line');
            l.setAttribute('class', 'igim-route');
            l.setAttribute('x1', byId[a].x); l.setAttribute('y1', byId[a].y);
            l.setAttribute('x2', byId[b].x); l.setAttribute('y2', byId[b].y);
            l.dataset.a = a; l.dataset.b = b;
            svg.appendChild(l);
        });
        world.append(canvas, svg);

        const nodeLayer = el('div', 'igim-nodes');
        NODES.forEach((n) => {
            const b = el('button', 'igim-node' + (hereNode && hereNode.id === n.id ? ' here' : ''));
            b.type = 'button';
            b.setAttribute('aria-label', LABEL[n.id]);
            b.append(el('span', 'igim-here', 'You are here.'), el('span', 'igim-tri', '◁'), el('span', 'igim-lbl', LABEL[n.id] + '.'));
            b.addEventListener('mouseenter', () => select(n.id, true));
            b.addEventListener('focus', () => select(n.id, true));
            b.addEventListener('click', () => select(n.id));
            b.addEventListener('dblclick', () => deploy(n));
            nodeLayer.appendChild(b);
            nodeEls[n.id] = b;
            hoverFx(b, true);
        });
        view.append(world, nodeLayer, el('div', 'igim-fx'));

        /* drag to pan, wheel to zoom */
        let drag = null;
        view.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.igim-node')) return;
            drag = { x: e.clientX, y: e.clientY };
            view.setPointerCapture(e.pointerId);
        });
        view.addEventListener('pointermove', (e) => {
            if (!drag) return;
            mox += e.clientX - drag.x; moy += e.clientY - drag.y;
            drag.x = e.clientX; drag.y = e.clientY;
            applyView();
        });
        const endDrag = () => { drag = null; };
        view.addEventListener('pointerup', endDrag);
        view.addEventListener('pointercancel', endDrag);
        view.addEventListener('wheel', (e) => { e.preventDefault(); zoomMap(e.deltaY < 0 ? 1.25 : 0.8); }, { passive: false });

        /* waypoint card */
        const info = el('aside', 'igim-info');
        infoTag = el('div', 'igim-tag');
        infoName = el('h3');
        infoBrief = el('p');
        infoList = el('ul', 'igim-mini');
        deployBtn = el('button', 'igim-btn', '> DEPLOY');
        deployBtn.type = 'button';
        deployBtn.addEventListener('click', () => deploy(byId[selected]));
        hoverFx(deployBtn);
        info.append(infoTag, infoName, infoBrief, infoList, deployBtn,
            el('div', 'igim-help', 'Keys: 1-9, 0 select | Enter deploy | arrows pan | + / - zoom | O objectives | L log | M close'));

        /* objectives + log pages */
        objPage = el('div', 'igim-pg igim-pg-objs');
        logPage = el('div', 'igim-pg igim-pg-log');

        /* Log / Objectives / Map menu */
        const menu = el('div', 'igim-menu');
        [['map', 'Map'], ['objs', 'Objectives'], ['log', 'Log']].forEach(([key, name]) => {
            const t = el('button', 'igim-tab', name);
            t.type = 'button';
            t.addEventListener('click', () => setTab(key));
            hoverFx(t);
            menu.appendChild(t);
            tabBtns[key] = t;
        });

        /* d-pad + zoom buttons */
        const ctrl = el('div', 'igim-ctrl');
        const dp = el('div');
        dp.innerHTML = '<svg class="igim-dpad" viewBox="0 0 100 100" aria-hidden="true">' +
            '<polygon class="ring" points="50,2 98,50 50,98 2,50"/>' +
            '<polygon data-dir="up" points="50,10 74,34 26,34"/><polygon data-dir="down" points="50,90 74,66 26,66"/>' +
            '<polygon data-dir="left" points="10,50 34,26 34,74"/><polygon data-dir="right" points="90,50 66,26 66,74"/>' +
            '<circle data-dir="center" cx="50" cy="50" r="15"/></svg>';
        let lastDir = null;
        dp.addEventListener('mouseover', (e) => {
            const d = e.target.closest('[data-dir]');
            if (d !== lastDir) { lastDir = d; if (d) sfx.hover(); }
        });
        dp.addEventListener('mouseleave', () => { lastDir = null; });
        dp.addEventListener('click', (e) => {
            const d = e.target.closest('[data-dir]');
            if (!d) return;
            if (d.dataset.dir === 'center') { mz = 1; mox = 0; moy = 0; applyView(); sfx.select(); } else panMap(d.dataset.dir);
        });
        const zoom = el('div', 'igim-zoom');
        const zin = el('button', 'igim-zbtn', '+');
        const zout = el('button', 'igim-zbtn', '−');
        zin.type = zout.type = 'button';
        zin.setAttribute('aria-label', 'Zoom in');
        zout.setAttribute('aria-label', 'Zoom out');
        zin.addEventListener('click', () => zoomMap(1.25));
        zout.addEventListener('click', () => zoomMap(0.8));
        hoverFx(zin); hoverFx(zout);
        zoom.append(zin, zout);
        ctrl.append(dp, zoom);

        screenEl.append(view, info, objPage, logPage, menu, ctrl);

        /* bezel: pills (close / sound), brand, progress */
        const bez = el('div', 'igim-bez');
        const pills = el('div', 'igim-pills');
        const closeBtn = el('button', 'igim-pill red');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close map computer');
        closeBtn.append(document.createElement('i'), el('span', null, 'ESC'));
        closeBtn.addEventListener('click', close);
        sfxBtn = el('button', 'igim-pill green');
        sfxBtn.type = 'button';
        sfxBtn.setAttribute('aria-label', 'Toggle sound effects');
        sfxCap = el('span');
        sfxBtn.append(document.createElement('i'), sfxCap);
        sfxBtn.addEventListener('click', () => { sfxOn = !sfxOn; store('igiMapSfx', sfxOn ? 'on' : 'off'); syncSfxBtn(); if (sfxOn) sfx.select(); });
        pills.append(closeBtn, sfxBtn);
        progText = el('div', 'igim-prog');
        bez.append(pills, el('div', 'igim-brand', '= SYS_K'), progText);
        hoverFx(closeBtn); hoverFx(sfxBtn);

        device.append(screenEl, bez);
        root.appendChild(device);
        document.body.appendChild(root);

        toastEl = el('div');
        toastEl.id = 'igiToast';
        toastEl.setAttribute('role', 'status');
        toastEl.append(el('div', 'igit-title'), el('div', 'igit-text'));
        document.body.appendChild(toastEl);

        syncSfxBtn();
        select(selected, true);
        setTab('map', true);
        renderAll();
        loadMapImage();
        window.addEventListener('resize', () => { if (isOpen) { drawTerrain(); applyView(); } });
    }

    /* crosshair hover colour + hover sound for every clickable thing (silent = the caller plays its own) */
    function hoverFx(node, silent) {
        node.addEventListener('mouseenter', () => {
            document.body.classList.add('hover-target');
            if (!silent) sfx.hover();
        });
        node.addEventListener('mouseleave', () => document.body.classList.remove('hover-target'));
    }

    function syncSfxBtn() { sfxCap.textContent = sfxOn ? 'SFX ON' : 'SFX OFF'; }

    /* ---------- map pan / zoom ---------- */
    /* switch between the wide layout and the tall (phone) layout */
    function updateMode(w, h) {
        const next = w < 560 ? (w / h < 1.15 ? 'portrait' : 'compact') : 'wide';
        if (next === layout) return false;
        layout = next;
        ROUTES.forEach(([a, b]) => {
            const l = svg.querySelector('.igim-route[data-a="' + a + '"][data-b="' + b + '"]');
            const pa = pos(byId[a]), pb = pos(byId[b]);
            l.setAttribute('x1', pa[0]); l.setAttribute('y1', pa[1]);
            l.setAttribute('x2', pb[0]); l.setAttribute('y2', pb[1]);
        });
        return true;
    }

    function applyView() {
        const w = view.clientWidth, h = view.clientHeight;
        if (!w || !h) return;
        if (updateMode(w, h)) drawTerrain();
        mz = clamp(mz, 1, 3);
        mox = clamp(mox, w - w * mz, 0);
        moy = clamp(moy, h - h * mz, 0);
        world.style.transform = 'translate(' + mox + 'px,' + moy + 'px) scale(' + mz + ')';
        NODES.forEach(n => {
            const b = nodeEls[n.id];
            const pp = pos(n);
            b.style.left = (pp[0] / 100 * w * mz + mox) + 'px';
            b.style.top = (pp[1] / 100 * h * mz + moy) + 'px';
            /* labels on the right half of the map open to the left so they stay on screen */
            b.classList.toggle('flip', pp[0] > 58);
        });
    }

    function zoomMap(f) {
        const w = view.clientWidth, h = view.clientHeight;
        const nz = clamp(mz * f, 1, 3);
        if (nz === mz) return;
        mox = w / 2 - (w / 2 - mox) * (nz / mz);
        moy = h / 2 - (h / 2 - moy) * (nz / mz);
        mz = nz;
        applyView();
        sfx.zoom();
    }

    function panMap(dir) {
        const step = Math.max(70, view.clientWidth * 0.08);
        if (dir === 'left') mox += step;
        if (dir === 'right') mox -= step;
        if (dir === 'up') moy += step;
        if (dir === 'down') moy -= step;
        applyView();
        sfx.hover();
    }

    function focusNode(n) {
        if (mz <= 1) return;
        const w = view.clientWidth, h = view.clientHeight;
        const pp = pos(n);
        mox = w / 2 - pp[0] / 100 * w * mz;
        moy = h / 2 - pp[1] / 100 * h * mz;
        applyView();
    }

    /* ---------- tabs ---------- */
    function setTab(name, quiet) {
        tab = name;
        screenEl.dataset.tab = name;
        Object.keys(tabBtns).forEach(k => tabBtns[k].classList.toggle('act', k === name));
        if (name === 'map') applyView();
        if (!quiet) sfx.select();
    }

    /* ---------- rendering ---------- */
    function renderInfo() {
        const n = byId[selected];
        const idx = NODES.indexOf(n) + 1;
        infoTag.textContent = 'Waypoint ' + String(idx).padStart(2, '0') + (hereNode && hereNode.id === n.id ? ' - you are here' : '');
        infoName.textContent = LABEL[n.id];
        infoBrief.textContent = n.brief;
        infoList.textContent = '';
        OBJ[n.id].forEach((o, i) => {
            const done = isDone(n.id, i);
            const li = el('li', done ? 'done' : '');
            li.append(el('span', 'dn', done ? '[✔]' : '[ ]'), el('span', null, o.t));
            infoList.appendChild(li);
        });
        deployBtn.textContent = hereNode && hereNode.id === n.id ? '> STAY HERE' : '> DEPLOY';
    }

    function resetProgress() {
        sfx.select();
        if (!window.confirm('Reset all objective progress?')) return;
        visited.clear(); flags.clear(); announced.clear();
        logs = [];
        store('igiLog', '[]');
        if (visitNode) visited.add(visitNode.id);
        saveAll();
        refresh();
    }

    function renderObjPage() {
        objPage.textContent = '';
        let k = 0;
        NODES.forEach(n => OBJ[n.id].forEach((o, i) => {
            k++;
            const done = isDone(n.id, i);
            const row = el('div', 'igim-ob' + (done ? ' done' : ''));
            const box = el('div');
            box.append(el('h4', null, 'Objective ' + k + ': ' + (done ? 'Complete' : 'Incomplete')), el('p', null, LABEL[n.id] + ': ' + o.t + '.'));
            row.append(el('div', 'igim-ring'), box);
            objPage.appendChild(row);
        }));
        const reset = el('button', 'igim-btn', '[ reset progress ]');
        reset.type = 'button';
        reset.addEventListener('click', resetProgress);
        hoverFx(reset);
        objPage.appendChild(reset);
    }

    function renderLog() {
        logPage.textContent = '';
        if (!logs.length) { logPage.appendChild(el('div', 'igim-log-row', 'Log empty. Complete objectives to fill it.')); return; }
        logs.forEach(entry => {
            const d = new Date(entry.t);
            const stamp = d.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const row = el('div', 'igim-log-row');
            row.append(el('i', null, stamp), document.createTextNode(entry.m));
            logPage.appendChild(row);
        });
    }

    function renderAll() {
        const all = allCount();
        progText.textContent = 'OBJECTIVES ' + all[0] + '/' + all[1];
        NODES.forEach(n => {
            const c = nodeCount(n.id);
            nodeEls[n.id].classList.toggle('done', c[0] === c[1]);
        });
        renderInfo();
        renderObjPage();
        renderLog();
    }

    /* ============================================================
       SELECTION / NAVIGATION
       ============================================================ */
    function select(id, quiet) {
        const n = byId[id];
        if (!n) return;
        const changed = selected !== id;
        selected = id;
        Object.keys(nodeEls).forEach(k => nodeEls[k].classList.toggle('sel', k === id));
        svg.querySelectorAll('.igim-route').forEach(l => l.classList.toggle('hot', l.dataset.a === id || l.dataset.b === id));
        renderInfo();
        if (isOpen && changed) (quiet ? sfx.hover : sfx.select)();
    }

    function deploy(n) {
        if (!n) return;
        if (hereNode && hereNode.id === n.id) { close(); return; }
        sfx.deploy();
        root.style.pointerEvents = 'none';
        setTimeout(() => {
            if (typeof loadLevel === 'function') loadLevel(n.page);
            else location.href = 'loading.html?target=' + encodeURIComponent(n.page);
        }, 450);
    }

    /* ============================================================
       OPEN / CLOSE
       ============================================================ */
    function open() {
        if (isOpen) return;
        if (!root) build();
        isOpen = true;
        lastFocus = document.activeElement;
        root.classList.add('open');
        document.body.style.overflow = 'hidden';
        applyView();
        drawTerrain();
        setFlag('hq:1');
        sfx.open();
        deployBtn.focus({ preventScroll: true });
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        root.classList.remove('open');
        document.body.style.overflow = '';
        document.body.classList.remove('hover-target');
        sfx.close();
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;

        if (e.key === 'm' || e.key === 'M') {
            if (e.repeat) return;
            if (isOpen && tab !== 'map') { setTab('map'); return; }
            isOpen ? close() : open();
            return;
        }
        if (!isOpen) return;
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'o' || e.key === 'O') { if (!e.repeat) setTab(tab === 'objs' ? 'map' : 'objs'); return; }
        if (e.key === 'l' || e.key === 'L') { if (!e.repeat) setTab(tab === 'log' ? 'map' : 'log'); return; }
        if (tab !== 'map') return;
        if (/^[0-9]$/.test(e.key)) {
            const i = e.key === '0' ? 9 : Number(e.key) - 1;
            if (NODES[i]) { select(NODES[i].id); focusNode(NODES[i]); }
            return;
        }
        if (e.key === 'ArrowLeft') { e.preventDefault(); panMap('left'); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); panMap('right'); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); panMap('up'); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); panMap('down'); return; }
        if (e.key === '+' || e.key === '=') { zoomMap(1.25); return; }
        if (e.key === '-' || e.key === '_') { zoomMap(0.8); return; }
        if (e.key === 'Enter' && !(t && t.tagName === 'BUTTON')) deploy(byId[selected]);
    });

    /* ============================================================
       PROCEDURAL TERRAIN (seeded, so the map looks the same each time)
       ============================================================ */
    function rng(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* Optional real map picture: put it at assets/igi-map.jpg (or .png) */
    let mapImg = null;
    function loadMapImage() {
        if (!USE_MAP_IMAGE) return;
        ['assets/igi-map.jpg', 'assets/igi-map.png'].reduce((chain, src) => chain.then(found => found || new Promise(res => {
            const im = new Image();
            im.onload = () => res(im);
            im.onerror = () => res(null);
            im.src = src;
        })), Promise.resolve(null)).then(im => { if (im) { mapImg = im; if (isOpen) drawTerrain(); } });
    }

    function drawTerrain() {
        const w = view.clientWidth, h = view.clientHeight;
        if (!w || !h) return;
        const k = Math.min(window.devicePixelRatio || 1, 2) * 1.5;   /* extra detail for zooming */
        canvas.width = Math.round(w * k);
        canvas.height = Math.round(h * k);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const c = canvas.getContext('2d');
        c.setTransform(k, 0, 0, k, 0, 0);
        const rand = rng(1999);
        updateMode(w, h);
        const P = (nx, ny) => [nx / 100 * w, ny / 100 * h];

        c.fillStyle = '#04120a';
        c.fillRect(0, 0, w, h);

        if (mapImg) {
            /* real map picture: cover-fit and slightly darkened */
            const f = Math.max(w / mapImg.width, h / mapImg.height);
            const iw = mapImg.width * f, ih = mapImg.height * f;
            c.drawImage(mapImg, (w - iw) / 2, (h - ih) / 2, iw, ih);
            c.fillStyle = 'rgba(0,10,3,.35)';
            c.fillRect(0, 0, w, h);
            return;
        }

        /* soft ground patches */
        for (let i = 0; i < 28; i++) {
            const x = rand() * w, y = rand() * h, r = 60 + rand() * 180;
            const g = c.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(34,96,50,' + (0.14 + rand() * 0.1) + ')');
            g.addColorStop(1, 'rgba(34,96,50,0)');
            c.fillStyle = g;
            c.fillRect(x - r, y - r, r * 2, r * 2);
        }

        /* a few faint contour lines */
        c.lineWidth = 1;
        for (let n = 0; n < 3; n++) {
            const cx = rand() * w, cy = rand() * h, ph = rand() * 6;
            for (let r = 30; r < 30 + 6 * 24; r += 24) {
                c.strokeStyle = 'rgba(80,200,110,.05)';
                c.beginPath();
                for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.12) {
                    const rr = r + 9 * Math.sin(a * 3 + ph) + 5 * Math.sin(a * 7 + ph * 2);
                    const x = cx + Math.cos(a) * rr * 1.25, y = cy + Math.sin(a) * rr;
                    a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
                }
                c.stroke();
            }
        }

        /* a couple of long winding ditches, kept subtle */
        for (let n = 0; n < 2; n++) {
            const x0 = rand() * w, x1 = x0 + (rand() - 0.5) * 220;
            const cp1 = rand() * w, cp2 = rand() * w;
            c.beginPath(); c.moveTo(x0, -10); c.bezierCurveTo(cp1, h * 0.35, cp2, h * 0.7, x1, h + 10);
            c.strokeStyle = 'rgba(60,140,80,.16)'; c.lineWidth = 24; c.stroke();
            c.strokeStyle = 'rgba(2,12,6,.7)'; c.lineWidth = 16; c.stroke();
        }

        /* roads follow the routes */
        ROUTES.forEach(([a, b]) => {
            const [x1, y1] = P(...pos(byId[a])), [x2, y2] = P(...pos(byId[b]));
            const mx = (x1 + x2) / 2 + (rand() - 0.5) * 70, my = (y1 + y2) / 2 + (rand() - 0.5) * 70;
            c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2);
            c.strokeStyle = 'rgba(90,190,110,.2)'; c.lineWidth = 6; c.stroke();
            c.strokeStyle = 'rgba(150,255,170,.16)'; c.lineWidth = 1; c.setLineDash([8, 8]); c.stroke(); c.setLineDash([]);
        });

        /* each base: just two small low-contrast buildings, offset away from the label */
        NODES.forEach(n => {
            const [x, y] = P(...pos(n));
            const blocks = [[-18, -30, 62, 13], [8, 14, 46, 11]];
            blocks.forEach(([dx, dy, bw, bh]) => {
                c.fillStyle = 'rgba(60,150,85,.1)'; c.fillRect(x + dx, y + dy, bw, bh);
                c.strokeStyle = 'rgba(130,235,155,.22)'; c.lineWidth = 1; c.strokeRect(x + dx, y + dy, bw, bh);
            });
        });

        /* light film grain */
        for (let i = 0; i < 2500; i++) {
            c.fillStyle = 'rgba(130,230,150,' + (0.02 + rand() * 0.05) + ')';
            c.fillRect(rand() * w, rand() * h, 1 + rand(), 1 + rand());
        }
    }

       /* ---------- boot ---------- */
    function init() {
        const btn = document.getElementById('igiMapBtn');
        if (btn) return;
        window.igiProgress = allCount;   /* lets the title screen show "objectives done / total" */
        build();

        /* clicking tracked things completes secondary objectives (capture phase: some
           handlers on the page stop propagation) */
        document.addEventListener('click', (e) => {
            if (!e.target.closest) return;
            CLICKS.forEach(c => { if (e.target.closest(c.sel)) setFlag(c.key); });
        }, true);

        if (hereFile === 'success.html') flags.add('comms:1');   /* message was sent */
        if (visitNode) visited.add(visitNode.id);
        saveAll();
        setTimeout(refresh, 1200);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
