import os, json
from PIL import Image, ImageDraw
OUT = os.path.dirname(os.path.abspath(__file__))
VERSION = "1.1.0"

CSS = """
:root{--bg:#f6f4ee;--ink:#1d1b2e;--mut:#5d5a70;--card:#fff;--line:#e4e0d4;--acc:#4f46e5;--acc2:#eef0ff;--ok:#16a34a;--bad:#dc2626;--half:#d9a400}
@media(prefers-color-scheme:dark){:root{--bg:#12111c;--ink:#f1effa;--mut:#a9a6bf;--card:#1c1b2b;--line:#2c2a40;--acc:#8b86ff;--acc2:#25234a}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header.bar{display:flex;align-items:center;justify-content:space-between;max-width:560px;margin:0 auto;padding:14px 18px}
.logo{font-weight:800;letter-spacing:-.02em;font-size:20px;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px}
.logo i{width:22px;height:22px;border-radius:7px;background:var(--acc);display:inline-block;position:relative}
.logo i:after{content:"";position:absolute;inset:6px;border:2.5px solid #fff;border-radius:50%;border-right-color:transparent}
nav.top a{color:var(--mut);text-decoration:none;font-size:14px;margin-left:14px}
main,#app{max-width:560px;margin:0 auto;padding:0 18px 40px}
h1{font-size:28px;line-height:1.2;margin:.3em 0 .4em;letter-spacing:-.02em}
h2{font-size:20px;margin:.2em 0 .3em}
h3{font-size:17px;margin:1.2em 0 .3em}
.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc);font-weight:700;margin:0}
.sub{color:var(--mut);margin:.2em 0 1em}
.hero{padding:22px 0 8px}
.btn{font:inherit;font-weight:700;border:1.5px solid var(--line);background:var(--card);color:var(--ink);padding:13px 20px;border-radius:14px;min-height:48px;cursor:pointer}
.btn.primary{background:var(--acc);border-color:var(--acc);color:#fff}
.btn:active,.opt:active,.chip:active,.key:active{transform:scale(.97)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 4px;text-align:center}
.stat b{display:block;font-size:22px}.stat span{font-size:11px;color:var(--mut)}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;margin:14px 0}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font:inherit;font-size:14px;font-weight:600;border:1.5px solid var(--line);background:var(--acc2);color:var(--ink);padding:10px 14px;border-radius:999px;min-height:44px;cursor:pointer}
.links{display:flex;flex-direction:column;gap:2px;margin:0}.links a{color:var(--acc);font-weight:600;text-decoration:none;padding:9px 0;border-bottom:1px solid var(--line)}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.link{font:inherit;background:none;border:0;color:var(--acc);font-weight:700;padding:10px 4px;min-height:44px;cursor:pointer}
.dots{display:flex;gap:6px;margin:4px 0 10px}.dots i{flex:1;height:6px;border-radius:3px;background:var(--line)}
.dots i.ok{background:var(--ok)}.dots i.half{background:var(--half)}.dots i.bad{background:var(--bad)}.dots i.cur{background:var(--acc)}
.show{font-size:24px;font-weight:700;text-align:center;background:var(--acc2);border-radius:14px;padding:18px 12px;margin:6px 0 14px;letter-spacing:.02em;line-height:1.4}
.show.shapes{font-size:22px;white-space:pre-line;line-height:1.7;letter-spacing:.04em}.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0 14px}.g3 i{font-style:normal;font-size:26px;font-weight:700;text-align:center;background:var(--acc2);border-radius:12px;padding:14px 0}.g3 i.q{background:var(--acc);color:#fff}.tg{display:block;margin-top:12px;font-size:14px;color:var(--mut)}.tg input{width:20px;height:20px;vertical-align:middle;margin-right:6px}.next{margin-top:12px}.hero .btn+.btn{margin-left:8px}.show.order{font-size:17px;font-weight:600;text-align:left;letter-spacing:0}
.opts{display:grid;gap:10px}.opts.c2{grid-template-columns:1fr 1fr}.opts.c5{grid-template-columns:repeat(3,1fr)}
.opt{font:inherit;font-size:20px;font-weight:700;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;min-height:58px;cursor:pointer}
.opt.right{border-color:var(--ok);background:rgba(22,163,74,.14)}.opt.wrong{border-color:var(--bad);background:rgba(220,38,38,.12)}
.fb{margin:14px 0;padding:12px 14px;border-radius:12px;font-size:15px}.fb.good{background:rgba(22,163,74,.12)}.fb.bad{background:rgba(220,38,38,.1)}
.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:0;width:min(100%,300px);margin:10px auto;border:2.5px solid var(--ink);border-radius:10px;overflow:hidden}
.cell{font:inherit;font-size:28px;font-weight:700;aspect-ratio:1;border:0;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--card);color:var(--acc);cursor:pointer}
.cell.fx{color:var(--ink);background:var(--acc2)}.cell.sel{outline:3px solid var(--acc);outline-offset:-3px}
.cell.rb{border-right:2.5px solid var(--ink)}.cell.bb{border-bottom:2.5px solid var(--ink)}
.pad{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0}
.key{font:inherit;font-size:20px;font-weight:700;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;min-height:52px;cursor:pointer}
.msg{min-height:24px;color:var(--mut);font-size:14px;text-align:center;margin-bottom:6px}
.sq{display:flex;gap:8px;margin:10px 0}.sq i{width:42px;height:42px;border-radius:10px;background:var(--line)}.sq i.ok{background:var(--ok)}.sq i.half{background:var(--half)}.sq i.bad{background:var(--bad)}.emoji{font-size:30px;letter-spacing:4px;margin:6px 0}
.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:12px 18px;border-radius:12px;font-size:14px;z-index:9}
footer{max-width:560px;margin:10px auto 30px;padding:0 18px;color:var(--mut);font-size:13px}footer a{color:var(--mut);margin-right:12px}
article{padding-top:6px}article p,article li{color:var(--ink)}article .ex{background:var(--acc2);border-radius:12px;padding:12px 14px;margin:10px 0}
a{color:var(--acc)}
button:focus-visible,a:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
"""

