(function () {
  const $ = s => document.querySelector(s);
  const KEY = 'brainloop.v1';
  const EPOCH = Date.UTC(2026, 10, 25);
  const SITE = 'Brainloop';
  const PUBLIC_URL = 'https://omarmohsen26.github.io/brainloop/';
  let busy = false, pendingReload = false, tab = 'today';

  const pad2 = x => String(x).padStart(2, '0');
  function fmt(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function today() { return fmt(new Date()); }
  function parse(ds) { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); }
  function addDays(ds, n) { const d = parse(ds); d.setDate(d.getDate() + n); return fmt(d); }
  function dayNum(ds) { const [y, m, d] = ds.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5) + 1; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } }
  const S = load();
  S.days = S.days || {}; S.streak = S.streak || 0; S.best = S.best || 0; S.last = S.last || ''; S.played = S.played || 0; S.totalScore = S.totalScore || 0; S.freeze = S.freeze || 0; S.byType = S.byType || {}; S.badges = S.badges || []; S.xp = S.xp || 0; S.lv = S.lv || { stars: {} }; if (S.hints === undefined) S.hints = 3; if (S.snd === undefined) S.snd = true; if (S.hap === undefined) S.hap = true;

  function setBusy(b) { busy = b; if (!b && pendingReload) location.reload(); }
  const app = $('#app');
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function buzz(n) { try { if (S.hap && navigator.vibrate) navigator.vibrate(n); } catch (e) { } }
  let AC;
  function tone(f, d, type, delay, vol) { if (!S.snd) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t0 = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(vol || .1, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + .02); } catch (e) { } }
  function sfx(k) { if (k === 'ok') { tone(660, .14, 'triangle'); tone(990, .2, 'triangle', .09); } else if (k === 'bad') { tone(190, .26, 'sawtooth', 0, .06); } else if (k === 'tap') { tone(520, .05, 'sine', 0, .05); } else if (k === 'lvl') { [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', i * .11)); } else if (k === 'win') { [523, 659, 784].forEach((f, i) => tone(f, .18, 'triangle', i * .09)); } }
  const TITLES = ['Rookie', 'Thinker', 'Solver', 'Sharp', 'Ace', 'Whiz', 'Master', 'Champion', 'Legend'];
  function levelOf(xp) { let l = 1, need = 80; while (xp >= need) { xp -= need; l++; need = 80 + 25 * (l - 1); } return { lvl: l, into: xp, need, title: TITLES[Math.min(l - 1, TITLES.length - 1)] }; }
  function confetti(n) { const cols = ['#ff6b8b', '#ffd23f', '#22c55e', '#3b82f6', '#a78bfa', '#ff7a45']; const box = document.createElement('div'); box.className = 'confetti'; for (let i = 0; i < (n || 40); i++) { const p = document.createElement('i'); p.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 6]};--dx:${(Math.random() * 160 - 80).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;animation-delay:${(Math.random() * .25).toFixed(2)}s;animation-duration:${(1.1 + Math.random() * .8).toFixed(2)}s`; box.appendChild(p); } document.body.appendChild(box); setTimeout(() => box.remove(), 2400); }
  function floatXp(txt, cls) { const f = el(`<div class="xpf ${cls || ''}">${esc(txt)}</div>`); document.body.appendChild(f); setTimeout(() => f.remove(), 1200); }
  function levelUp(info, done) { sfx('lvl'); buzz([20, 30, 40]); confetti(60); const o = el(`<div class="ov"><div class="ovc"><p class="eyebrow w">Level up</p><div class="lvbig">${info.lvl}</div><h2>${info.title}</h2><p class="sub w">Keep it going.</p><button class="btn light" id="ovok">Nice</button></div></div>`); document.body.appendChild(o); o.querySelector('#ovok').onclick = () => { o.remove(); done(); }; }
  function xpBar(compact) { const L = levelOf(S.xp); return `<div class="lvl${compact ? ' c' : ''}"><span class="lvn">Lv ${L.lvl}</span><div class="xpb"><u style="width:${Math.round(L.into / L.need * 100)}%"></u></div><span class="xpt">${L.into}/${L.need} XP</span></div>`; }
  let combo = 0, curDay = null, lvlUpInfo = null;
  function playing(on) { document.body.classList.toggle('playing', !!on); }
  document.body.classList.add('game');

  /* ---------- shell: bottom tabs ---------- */
  const ICONS = {
    today: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    practice: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-7"/></svg>',
    levels: '<svg viewBox="0 0 24 24"><path d="M5 20c0-4 14-3 14-8S8 9 12 4"/><circle cx="5" cy="20" r="1.6"/><circle cx="12" cy="4" r="1.6"/></svg>',
    learn: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13"/></svg>'
  };
  const nav = el('<nav class="tabs" aria-label="Main"></nav>');
  [['today', 'Home'], ['levels', 'Levels'], ['practice', 'Practice'], ['stats', 'Stats'], ['learn', 'Learn']].forEach(([k, label]) => {
    const b = el(`<button data-t="${k}" aria-label="${label}">${ICONS[k]}<span>${label}</span></button>`);
    b.onclick = () => { if (busy && !confirm('Leave this puzzle? Your progress on it will be lost.')) return; go(k); };
    nav.appendChild(b);
  });
  document.body.appendChild(nav);
  function markTab() { nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); }
  function go(k) { tab = k; document.body.classList.toggle('tab-learn', k === 'learn'); combo = 0; setBusy(false); playing(false); markTab(); ({ today: viewToday, levels: viewLevels, practice: viewPractice, stats: viewStats, learn: viewLearn })[k](); window.scrollTo(0, 0); }

  /* ---------- Today ---------- */
  function streakNow() { const t = today(); if (S.last === t || S.last === addDays(t, -1)) return S.streak; if (S.last === addDays(t, -2) && S.freeze > 0) return S.streak; return 0; }

  function viewToday() {
    const t = today(), n = dayNum(t), day = S.days[t], hday = S.days[t + 'h'];
    const done = day && day.done, st = streakNow();
    app.innerHTML = '';
    const prog = [0, 1, 2, 3, 4].map(k => { const r = day && day.res ? day.res[k] : undefined; return '<i class="' + (r === 2 ? 'ok' : r === 1 ? 'half' : r === 0 ? 'bad' : (!done && day && day.i === k ? 'cur' : '')) + '"></i>'; }).join('');
    app.appendChild(el(`<section class="home">
      <div class="hbar">${xpBar()}<button class="ibtn" id="snd" aria-label="Sound ${S.snd ? 'on' : 'off'}">${S.snd ? '🔊' : '🔇'}</button></div>
      <div class="orb"><span class="lvo">${nextLevel()}</span></div>
      <p class="eyebrow w c">Level ${nextLevel()}${isBoss(nextLevel()) ? ' · Boss' : ''}</p>
      <button class="play" id="go">Play</button>
      <p class="hint">${st ? '🔥 ' + st + ' day streak · ' : ''}★ ${totalStars()} · 💡 ${S.hints}${done ? ' · next daily in <b id="cd"></b>' : ''}</p>
      <div class="mini m3"><button class="tile t3" id="dly"><b>📅 Daily</b><span>${done ? day.score + '/5 done' : (day && day.i > 0 ? 'Continue' : '5 puzzles')}</span></button><button class="tile t1" id="hard"><b>⚡ Hard</b><span>${hday && hday.done ? hday.score + '/5 done' : (hday && hday.i > 0 ? 'Continue' : 'Daily')}</span></button><button class="tile t2" id="prac"><b>🎯 Practice</b><span>Endless</span></button></div>
    </section>`));
    $('#go').onclick = () => { sfx('tap'); playLevel(nextLevel()); };
    $('#dly').onclick = () => { sfx('tap'); daily(false, t); };
    $('#hard').onclick = () => { sfx('tap'); daily(true, t); };
    $('#prac').onclick = () => { sfx('tap'); go('practice'); };
    $('#snd').onclick = () => { S.snd = !S.snd; save(S); sfx('tap'); viewToday(); };
    countdown();
  }

  /* ---------- Levels ---------- */
  const LTYPES = [['seq', 1], ['odd', 2], ['math', 3], ['letters', 5], ['order', 7], ['grid', 9], ['ops', 12], ['shapes', 15]];
  function isBoss(L) { return L >= 10 && L % 5 === 0; }
  function nextLevel() { let L = 1; while (S.lv.stars[L]) L++; return L; }
  function totalStars() { return Object.keys(S.lv.stars).reduce((q, k) => q + S.lv.stars[k], 0); }
  function levelPuzzles(L) {
    const av = LTYPES.filter(x => x[1] <= L), intro = LTYPES.filter(x => x[1] === L)[0];
    const out = [];
    for (let k = 0; k < 3; k++) {
      let kind = av[(L * 3 + k * 2 + Math.floor(L / 3)) % av.length][0];
      if (k === 2 && intro) kind = intro[0];
      if (k === 2 && isBoss(L)) kind = 'sudoku';
      const hard = L >= 70 ? true : L >= 40 ? (L + k) % 3 !== 0 : L >= 15 ? (L + k) % 3 === 0 : (isBoss(L) && L >= 25);
      const pz = BL.practice('level|' + L + '|' + k, kind, hard, L <= 6); if (k === 2 && intro && !isBoss(L)) pz.isNew = true; if (L === 1 && k === 0) pz.coach = 'Find the pattern, then tap the number that comes next.'; if (L === 2 && k === 0) pz.coach = 'Two out of three right clears a level. Stars come from clean answers.';
      out.push(pz);
    }
    return out;
  }
  function playLevel(L) {
    const ps = levelPuzzles(L), res = []; curDay = null; let i = 0;
    (function step() {
      showPuzzle(ps[i], dots(res, i, 3), (isBoss(L) ? '👑 ' : '') + 'Level ' + L + ' · ' + (i + 1) + '/3', score => { res[i] = score; i++; if (i >= 3) levelDone(L, res); else step(); }, false, () => go('today'));
    })();
  }
  function levelDone(L, res) {
    setBusy(false); playing(false);
    const right = res.filter(r => r === 2).length, okc = res.filter(r => r >= 1).length, pass = okc >= 2, stars = pass ? Math.max(1, right) : 0, prev = S.lv.stars[L] || 0; let gotHint = false;
    let bonus = 0, up = null;
    if (pass) { if (stars > prev) { bonus = 15 + 10 * (stars - prev) + (isBoss(L) && !prev ? 40 : 0); const bef = levelOf(S.xp).lvl; S.xp += bonus; if (levelOf(S.xp).lvl > bef) up = levelOf(S.xp); S.lv.stars[L] = stars; if (stars === 3) { S.hints++; gotHint = true; } } }
    save(S); awardBadges();
    const nl = nextLevel();
    app.innerHTML = '';
    app.appendChild(el(`<section class="hero2 tall win"><p class="eyebrow w">${isBoss(L) ? 'Boss level ' : 'Level '}${L}</p>
      <h1>${pass ? (stars === 3 ? 'Perfect!' : 'Level clear!') : 'So close!'}</h1>
      <div class="stars">${[0, 1, 2].map(k => `<b class="${k < stars ? 'on' : ''}" style="animation-delay:${k * .2}s">★</b>`).join('')}</div>
      <p class="sub w">${pass ? (bonus ? '+' + bonus + ' bonus XP' + (gotHint ? ' · +1 💡 hint' : '') : 'Already cleared. Go for 3 stars.') : 'You need 2 of 3. Hints count, but only clean answers earn stars.'}</p>
      ${xpBar(true)}
      <div class="acts col">${pass ? `<button class="btn light big" id="nl">Level ${nl}</button>` : `<button class="btn light big" id="rt">Retry</button>`}<button class="btn ghost" id="mp">Map</button>${pass && stars < 3 ? '<button class="btn ghost" id="rt">Retry for 3 stars</button>' : ''}</div></section>`));
    sfx(pass ? 'win' : 'bad'); if (pass) confetti(stars === 3 ? 70 : 35);
    if (up) setTimeout(() => levelUp(up, () => { }), 900);
    const nlb = $('#nl'); if (nlb) nlb.onclick = () => { sfx('tap'); playLevel(nl); };
    const rtb = $('#rt'); if (rtb) rtb.onclick = () => { sfx('tap'); playLevel(L); };
    $('#mp').onclick = () => go('levels');
    window.scrollTo(0, 0);
  }
  function viewLevels() {
    const cur = nextLevel(), top = Math.max(12, cur + 6); app.innerHTML = '';
    const GAP = 128, PAD = 90, H = top * GAP + PAD * 2;
    const sec = el(`<section class="map"><div class="hbar">${xpBar()}<span class="hintc">💡 ${S.hints}</span></div><div class="mapin" style="height:${H}px"><svg class="mpath" width="100%" height="${H}"></svg></div></section>`);
    const inn = sec.querySelector('.mapin'), pts = [];
    for (let L = 1; L <= top; L++) {
      const st = S.lv.stars[L] || 0, open = L <= cur, boss = isBoss(L);
      const x = Math.round(Math.sin(L * 0.85) * 70), y = H - PAD - (L - 1) * GAP;
      pts.push([x, y]);
      if (L === 1 || (L - 1) % 10 === 0) inn.appendChild(el(`<div class="world" style="top:${y + 70}px">World ${Math.floor((L - 1) / 10) + 1}</div>`));
      const n = el(`<div class="lrow" style="top:${y - 40}px;left:calc(50% + ${x}px)">${L === cur ? '<div class="you">YOU</div>' : ''}<button class="node${L === cur ? ' cur' : ''}${st ? ' done' : ''}${boss ? ' boss' : ''}${open ? '' : ' lock'}" ${open ? '' : 'disabled'} aria-label="Level ${L}${open ? '' : ' locked'}">${open ? (boss ? '👑' : L) : '🔒'}</button><div class="nst">${[0, 1, 2].map(k => `<b class="${k < st ? 'on' : ''}">★</b>`).join('')}</div></div>`);
      if (open) n.querySelector('.node').onclick = () => { sfx('tap'); playLevel(L); };
      inn.appendChild(n);
    }
    app.appendChild(sec);
    const W = inn.clientWidth || 376, svg = sec.querySelector('.mpath');
    svg.innerHTML = '<polyline fill="none" stroke="rgba(255,255,255,.22)" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 14" points="' + pts.map(p => (W / 2 + p[0]) + ',' + p[1]).join(' ') + '"/>';
    const c = sec.querySelector('.node.cur'); if (c) setTimeout(() => c.scrollIntoView({ block: 'center' }), 30);
  }

  /* ---------- Practice ---------- */
  function viewPractice() {
    app.innerHTML = '';
    app.appendChild(el(`<section class="card"><h1 class="h1s">Practice</h1><p class="sub">Endless extra puzzles. Pick a type.</p>
      <div class="chips">
        <button class="chip" data-k="seq">Sequences</button><button class="chip" data-k="letters">Letters</button><button class="chip" data-k="order">Logic</button>
        <button class="chip" data-k="odd">Odd one out</button><button class="chip" data-k="grid">Number grid</button><button class="chip" data-k="shapes">Shape math</button>
        <button class="chip" data-k="math">Mental math</button><button class="chip" data-k="ops">Missing signs</button><button class="chip" data-k="sudoku">Mini sudoku</button><button class="chip" data-k="">Mixed</button>
      </div><label class="tg"><input type="checkbox" id="hp"${S.hp ? ' checked' : ''}> Hard mode</label></section>`));
    $('#hp').onchange = e => { S.hp = e.target.checked; save(S); };
    app.querySelectorAll('.chip').forEach(b => b.onclick = () => practice(b.dataset.k, 0));
  }

  /* ---------- Stats + archive ---------- */
  function viewStats() {
    const t = today(); const done = Object.keys(S.days).filter(k => !k.endsWith('h') && S.days[k].done);
    const dist = [0, 0, 0, 0, 0, 0]; done.forEach(k => dist[Math.min(5, Math.floor(S.days[k].score))]++);
    const mx = Math.max(1, ...dist);
    app.innerHTML = '';
    app.appendChild(el(`<section class="card"><h2>Settings</h2><label class="tg"><input type="checkbox" id="osnd"${S.snd ? ' checked' : ''}> Sound effects</label><label class="tg"><input type="checkbox" id="ohap"${S.hap ? ' checked' : ''}> Vibration</label>${!(window.matchMedia && matchMedia('(display-mode: standalone)').matches) ? '<p class="sub" style="margin-top:12px">Tip: use your browser menu, Add to Home Screen. It then opens like an app, works offline and updates itself.</p>' : ''}</section>`));
    $('#osnd').onchange = e => { S.snd = e.target.checked; save(S); sfx('ok'); }; $('#ohap').onchange = e => { S.hap = e.target.checked; save(S); buzz(30); };
    app.appendChild(el(`<section class="card"><h1 class="h1s">Your stats</h1><div class="stats">
      <div class="stat"><b>${streakNow()}</b><span>Streak</span></div><div class="stat"><b>${S.best}</b><span>Best</span></div>
      <div class="stat"><b>${S.played}</b><span>Sets</span></div><div class="stat"><b>${S.played ? (S.totalScore / S.played).toFixed(1) : '0'}</b><span>Avg /5</span></div></div>
      <p class="sub">Streak freeze: <b>${S.freeze}</b>. Every 7-day streak earns one (max 1). It covers one missed day so a busy day does not wipe your streak.</p></section>`));
    { const wkd = []; for (let i = 6; i >= 0; i--) { const d = addDays(t, -i); [d, d + 'h'].forEach(k => { const x = S.days[k]; if (x && x.done) wkd.push({ k, s: x.score }); }); }
      if (wkd.length) { const tot = wkd.reduce((q, x) => q + x.s, 0), n = wkd.length, best = Math.max.apply(null, wkd.map(x => x.s)), hard = wkd.filter(x => x.k.endsWith('h')).length;
        const txt = 'My Brainloop week: ' + n + ' set' + (n > 1 ? 's' : '') + ', average ' + (tot / n).toFixed(1) + '/5' + (hard ? ', ' + hard + ' hard' : '') + '. 🔥 ' + S.streak + ' day streak\n' + PUBLIC_URL;
        const c = el(`<section class="card"><h2>Your week</h2><div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><b>${n}</b><span>Sets</span></div><div class="stat"><b>${(tot / n).toFixed(1)}</b><span>Avg /5</span></div><div class="stat"><b>${best}</b><span>Best</span></div></div><button class="btn" id="wkshare">Copy week recap</button></section>`);
        c.querySelector('#wkshare').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Recap copied'), () => toast('Copy not available')); }; app.appendChild(c); } }
    const NAMES = { seq: 'Number sequences', letters: 'Letter sequences', order: 'Logic', odd: 'Odd one out', grid: 'Number grids', shapes: 'Shape math', math: 'Mental math', ops: 'Missing signs', sudoku: 'Mini sudoku' };
    const rows = Object.keys(NAMES).filter(k => S.byType[k] && S.byType[k].n).map(k => ({ k, n: S.byType[k].n, pct: Math.round(S.byType[k].ok / S.byType[k].n * 100) })).sort((x, y) => y.pct - x.pct);
    if (rows.length) app.appendChild(el(`<section class="card"><h2>By puzzle type</h2><p class="sub">First-try accuracy. ${rows.length > 1 ? 'Strongest: <b>' + NAMES[rows[0].k] + '</b>. To practice: <b>' + NAMES[rows[rows.length - 1].k] + '</b>.' : ''}</p><div class="dist">${rows.map(r => `<div><u style="width:${Math.max(4, r.pct)}%"></u><em>${r.pct}% · ${NAMES[r.k]} (${r.n})</em></div>`).join('')}</div></section>`));
    app.appendChild(el(`<section class="card"><h2>Badges</h2><div class="chips">${BADGES.map(b => `<span class="badge${S.badges.indexOf(b[0]) >= 0 ? ' on' : ''}">${b[1]}</span>`).join('')}</div></section>`));
    app.appendChild(el(`<section class="card"><h2>Scores</h2><div class="dist">${dist.map((c, i) => `<div><span>${i}</span><u style="width:${Math.max(4, c / mx * 100)}%"></u><em>${c}</em></div>`).join('')}</div></section>`));
    const cal = []; const first = addDays(t, -27);
    const off = (parse(first).getDay() + 6) % 7; for (let i = 0; i < off; i++) cal.push('<i class="e"></i>');
    for (let i = 27; i >= 0; i--) { const d = addDays(t, -i), x = S.days[d], past = dayNum(d) >= 1; const cls = x && x.done ? (x.score >= 4 ? 'ok' : x.score >= 2.5 ? 'half' : 'bad') : (past ? 'open' : 'e'); cal.push(`<button class="${cls}${d === t ? ' now' : ''}" data-d="${d}" aria-label="${d}">${parse(d).getDate()}</button>`); }
    app.appendChild(el(`<section class="card"><h2>Archive</h2><p class="sub">Play any past set for free. Past sets do not change your streak.</p><div class="cal"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>${cal.join('')}</div></section>`));
    app.querySelectorAll('.cal button').forEach(b => b.onclick = () => { const d = b.dataset.d; if (d === t) { go('today'); return; } daily(false, d); });
  }

  /* ---------- Learn ---------- */
  function viewLearn() {
    app.innerHTML = '';
    const items = [['sequences.html', 'Number sequences', 'Find the rule fast'], ['letter-sequences.html', 'Letter sequences', 'Count places in the alphabet'], ['logic-puzzles.html', 'Logic ordering', 'Build a chain from clues'], ['odd-one-out.html', 'Odd one out', 'Spot the rule that breaks'], ['number-grids.html', 'Number grids', 'Read the rule across rows'], ['shape-equations.html', 'Shape math', 'Solve for each symbol'], ['mini-sudoku.html', 'Mini sudoku', 'Rules and a clean method'], ['mental-math.html', 'Mental math', 'Simple methods that work'], ['missing-signs.html', 'Missing signs', 'Find the operators'], ['order-of-operations.html', 'Order of operations', 'Why times comes first'], ['solve-puzzles-faster.html', 'Solve puzzles faster', 'Seven simple habits'], ['daily-puzzle-habit.html', 'Build a daily puzzle habit', 'Make five minutes stick'], ['brain-training-faq.html', 'Does brain training work?', 'An honest FAQ']];
    app.appendChild(el('<section class="card"><h1 class="h1s">Learn</h1><p class="sub">Short guides with worked examples.</p><div class="list">' + items.map(i => `<a href="${i[0]}"><b>${i[1]}</b><span>${i[2]}</span></a>`).join('') + '</div></section>'));
  }

  /* ---------- Sets ---------- */
  function dots(results, i, n) {
    return '<div class="dots">' + Array.from({ length: n || 5 }, (_, q) => q).map(k => { const r = results[k]; const c = r === 2 ? 'ok' : r === 1 ? 'half' : r === 0 ? 'bad' : (k === i ? 'cur' : ''); return '<i class="' + c + '"></i>'; }).join('') + '</div>';
  }
  function daily(hard, date) {
    const t = today(), key = hard ? date + 'h' : date; const set = BL.dailySet(date, hard);
    const day = S.days[key] = S.days[key] || { i: 0, res: [], done: false };
    if (day.done) return summary(date, hard);
    const isArchive = date !== t; curDay = day;
    showPuzzle(set[day.i], dots(day.res, day.i), (isArchive ? 'Archive · ' : '') + (hard ? 'Hard · ' : '') + `Puzzle ${day.i + 1} of 5`, score => {
      day.res[day.i] = score; day.i++;
      if (day.i >= 5) finishDay(date, day, hard, isArchive);
      save(S); if (day.done) { awardBadges(); summary(date, hard); } else daily(hard, date);
    }, false);
  }
  function finishDay(t, day, hard, isArchive) {
    day.done = true;
    { const bef = levelOf(S.xp).lvl; const bonus = (hard ? 40 : 20) + (day.res.every(r => r === 2) ? 30 : 0); S.xp += bonus; day.xp = (day.xp || 0) + bonus; day.bonus = bonus; if (levelOf(S.xp).lvl > bef) day.lvlUp = levelOf(S.xp); }
    const pts = day.res.reduce((a, r) => a + (r === 2 ? 1 : r === 1 ? 0.5 : 0), 0);
    day.score = pts;
    if (hard) { S.hardPlayed = (S.hardPlayed || 0) + 1; S.hardTotal = (S.hardTotal || 0) + pts; return; }
    S.played++; S.totalScore += pts;
    if (isArchive) return;
    if (S.last === addDays(t, -1)) S.streak++;
    else if (S.last === addDays(t, -2) && S.freeze > 0) { S.freeze--; S.streak++; }
    else if (S.last !== t) S.streak = 1;
    S.last = t; S.best = Math.max(S.best, S.streak);
    if (S.streak > 0 && S.streak % 7 === 0) S.freeze = Math.min(1, S.freeze + 1);
  }
  const BADGES = [['first', 'First set', () => S.played >= 1], ['s3', '3-day streak', () => S.best >= 3], ['s7', '7-day streak', () => S.best >= 7], ['s14', '14-day streak', () => S.best >= 14], ['s30', '30-day streak', () => S.best >= 30],
    ['p10', '10 sets', () => S.played >= 10], ['p50', '50 sets', () => S.played >= 50], ['perf', 'Perfect set', () => Object.keys(S.days).some(k => !k.endsWith('h') && S.days[k].score === 5)], ['hard', 'Hard set 5/5', () => Object.keys(S.days).some(k => k.endsWith('h') && S.days[k].score === 5)], ['hard3', '3 hard sets', () => (S.hardPlayed || 0) >= 3]];
  function awardBadges() { const fresh = BADGES.filter(b => b[2]() && S.badges.indexOf(b[0]) < 0); fresh.forEach(b => S.badges.push(b[0])); save(S); if (fresh.length) setTimeout(() => toast('Badge earned: ' + fresh[0][1]), 500); }

  function summary(t, hard) {
    setBusy(false); playing(false); combo = 0;
    const day = S.days[hard ? t + 'h' : t]; const n = dayNum(t); const isToday = t === today();
    const sq = day.res.map(r => `<i class="${r === 2 ? 'ok' : r === 1 ? 'half' : 'bad'}"></i>`).join('');
    const stars = day.score >= 5 ? 3 : day.score >= 3.5 ? 2 : day.score >= 2 ? 1 : 0;
    app.innerHTML = '';
    app.appendChild(el(`<section class="hero2 tall win"><p class="eyebrow w">${hard ? 'Hard set' : 'Daily set'} #${n}</p>
      <div class="stars">${[0, 1, 2].map(k => `<b class="${k < stars ? 'on' : ''}" style="animation-delay:${k * .18}s">★</b>`).join('')}</div>
      <h1 class="big">${day.score}<small>/5</small></h1>
      <p class="sq">${sq}</p>
      <p class="xpgain">+${day.xp || 0} XP${hard || !isToday ? '' : ' · 🔥 ' + S.streak + ' day streak'}</p>
      ${xpBar(true)}
      <div class="acts"><button class="btn light big" id="share">Share card</button><button class="btn ghost" id="copy">Copy text</button><button class="btn ghost" id="back">Home</button></div>
      ${isToday ? '<p class="sub w next">Next set in <b id="cd"></b></p>' : ''}</section>`));
    if (day.score >= 4) { sfx('win'); confetti(day.score === 5 ? 70 : 40); }
    if (day.lvlUp) { const L = day.lvlUp; day.lvlUp = null; save(S); setTimeout(() => levelUp(L, () => { }), 900); }
    countdown();
    const url = PUBLIC_URL;
    const em = day.res.map(r => r === 2 ? '🟩' : r === 1 ? '🟨' : '🟥').join('');
    const txt = `${SITE}${hard ? ' Hard' : ''} #${n}  ${day.score}/5\n${em}\n${hard || !isToday ? '' : '🔥 ' + S.streak + ' day streak\n'}${url}`;
    $('#back').onclick = () => go('today');
    $('#copy').onclick = async () => { try { await navigator.clipboard.writeText(txt); toast('Copied. Paste it anywhere.'); } catch (e) { prompt('Copy your result', txt); } };
    $('#share').onclick = async () => {
      try {
        const blob = await card(day, n, hard, isToday ? S.streak : 0);
        const file = new File([blob], 'brainloop-' + t + '.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: txt }); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('Card saved to your downloads.');
      } catch (e) { if (e && e.name === 'AbortError') return; try { await navigator.clipboard.writeText(txt); toast('Copied as text.'); } catch (e2) { } }
    };
    window.scrollTo(0, 0);
  }

  function card(day, n, hard, streak) {
    return new Promise(res => {
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, '#5b52f0'); g.addColorStop(1, '#2a2480'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
      x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(980, 120, 340, 0, 7); x.fill(); x.beginPath(); x.arc(60, 1280, 260, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.font = '700 54px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; x.fillText('Brainloop', 90, 140);
      x.font = '600 36px system-ui,sans-serif'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText((hard ? 'Hard set' : 'Daily set') + ' #' + n, 90, 205);
      x.fillStyle = '#fff'; x.font = '800 340px system-ui,sans-serif'; x.fillText(String(day.score), 90, 640);
      const w = x.measureText(String(day.score)).width; x.font = '700 120px system-ui,sans-serif'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('/5', 100 + w, 640);
      const cols = { 2: '#22c55e', 1: '#facc15', 0: '#ef4444' };
      day.res.forEach((r, i) => { x.fillStyle = cols[r]; rr(x, 90 + i * 180, 740, 150, 150, 32); });
      x.fillStyle = '#fff'; x.font = '600 44px system-ui,sans-serif';
      if (streak) x.fillText(streak + ' day streak', 90, 1010);
      x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '500 38px system-ui,sans-serif'; x.fillText('Five quick puzzles a day. Free, no sign-up.', 90, 1210);
      x.fillStyle = '#fff'; x.font = '700 40px system-ui,sans-serif'; x.fillText(PUBLIC_URL.replace('https://', '').replace(/\/$/, ''), 90, 1275);
      c.toBlob(b => res(b), 'image/jpeg', 0.92);
    });
  }
  function rr(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); x.fill(); }

  let cdT;
  function countdown() {
    clearInterval(cdT); if (!$('#cd')) return;
    const tick = () => { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1); const s = Math.max(0, Math.floor((m - n) / 1000)); const e = $('#cd'); if (!e) { clearInterval(cdT); return; } e.textContent = pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s % 3600 / 60)) + ':' + pad2(s % 60); };
    tick(); cdT = setInterval(tick, 1000);
  }
  function toast(m) { const t = el(`<div class="toast">${esc(m)}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

  function practice(kind, n) {
    const seed = 'practice|' + Date.now() + '|' + n + '|' + Math.random();
    curDay = null; const p = BL.practice(seed, kind, !!S.hp);
    showPuzzle(p, '', 'Practice · puzzle ' + (n + 1) + (S.hp ? ' · hard' : ''), () => practice(kind, n + 1), true, () => go('practice'));
  }

  function showPuzzle(p, dotsHtml, label, onDone, isPractice, onExit) {
    playing(true); app.innerHTML = '';
    const t0 = Date.now(); let tmr;
    const wrap = el(`<section class="puzzle g"><div class="ptop"><button class="x" id="exit" aria-label="Back">✕</button>${dotsHtml || '<div class="dots"></div>'}<span class="cmb" id="cmb"></span></div>
      <div class="pmeta"><span>${esc(label)}${p.isNew ? ' <em class="newb">NEW TYPE</em>' : ''}</span><span id="tm">0s</span></div>
      <h2>${esc(p.title)}</h2><p class="sub">${esc(p.prompt)}</p>${p.coach ? '<div class="coach">💡 ' + esc(p.coach) + '</div>' : ''}<div id="body"></div><div id="fb"></div></section>`);
    app.appendChild(wrap); window.scrollTo(0, 0);
    const showCombo = () => { const c = $('#cmb'); if (c) c.innerHTML = combo >= 2 ? '🔥 x' + combo : ''; }; showCombo();
    tmr = setInterval(() => { const e = $('#tm'); if (!e) { clearInterval(tmr); return; } e.textContent = Math.floor((Date.now() - t0) / 1000) + 's'; }, 500);
    $('#exit').onclick = () => { clearInterval(tmr); setBusy(false); onExit ? onExit() : go('today'); };
    const body = $('#body'), fb = $('#fb'); let hinted = false, hintFn = null;
    function next(score, ok, extra) {
      clearInterval(tmr); const secs = Math.floor((Date.now() - t0) / 1000);
      buzz(ok ? 15 : [30, 40, 30]); sfx(ok ? 'ok' : 'bad');
      { const bt = S.byType[p.type] = S.byType[p.type] || { n: 0, ok: 0 }; bt.n++; if (score === 2) bt.ok++; }
      let gain = 0, note = '';
      if (score === 2) { combo++; gain = 10 + Math.min(combo - 1, 5) * 2; if (secs < 10) { gain += 5; note = ' ⚡'; } } else if (score === 1) { gain = 5; combo = 0; } else combo = 0;
      if (p.hard || S.hp && isPractice) gain = Math.round(gain * 1.5);
      if (gain) { const bef = levelOf(S.xp).lvl; S.xp += gain; const L = levelOf(S.xp); if (L.lvl > bef) lvlUpInfo = L; floatXp('+' + gain + ' XP' + note, ''); if (score === 2) confetti(combo >= 3 ? 36 : 18); }
      if (curDay) curDay.xp = (curDay.xp || 0) + gain;
      save(S); showCombo(); if (!ok) { wrap.classList.remove('shk'); void wrap.offsetWidth; wrap.classList.add('shk'); } const hb = $('#hint'); if (hb) hb.remove();
      fb.innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><b>${ok ? (combo >= 3 ? 'Combo x' + combo + '!' : 'Correct!') : 'Not quite.'}</b> ${esc(extra || p.explain)}</div><button class="btn primary big" id="nx">${isPractice ? 'Next' : 'Continue'}</button>`;
      $('#nx').onclick = () => { sfx('tap'); if (lvlUpInfo) { const L = lvlUpInfo; lvlUpInfo = null; levelUp(L, () => onDone(score)); } else onDone(score); };
      $('#nx').focus(); setTimeout(() => { const n = $('#nx'); n && n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    }
    if (p.type !== 'sudoku') {
      setBusy(false);
      if (p.cells) body.appendChild(el('<div class="g3">' + p.cells.map(c => '<i' + (c === '?' ? ' class="q"' : '') + '>' + esc(c) + '</i>').join('') + '</div>'));
      if (p.show) body.appendChild(el(`<div class="show ${p.type}">${esc(p.show)}</div>`));
      const opts = el(`<div class="opts c${p.cols || 2}"></div>`);
      p.options.forEach(o => {
        const b = el(`<button class="opt">${esc(o)}</button>`); b.onpointerdown = () => sfx('tap');
        b.onclick = () => {
          opts.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.textContent === p.answer) x.classList.add('right'); });
          const ok = o === p.answer; if (!ok) b.classList.add('wrong');
          next(ok ? (hinted ? 1 : 2) : 0, ok);
        };
        opts.appendChild(b);
      });
      body.appendChild(opts);
      hintFn = () => { const wr = [...opts.querySelectorAll('button')].filter(x => x.textContent !== p.answer && !x.disabled); wr.sort(() => Math.random() - .5).slice(0, Math.max(1, Math.min(2, wr.length - 1))).forEach(x => { x.disabled = true; x.classList.add('gone'); }); };
      if (p.coach && L1glow()) { const rb = [...opts.querySelectorAll('button')].find(x => x.textContent === p.answer); if (rb) rb.classList.add('glow'); }
    } else {
      const g = p.grid.map(r => r.slice()); const fixed = p.grid.map(r => r.map(v => v !== 0));
      let sel = null, wrongChecks = 0, finished = false;
      const board = el('<div class="sg"></div>');
      const padEl = el('<div class="pad"></div>');
      const msg = el('<div class="msg" aria-live="polite"></div>');
      function draw() {
        board.innerHTML = '';
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          const b = document.createElement('button');
          b.className = 'cell' + (fixed[r][c] ? ' fx' : '') + (sel && sel[0] === r && sel[1] === c ? ' sel' : '') + (c === 1 ? ' rb' : '') + (r === 1 ? ' bb' : '');
          b.textContent = g[r][c] || '';
          b.setAttribute('aria-label', 'Row ' + (r + 1) + ' column ' + (c + 1) + (g[r][c] ? ', ' + g[r][c] : ', empty'));
          b.onclick = () => { if (finished || fixed[r][c]) return; sel = [r, c]; draw(); };
          board.appendChild(b);
        }
      }
      [1, 2, 3, 4].forEach(v => { const b = el(`<button class="key">${v}</button>`); b.onclick = () => put(v); padEl.appendChild(b); });
      const er = el('<button class="key" aria-label="Erase">⌫</button>'); er.onclick = () => put(0); padEl.appendChild(er);
      function put(v) { if (!sel || finished) return; g[sel[0]][sel[1]] = v; setBusy(g.some((row, r) => row.some((x, c) => !fixed[r][c] && x))); msg.textContent = ''; draw(); }
      const chk = el('<button class="btn primary" id="chk">Check</button>');
      chk.onclick = () => {
        if (finished) return;
        let empty = 0, wrong = 0;
        g.forEach((row, r) => row.forEach((x, c) => { if (!x) empty++; else if (x !== p.solution[r][c]) wrong++; }));
        if (empty) { msg.textContent = empty + ' cell' + (empty > 1 ? 's' : '') + ' still empty.'; return; }
        if (wrong) { wrongChecks++; buzz([30, 40, 30]); msg.textContent = wrong + ' cell' + (wrong > 1 ? 's are' : ' is') + ' wrong. Try again.'; return; }
        finished = true; chk.remove(); setBusy(false);
        next(wrongChecks || hinted ? 1 : 2, true, wrongChecks ? 'Solved after ' + wrongChecks + ' wrong check' + (wrongChecks > 1 ? 's' : '') + '.' : 'Solved with no wrong checks.');
      };
      body.appendChild(board); body.appendChild(padEl); body.appendChild(msg); body.appendChild(chk); draw();
      hintFn = () => { const cells = []; g.forEach((row, r) => row.forEach((x, c) => { if (!fixed[r][c] && x !== p.solution[r][c]) cells.push([r, c]); })); if (!cells.length) return; const [r, c] = cells[Math.floor(Math.random() * cells.length)]; g[r][c] = p.solution[r][c]; fixed[r][c] = true; sel = null; draw(); msg.textContent = 'Hint: one cell filled in.'; };
    }
    if (hintFn) {
      const hb = el(`<button class="hintb" id="hint">💡 Hint <b>${S.hints}</b></button>`); wrap.appendChild(hb);
      hb.onclick = () => { if (hinted || S.hints <= 0) { toast(S.hints <= 0 ? 'No hints left. Earn one with a 3-star level.' : 'One hint per puzzle.'); return; } hinted = true; S.hints--; save(S); hintFn(); sfx('tap'); hb.innerHTML = '💡 Hint used'; hb.disabled = true; };
    }
  }
  function L1glow() { return Object.keys(S.lv.stars).length === 0; }

  // Updates: install once, then update silently. Never reload mid-puzzle.
  if ('serviceWorker' in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(reg => {
      const poke = () => reg.update().catch(() => { });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) poke(); });
      setInterval(poke, 30 * 60 * 1000);
    }).catch(() => { });
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had || reloaded) return; reloaded = true;
      if (busy) { pendingReload = true; } else { sessionStorage.setItem('bl.updated', '1'); location.reload(); }
    });
    if (sessionStorage.getItem('bl.updated')) { sessionStorage.removeItem('bl.updated'); setTimeout(() => toast('Updated to the latest version'), 400); }
  }
  go('today');
})();
