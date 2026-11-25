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
  S.days = S.days || {}; S.streak = S.streak || 0; S.best = S.best || 0; S.last = S.last || ''; S.played = S.played || 0; S.totalScore = S.totalScore || 0; S.freeze = S.freeze || 0; S.byType = S.byType || {}; S.badges = S.badges || [];

  function setBusy(b) { busy = b; if (!b && pendingReload) location.reload(); }
  const app = $('#app');
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) { } }
  function playing(on) { document.body.classList.toggle('playing', !!on); }

  /* ---------- shell: bottom tabs ---------- */
  const ICONS = {
    today: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    practice: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-7"/></svg>',
    learn: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13"/></svg>'
  };
  const nav = el('<nav class="tabs" aria-label="Main"></nav>');
  [['today', 'Today'], ['practice', 'Practice'], ['stats', 'Stats'], ['learn', 'Learn']].forEach(([k, label]) => {
    const b = el(`<button data-t="${k}" aria-label="${label}">${ICONS[k]}<span>${label}</span></button>`);
    b.onclick = () => { if (busy && !confirm('Leave this puzzle? Your progress on it will be lost.')) return; go(k); };
    nav.appendChild(b);
  });
  document.body.appendChild(nav);
  function markTab() { nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); }
  function go(k) { tab = k; setBusy(false); playing(false); markTab(); ({ today: viewToday, practice: viewPractice, stats: viewStats, learn: viewLearn })[k](); window.scrollTo(0, 0); }

  /* ---------- Today ---------- */
  function streakNow() { const t = today(); if (S.last === t || S.last === addDays(t, -1)) return S.streak; if (S.last === addDays(t, -2) && S.freeze > 0) return S.streak; return 0; }

  function viewToday() {
    const t = today(), n = dayNum(t), day = S.days[t], hday = S.days[t + 'h'];
    const done = day && day.done, st = streakNow();
    app.innerHTML = '';
    app.appendChild(el(`<section class="hero2">
      <div class="row"><p class="eyebrow w">Daily set #${n}</p><span class="pill">${st} day streak${S.freeze ? ' · 1 freeze' : ''}</span></div>
      <h1>${done ? 'Done for today.' : (day && day.i > 0 ? 'Pick up where you left off.' : 'Five puzzles. A few calm minutes.')}</h1>
      <p class="sub w">${done ? 'You scored ' + day.score + ' out of 5. A new set opens at midnight.' : 'Patterns, logic, numbers and a mini sudoku. Same set for everyone today.'}</p>
      <button class="btn light" id="go">${done ? 'See result' : (day && day.i > 0 ? 'Continue' : 'Start today\'s set')}</button>
      ${done ? '<p class="sub w next">Next set in <b id="cd"></b></p>' : ''}
    </section>`));
    app.appendChild(el(`<section class="card row2"><div><h2>Hard set</h2><p class="sub">Tougher versions of the same five.</p></div>
      <button class="btn" id="hard">${hday && hday.done ? hday.score + '/5' : (hday && hday.i > 0 ? 'Continue' : 'Play')}</button></section>`));
    if (!(window.matchMedia && matchMedia('(display-mode: standalone)').matches) && !S.hideInstall) {
      app.appendChild(el(`<section class="card tip"><div><b>Add to Home Screen</b><p class="sub">Open your browser menu and choose Add to Home Screen. It then opens like an app, works offline and updates itself.</p></div><button class="link" id="hideTip">Got it</button></section>`));
      $('#hideTip').onclick = () => { S.hideInstall = 1; save(S); viewToday(); };
    }
    const wk = [];
    for (let i = 6; i >= 0; i--) { const d = addDays(t, -i), x = S.days[d]; wk.push(`<i class="${x && x.done ? (x.score >= 4 ? 'ok' : x.score >= 2.5 ? 'half' : 'bad') : ''}${i === 0 ? ' now' : ''}"><b>${'SMTWTFS'[parse(d).getDay()]}</b></i>`); }
    app.appendChild(el(`<section class="card"><h2>This week</h2><div class="week">${wk.join('')}</div></section>`));
    $('#go').onclick = () => daily(false, t);
    $('#hard').onclick = () => daily(true, t);
    countdown();
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
    app.appendChild(el(`<section class="card"><h1 class="h1s">Your stats</h1><div class="stats">
      <div class="stat"><b>${streakNow()}</b><span>Streak</span></div><div class="stat"><b>${S.best}</b><span>Best</span></div>
      <div class="stat"><b>${S.played}</b><span>Sets</span></div><div class="stat"><b>${S.played ? (S.totalScore / S.played).toFixed(1) : '0'}</b><span>Avg /5</span></div></div>
      <p class="sub">Streak freeze: <b>${S.freeze}</b>. Every 7-day streak earns one (max 1). It covers one missed day so a busy day does not wipe your streak.</p></section>`));
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
    const items = [['sequences.html', 'Number sequences', 'Find the rule fast'], ['letter-sequences.html', 'Letter sequences', 'Count places in the alphabet'], ['logic-puzzles.html', 'Logic ordering', 'Build a chain from clues'], ['odd-one-out.html', 'Odd one out', 'Spot the rule that breaks'], ['number-grids.html', 'Number grids', 'Read the rule across rows'], ['shape-equations.html', 'Shape math', 'Solve for each symbol'], ['mini-sudoku.html', 'Mini sudoku', 'Rules and a clean method'], ['mental-math.html', 'Mental math', 'Simple methods that work'], ['daily-puzzle-habit.html', 'Build a daily puzzle habit', 'Make five minutes stick'], ['brain-training-faq.html', 'Does brain training work?', 'An honest FAQ']];
    app.appendChild(el('<section class="card"><h1 class="h1s">Learn</h1><p class="sub">Short guides with worked examples.</p><div class="list">' + items.map(i => `<a href="${i[0]}"><b>${i[1]}</b><span>${i[2]}</span></a>`).join('') + '</div></section>'));
  }

  /* ---------- Sets ---------- */
  function dots(results, i) {
    return '<div class="dots">' + [0, 1, 2, 3, 4].map(k => { const r = results[k]; const c = r === 2 ? 'ok' : r === 1 ? 'half' : r === 0 ? 'bad' : (k === i ? 'cur' : ''); return '<i class="' + c + '"></i>'; }).join('') + '</div>';
  }
  function daily(hard, date) {
    const t = today(), key = hard ? date + 'h' : date; const set = BL.dailySet(date, hard);
    const day = S.days[key] = S.days[key] || { i: 0, res: [], done: false };
    if (day.done) return summary(date, hard);
    const isArchive = date !== t;
    showPuzzle(set[day.i], dots(day.res, day.i), (isArchive ? 'Archive · ' : '') + (hard ? 'Hard · ' : '') + `Puzzle ${day.i + 1} of 5`, score => {
      day.res[day.i] = score; day.i++;
      if (day.i >= 5) finishDay(date, day, hard, isArchive);
      save(S); if (day.done) { awardBadges(); summary(date, hard); } else daily(hard, date);
    }, false);
  }
  function finishDay(t, day, hard, isArchive) {
    day.done = true;
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
    setBusy(false); playing(false);
    const day = S.days[hard ? t + 'h' : t]; const n = dayNum(t); const isToday = t === today();
    const sq = day.res.map(r => `<i class="${r === 2 ? 'ok' : r === 1 ? 'half' : 'bad'}"></i>`).join('');
    app.innerHTML = '';
    app.appendChild(el(`<section class="hero2 tall"><p class="eyebrow w">${hard ? 'Hard set' : 'Daily set'} #${n}</p><h1 class="big">${day.score}<small>/5</small></h1>
      <p class="sq">${sq}</p><p class="sub w">Green: first try. Yellow: sudoku with a wrong check. Red: missed.${hard || !isToday ? '' : ` Streak: <b>${S.streak}</b>.`}</p>
      <div class="acts"><button class="btn light" id="share">Share card</button><button class="btn ghost" id="copy">Copy text</button><button class="btn ghost" id="back">Home</button></div>
      ${isToday ? '<p class="sub w next">Next set in <b id="cd"></b></p>' : ''}</section>`));
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
    const p = BL.practice(seed, kind, !!S.hp);
    showPuzzle(p, '', 'Practice · puzzle ' + (n + 1) + (S.hp ? ' · hard' : ''), () => practice(kind, n + 1), true, () => go('practice'));
  }

  function showPuzzle(p, dotsHtml, label, onDone, isPractice, onExit) {
    playing(true); app.innerHTML = '';
    const wrap = el(`<section class="card puzzle"><div class="top"><button class="link" id="exit">‹ Back</button><span class="eyebrow">${esc(label)}</span></div>${dotsHtml}
      <h2>${esc(p.title)}</h2><p class="sub">${esc(p.prompt)}</p><div id="body"></div><div id="fb"></div></section>`);
    app.appendChild(wrap); window.scrollTo(0, 0);
    $('#exit').onclick = () => { setBusy(false); onExit ? onExit() : go('today'); };
    const body = $('#body'), fb = $('#fb');
    function next(score, ok, extra) {
      buzz(ok ? 15 : [30, 40, 30]);
      { const bt = S.byType[p.type] = S.byType[p.type] || { n: 0, ok: 0 }; bt.n++; if (score === 2) bt.ok++; save(S); }
      fb.innerHTML = `<div class="fb ${ok ? 'good' : 'bad'}"><b>${ok ? 'Correct' : 'Not quite'}.</b> ${esc(extra || p.explain)}</div><button class="btn primary" id="nx">${isPractice ? 'Next puzzle' : 'Continue'}</button>`;
      $('#nx').onclick = () => onDone(score);
      $('#nx').focus();
    }
    if (p.type !== 'sudoku') {
      setBusy(false);
      if (p.cells) body.appendChild(el('<div class="g3">' + p.cells.map(c => '<i' + (c === '?' ? ' class="q"' : '') + '>' + esc(c) + '</i>').join('') + '</div>'));
      if (p.show) body.appendChild(el(`<div class="show ${p.type}">${esc(p.show)}</div>`));
      const opts = el(`<div class="opts c${p.cols || 2}"></div>`);
      p.options.forEach(o => {
        const b = el(`<button class="opt">${esc(o)}</button>`);
        b.onclick = () => {
          opts.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.textContent === p.answer) x.classList.add('right'); });
          const ok = o === p.answer; if (!ok) b.classList.add('wrong');
          next(ok ? 2 : 0, ok);
        };
        opts.appendChild(b);
      });
      body.appendChild(opts);
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
        next(wrongChecks ? 1 : 2, true, wrongChecks ? 'Solved after ' + wrongChecks + ' wrong check' + (wrongChecks > 1 ? 's' : '') + '.' : 'Solved with no wrong checks.');
      };
      body.appendChild(board); body.appendChild(padEl); body.appendChild(msg); body.appendChild(chk); draw();
    }
  }

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