NAV = '<header class="bar"><a class="logo" href="./"><i></i>Brainloop</a><nav class="top"><a href="guide.html">Guide</a><a href="about.html">About</a></nav></header>'
FOOT = '<footer><a href="about.html">About</a><a href="guide.html">How to play</a><a href="privacy.html">Privacy</a><a href="brain-training-faq.html">FAQ</a><p>Brainloop is a free daily puzzle game. Puzzles are generated by code, so every one is original.</p></footer>'

def page(slug, title, desc, body):
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title><meta name="description" content="{desc}"><meta name="theme-color" content="#4f46e5">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><link rel="stylesheet" href="style.css"></head>
<body>{NAV}<main><article>{body}</article></main>{FOOT}</body></html>'''
    open(os.path.join(OUT, slug), 'w').write(html)

pages = {}
pages['guide.html'] = ('How to play Brainloop', 'How the daily set works, how scoring and streaks work, and what each puzzle type asks.', '''
<p class="eyebrow">Guide</p><h1>How to play Brainloop</h1>
<p>Brainloop gives you one set of five short puzzles each day. Everyone gets the same set on the same date, so you can compare your result with friends. A set takes about five minutes.</p>
<h2>The five puzzles</h2>
<ul>
<li><b>Number sequence.</b> Find the rule and pick the next number. <a href="sequences.html">Read the sequence guide.</a></li>
<li><b>Logic.</b> A few clues about who is taller or shorter. Put them in order. <a href="logic-puzzles.html">Read the logic guide.</a></li>
<li><b>Odd one out.</b> Five numbers, one breaks the pattern.</li>
<li><b>Mental math.</b> A short sum with the right order of operations. <a href="mental-math.html">Read the math guide.</a></li>
<li><b>Mini sudoku.</b> A 4 by 4 grid using 1 to 4. <a href="mini-sudoku.html">Read the sudoku guide.</a></li>
</ul>
<h2>Scoring</h2>
<p>Each multiple-choice puzzle gives you one point if you pick the right answer. You get one try. For the sudoku, a clean solve with no wrong checks gives one point, and a solve after one or more wrong checks gives half a point. Your daily score is out of five.</p>
<h2>Streaks</h2>
<p>Finish a daily set and your streak goes up by one. Miss a whole day and it resets to one the next time you finish. Your streak and stats are stored only on your own device.</p>
<h2>Practice mode</h2>
<p>When you want more, use Practice on the home screen. Pick one puzzle type or mix them. Practice puzzles are random and do not change your streak.</p>
<h2>Sharing</h2>
<p>After a daily set, tap Share result. You get a short block of colored squares: green for a first-try solve, yellow for a sudoku solved after a wrong check, black for a miss. It does not reveal answers.</p>
<h2>Install it</h2>
<p>Brainloop works in your browser. To add it to your phone, open the browser menu and choose Add to Home Screen. It then opens like an app and keeps itself up to date.</p>
<p>A note on the name of this game: Brainloop is for fun and practice. It is not a clinical or standardized IQ test, and it does not measure your IQ.</p>''')

pages['sequences.html'] = ('Number sequence puzzles: how to find the rule', 'A practical guide to solving number sequence puzzles, with worked examples of the seven common rules.', '''
<p class="eyebrow">Guide</p><h1>Number sequences: how to find the rule</h1>
<p>A number sequence puzzle shows a row of numbers and asks for the next one. Every sequence follows a rule. Your job is to find it. The trick is to check a short list of common rules in a good order.</p>
<h2>Step 1: look at the gaps</h2>
<p>Subtract each number from the next one. If the gaps are all the same, you have an <b>add-the-same-number</b> rule. Example: 7, 12, 17, 22, 27. The gap is always 5, so the next number is 32.</p>
<h2>Step 2: if the gaps change, look at the gaps of the gaps</h2>
<p>If the gaps grow by the same amount each time, you have a <b>growing-gap</b> sequence. Example: 3, 5, 8, 12, 17. The gaps are 2, 3, 4, 5, so the next gap is 6 and the answer is 23. Square numbers also behave this way: the gaps between 1, 4, 9, 16 are 3, 5, 7.</p>
<h2>Step 3: try multiplying</h2>
<p>If the numbers grow very fast, divide each number by the one before it. A constant answer means you have a <b>multiply-by-the-same-number</b> rule. Example: 2, 6, 18, 54, 162. Each is 3 times the one before, so the next is 486. A close cousin is double-then-add: 4, 9, 19, 39, 79. Each number is double the last, plus 1, so the next is 159.</p>
<h2>Step 4: check for two patterns at once</h2>
<p>If the gaps jump back and forth, the step may alternate. Example: 5, 7, 14, 16, 23. The steps go +2, +7, +2, +7, so the next is 25.</p>
<h2>Step 5: check if each number adds up the previous two</h2>
<p>Example: 2, 3, 5, 8, 13. Each number is the sum of the two before it, so the next is 21. This is the Fibonacci pattern.</p>
<div class="ex"><b>Quick checklist:</b> same gap, growing gap, same multiplier, alternating step, sum of the last two. Almost every sequence in Brainloop is one of these five.</div>
<h2>Habits that help</h2>
<ul><li>Write the gaps down. Do not try to see the answer all at once.</li><li>Test your rule on every pair in the sequence, not just the first two.</li><li>When two answers both look right, pick the one that fits the rule on all the numbers.</li></ul>
<p><a href="./">Try today's set</a></p>''')

