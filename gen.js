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

  function sequence(r, h) {
    const kind = h ? pick(r, ['quad', 'altmul', 'cube', 'primes', 'alt2', 'fib']) : pick(r, ['add', 'mult', 'alt', 'square', 'tri', 'fib', 'addmul']);
    let t = [], why = '';
    if (kind === 'add') { const a = ri(r, 2, 30), d = ri(r, 3, 13); t = [0, 1, 2, 3, 4, 5].map(i => a + d * i); why = 'Each number is ' + d + ' more than the one before.'; }
    else if (kind === 'mult') { const a = ri(r, 1, 4), m = pick(r, [2, 3]); t = [0, 1, 2, 3, 4, 5].map(i => a * Math.pow(m, i)); why = 'Each number is ' + m + ' times the one before.'; }
    else if (kind === 'alt') { const a = ri(r, 3, 20), x = ri(r, 2, 6), y = ri(r, 7, 12); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + (i % 2 ? x : y)); why = 'The step alternates: +' + x + ', +' + y + ', +' + x + ', +' + y + '...'; }
    else if (kind === 'square') { const c = ri(r, 0, 9), s = ri(r, 1, 5); t = [0, 1, 2, 3, 4, 5].map(i => (i + s) * (i + s) + c); why = 'These are square numbers (' + s + '², ' + (s + 1) + '², ' + (s + 2) + '²...)' + (c ? ' plus ' + c : '') + '.'; }
    else if (kind === 'tri') { const a = ri(r, 1, 12); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + i + 1); why = 'The gaps grow by one each time: +2, +3, +4, +5, +6.'; }
    else if (kind === 'fib') { const a = ri(r, 1, 6), b = ri(r, 2, 9); t = [a, b]; for (let i = 2; i < 6; i++) t.push(t[i - 1] + t[i - 2]); why = 'Each number is the sum of the two before it.'; }
    else if (kind === 'quad') { const a = ri(r, 1, 9), b = ri(r, 1, 4), c = ri(r, 1, 3); t = [0, 1, 2, 3, 4, 5].map(i => a + b * i + c * i * i); why = 'The gaps are ' + [1, 2, 3, 4, 5].map(i => t[i] - t[i - 1]).join(', ') + ', and they grow by ' + (2 * c) + ' each time.'; }
    else if (kind === 'altmul') { const a = ri(r, 1, 4), k = ri(r, 2, 5); t = [a]; for (let i = 1; i < 6; i++) t.push(i % 2 ? t[i - 1] * 2 : t[i - 1] + k); why = 'The rule alternates: double, then add ' + k + ', double, then add ' + k + '...'; }
    else if (kind === 'cube') { const c = ri(r, 0, 8), s = ri(r, 1, 3); t = [0, 1, 2, 3, 4, 5].map(i => Math.pow(i + s, 3) + c); why = 'These are cubes (' + s + '³, ' + (s + 1) + '³, ' + (s + 2) + '³...)' + (c ? ' plus ' + c : '') + '.'; }
    else if (kind === 'primes') { const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]; const s = ri(r, 0, 6); t = P.slice(s, s + 6); why = 'These are consecutive prime numbers.'; }
    else if (kind === 'alt2') { const a = ri(r, 2, 9), b = ri(r, 20, 40), x = ri(r, 2, 5), y = ri(r, 2, 6); t = [a, b, a + x, b - y, a + 2 * x, b - 2 * y]; why = 'Two sequences are mixed. The 1st, 3rd and 5th go up by ' + x + '. The 2nd, 4th and 6th go down by ' + y + '.'; }
    else { const a = ri(r, 1, 5), m = 2; const c = pick(r, [1, 2, 3, -1]); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * m + c); why = 'Double the previous number, then ' + (c > 0 ? 'add ' + c : 'subtract ' + (-c)) + '.'; }
    const ans = t[5];
    return { type: 'seq', title: 'Number sequence', prompt: 'What comes next?', show: t.slice(0, 5).join(', ') + ', ?', options: numOptions(r, ans), answer: String(ans), explain: why };
  }

  function ordering(r, h) {
    if (h) {
      const names = shuffle(r, ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay']).slice(0, 5);
      const o = shuffle(r, names), cl = [];
      cl.push(o[0] + ' is taller than ' + o[1] + '.');
      cl.push(o[2] + ' is shorter than ' + o[1] + ' but taller than ' + o[3] + '.');
      cl.push(o[3] + ' is taller than ' + o[4] + '.');
      cl.push(o[4] + ' is the shortest.');
      const qs = [['tallest', 0], ['second tallest', 1], ['in the middle', 2], ['second shortest', 3]]; const q = pick(r, qs);
      const ans = o[q[1]]; const opts = shuffle(r, [ans].concat(shuffle(r, names.filter(x => x !== ans)).slice(0, 3)));
      return { type: 'order', title: 'Logic', prompt: 'Who is ' + (q[0] === 'in the middle' ? 'in the middle' : 'the ' + q[0]) + '?', show: shuffle(r, cl).join(' '), options: opts, answer: ans, explain: 'Build one chain. From tallest to shortest: ' + o.join(', ') + '.' };
    }
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

  function oddOne(r, h) {
    const kind = h ? pick(r, ['digsum', 'pow2', 'pal', 'mult']) : pick(r, ['mult', 'prime', 'square', 'even']);
    let four = [], odd, why = '';
    if (kind === 'mult') { const k = pick(r, [3, 4, 6, 7, 9]); const ms = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]).slice(0, 4).map(m => m * k); do { odd = ri(r, 10, 99); } while (odd % k === 0); four = ms; why = 'All the others are multiples of ' + k + '.'; }
    else if (kind === 'prime') { four = shuffle(r, [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]).slice(0, 4); odd = pick(r, [21, 27, 33, 39, 51, 57, 87, 91]); why = 'All the others are prime. ' + odd + ' is divisible by ' + (odd % 3 === 0 ? 3 : 7) + '.'; }
    else if (kind === 'square') { four = shuffle(r, [4, 9, 16, 25, 36, 49, 64, 81, 100, 121]).slice(0, 4); do { odd = ri(r, 10, 120); } while (Number.isInteger(Math.sqrt(odd))); why = 'All the others are square numbers.'; }
    else if (kind === 'digsum') { const s = pick(r, [9, 10, 11]); const pool = []; for (let n = 12; n < 100; n++) if ((Math.floor(n / 10) + n % 10) === s) pool.push(n); four = shuffle(r, pool).slice(0, 4); do { odd = ri(r, 12, 98); } while ((Math.floor(odd / 10) + odd % 10) === s); why = 'The digits of every other number add up to ' + s + '.'; }
    else if (kind === 'pow2') { four = shuffle(r, [2, 4, 8, 16, 32, 64, 128, 256]).slice(0, 4); do { odd = ri(r, 3, 200); } while ((odd & (odd - 1)) === 0); why = 'All the others are powers of 2 (each is double the one before in the full list).'; }
    else if (kind === 'pal') { four = shuffle(r, [11, 22, 33, 44, 55, 66, 77, 88, 99, 101, 121, 131, 141, 151, 242, 252]).slice(0, 4); do { odd = ri(r, 12, 260); } while (String(odd) === String(odd).split('').reverse().join('')); why = 'All the others read the same forwards and backwards.'; }
    else { four = shuffle(r, [12, 14, 18, 22, 26, 34, 38, 46, 52, 58, 64, 72]).slice(0, 4); odd = pick(r, [13, 17, 19, 23, 27, 35, 39, 45, 51]); why = 'All the others are even numbers.'; }
    return { type: 'odd', title: 'Odd one out', prompt: 'Which number does not belong?', show: '', options: shuffle(r, four.concat([odd])).map(String), answer: String(odd), explain: why, cols: 5 };
  }

  function mental(r, h) {
    const form = h ? 4 + ri(r, 0, 2) : ri(r, 0, 3);
    let txt, ans, why;
    if (form === 4) { const a = ri(r, 12, 29), b = ri(r, 3, 9), c = ri(r, 4, 9), d = ri(r, 3, 9); txt = a + ' × ' + b + ' − ' + c + ' × ' + d; ans = a * b - c * d; why = 'Multiply first: ' + (a * b) + ' − ' + (c * d) + '.'; return { type: 'math', title: 'Mental math', prompt: 'Work it out in your head.', show: txt + ' = ?', options: numOptions(r, ans), answer: String(ans), explain: why }; }
    if (form === 5) { const a = ri(r, 11, 25), b = ri(r, 3, 8), c = ri(r, 2, 6); txt = '(' + a + ' − ' + b + ') × ' + c + ' + ' + a; ans = (a - b) * c + a; why = 'Brackets: ' + (a - b) + '. Then × ' + c + ' = ' + ((a - b) * c) + '. Then + ' + a + '.'; return { type: 'math', title: 'Mental math', prompt: 'Work it out in your head.', show: txt + ' = ?', options: numOptions(r, ans), answer: String(ans), explain: why }; }
    if (form === 6) { const p = ri(r, 2, 9) * 10, q = pick(r, [10, 20, 25, 50]); const base = pick(r, [40, 80, 120, 200, 240]); txt = q + '% of ' + base + ' + ' + p; ans = base * q / 100 + p; why = q + '% of ' + base + ' is ' + (base * q / 100) + ', then add ' + p + '.'; return { type: 'math', title: 'Mental math', prompt: 'Work it out in your head.', show: txt + ' = ?', options: numOptions(r, ans), answer: String(ans), explain: why }; }
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
  function sudoku(r, h) {
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
      if (given <= (h ? 5 : 6)) break;
      const rr = Math.floor(c / 4), cc = c % 4, keep = g[rr][cc];
      g[rr][cc] = 0;
      const test = g.map(x => x.slice());
      if (solve4(test, 2) !== 1) g[rr][cc] = keep; else given--;
    }
    return { type: 'sudoku', title: 'Mini Sudoku', prompt: 'Fill the grid so every row, column and 2×2 box has 1, 2, 3 and 4.', grid: g, solution: sol, explain: 'Each row, column and 2×2 box holds 1 to 4 once.' };
  }


  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function letters(r, h) {
    let idx = [], why = '';
    if (!h) { const k = ri(r, 2, 4), s = ri(r, 0, 25 - 5 * k); idx = [0, 1, 2, 3, 4, 5].map(i => s + k * i); why = 'Each letter is ' + k + ' places after the one before in the alphabet.'; }
    else if (r() < 0.5) { const s = ri(r, 0, 8), x = ri(r, 1, 3), y = ri(r, 3, 5); idx = [s]; for (let i = 1; i < 6; i++) idx.push(idx[i - 1] + (i % 2 ? x : y)); why = 'The jumps alternate: ' + x + ' place' + (x > 1 ? 's' : '') + ', then ' + y + ' places.'; }
    else { const s = ri(r, 0, 4); idx = [s]; for (let i = 1; i < 6; i++) idx.push(idx[i - 1] + i); why = 'The jumps grow by one each time: 1, 2, 3, 4, 5.'; }
    if (idx[5] > 25) return letters(r, h);
    const ans = L[idx[5]]; const set = new Set([ans]); let g = 50;
    while (set.size < 4 && g-- > 0) { const v = idx[5] + pick(r, [-3, -2, -1, 1, 2, 3]); if (v >= 0 && v < 26) set.add(L[v]); }
    return { type: 'letters', title: 'Letter sequence', prompt: 'Which letter comes next?', show: idx.slice(0, 5).map(i => L[i]).join(', ') + ', ?', options: shuffle(r, [...set]), answer: ans, explain: why };
  }
  function shapes(r, h) {
    const a = ri(r, 2, 8), b = ri(r, 2, 8), c = ri(r, 2, 9);
    let rows, ans, ask, why;
    if (!h) {
      rows = ['● + ● + ● = ' + (3 * a), '● + ■ = ' + (a + b), '■ + ▲ = ' + (b + c)]; ans = c + a; ask = '▲ + ● = ?';
      why = '● is ' + a + ' (3 × ' + a + ' = ' + (3 * a) + '). Then ■ is ' + b + ', and ▲ is ' + c + '. So ▲ + ● = ' + ans + '.';
    } else {
      const a2 = ri(r, 2, 6), b2 = ri(r, 2, 6), c2 = ri(r, 2, 9);
      rows = ['● × ● = ' + (a2 * a2), '● × ■ = ' + (a2 * b2), '■ + ▲ = ' + (b2 + c2)]; ans = a2 * c2 + b2; ask = '▲ × ● + ■ = ?';
      why = '● × ● = ' + (a2 * a2) + ' so ● is ' + a2 + '. Then ■ is ' + b2 + ', and ▲ is ' + c2 + '. So ▲ × ● + ■ = ' + ans + '.';
    }
    return { type: 'shapes', title: 'Shape math', prompt: 'Each shape stands for a number. Find the last line.', show: rows.join('\n') + '\n' + ask, options: numOptions(r, ans), answer: String(ans), explain: why };
  }
  function grid(r, h) {
    const rule = h ? pick(r, ['mul', 'lin']) : pick(r, ['add', 'sub']);
    const cells = [], rows = [];
    for (let i = 0; i < 3; i++) {
      let x = ri(r, 2, h ? 9 : 12), y = ri(r, 2, h ? 7 : 12), z;
      if (rule === 'add') z = x + y; else if (rule === 'sub') { x = ri(r, 12, 30); y = ri(r, 2, 11); z = x - y; } else if (rule === 'mul') z = x * y; else z = 2 * x + y;
      rows.push([x, y, z]);
    }
    const ans = rows[2][2]; cells.push(...rows[0], ...rows[1], rows[2][0], rows[2][1], '?');
    const why = { add: 'In each row, the first two numbers add up to the third.', sub: 'In each row, the first number minus the second gives the third.', mul: 'In each row, the first two numbers multiply to give the third.', lin: 'In each row, double the first number and add the second to get the third.' }[rule];
    return { type: 'grid', title: 'Number grid', prompt: 'Find the rule in the rows. What goes in the empty cell?', cells, options: numOptions(r, ans), answer: String(ans), explain: why };
  }

  const makers = { seq: sequence, letters: letters, order: ordering, odd: oddOne, grid: grid, math: mental, shapes: shapes, sudoku: sudoku };
  function dailySet(dateStr, h) {
    const r = rng(hash('brainloop|' + dateStr + (h ? '|hard' : '')));
    const A = r() < 0.5, B = r() < 0.5, C = r() < 0.5;
    return [A ? sequence(r, h) : letters(r, h), ordering(r, h), B ? oddOne(r, h) : grid(r, h), C ? mental(r, h) : shapes(r, h), sudoku(r, h)];
  }
  function practice(seedStr, kind, h) { const r = rng(hash(seedStr)); const ks = Object.keys(makers); return makers[kind && makers[kind] ? kind : pick(r, ks)](r, h); }
  root.BL = { dailySet, practice, hash, rng };
  if (typeof module !== 'undefined') module.exports = root.BL;
})(typeof window !== 'undefined' ? window : globalThis);
