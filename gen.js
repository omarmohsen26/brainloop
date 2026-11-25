/* Brainloop puzzle generators. Pure functions, seeded, no network. */
(function (root) {
  function hash(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function numOptions(r, ans) {
    const set = new Set([ans]);
    const deltas = shuffle(r, [1, 2, 3, 4, 5, 6, 10, 12]);
    let k = 0;
    while (set.size < 4 && k < 60) {
      const d = deltas[k % deltas.length] * (r() < 0.5 ? -1 : 1);
      const v = ans + d + Math.floor(k / deltas.length);
      if (v !== ans && !set.has(v) && v >= 0 === ans >= 0) set.add(v);
      k++;
    }
    let guard = 100;
    while (set.size < 4 && guard-- > 0) set.add(ans + ri(r, 7, 40));
    return shuffle(r, [...set]).map(String);
  }

  function sequence(r) {
    const kind = pick(r, ['add', 'mult', 'alt', 'square', 'tri', 'fib', 'addmul']);
    let t = [], why = '';
    if (kind === 'add') { const a = ri(r, 2, 30), d = ri(r, 3, 13); t = [0, 1, 2, 3, 4, 5].map(i => a + d * i); why = 'Each number is ' + d + ' more than the one before.'; }
    else if (kind === 'mult') { const a = ri(r, 1, 4), m = pick(r, [2, 3]); t = [0, 1, 2, 3, 4, 5].map(i => a * Math.pow(m, i)); why = 'Each number is ' + m + ' times the one before.'; }
    else if (kind === 'alt') { const a = ri(r, 3, 20), x = ri(r, 2, 6), y = ri(r, 7, 12); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + (i % 2 ? x : y)); why = 'The step alternates: +' + x + ', +' + y + ', +' + x + ', +' + y + '...'; }
    else if (kind === 'square') { const c = ri(r, 0, 9), s = ri(r, 1, 5); t = [0, 1, 2, 3, 4, 5].map(i => (i + s) * (i + s) + c); why = 'These are square numbers (' + s + '², ' + (s + 1) + '², ' + (s + 2) + '²...)' + (c ? ' plus ' + c : '') + '.'; }
    else if (kind === 'tri') { const a = ri(r, 1, 12); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + i + 1); why = 'The gaps grow by one each time: +2, +3, +4, +5, +6.'; }
    else if (kind === 'fib') { const a = ri(r, 1, 6), b = ri(r, 2, 9); t = [a, b]; for (let i = 2; i < 6; i++) t.push(t[i - 1] + t[i - 2]); why = 'Each number is the sum of the two before it.'; }
    else { const a = ri(r, 1, 5), m = 2; const c = pick(r, [1, 2, 3, -1]); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * m + c); why = 'Double the previous number, then ' + (c > 0 ? 'add ' + c : 'subtract ' + (-c)) + '.'; }
    const ans = t[5];
    return { type: 'seq', title: 'Number sequence', prompt: 'What comes next?', show: t.slice(0, 5).join(', ') + ', ?', options: numOptions(r, ans), answer: String(ans), explain: why };
  }

  function ordering(r) {
    const names = shuffle(r, ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay']).slice(0, 4);
    const order = shuffle(r, names); // tallest first
    const clues = [];
    for (let i = 0; i < 3; i++) {
      const a = order[i], b = order[i + 1];
      clues.push(r() < 0.5 ? a + ' is taller than ' + b + '.' : b + ' is shorter than ' + a + '.');
    }
    const q = pick(r, ['tallest', 'shortest', 'second tallest', 'second shortest']);
    const ans = q === 'tallest' ? order[0] : q === 'shortest' ? order[3] : q === 'second tallest' ? order[1] : order[2];
    return { type: 'order', title: 'Logic', prompt: 'Who is the ' + q + '?', show: shuffle(r, clues).join(' '), options: shuffle(r, names), answer: ans, explain: 'Put the clues in a chain. From tallest to shortest: ' + order.join(', ') + '.' };
  }

  function oddOne(r) {
    const kind = pick(r, ['mult', 'prime', 'square', 'even']);
    let four = [], odd, why = '';
    if (kind === 'mult') { const k = pick(r, [3, 4, 6, 7, 9]); const ms = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]).slice(0, 4).map(m => m * k); do { odd = ri(r, 10, 99); } while (odd % k === 0); four = ms; why = 'All the others are multiples of ' + k + '.'; }
    else if (kind === 'prime') { four = shuffle(r, [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]).slice(0, 4); odd = pick(r, [21, 27, 33, 39, 51, 57, 87, 91]); why = 'All the others are prime. ' + odd + ' is divisible by ' + (odd % 3 === 0 ? 3 : 7) + '.'; }
    else if (kind === 'square') { four = shuffle(r, [4, 9, 16, 25, 36, 49, 64, 81, 100, 121]).slice(0, 4); do { odd = ri(r, 10, 120); } while (Number.isInteger(Math.sqrt(odd))); why = 'All the others are square numbers.'; }
    else { four = shuffle(r, [12, 14, 18, 22, 26, 34, 38, 46, 52, 58, 64, 72]).slice(0, 4); odd = pick(r, [13, 17, 19, 23, 27, 35, 39, 45, 51]); why = 'All the others are even numbers.'; }
    return { type: 'odd', title: 'Odd one out', prompt: 'Which number does not belong?', show: '', options: shuffle(r, four.concat([odd])).map(String), answer: String(odd), explain: why, cols: 5 };
  }

  function mental(r) {
    const form = ri(r, 0, 3);
    let txt, ans, why;
    if (form === 0) { const a = ri(r, 6, 19), b = ri(r, 3, 9), c = ri(r, 5, 40); txt = a + ' × ' + b + ' + ' + c; ans = a * b + c; why = a + ' × ' + b + ' = ' + (a * b) + ', then add ' + c + '.'; }
    else if (form === 1) { const a = ri(r, 10, 60), b = ri(r, 3, 9), c = ri(r, 2, 9); txt = a + ' + ' + b + ' × ' + c; ans = a + b * c; why = 'Multiply first: ' + b + ' × ' + c + ' = ' + (b * c) + ', then add ' + a + '.'; }
    else if (form === 2) { const a = ri(r, 3, 12), b = ri(r, 3, 12), c = ri(r, 2, 9); txt = '(' + a + ' + ' + b + ') × ' + c; ans = (a + b) * c; why = 'Brackets first: ' + (a + b) + ', then × ' + c + '.'; }
    else { const b = ri(r, 3, 9), q = ri(r, 4, 15), c = ri(r, 5, 30); txt = (b * q) + ' ÷ ' + b + ' + ' + c; ans = q + c; why = (b * q) + ' ÷ ' + b + ' = ' + q + ', then add ' + c + '.'; }
    return { type: 'math', title: 'Mental math', prompt: 'Work it out in your head.', show: txt + ' = ?', options: numOptions(r, ans), answer: String(ans), explain: why };
  }

  function solve4(g, limit) {
    let count = 0;
    function ok(r, c, v) { for (let i = 0; i < 4; i++) { if (g[r][i] === v || g[i][c] === v) return false; } const br = r - r % 2, bc = c - c % 2; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (g[br + i][bc + j] === v) return false; return true; }
    function go() {
      if (count >= limit) return;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 0) { for (let v = 1; v <= 4; v++) if (ok(r, c, v)) { g[r][c] = v; go(); g[r][c] = 0; } return; }
      count++;
    }
    go(); return count;
  }
  function sudoku(r) {
    const base = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) base[i][j] = (2 * (i % 2) + Math.floor(i / 2) + j) % 4 + 1;
    const dm = shuffle(r, [1, 2, 3, 4]);
    const rowOrder = [].concat(...shuffle(r, [0, 1]).map(b => shuffle(r, [0, 1]).map(x => b * 2 + x)));
    const colOrder = [].concat(...shuffle(r, [0, 1]).map(b => shuffle(r, [0, 1]).map(x => b * 2 + x)));
    const sol = rowOrder.map(i => colOrder.map(j => dm[base[i][j] - 1]));
    const g = sol.map(x => x.slice());
    const cells = shuffle(r, [...Array(16).keys()]);
    let given = 16;
    for (const c of cells) {
      if (given <= 6) break;
      const rr = Math.floor(c / 4), cc = c % 4, keep = g[rr][cc];
      g[rr][cc] = 0;
      const test = g.map(x => x.slice());
      if (solve4(test, 2) !== 1) g[rr][cc] = keep; else given--;
    }
    return { type: 'sudoku', title: 'Mini Sudoku', prompt: 'Fill the grid so every row, column and 2×2 box has 1, 2, 3 and 4.', grid: g, solution: sol, explain: 'Each row, column and 2×2 box holds 1 to 4 once.' };
  }

  const makers = { seq: sequence, order: ordering, odd: oddOne, math: mental, sudoku: sudoku };
  function dailySet(dateStr) {
    const r = rng(hash('brainloop|' + dateStr));
    return [sequence(r), ordering(r), oddOne(r), mental(r), sudoku(r)];
  }
  function practice(seedStr, kind) { const r = rng(hash(seedStr)); const ks = Object.keys(makers); return makers[kind && makers[kind] ? kind : pick(r, ks)](r); }
  root.BL = { dailySet, practice, hash, rng };
  if (typeof module !== 'undefined') module.exports = root.BL;
})(typeof window !== 'undefined' ? window : globalThis);