pages['logic-puzzles.html'] = ('Logic ordering puzzles: how to solve "who is taller" clues', 'Learn a simple method for solving ordering logic puzzles with taller and shorter clues.', '''
<p class="eyebrow">Guide</p><h1>Logic puzzles: ordering clues</h1>
<p>An ordering puzzle gives you short statements like "Ana is taller than Ben." You then answer a question such as "Who is the shortest?" You never have to guess. The clues always give enough information to build a full line.</p>
<h2>Method: build a chain</h2>
<ol><li>Rewrite every clue in the same direction. "Ben is shorter than Cleo" becomes "Cleo is taller than Ben."</li>
<li>Look for a name that appears in two clues. That is where the clues connect.</li>
<li>Link the clues into one line, tallest on the left and shortest on the right.</li>
<li>Read the answer off the line.</li></ol>
<div class="ex"><b>Example.</b> Clues: Dev is shorter than Ana. Eli is shorter than Dev. Fay is taller than Ana.<br>Rewrite: Ana is taller than Dev. Dev is taller than Eli. Fay is taller than Ana.<br>Chain: Fay, Ana, Dev, Eli. The second tallest is Ana. The shortest is Eli.</div>
<h2>Common mistakes</h2>
<ul><li><b>Mixing up directions.</b> Always convert to one direction first.</li><li><b>Assuming a clue you were not given.</b> If the puzzle does not say how two people compare directly, use the chain.</li><li><b>Stopping at the first answer that sounds right.</b> Finish the whole line, then answer.</li></ul>
<h2>Why this type is good practice</h2>
<p>Ordering puzzles train you to hold several facts in mind and combine them, which is the same skill used in scheduling, rankings and many everyday decisions. Writing the chain on paper is allowed and speeds you up.</p>
<p><a href="./">Try today's set</a></p>''')

