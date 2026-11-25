(function () {
  const $ = s => document.querySelector(s);
  const KEY = 'brainloop.v1';
  const EPOCH = Date.UTC(2026, 10, 25);
  const SITE = 'Brainloop';
  let busy = false, pendingReload = false;

  function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dayNum(ds) { const [y, m, d] = ds.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5) + 1; }
  function yest(ds) { const [y, m, d] = ds.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d - 1)); return t.toISOString().slice(0, 10); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } }
  let S = load();
  S.days = S.days || {}; S.streak = S.streak || 0; S.best = S.best || 0; S.last = S.last || ''; S.played = S.played || 0; S.totalScore = S.totalScore || 0;

  function setBusy(b) { busy = b; if (!b && pendingReload) location.reload(); }
  const app = $('#app');
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function home() {
    setBusy(false);
    const t = today(), n = dayNum(t), day = S.days[t], hday = S.days[t + 'h'];
    const done = day && day.done;
    const streakAlive = S.last === t || S.last === yest(t);
    const streak = streakAlive ? S.streak : 0;
    app.innerHTML = '';
    app.appendChild(el(`<section class="hero">
      <p class="eyebrow">Daily set #${n}</p>
      <h1>${done ? 'Nice work. See you tomorrow.' : 'Five quick puzzles. About five minutes.'}</h1>
      <p class="sub">Number patterns, logic, odd one out, mental math and a mini sudoku. A new set every day, the same for everyone.</p>
      <button class="btn primary" id="go">${done ? 'Review today\'s result' : (day && day.i > 0 ? 'Continue today\'s set' : 'Start today\'s set')}</button>
      <button class="btn" id="hard">${hday && hday.done ? 'Hard set: ' + hday.score + '/5' : 'Hard set'}</button>
      ${done ? '<p class="sub next">Next set in <b id="cd"></b></p>' : ''}
    </section>`));
    app.appendChild(el(`<section class="stats">
      <div class="stat"><b>${streak}</b><span>Day streak</span></div>
      <div class="stat"><b>${S.best}</b><span>Best streak</span></div>
      <div class="stat"><b>${S.played}</b><span>Sets played</span></div>
      <div class="stat"><b>${S.played ? (S.totalScore / S.played).toFixed(1) : '0'}</b><span>Avg score /5</span></div>
    </section>`));
    app.appendChild(el(`<section class="card"><h2>Practice</h2><p class="sub">Endless extra puzzles. Pick a type.</p>
      <div class="chips">
        <button class="chip" data-k="seq">Sequences</button><button class="chip" data-k="letters">Letters</button><button class="chip" data-k="order">Logic</button>
        <button class="chip" data-k="odd">Odd one out</button><button class="chip" data-k="grid">Number grid</button><button class="chip" data-k="shapes">Shape math</button>
        <button class="chip" data-k="math">Mental math</button><button class="chip" data-k="sudoku">Mini sudoku</button><button class="chip" data-k="">Mixed</button>
      </div><label class="tg"><input type="checkbox" id="hp"${S.hp ? ' checked' : ''}> Hard mode</label></section>`));
    app.appendChild(el(`<section class="card"><h2>Learn the tricks</h2><p class="sub">Short guides to each puzzle type, with worked examples.</p>
      <p class="links"><a href="sequences.html">Number sequences</a><a href="logic-puzzles.html">Logic puzzles</a><a href="mini-sudoku.html">Mini sudoku</a><a href="mental-math.html">Mental math</a><a href="brain-training-faq.html">Does brain training work?</a></p></section>`));
    $('#go').onclick = () => daily(false);
    $('#hard').onclick = () => daily(true);
    countdown();
    $('#hp').onchange = e => { S.hp = e.target.checked; save(S); };
    app.querySelectorAll('.chip').forEach(b => b.onclick = () => practice(b.dataset.k, 0));
    window.scrollTo(0, 0);
  }

  function dots(results, i) {
    return '<div class="dots">' + [0, 1, 2, 3, 4].map(k => {
      const r = results[k]; const c = r === 2 ? 'ok' : r === 1 ? 'half' : r === 0 ? 'bad' : (k === i ? 'cur' : '');
      return '<i class="' + c + '"></i>';
    }).join('') + '</div>';
  }

  function daily(hard) {
    const t = today(), key = hard ? t + 'h' : t; const set = BL.dailySet(t, hard);
    const day = S.days[key] = S.days[key] || { i: 0, res: [], done: false };
    if (day.done) return summary(t, hard);
    showPuzzle(set[day.i], dots(day.res, day.i), (hard ? 'Hard · ' : '') + `Puzzle ${day.i + 1} of 5`, score => {
      day.res[day.i] = score; day.i++;
      if (day.i >= 5) finishDay(t, day, hard);
      save(S); if (day.done) summary(t, hard); else daily(hard);
    }, false);
  }

  function finishDay(t, day, hard) {
    day.done = true;
    const pts = day.res.reduce((a, r) => a + (r === 2 ? 1 : r === 1 ? 0.5 : 0), 0);
    day.score = pts;
    if (hard) { S.hardPlayed = (S.hardPlayed || 0) + 1; S.hardTotal = (S.hardTotal || 0) + pts; return; }
    S.played++; S.totalScore += pts;
    if (S.last === yest(t)) S.streak++; else if (S.last !== t) S.streak = 1;
    S.last = t; S.best = Math.max(S.best, S.streak);
  }

  function summary(t, hard) {
    setBusy(false);
    const day = S.days[hard ? t + 'h' : t]; const n = dayNum(t);
    const em = day.res.map(r => r === 2 ? '🟩' : r === 1 ? '🟨' : '⬛').join('');
    const txt = `${SITE}${hard ? ' Hard' : ''} #${n}  ${day.score}/5\n${em}\n${hard ? '' : '🔥 ' + S.streak + ' day streak\n'}${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
    app.innerHTML = '';
    app.appendChild(el(`<section class="hero"><p class="eyebrow">${hard ? 'Hard set' : 'Daily set'} #${n}</p><h1>${day.score} out of 5</h1>
      <p class="sq">${day.res.map(r => `<i class="${r === 2 ? 'ok' : r === 1 ? 'half' : 'bad'}"></i>`).join('')}</p><p class="sub">Green: first try. Yellow: sudoku with a wrong check. Red: missed.${hard ? '' : ` Streak: <b>${S.streak}</b> day${S.streak === 1 ? '' : 's'}.`}</p>
      <button class="btn primary" id="share">Share result</button> <button class="btn" id="back">Home</button><p class="sub next">Next set in <b id="cd"></b></p></section>`));
    countdown();
    $('#back').onclick = home;
    $('#share').onclick = async () => {
      try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(txt); toast('Copied. Paste it anywhere.'); } catch (e) { prompt('Copy your result', txt); }
    };
    window.scrollTo(0, 0);
  }

  let cdT;
  function countdown() {
    clearInterval(cdT); const e = $('#cd'); if (!e) return;
    const tick = () => { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1); const s = Math.max(0, Math.floor((m - n) / 1000)); const p = x => String(x).padStart(2, '0'); const el2 = $('#cd'); if (!el2) { clearInterval(cdT); return; } el2.textContent = p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60); };
    tick(); cdT = setInterval(tick, 1000);
  }
  function toast(m) { const t = el(`<div class="toast">${esc(m)}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

  function practice(kind, n) {
    const seed = 'practice|' + Date.now() + '|' + n + '|' + Math.random();
    const p = BL.practice(seed, kind, !!S.hp);
    showPuzzle(p, '', 'Practice · puzzle ' + (n + 1), () => practice(kind, n + 1), true, home);
  }

  function showPuzzle(p, dotsHtml, label, onDone, isPractice, onExit) {
    app.innerHTML = '';
    const wrap = el(`<section class="card puzzle"><div class="top"><button class="link" id="exit">‹ Home</button><span class="eyebrow">${esc(label)}</span></div>${dotsHtml}
      <h2>${esc(p.title)}</h2><p class="sub">${esc(p.prompt)}</p><div id="body"></div><div id="fb"></div></section>`);
    app.appendChild(wrap); window.scrollTo(0, 0);
    $('#exit').onclick = () => { onExit ? onExit() : home(); };
    const body = $('#body'), fb = $('#fb');
    function next(score, ok, extra) {
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
      const pad = el('<div class="pad"></div>');
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
      [1, 2, 3, 4].forEach(v => { const b = el(`<button class="key">${v}</button>`); b.onclick = () => put(v); pad.appendChild(b); });
      const er = el('<button class="key">⌫</button>'); er.onclick = () => put(0); pad.appendChild(er);
      function put(v) { if (!sel || finished) return; g[sel[0]][sel[1]] = v; setBusy(g.some((row, r) => row.some((x, c) => !fixed[r][c] && x))); msg.textContent = ''; draw(); }
      const chk = el('<button class="btn primary" id="chk">Check</button>');
      chk.onclick = () => {
        if (finished) return;
        let empty = 0, wrong = 0;
        g.forEach((row, r) => row.forEach((x, c) => { if (!x) empty++; else if (x !== p.solution[r][c]) wrong++; }));
        if (empty) { msg.textContent = empty + ' cell' + (empty > 1 ? 's' : '') + ' still empty.'; return; }
        if (wrong) { wrongChecks++; msg.textContent = wrong + ' cell' + (wrong > 1 ? 's are' : ' is') + ' wrong. Try again.'; return; }
        finished = true; chk.remove(); setBusy(false);
        next(wrongChecks ? 1 : 2, true, wrongChecks ? 'Solved after ' + wrongChecks + ' wrong check' + (wrongChecks > 1 ? 's' : '') + '.' : 'Solved with no wrong checks.');
      };
      body.appendChild(board); body.appendChild(pad); body.appendChild(msg); body.appendChild(chk); draw();
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
  home();
})();
