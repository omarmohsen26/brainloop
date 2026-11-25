import os, json
from PIL import Image, ImageDraw
OUT = os.path.dirname(os.path.abspath(__file__))
VERSION = "1.9.0"

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


.tabs{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;justify-content:center;gap:4px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--card) 92%,transparent);backdrop-filter:blur(14px);border-top:1px solid var(--line)}
.tabs button{flex:1;max-width:120px;font:inherit;font-size:11px;font-weight:600;color:var(--mut);background:none;border:0;border-radius:14px;padding:6px 0 4px;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:52px;cursor:pointer}
.tabs svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.tabs button.on{color:var(--acc);background:var(--acc2)}
body.has-tabs{padding-bottom:84px}
.playing article,.playing footer{display:none}
.hero2{background:linear-gradient(145deg,#5b52f0,#2f2890);color:#fff;border-radius:24px;padding:22px 20px 20px;margin:6px 0 14px;box-shadow:0 10px 30px rgba(79,70,229,.28)}
.hero2 h1{margin:.35em 0 .3em;font-size:27px}.hero2.tall{padding-bottom:24px}
.hero2 .big{font-size:84px;line-height:1;margin:.1em 0}.hero2 .big small{font-size:34px;opacity:.7}
.eyebrow.w{color:rgba(255,255,255,.78)}.sub.w{color:rgba(255,255,255,.85)}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.pill{background:rgba(255,255,255,.18);border-radius:999px;padding:5px 11px;font-size:12px;font-weight:700}
.btn.light{background:#fff;color:#2f2890;border-color:#fff}.btn.ghost{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.3)}
.acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.hero2 .sq i{background:rgba(255,255,255,.2)}.hero2 .sq i.ok{background:#22c55e}.hero2 .sq i.half{background:#facc15}.hero2 .sq i.bad{background:#ef4444}
.row2{display:flex;justify-content:space-between;align-items:center;gap:12px}.row2 .sub{margin:0}
.h1s{font-size:24px;margin:.1em 0 .2em}
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:6px}.week i{aspect-ratio:1;border-radius:12px;background:var(--line);display:flex;align-items:center;justify-content:center;font-style:normal}
.week i b{font-size:12px;color:var(--mut)}.week i.ok{background:var(--ok)}.week i.half{background:var(--half)}.week i.bad{background:var(--bad)}
.week i.ok b,.week i.half b,.week i.bad b{color:#fff}.week i.now{outline:2.5px solid var(--acc);outline-offset:2px}
.dist div{display:flex;align-items:center;gap:8px;margin:5px 0}.dist span{width:14px;font-size:13px;color:var(--mut)}.dist u{display:block;height:20px;border-radius:6px;background:var(--acc)}.dist em{font-style:normal;font-size:13px;font-weight:700}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.cal span{text-align:center;font-size:11px;color:var(--mut)}
.cal i.e{display:block}.cal button{font:inherit;font-size:13px;font-weight:600;aspect-ratio:1;border-radius:11px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;min-height:36px}
.cal button.ok{background:var(--ok);border-color:var(--ok);color:#fff}.cal button.half{background:var(--half);border-color:var(--half);color:#fff}.cal button.bad{background:var(--bad);border-color:var(--bad);color:#fff}.cal button.now{outline:2.5px solid var(--acc);outline-offset:1px}
.list a{display:flex;flex-direction:column;text-decoration:none;color:var(--ink);padding:12px 0;border-bottom:1px solid var(--line)}.list a b{font-size:16px}.list a span{font-size:13px;color:var(--mut)}.list a:last-child{border:0}
.badge{font-size:13px;font-weight:600;padding:8px 12px;border-radius:999px;border:1.5px dashed var(--line);color:var(--mut)}.badge.on{border:1.5px solid var(--acc);background:var(--acc2);color:var(--ink)}.tip{display:flex;gap:10px;align-items:flex-start;background:var(--acc2)}.tip .sub{margin:.2em 0 0;font-size:14px}.puzzle{animation:rise .2s ease-out}@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
footer{max-width:560px;margin:10px auto 30px;padding:0 18px;color:var(--mut);font-size:13px}footer a{color:var(--mut);margin-right:12px}
article{padding-top:6px}article p,article li{color:var(--ink)}article .ex{background:var(--acc2);border-radius:12px;padding:12px 14px;margin:10px 0}
a{color:var(--acc)}
button:focus-visible,a:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}

body.has-tabs{--bg:#14122b;--ink:#fff;--mut:#b9b5e0;--card:#232050;--line:#38347a;--acc:#8b7bff;--acc2:#2f2b68;background:radial-gradient(120% 60% at 50% -10%,#3b2fa8 0%,#14122b 60%) fixed,#14122b;color:#fff}
html:has(body.has-tabs){background:#14122b}body.has-tabs{min-height:100vh}
body.has-tabs header.bar,body.has-tabs footer,body.has-tabs main{display:none}
body.has-tabs.tab-learn footer,body.has-tabs.tab-learn main{display:block}
body.has-tabs.playing .tabs{display:none}body.has-tabs.playing{padding-bottom:24px}
.home{padding-top:8px;text-align:center}
.hbar{display:flex;align-items:center;gap:10px;padding:10px 0}
.lvl{flex:1;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800}.lvn{background:#ffd23f;color:#3a2a00;border-radius:999px;padding:4px 10px}
.xpb{flex:1;height:12px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden}.xpb u{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#22c55e,#a3e635);transition:width .6s}
.xpt{color:var(--mut);font-weight:700}.lvl.c{margin:8px 0 14px}
.ibtn{border:0;background:rgba(255,255,255,.12);border-radius:14px;width:46px;height:46px;font-size:20px;cursor:pointer}
.orb{width:128px;height:128px;margin:20px auto 10px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#a99bff,#5b3df0 60%,#2a1d9a);display:flex;align-items:center;justify-content:center;font-size:60px;box-shadow:0 14px 40px rgba(91,61,240,.55),inset 0 -8px 18px rgba(0,0,0,.25);animation:bob 3s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-8px)}}
.eyebrow.c{text-align:center;margin-top:8px}
.prog{display:flex;gap:8px;justify-content:center;margin:12px 0 22px}.prog i{width:38px;height:10px;border-radius:99px;background:rgba(255,255,255,.18)}
.prog i.ok{background:#22c55e}.prog i.half{background:#facc15}.prog i.bad{background:#ef4444}.prog i.cur{background:#fff}
.play{display:block;width:100%;font:inherit;font-size:34px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#fff;border:0;border-radius:28px;padding:26px 0;background:linear-gradient(#34d27b,#16a34a);box-shadow:0 9px 0 #0d6a2f,0 18px 36px rgba(22,163,74,.4);cursor:pointer;animation:pulse 2s ease-in-out infinite}
.play:active{transform:translateY(7px);box-shadow:0 2px 0 #0d6a2f}
@keyframes pulse{50%{transform:scale(1.025)}}
.hint{color:var(--mut);margin:20px 0 14px;font-weight:600}
.mini{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}
.tile{font:inherit;color:#fff;border:0;border-radius:22px;padding:18px 8px;display:flex;flex-direction:column;gap:2px;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.3)}.tile b{font-size:19px}.tile span{font-size:12px;opacity:.85}
.tile.t1{background:#ff7a45}.tile.t2{background:#3b82f6}.tile:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.3)}
.puzzle.g{padding-top:6px;animation:rise .25s ease-out}
.ptop{display:flex;align-items:center;gap:10px}.ptop .dots{flex:1;margin:0}.dots i{height:10px;border-radius:99px;background:rgba(255,255,255,.18)}
.x{font:inherit;border:0;background:rgba(255,255,255,.12);color:#fff;width:40px;height:40px;border-radius:12px;font-size:16px;cursor:pointer}
.cmb{min-width:54px;text-align:right;font-weight:900;color:#ffd23f}
.pmeta{display:flex;justify-content:space-between;font-size:12px;color:var(--mut);font-weight:700;margin:10px 0 0;text-transform:uppercase;letter-spacing:.06em}
.puzzle.g h2{font-size:26px;margin:.5em 0 .1em}.puzzle.g .sub{margin:0 0 14px}
body.has-tabs .show{background:rgba(255,255,255,.1);font-size:28px;border-radius:20px;padding:24px 12px}
body.has-tabs .g3 i{background:rgba(255,255,255,.1);border-radius:16px;font-size:30px;padding:20px 0}body.has-tabs .g3 i.q{background:#8b7bff}
.opts{gap:12px}
body.has-tabs .opt{border:0;border-radius:22px;min-height:88px;font-size:26px;color:#fff;box-shadow:0 7px 0 rgba(0,0,0,.3);transition:transform .08s,box-shadow .08s,opacity .2s}
.opt:nth-child(4n+1){background:#6c5ce7}.opt:nth-child(4n+2){background:#0ea5a0}.opt:nth-child(4n+3){background:#f97316}.opt:nth-child(4n+4){background:#3b82f6}
.opt:active{transform:translateY(5px);box-shadow:0 2px 0 rgba(0,0,0,.3)}
.opts.c5 .opt{min-height:74px}
body.has-tabs .opt.right{background:#22c55e!important;animation:pop .5s}body.has-tabs .opt.wrong{background:#ef4444!important;animation:shake .4s}
.opt:disabled:not(.right):not(.wrong){opacity:.3}
@keyframes pop{30%{transform:scale(1.1)}60%{transform:scale(.97)}}
@keyframes shake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.fb{border-radius:18px;animation:rise .25s ease-out;font-size:15px}
.fb.good{background:rgba(34,197,94,.2)}.fb.bad{background:rgba(239,68,68,.2)}
.btn.big{width:100%;font-size:20px;padding:16px;border-radius:20px;box-shadow:0 6px 0 rgba(0,0,0,.3)}
body.has-tabs .btn.primary{background:#22c55e;border-color:#22c55e;box-shadow:0 6px 0 #0d6a2f}
body.has-tabs .btn.primary:active{transform:translateY(4px)}
body.has-tabs .key{border:0;background:#3b3799;color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.3)}
body.has-tabs .cell{background:#2b2766;color:#cfc8ff;border-color:#4a45a0}body.has-tabs .cell.fx{background:#3d3890;color:#fff}body.has-tabs .sg{border-color:#fff}
body.has-tabs .cell.rb{border-right-color:#fff}body.has-tabs .cell.bb{border-bottom-color:#fff}
body.has-tabs .card{box-shadow:0 4px 0 rgba(0,0,0,.18)}
body.has-tabs .btn{background:#2f2b68;color:#fff;border-color:#4a45a0}
body.has-tabs .btn.light{background:#fff;color:#2f2890}body.has-tabs .btn.ghost{background:rgba(255,255,255,.14)}
body.has-tabs .chip{background:#2f2b68;color:#fff;border:0;box-shadow:0 4px 0 rgba(0,0,0,.25)}
body.has-tabs .tabs{background:rgba(20,18,43,.94);border-top:1px solid #38347a}
.win .stars{font-size:54px;letter-spacing:6px}.stars b{display:inline-block;color:rgba(255,255,255,.2);transform:scale(.6)}.stars b.on{color:#ffd23f;animation:starin .5s both;text-shadow:0 0 24px rgba(255,210,63,.7)}
@keyframes starin{0%{transform:scale(0) rotate(-90deg)}70%{transform:scale(1.35)}100%{transform:scale(1)}}
.xpgain{font-weight:800;font-size:18px;margin:.4em 0 0;color:#ffd23f}
.win .sq{justify-content:center}
.confetti{position:fixed;inset:0;pointer-events:none;z-index:30;overflow:hidden}
.confetti i{position:absolute;top:-12px;width:10px;height:16px;border-radius:2px;animation:fall 1.6s ease-in forwards}
@keyframes fall{to{transform:translate(var(--dx),105vh) rotate(var(--r));opacity:.9}}
.xpf{position:fixed;left:50%;top:38%;transform:translateX(-50%);z-index:31;font-size:30px;font-weight:900;color:#ffd23f;text-shadow:0 3px 0 rgba(0,0,0,.4);pointer-events:none;animation:flt 1.1s ease-out forwards}
@keyframes flt{from{opacity:1;transform:translate(-50%,0) scale(.7)}30%{transform:translate(-50%,-20px) scale(1.2)}to{opacity:0;transform:translate(-50%,-90px) scale(1)}}
.ov{position:fixed;inset:0;z-index:40;background:rgba(10,8,30,.82);display:flex;align-items:center;justify-content:center;padding:24px;animation:rise .2s}
.ovc{background:linear-gradient(145deg,#6a5cf5,#2f2890);border-radius:28px;padding:30px 36px;text-align:center;color:#fff;animation:pop .6s;min-width:260px}
.lvbig{font-size:110px;font-weight:900;line-height:1;color:#ffd23f;text-shadow:0 6px 0 rgba(0,0,0,.3)}

.lvo{font-size:64px;font-weight:900;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.25)}
.mini.m3{grid-template-columns:repeat(3,1fr);gap:10px}.mini.m3 .tile b{font-size:16px}.tile.t3{background:#0ea5a0}
.acts.col{flex-direction:column;align-items:stretch;margin-top:14px}.acts.col .btn{width:100%}
.map{padding-top:0;text-align:center;overflow-x:hidden}body.has-tabs{overflow-x:hidden}.world{margin:22px 0 6px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;font-size:12px;color:#ffd23f}
.lrow{display:flex;flex-direction:column;align-items:center;margin:10px 0 14px}
.node{font:inherit;font-size:26px;font-weight:900;color:#fff;width:74px;height:74px;border-radius:50%;border:0;background:#3b3799;box-shadow:0 7px 0 rgba(0,0,0,.35);cursor:pointer}
.node.done{background:#22c55e;box-shadow:0 7px 0 #0d6a2f}.node.cur{background:#ff7a45;box-shadow:0 7px 0 #a84a1f,0 0 0 6px rgba(255,122,69,.3);animation:pulse 1.8s ease-in-out infinite}
.node.boss{width:88px;height:88px;background:linear-gradient(#ffd23f,#e09b00);color:#3a2a00;font-size:34px;box-shadow:0 7px 0 #8a5e00}.node.lock{background:#2a2760;opacity:.7;box-shadow:0 5px 0 rgba(0,0,0,.3);cursor:default;font-size:22px}
.node:active:not(:disabled){transform:translateY(5px)}
.nst{margin-top:8px;font-size:15px;letter-spacing:2px}.nst b{color:rgba(255,255,255,.2)}.nst b.on{color:#ffd23f}
.tabs button{max-width:90px}

.map .hbar{position:sticky;top:0;z-index:3;background:#14122b;margin:0 -18px;padding:10px 18px}.hintc{font-weight:800;background:rgba(255,255,255,.12);border-radius:999px;padding:6px 12px;font-size:14px}
.mapin{position:relative}.mpath{position:absolute;left:0;top:0}
.mapin .lrow{position:absolute;transform:translateX(-50%);margin:0;width:100px}
.mapin .world{position:absolute;left:0;right:0;margin:0}
.you{position:absolute;top:-30px;left:50%;transform:translateX(-50%);background:#fff;color:#2f2890;font-size:11px;font-weight:900;border-radius:8px;padding:3px 8px;animation:hop 1s ease-in-out infinite;z-index:2}
.you:after{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-top-color:#fff;border-bottom:0}
@keyframes hop{50%{transform:translate(-50%,-6px)}}
.mapin .lrow .node{margin-top:0}
.coach{background:rgba(255,210,63,.16);border:1.5px solid rgba(255,210,63,.5);color:#ffe9a0;border-radius:16px;padding:10px 14px;margin:0 0 14px;font-size:14px;font-weight:600;animation:rise .3s}
.newb{font-style:normal;background:#ff7a45;color:#fff;border-radius:6px;padding:2px 6px;margin-left:6px;letter-spacing:.04em}
.opt.glow{outline:4px solid #ffd23f;outline-offset:3px;animation:glowp 1s ease-in-out infinite}@keyframes glowp{50%{outline-color:rgba(255,210,63,.2)}}
.opt.gone{opacity:.12!important;transform:scale(.94)}
.hintb{display:block;margin:16px auto 0;font:inherit;font-weight:800;color:#fff;background:#3b3799;border:0;border-radius:16px;padding:12px 22px;box-shadow:0 5px 0 rgba(0,0,0,.3);cursor:pointer}.hintb b{background:#ffd23f;color:#3a2a00;border-radius:99px;padding:1px 8px;margin-left:6px}.hintb:disabled{opacity:.5}
.puzzle.shk{animation:shk .4s}@keyframes shk{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@media(prefers-reduced-motion:reduce){.orb,.play,.confetti i{animation:none!important}}
"""

NAV = '<header class="bar"><a class="logo" href="./"><i></i>Brainloop</a><nav class="top"><a href="guide.html">Guide</a><a href="about.html">About</a></nav></header>'
FOOT = '<footer><a href="about.html">About</a><a href="guide.html">How to play</a><a href="privacy.html">Privacy</a><a href="brain-training-faq.html">FAQ</a><p>Brainloop is a free daily puzzle game. Puzzles are generated by code, so every one is original.</p></footer>'

def page(slug, title, desc, body):
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title><meta name="description" content="{desc}"><meta name="theme-color" content="#4f46e5">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="bl-version" content="{VERSION}"><link rel="stylesheet" href="style.css?v={VERSION}">
<meta property="og:site_name" content="Brainloop"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="website"><meta property="og:image" content="https://omarmohsen26.github.io/brainloop/og.png"><meta name="twitter:card" content="summary_large_image"></head>
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


pages['letter-sequences.html'] = ('Letter sequence puzzles: how to solve them', 'How to solve letter sequence puzzles by counting places in the alphabet, with worked examples.', """
<p class="eyebrow">Guide</p><h1>Letter sequences: count the places</h1>
<p>A letter sequence looks like A, C, E, G, ? and asks for the next letter. The trick is to turn letters into numbers. A is 1, B is 2, C is 3, and so on up to Z, which is 26. Once you see numbers, it becomes a number sequence.</p>
<h2>Step 1: count the jumps</h2>
<p>For A, C, E, G the numbers are 1, 3, 5, 7. The jump is +2 each time, so the next number is 9, which is the letter I.</p>
<h2>Step 2: if the jumps change, write them down</h2>
<p>For B, C, E, H, L the numbers are 2, 3, 5, 8, 12. The jumps are 1, 2, 3, 4, so the next jump is 5 and the next number is 17, which is Q.</p>
<h2>Step 3: watch for alternating jumps</h2>
<p>For C, D, I, J, O the numbers are 3, 4, 9, 10, 15. The jumps go +1, +5, +1, +5, so the next jump is +1 and the next letter is P (16).</p>
<div class="ex"><b>Alphabet anchors that save time:</b> E is 5, J is 10, O is 15, T is 20, Y is 25. Count from the nearest anchor instead of from A.</div>
<h2>Common mistakes</h2>
<ul><li>Counting the letter itself. Counting from C to E is 2 places, not 3.</li><li>Forgetting that Brainloop sequences never wrap past Z.</li><li>Looking only at the first two letters. Check the rule on every pair.</li></ul>
<p>Compare with <a href="sequences.html">number sequences</a>, which use the same ideas. <a href="./">Try today's set</a></p>""")

pages['odd-one-out.html'] = ('Odd one out puzzles: how to find the number that does not belong', 'A guide to odd one out number puzzles: multiples, primes, squares, digit sums and more.', """
<p class="eyebrow">Guide</p><h1>Odd one out: find the rule that breaks</h1>
<p>In an odd one out puzzle, four of the five numbers share a property and one does not. You do not need to name the property in advance. Test a short list of ideas until four numbers agree.</p>
<h2>Idea 1: multiples</h2>
<p>Do four numbers divide evenly by the same small number? In 18, 27, 45, 63, 40 the first four are multiples of 9. 40 is not. Try 2, 3, 4, 5, 6, 7, 9 in that order.</p>
<h2>Idea 2: primes</h2>
<p>A prime has no divisors except 1 and itself. In 11, 17, 23, 29, 51 the first four are prime. 51 is 3 times 17, so it does not belong.</p>
<h2>Idea 3: squares and powers of 2</h2>
<p>Learn the squares up to 12 (1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144) and the powers of 2 (2, 4, 8, 16, 32, 64, 128, 256). Both lists appear a lot.</p>
<h2>Idea 4: digit sums</h2>
<p>Add the digits of each number. In 18, 27, 36, 45, 53 the digits of the first four add up to 9. 53 adds up to 8.</p>
<h2>Idea 5: even, odd and palindromes</h2>
<p>Check whether four are even and one is odd. In hard mode, also check for palindromes, numbers that read the same backwards, such as 121 or 44.</p>
<div class="ex"><b>Fast habit:</b> check even or odd first, then multiples, then squares or primes, then digit sums. That order solves almost every puzzle.</div>
<p><a href="./">Try today's set</a></p>""")

pages['number-grids.html'] = ('Number grid puzzles: how to find the rule', 'How to solve 3 by 3 number grid puzzles where each row follows the same rule.', """
<p class="eyebrow">Guide</p><h1>Number grids: read the rule across rows</h1>
<p>A number grid is three rows of three numbers. Every row follows the same rule to get its last number from the first two. The last cell of the third row is empty. Find the rule from the complete rows, then apply it.</p>
<h2>Test the four common rules</h2>
<ul><li><b>Add:</b> first + second = third. Row 4, 7, 11 fits.</li><li><b>Subtract:</b> first − second = third. Row 20, 6, 14 fits.</li><li><b>Multiply:</b> first × second = third. Row 3, 5, 15 fits.</li><li><b>Double plus:</b> twice the first + the second = third. Row 4, 3, 11 fits.</li></ul>
<h2>Method</h2>
<ol><li>Look at the first row only. Try each rule until one works.</li><li>Check that rule on the second row. If it fails, try another one.</li><li>Apply the rule to the first two numbers of the third row.</li></ol>
<div class="ex"><b>Example.</b> Rows: 9, 6, 15 and 6, 12, 18 and 10, 2, ?. Row one: 9 + 6 = 15. Row two: 6 + 12 = 18. The rule is add. So 10 + 2 = 12.</div>
<h2>Tip</h2>
<p>If two rules both fit one row (for example 2, 2, 4 fits both add and multiply), use the second row to decide.</p>
<p><a href="./">Try today's set</a></p>""")

pages['shape-equations.html'] = ('Shape math puzzles: solving for each symbol', 'A guide to shape equation puzzles where each symbol is a hidden number.', """
<p class="eyebrow">Guide</p><h1>Shape math: solve for each symbol</h1>
<p>In a shape math puzzle each symbol stands for a number. The same symbol is always the same number. You are given a few equations and asked to work out the last line.</p>
<h2>Start with the line that has only one kind of shape</h2>
<p>If a line reads ● + ● + ● = 18, then three of the same shape make 18, so ● is 6. That is your first solid fact.</p>
<h2>Substitute and move on</h2>
<p>If the next line reads ● + ■ = 10, put 6 in for ●: 6 + ■ = 10, so ■ is 4. Keep going until every shape is known.</p>
<h2>Hard mode: multiplication</h2>
<p>A line like ● × ● = 25 means ● times itself is 25, so ● is 5. Then ● × ■ = 25 gives ■ = 5. Learn the squares (4, 9, 16, 25, 36, 49) to spot these fast.</p>
<div class="ex"><b>Example.</b> ● + ● + ● = 15, ● + ■ = 9, ■ + ▲ = 11, ▲ + ● = ?<br>● = 5. ■ = 4. ▲ = 7. So ▲ + ● = 12.</div>
<h2>Check your work</h2>
<p>Put your values back into every line. If one line fails, one of your steps is wrong. Fix it before you answer.</p>
<p><a href="./">Try today's set</a></p>""")

pages['daily-puzzle-habit.html'] = ('How to build a daily puzzle habit', 'Practical tips for making five minutes of puzzles a steady daily habit without pressure.', """
<p class="eyebrow">Guide</p><h1>How to build a daily puzzle habit</h1>
<p>A good puzzle habit is small. Five minutes a day is easier to keep than an hour once a week, and that is why Brainloop gives you one short set each day.</p>
<h2>Attach it to something you already do</h2>
<p>Pair the puzzle with a cue: your morning coffee, your commute, or the minute before bed. A cue you already have is easier to remember than a reminder.</p>
<h2>Keep the bar low</h2>
<p>On a busy day, finish the set even if you rush. A fast attempt keeps the routine alive. A streak freeze covers one missed day, so a single bad day does not undo your progress.</p>
<h2>Learn from misses</h2>
<p>After a wrong answer, read the short explanation. Most puzzles repeat a small set of ideas, so a ten-second read makes you faster next time. The <a href="learn.html">guides</a> list them type by type.</p>
<h2>Use hard mode when it feels easy</h2>
<p>When you score five out of five for a week, try the hard set. It uses the same ideas with extra steps.</p>
<h2>Compare, do not compete</h2>
<p>Share your result card with a friend and see how you did on the same set. The colored squares do not give away the answers.</p>
<p><a href="./">Play today's set</a></p>""")

pages['missing-signs.html'] = ('Missing signs puzzles: finding the operators', 'How to solve puzzles where you pick the plus, minus or times signs that make an equation true.', """
<p class="eyebrow">Guide</p><h1>Missing signs: find the operators</h1>
<p>You get an equation with the signs hidden, like 4 ? 6 ? 5 = 15. Your job is to choose the signs that make it true. In Brainloop, multiplication is done before addition and subtraction, just like in school math.</p>
<h2>Method</h2>
<ol><li>Look at the target. Is it much bigger than the numbers? Then a times sign is likely.</li><li>Is it close to the first number? Then plus or minus with small numbers is likely.</li><li>Try the most likely choice and work it out, multiplying first.</li><li>If the result is wrong, change one sign and try again.</li></ol>
<div class="ex"><b>Example.</b> 4 ? 6 ? 5 = 15. Try + and +: 4 + 6 + 5 = 15. It fits. Try × and +: 24 + 5 = 29, too big.</div>
<h2>Use the answer choices</h2>
<p>You only have four choices. Test each one quickly and cross it out. Often two of them are far off and can be dropped at once.</p>
<h2>Hard mode</h2>
<p>Hard mode has three signs. Do the multiplications first, then add and subtract from left to right. Write the partial result as you go.</p>
<p>Related: <a href="order-of-operations.html">order of operations</a>. <a href="./">Try today's set</a></p>""")

pages['order-of-operations.html'] = ('Order of operations explained with examples', 'A short explanation of why multiplication comes before addition, with worked examples.', """
<p class="eyebrow">Guide</p><h1>Order of operations</h1>
<p>When an expression mixes signs, the order matters. Multiplication happens before addition and subtraction. Brackets come first of all. Then you work left to right.</p>
<h2>Why it matters</h2>
<p>Take 2 + 3 × 4. If you add first you get 20. If you multiply first you get 2 + 12 = 14. The agreed answer is 14.</p>
<h2>Steps</h2>
<ol><li>Do anything inside brackets.</li><li>Do multiplication.</li><li>Do addition and subtraction from left to right.</li></ol>
<div class="ex"><b>Example.</b> (14 − 6) × 2 + 14. Brackets: 8. Then 8 × 2 = 16. Then 16 + 14 = 30.</div>
<h2>Common slip</h2>
<p>With 10 − 4 + 3, go left to right: 6 + 3 = 9. Do not do 4 + 3 first, that gives 3, which is wrong.</p>
<p>Related: <a href="mental-math.html">mental math</a>, <a href="missing-signs.html">missing signs</a>. <a href="./">Try today's set</a></p>""")

pages['solve-puzzles-faster.html'] = ('How to solve puzzles faster: 7 habits', 'Seven simple habits that make daily logic and number puzzles quicker, with no tricks.', """
<p class="eyebrow">Guide</p><h1>How to solve puzzles faster</h1>
<p>Speed comes from habits, not talent. These seven work across every puzzle type in Brainloop.</p>
<ol><li><b>Read the question twice.</b> Most wrong answers come from a misread, not a hard idea.</li><li><b>Write the first guess.</b> A rough rule you can test beats staring.</li><li><b>Check differences first.</b> In number puzzles, look at the gaps between numbers before anything else.</li><li><b>Test, do not trust.</b> Run your rule on every given number before you answer.</li><li><b>Drop choices.</b> Cross out options that are obviously off, then decide between the rest.</li><li><b>Skip and return.</b> If you are stuck for a minute, take a break and look again with fresh eyes.</li><li><b>Read the explanation.</b> After each miss, the short note teaches the pattern for next time.</li></ol>
<p>Pick one habit per week. Practice mode lets you focus on a single puzzle type. See also <a href="daily-puzzle-habit.html">building a daily habit</a>. <a href="./">Play today's set</a></p>""")

pages['learn.html'] = ('Learn: puzzle guides', 'All Brainloop puzzle guides in one place.', """
<p class="eyebrow">Learn</p><h1>Puzzle guides</h1>
<p>Short guides with worked examples for every puzzle type in Brainloop.</p>
<ul><li><a href="sequences.html">Number sequences</a></li><li><a href="letter-sequences.html">Letter sequences</a></li><li><a href="logic-puzzles.html">Logic ordering</a></li><li><a href="odd-one-out.html">Odd one out</a></li><li><a href="number-grids.html">Number grids</a></li><li><a href="shape-equations.html">Shape math</a></li><li><a href="mini-sudoku.html">Mini sudoku</a></li><li><a href="mental-math.html">Mental math</a></li><li><a href="missing-signs.html">Missing signs</a></li><li><a href="order-of-operations.html">Order of operations</a></li><li><a href="solve-puzzles-faster.html">Solve puzzles faster</a></li><li><a href="daily-puzzle-habit.html">Build a daily puzzle habit</a></li><li><a href="brain-training-faq.html">Does brain training work?</a></li></ul>""")

for slug, (t, d, b) in pages.items():
    page(slug, t, d, b)

# index shell
index = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Brainloop: a free daily puzzle game</title>
<meta name="description" content="Five quick brain puzzles every day: number sequences, logic, odd one out, mental math and mini sudoku. Free, private, works offline.">
<meta name="theme-color" content="#4f46e5"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="bl-version" content="{VERSION}"><link rel="stylesheet" href="style.css?v={VERSION}">
<meta property="og:site_name" content="Brainloop"><meta property="og:title" content="Brainloop: a free daily puzzle game"><meta property="og:description" content="Five quick brain puzzles every day. Free, private, works offline."><meta property="og:type" content="website"><meta property="og:image" content="https://omarmohsen26.github.io/brainloop/og.png"><meta name="twitter:card" content="summary_large_image"></head>
<body class="has-tabs">{NAV}<div id="app"></div>
<main><article style="padding-top:0"><h2>What is Brainloop?</h2>
<p>Brainloop is a free daily puzzle game made of five short puzzles: number sequences, logic questions, odd one out, mental math and a 4 by 4 mini sudoku. The set is new every day and the same for every player, so you can compare results with friends. Build a streak, practice any type you like, and read the <a href="guide.html">guide</a> to learn the tricks.</p>
<p>It is built to be quick and fun, with levels, combos, sound effects you can switch off, no accounts and no tracking. Your progress stays on your device, and it works offline once opened. It is a game for fun and practice, not an IQ test.</p></article></main>
{FOOT}<script src="gen.js?v={VERSION}"></script><script src="app.js?v={VERSION}"></script></body></html>'''
open(os.path.join(OUT, 'index.html'), 'w').write(index)
open(os.path.join(OUT, 'style.css'), 'w').write(CSS)

manifest = {"name": "Brainloop", "short_name": "Brainloop", "description": "Five quick puzzles every day.", "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#f6f4ee", "theme_color": "#4f46e5", "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}
open(os.path.join(OUT, 'manifest.webmanifest'), 'w').write(json.dumps(manifest, indent=1))

html_files = ['./', 'index.html'] + sorted(pages)
asset_files = ['style.css?v=' + VERSION, 'gen.js?v=' + VERSION, 'app.js?v=' + VERSION, 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'og.png']
sw = """const V = 'brainloop-%(v)s';
const HTML = %(html)s;
const ASSETS = %(assets)s;
// Install is all-or-nothing: fetch every file fresh (bypass HTTP cache), check every page carries this version,
// and only then swap caches. A stale CDN copy during a Pages publish makes install fail, the old cache stays, the browser retries later.
self.addEventListener('install', e => {
  e.waitUntil((async () => { try {
    const c = await caches.open(V);
    for (const u of HTML) {
      const r = await fetch(u, { cache: 'reload' });
      if (!r.ok) throw new Error('bad ' + u);
      const t = await r.clone().text();
      if (t.indexOf('name="bl-version" content="%(v)s"') < 0) throw new Error('stale ' + u);
      await c.put(u, r);
    }
    for (const u of ASSETS) {
      const r = await fetch(u, { cache: 'reload' });
      if (!r.ok) throw new Error('bad ' + u);
      await c.put(u, r);
    }
    await self.skipWaiting();
  } catch (err) { await caches.delete(V); throw err; } })());
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url); if (u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(e.request, { ignoreSearch: false })).then(m => m || caches.open(V).then(c => c.match(e.request, { ignoreSearch: true })).then(m2 => m2 || fetch(e.request))));
});
""" % {'v': VERSION, 'html': json.dumps(html_files), 'assets': json.dumps(asset_files)}
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

# og image + sitemap + robots
def og():
    from PIL import ImageFont
    W,H=1200,630; im=Image.new('RGB',(W,H),'#4f46e5'); d=ImageDraw.Draw(im)
    for y in range(H):
        t=y/H; d.line([(0,y),(W,y)],fill=(int(91-49*t),int(82-46*t),int(240-100*t)))
    d.ellipse([850,-150,1350,350],fill=(100,92,240)); d.ellipse([-120,430,260,810],fill=(70,62,200))
    def f(s):
        for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
            if os.path.exists(p): return ImageFont.truetype(p,s)
        return ImageFont.load_default()
    d.text((80,150),"Brainloop",font=f(110),fill='white')
    d.text((84,290),"Five quick puzzles a day.",font=f(48),fill=(225,225,255))
    d.text((84,355),"Free. No sign-up. Works offline.",font=f(40),fill=(200,200,245))
    cols=['#22c55e','#22c55e','#facc15','#22c55e','#ef4444']
    for i,c in enumerate(cols): d.rounded_rectangle([84+i*110,470,84+i*110+90,560],radius=20,fill=c)
    im.save(os.path.join(OUT,'og.png'))
og()
urls=['','guide.html','about.html','privacy.html','learn.html']+sorted(pages)
urls=sorted(set(urls))
open(os.path.join(OUT,'sitemap.xml'),'w').write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://omarmohsen26.github.io/brainloop/%s</loc></url>'%u for u in urls)+'</urlset>')
open(os.path.join(OUT,'robots.txt'),'w').write('User-agent: *\nAllow: /\nSitemap: https://omarmohsen26.github.io/brainloop/sitemap.xml\n')