pages['mini-sudoku.html'] = ('Mini sudoku 4x4: rules and solving tips', 'The rules of 4 by 4 mini sudoku and a short method for solving it without guessing.', '''
<p class="eyebrow">Guide</p><h1>Mini sudoku (4 by 4): rules and tips</h1>
<h2>The rules</h2>
<p>Fill the grid with the numbers 1, 2, 3 and 4. Every row must contain each number once. Every column must contain each number once. Each of the four 2 by 2 boxes, marked by the thick lines, must also contain each number once.</p>
<h2>Method 1: the only number that fits</h2>
<p>Pick an empty cell. Look at its row, its column and its box. Cross off every number you can already see. If only one number is left, that is the answer. In a 4 by 4 grid this alone solves many puzzles.</p>
<h2>Method 2: the only cell that fits</h2>
<p>Pick a number, for example 3. Look at a row, column or box where 3 is missing. If every empty cell but one already sees a 3 in its row or column, the 3 must go in the last cell.</p>
<h2>Method 3: rows that are almost full</h2>
<p>A row with three numbers filled in is solved: the missing number is the one you cannot see. Scan for rows, columns and boxes with three numbers first.</p>
<div class="ex"><b>Example.</b> A row reads 2, _, 4, 1. The only missing number is 3, so the blank is 3.</div>
<h2>No guessing needed</h2>
<p>Every Brainloop mini sudoku has exactly one solution, and it is checked by the program before you see it. If you feel stuck, it means a cell has more clues than you have used yet. Go back to Method 1 on a different cell.</p>
<h2>Check button</h2>
<p>You can use Check as often as you like, but a solve after a wrong check scores half a point instead of one. Try to be sure before you press it.</p>
<p><a href="./">Try today's set</a></p>''')

pages['mental-math.html'] = ('Mental math tips: order of operations and fast sums', 'Simple mental math methods for multiplying and adding in your head, with the order of operations explained.', '''
<p class="eyebrow">Guide</p><h1>Mental math: simple methods that work</h1>
<h2>Order of operations</h2>
<p>Do brackets first. Then multiplication and division. Then addition and subtraction. So 12 + 3 × 4 is 12 + 12 = 24, not 15 × 4 = 60. Brainloop puzzles always use this order, and the explanation after each puzzle shows the steps.</p>
<h2>Multiplying by a teen number</h2>
<p>Split it. 14 × 6 is 10 × 6 plus 4 × 6, which is 60 + 24 = 84. This split method works for any two-digit number.</p>
<h2>Adding bigger numbers</h2>
<p>Add the tens first, then the ones. 47 + 38: 40 + 30 = 70, then 7 + 8 = 15, then 70 + 15 = 85.</p>
<h2>Divide by thinking "how many groups"</h2>
<p>56 ÷ 7 asks how many sevens fit in 56. If you know your seven times table, the answer is 8. If a division is hard, check it by multiplying back.</p>
<h2>Rule of thumb for checking</h2>
<p>Round the numbers first and estimate. 19 × 4 is close to 20 × 4 = 80, so the real answer should be a little below 80 (it is 76). If one of the four choices is far from your estimate, drop it.</p>
<div class="ex"><b>Try this:</b> 8 + 6 × 5. Multiply first: 6 × 5 = 30. Then add: 38.</div>
<p><a href="./">Try today's set</a></p>''')

pages['brain-training-faq.html'] = ('Does brain training work? An honest FAQ', 'What puzzles can and cannot do, what Brainloop is, and why it is not an IQ test.', '''
<p class="eyebrow">FAQ</p><h1>Does brain training work? An honest FAQ</h1>
<h2>Will puzzles make me smarter?</h2>
<p>Practice makes you better at the kind of puzzle you practice. Research on whether brain-training games raise general intelligence or everyday thinking is mixed, and we do not claim that Brainloop does. Think of it like a crossword: a satisfying five-minute habit and a way to learn tricks.</p>
<h2>Is Brainloop an IQ test?</h2>
<p>No. A real IQ test is given and scored under standard conditions by a trained professional. Brainloop is a casual game. It does not give an IQ score and you should not use it to judge your intelligence.</p>
<h2>Where do the puzzles come from?</h2>
<p>A program generates them from simple rules and a seed based on the date. That means every set is original, and answers are checked by code before you see them. Each daily set is the same for everyone that day.</p>
<h2>What do you collect about me?</h2>
<p>Nothing is sent anywhere. Your streak, stats and progress are stored on your device only. Read the <a href="privacy.html">privacy page</a>.</p>
<h2>Can I play offline?</h2>
<p>Yes, after the first visit. Add Brainloop to your home screen and it works without a connection.</p>
<h2>How do I get better?</h2>
<ul><li>Play the daily set at the same time each day.</li><li>Read the short guides: <a href="sequences.html">sequences</a>, <a href="logic-puzzles.html">logic</a>, <a href="mini-sudoku.html">mini sudoku</a>, <a href="mental-math.html">mental math</a>.</li><li>After a wrong answer, read the explanation instead of skipping it.</li></ul>''')

pages['about.html'] = ('About Brainloop', 'Brainloop is a free daily puzzle game with five quick puzzles, streaks and no tracking.', '''
<p class="eyebrow">About</p><h1>About Brainloop</h1>
<p>Brainloop is a free daily puzzle game. Each day there are five short puzzles: a number sequence, a logic question, an odd-one-out, a mental math sum and a mini sudoku. A set takes about five minutes.</p>
<h2>What we care about</h2>
<ul><li><b>Short and calm.</b> One set a day. No timers, no pressure.</li><li><b>Fair puzzles.</b> Every puzzle is generated by code and checked so that it has one correct answer.</li><li><b>Private.</b> No accounts, no tracking, nothing sent off your device.</li><li><b>Honest.</b> It is a game. It is not an IQ test and we do not promise it will make you smarter.</li></ul>
<h2>How it is built</h2>
<p>Brainloop is a progressive web app. It is plain HTML, CSS and JavaScript, with no external libraries, fonts or images from other sites. It works offline once opened and updates itself in the background, without asking you to reinstall.</p>
<h2>Feedback</h2>
<p>Found a puzzle that seems wrong or unclear? Contact details will be added to this page when the site has a public inbox.</p>''')

pages['privacy.html'] = ('Brainloop privacy policy', 'Brainloop collects no personal data. Your progress is stored only on your device.', '''
<p class="eyebrow">Privacy</p><h1>Privacy policy</h1>
<p><b>Short version:</b> Brainloop does not collect, send or sell any personal information.</p>
<h2>What is stored on your device</h2>
<p>To remember your streak, your stats and your progress in today's set, Brainloop uses your browser's local storage on your own device. It also stores the app files so the game can work offline. This data never leaves your device, and you can clear it any time by clearing site data in your browser.</p>
<h2>What we do not do</h2>
<ul><li>No accounts or sign-ups.</li><li>No analytics or tracking scripts.</li><li>No cookies set by Brainloop.</li><li>No data sent to servers that we run. Brainloop has no server.</li></ul>
<h2>Children</h2>
<p>Brainloop is a general-audience game and is not directed at children under 13. Because it collects no personal information from anyone, there is nothing to collect from children either.</p>
<h2>Hosting</h2>
<p>The site is served as static files by GitHub Pages. GitHub, like any host, may keep standard server logs such as IP addresses. See GitHub's own privacy statement for how it handles them.</p>
<h2>Changes</h2>
<p>If we ever add advertising or any other service that handles data, this page will be updated first to explain exactly what changes, and the game will ask where the law requires it.</p>
<p>Last updated: November 25, 2026.</p>''')

for slug, (t, d, b) in pages.items():
    page(slug, t, d, b)

# index shell
index = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Brainloop: a free daily puzzle game</title>
<meta name="description" content="Five quick brain puzzles every day: number sequences, logic, odd one out, mental math and mini sudoku. Free, private, works offline.">
<meta name="theme-color" content="#4f46e5"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><link rel="stylesheet" href="style.css"></head>
<body>{NAV}<div id="app"></div>
<main><article style="padding-top:0"><h2>What is Brainloop?</h2>
<p>Brainloop is a free daily puzzle game made of five short puzzles: number sequences, logic questions, odd one out, mental math and a 4 by 4 mini sudoku. The set is new every day and the same for every player, so you can compare results with friends. Build a streak, practice any type you like, and read the <a href="guide.html">guide</a> to learn the tricks.</p>
<p>It is built to be quick and calm, with no timers, no accounts and no tracking. Your progress stays on your device, and it works offline once opened. It is a game for fun and practice, not an IQ test.</p></article></main>
{FOOT}<script src="gen.js"></script><script src="app.js"></script></body></html>'''
open(os.path.join(OUT, 'index.html'), 'w').write(index)
open(os.path.join(OUT, 'style.css'), 'w').write(CSS)

manifest = {"name": "Brainloop", "short_name": "Brainloop", "description": "Five quick puzzles every day.", "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#f6f4ee", "theme_color": "#4f46e5", "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}
open(os.path.join(OUT, 'manifest.webmanifest'), 'w').write(json.dumps(manifest, indent=1))

files = ['./', 'index.html', 'style.css', 'gen.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'] + sorted(pages)
sw = f'''const V = 'brainloop-{VERSION}';
const FILES = {json.dumps(files)};
self.addEventListener('install', e => {{ self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {{ const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); return r; }}).catch(() => caches.match(e.request, {{ ignoreSearch: true }}).then(m => m || caches.match('index.html'))));
}});
'''
open(os.path.join(OUT, 'sw.js'), 'w').write(sw)

def icon(n):
    im = Image.new('RGB', (n, n), '#4f46e5'); d = ImageDraw.Draw(im)
    pad = int(n * .26); w = int(n * .09)
    d.arc([pad, pad, n - pad, n - pad], start=40, end=330, fill='white', width=w)
    r = w // 2 + 2; import math
    ang = math.radians(330); cx = n / 2 + (n / 2 - pad - w / 2) * math.cos(ang); cy = n / 2 + (n / 2 - pad - w / 2) * math.sin(ang)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill='white')
    im.save(os.path.join(OUT, f'icon-{n}.png'))
icon(192); icon(512)
print('built', VERSION)
