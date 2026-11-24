/* Art for the iterative refinement page: one drawing, refined section by section.
   Pencil (the idea, the brainstorm) -> cyanotype blueprint -> risograph print -> filed in Ready for Work.
   Decorative only (aria-hidden), drawn here from seeded geometry, so every run draws the same pictures.
   Each piece has one progress value, --p (0..1). CSS turns it into each stroke's draw-on, fade or shift:
   every element carries its own window --a..--b of that progress. Scrolling sets --p; reduced motion pins it at 1. */
(function () {
  'use strict';
  if (/[?&]noart\b/.test(location.search)) return;
  document.documentElement.classList.add('art-on');

  var PHI = (1 + Math.sqrt(5)) / 2, TAU = 2 * Math.PI, Q = Math.PI / 2;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  // keep in step with art.css: margins (sticky, anchor-driven) from 860 px, floats beside the text below
  var wideMQ = window.matchMedia('(min-width: 860px)');
  var finalAll = /[?&]final\b/.test(location.search);

  /* ---------- small helpers ---------- */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function n1(v) { return Math.round(v * 10) / 10; }
  function n3(v) { return Math.round(v * 1000) / 1000; }
  function dOf(pts, close) {
    var s = 'M' + n1(pts[0][0]) + ' ' + n1(pts[0][1]);
    for (var i = 1; i < pts.length; i++) s += 'L' + n1(pts[i][0]) + ' ' + n1(pts[i][1]);
    return close ? s + 'Z' : s;
  }
  function densify(pts, step) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (var j = 1; j <= n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
    }
    return out;
  }
  // a smooth hand wobble: three sines with random phase, as a function of position along the stroke (0..1)
  function wobble(r, amp, freq) {
    var k = [];
    for (var i = 0; i < 3; i++) k.push([r() * TAU, freq * (1 + i * 1.7) * (0.7 + 0.6 * r()), amp / (i + 1)]);
    return function (s) {
      return k[0][2] * Math.sin(k[0][1] * s + k[0][0]) + k[1][2] * Math.sin(k[1][1] * s + k[1][0]) +
        k[2][2] * Math.sin(k[2][1] * s + k[2][0]);
    };
  }
  function sketch(pts, r, amp, freq) {
    var wx = wobble(r, amp, freq), wy = wobble(r, amp, freq), n = pts.length - 1;
    return pts.map(function (p, i) { return [p[0] + wx(i / n), p[1] + wy(i / n)]; });
  }
  // window of progress, plus an optional opacity multiplier
  function win(a, b, o) { return ' style="--a:' + n3(a) + ';--b:' + n3(b) + (o != null ? ';--o:' + o : '') + '"'; }
  function path(d, cls, a, b, attrs, o) {
    return '<path class="' + cls + '" d="' + d + '" pathLength="1"' + win(a, b, o) + (attrs || '') + '/>';
  }
  function svg(name, w, h, defs, body) {
    return '<svg class="piece piece--' + name + '" viewBox="0 0 ' + w + ' ' + h + '" focusable="false">' +
      '<defs>' + defs + '</defs>' + body + '</svg>';
  }
  // a log spiral that grows by `g` every quarter turn, ending at angle tEnd with radius rEnd
  function logSpiral(cx, cy, rEnd, tEnd, turns, g, perTurn) {
    var pts = [], n = Math.ceil(turns * (perTurn || 90));
    for (var i = 0; i <= n; i++) {
      var t = tEnd - turns * TAU * (1 - i / n), r = rEnd * Math.pow(g, (t - tEnd) / Q);
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    return pts;
  }
  // torn / deckled paper edge around a rectangle
  function deckle(x0, y0, x1, y1, r, amp) {
    var pts = [], step = 7;
    function edge(ax, ay, bx, by, nx, ny) {
      var n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (var i = 0; i < n; i++) {
        var j = (r() - 0.5) * 2 * amp;
        pts.push([ax + (bx - ax) * i / n + nx * j, ay + (by - ay) * i / n + ny * j]);
      }
    }
    edge(x0, y0, x1, y0, 0, 1); edge(x1, y0, x1, y1, 1, 0); edge(x1, y1, x0, y1, 0, 1); edge(x0, y1, x0, y0, 1, 0);
    return dOf(pts, true);
  }
  // pencil grain plus a hand wobble; the wobble's seed is cycled while the page scrolls (a "boil")
  function graphiteFilter(id) {
    return '<filter id="' + id + '" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="5" result="g"/>' +
      '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4 -1.3" result="ga"/>' +
      '<feComposite in="SourceGraphic" in2="ga" operator="in" result="gs"/>' +
      '<feTurbulence class="boil" type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="1" result="w"/>' +
      '<feDisplacementMap in="gs" in2="w" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>';
  }

  /* ---------- the shared geometry: Fibonacci squares and the spiral they construct ---------- */
  function fibGeom(n) {
    var F = [1, 1];
    while (F.length < n) F.push(F[F.length - 1] + F[F.length - 2]);
    var b = { x0: 0, y0: 0, x1: 1, y1: 1 }, sq = [{ x: 0, y: 0, s: 1, cx: 1, cy: 1, a0: Math.PI }];
    var dirs = ['right', 'up', 'left', 'down'];
    for (var i = 1; i < n; i++) {
      var s = F[i], dir = dirs[(i - 1) % 4], q;
      if (dir === 'right') { q = { x: b.x1, y: b.y0, s: s, cx: b.x1, cy: b.y0 + s, a0: 1.5 * Math.PI }; b.x1 += s; }
      else if (dir === 'up') { q = { x: b.x0, y: b.y1, s: s, cx: b.x0, cy: b.y1, a0: 0 }; b.y1 += s; }
      else if (dir === 'left') { q = { x: b.x0 - s, y: b.y1 - s, s: s, cx: b.x0, cy: b.y1 - s, a0: Q }; b.x0 -= s; }
      else { q = { x: b.x1 - s, y: b.y0 - s, s: s, cx: b.x1, cy: b.y0, a0: Math.PI }; b.y0 -= s; }
      sq.push(q);
    }
    function end(q) { return [q.cx + q.s * Math.cos(q.a0 + Q), q.cy + q.s * Math.sin(q.a0 + Q)]; }
    // the log spiral (growth PHI per quarter turn) through the last two arc ends: B - C = PHI * rot90(A - C)
    var A = end(sq[n - 2]), B = end(sq[n - 1]);
    var k1 = B[0] + PHI * A[1], k2 = B[1] - PHI * A[0], det = 1 + PHI * PHI;
    var C = [(k1 - PHI * k2) / det, (k2 + PHI * k1) / det];
    return { sq: sq, box: b, C: C, rB: Math.hypot(B[0] - C[0], B[1] - C[1]), tB: Math.atan2(B[1] - C[1], B[0] - C[0]) };
  }
  var G = fibGeom(7);
  // blueprint and print share one frame, so the print sits exactly on the plan it came from
  var FRAME = { w: 310, h: 480, u: 18, ox: 44, oy: 24 };
  function mapper(f) {
    return function (x, y) { return [f.ox + (x - G.box.x0) * f.u, f.oy + (G.box.y1 - y) * f.u]; };
  }
  var map = mapper(FRAME);
  function squarePts(q) {
    return [map(q.x, q.y), map(q.x + q.s, q.y), map(q.x + q.s, q.y + q.s), map(q.x, q.y + q.s)];
  }
  function arcPts(q, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) { var a = q.a0 + Q * i / n; pts.push(map(q.cx + q.s * Math.cos(a), q.cy + q.s * Math.sin(a))); }
    return pts;
  }
  function fibSpiralPts(upTo) {
    var pts = [];
    for (var k = 0; k < upTo; k++) {
      var a = arcPts(G.sq[k], 6 + G.sq[k].s * 3);
      pts = pts.concat(k ? a.slice(1) : a);
    }
    return pts;
  }

  /* ---------- 1. hero: the idea, one pencil gesture ---------- */
  function hero() {
    var r = rng(11), s = '';
    var pts = logSpiral(160, 168, 150, -0.32 * Math.PI, 2.35, PHI);
    s += path(dOf(sketch(pts, r, 2.0, 6)), 'd gr', 0.05, 0.8, ' stroke-width="3.1"');
    var back = sketch(pts.slice(Math.floor(pts.length * 0.4)), r, 3.4, 5);
    s += path(dOf(back), 'd gr', 0.42, 0.95, ' stroke-width="1.4"', 0.6);
    var e = pts[pts.length - 1], e2 = pts[pts.length - 5], dx = e[0] - e2[0], dy = e[1] - e2[1], L = Math.hypot(dx, dy);
    var tail = sketch(densify([e, [e[0] + dx / L * 30 - 4, e[1] + dy / L * 30 + 8]], 3), r, 1, 2);
    s += path(dOf(tail), 'd gr', 0.8, 0.9, ' stroke-width="1.7"');
    s += '<circle class="f gr-fill" cx="' + n1(pts[0][0]) + '" cy="' + n1(pts[0][1]) + '" r="2.8"' + win(0, 0.05) + '/>';
    return svg('hero', 320, 320, graphiteFilter('grf-hero'), '<g filter="url(#grf-hero)">' + s + '</g>');
  }

  /* ---------- 2. brainstorm: loose attempts, one crossed out, the one that works circled ---------- */
  function brainstorm() {
    var r = rng(29), s = '';
    function at(k) { var a = 0.02 + k * 0.082; return [a, a + 0.14]; }
    function stroke(pts, k, w, amp, o) {
      var g = at(k);
      return path(dOf(sketch(densify(pts, 3), r, amp, 5)), 'd gr', g[0], g[1], ' stroke-width="' + w + '"', o);
    }
    var t, j, x, y;
    var loop = [];
    for (t = 0; t <= 1.18 * TAU; t += 0.08) loop.push([74 + 38 * Math.cos(t) * (1 + 0.07 * Math.sin(3 * t)), 76 + 33 * Math.sin(t)]);
    s += stroke(loop, 0, 1.8, 2.2);
    var sqs = [[224, 82]], L = 9, dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    x = 224; y = 82;
    for (j = 0; j < 9; j++) { x += dirs[j % 4][0] * L; y += dirs[j % 4][1] * L; sqs.push([x, y]); if (j % 2) L += 13; }
    s += stroke(sqs, 1, 1.7, 1.4);
    var wave = [];
    for (t = 0; t <= 1; t += 0.02) wave.push([36 + 104 * t, 212 + 21 * Math.sin(t * 3 * Math.PI) * (1 - 0.3 * t)]);
    s += stroke(wave, 2, 1.8, 1.6);
    s += stroke(logSpiral(224, 212, 52, -0.4 * Math.PI, 1.95, PHI, 70), 3, 2.2, 1.2);
    var tri = [[86, 338]], ang = -Math.PI / 2, Lt = 10;
    x = 86; y = 338;
    for (j = 0; j < 7; j++) { x += Math.cos(ang) * Lt; y += Math.sin(ang) * Lt; tri.push([x, y]); ang += TAU / 3 + 0.12; Lt += 11; }
    s += stroke(tri, 4, 1.7, 1.5);
    var over = [];
    for (t = 0; t <= 4.2 * TAU; t += 0.07) { var rr = 4 + 9 * t / TAU; over.push([226 + rr * Math.cos(t), 344 + rr * 0.9 * Math.sin(t)]); }
    s += stroke(over, 5, 1.1, 1.8, 0.8);
    // stray marks while thinking
    [[150, 140], [40, 150], [160, 285], [282, 150], [140, 412]].forEach(function (m, i) {
      s += '<circle class="f gr-fill" cx="' + m[0] + '" cy="' + m[1] + '" r="' + (1.4 + (i % 2)) + '"' + win(0.08 + i * 0.1, 0.12 + i * 0.1) + '/>';
    });
    s += stroke([[18, 288], [36, 282]], 2.6, 1.4, 0.6) + stroke([[262, 412], [292, 405]], 4.6, 1.4, 0.6);
    // the overworked one gets crossed out
    s += stroke([[186, 304], [268, 384]], 6.0, 2.3, 1.1) + stroke([[268, 304], [188, 386]], 6.35, 2.3, 1.1);
    // the one that works gets circled, and an arrow says "this one"
    var lasso = [];
    for (t = 0; t <= 1.13 * TAU; t += 0.05) {
      var lr = 1 + 0.09 * t / TAU, lx = 84 * lr * Math.cos(t - 2.6), ly = 60 * lr * Math.sin(t - 2.6), ca = Math.cos(-0.24), sa = Math.sin(-0.24);
      lasso.push([220 + lx * ca - ly * sa, 214 + lx * sa + ly * ca]);
    }
    s += path(dOf(sketch(lasso, r, 2.6, 3)), 'd gr', 0.8, 0.93, ' stroke-width="2.6"');
    s += path(dOf(sketch(densify([[96, 296], [130, 276], [150, 262]], 3), r, 1.2, 2)), 'd gr', 0.92, 0.97, ' stroke-width="1.8"');
    s += path(dOf([[137, 260], [151, 261], [146, 274]]), 'd gr', 0.96, 1, ' stroke-width="1.8"');
    return svg('brainstorm', 310, 440, graphiteFilter('grf-brainstorm'), '<g filter="url(#grf-brainstorm)">' + s + '</g>');
  }

  /* ---------- 3. blueprint: three passes, one per prompt; the spiral only emerges on the last ---------- */
  var BP = '#1f4a7c', BPL = '#eef3fa';
  function construction(width, a, b, sqRange, arcRange) {
    var s = '', order = [];
    for (var k = G.sq.length - 1; k >= 0; k--) order.push(k);
    if (sqRange) order.forEach(function (k, i) {
      var w = (sqRange[1] - sqRange[0]) / order.length;
      s += path(dOf(squarePts(G.sq[k]), true), 'd', sqRange[0] + i * w * 0.8, sqRange[0] + (i + 1.6) * w,
        ' fill="none" stroke="' + BPL + '" stroke-width="' + width + '"');
    });
    if (arcRange) s += path(dOf(fibSpiralPts(G.sq.length)), 'd', arcRange[0], arcRange[1],
      ' fill="none" stroke="' + BPL + '" stroke-width="' + (width * 2.4) + '" stroke-linecap="round"');
    return s;
  }
  function blueprint() {
    var r = rng(41), s = '', f = FRAME;
    var sheet = deckle(7, 7, f.w - 7, f.h - 7, r, 1.1);
    var defs = '<clipPath id="bp-clip"><path d="' + sheet + '"/></clipPath>' +
      '<filter id="bp-mot" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".03 .055" numOctaves="3" seed="9"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .4 0 0 0 -.17"/></filter>';
    s += '<path class="f" d="' + sheet + '" fill="' + BP + '"' + win(0, 0.08) + '/>';
    var body = '<rect class="f" x="0" y="0" width="' + f.w + '" height="' + f.h + '" filter="url(#bp-mot)"' + win(0, 0.1) + '/>';
    var grid = '';
    for (var gx = 14; gx < f.w; gx += 12) grid += 'M' + gx + ' 0V' + f.h;
    for (var gy = 12; gy < f.h; gy += 12) grid += 'M0 ' + gy + 'H' + f.w;
    body += '<path class="f" d="' + grid + '" stroke="' + BPL + '" stroke-width=".4" fill="none"' + win(0.06, 0.22, 0.16) + '/>';

    // pass 1 (Blueprint 1): the frame and the squares, largest first, with their sizes
    var bx0 = map(G.box.x0, G.box.y1), bx1 = map(G.box.x1, G.box.y0);
    body += construction(1.1, 0, 0, [0.27, 0.47]);
    G.sq.slice().reverse().forEach(function (q, i) {
      var c = map(q.x, q.y + q.s), fs = Math.max(6.5, Math.min(13, q.s * 3.6)), pad = Math.max(3, q.s * 1.6);
      body += '<text class="f" x="' + n1(c[0] + pad) + '" y="' + n1(c[1] + pad + fs * 0.8) + '" font-size="' + n1(fs) +
        '" fill="' + BPL + '" font-family="Instrument Sans, sans-serif"' + win(0.3 + i * 0.025, 0.34 + i * 0.025, 0.85) + '>' + q.s + '</text>';
    });

    // pass 2 (Blueprint 2): research and pitfalls: compass circles, dimensions, a detail lens, the title block
    var circles = '';
    [6, 5, 4].forEach(function (k) {
      var q = G.sq[k], c = map(q.cx, q.cy);
      circles += '<circle cx="' + n1(c[0]) + '" cy="' + n1(c[1]) + '" r="' + n1(q.s * f.u) + '"/>';
    });
    body += '<g class="f" fill="none" stroke="' + BPL + '" stroke-width=".7" stroke-dasharray="3 4"' + win(0.5, 0.58, 0.45) + '>' + circles + '</g>';
    var dimX = bx0[0] - 16, dimY = bx1[1] + 14;
    body += path('M' + dimX + ' ' + bx0[1] + 'V' + bx1[1] + 'M' + (dimX - 4) + ' ' + (bx0[1] + 4) + 'l8 -8M' + (dimX - 4) + ' ' + (bx1[1] + 4) + 'l8 -8',
      'd', 0.54, 0.62, ' fill="none" stroke="' + BPL + '" stroke-width=".8"');
    body += path('M' + bx0[0] + ' ' + dimY + 'H' + bx1[0] + 'M' + (bx0[0] - 4) + ' ' + (dimY + 4) + 'l8 -8M' + (bx1[0] - 4) + ' ' + (dimY + 4) + 'l8 -8',
      'd', 0.56, 0.64, ' fill="none" stroke="' + BPL + '" stroke-width=".8"');
    var midY = (bx0[1] + bx1[1]) / 2, midX = (bx0[0] + bx1[0]) / 2;
    body += '<g class="f" fill="' + BPL + '" font-family="Instrument Sans, sans-serif" font-size="9"' + win(0.6, 0.65) + '>' +
      '<rect x="' + (dimX - 7) + '" y="' + (midY - 9) + '" width="14" height="18" fill="' + BP + '"/>' +
      '<text x="' + dimX + '" y="' + (midY + 3) + '" text-anchor="middle" transform="rotate(-90 ' + dimX + ' ' + midY + ')">21</text>' +
      '<rect x="' + (midX - 9) + '" y="' + (dimY - 6) + '" width="18" height="12" fill="' + BP + '"/>' +
      '<text x="' + midX + '" y="' + (dimY + 3.2) + '" text-anchor="middle">13</text></g>';
    // the detail lens: the spiral's eye, magnified, in the empty middle of the largest square
    var top = G.sq[6], L = map(top.x + top.s / 2, top.y + top.s / 2), eye = map(G.C[0], G.C[1]), R = 46, kz = 2.5;
    defs += '<clipPath id="bp-lens"><circle cx="' + n1(L[0]) + '" cy="' + n1(L[1]) + '" r="' + R + '"/></clipPath>';
    var ex = eye[0] - L[0], ey = eye[1] - L[1], el = Math.hypot(ex, ey);
    body += path('M' + n1(L[0] + ex / el * R) + ' ' + n1(L[1] + ey / el * R) + 'L' + n1(eye[0] - ex / el * 20) + ' ' + n1(eye[1] - ey / el * 20),
      'd', 0.62, 0.68, ' fill="none" stroke="' + BPL + '" stroke-width=".8"');
    body += path(dOf(logSpiral(eye[0], eye[1], 20, 0, 1, 1, 60), true), 'd', 0.62, 0.68, ' fill="none" stroke="' + BPL + '" stroke-width=".8"');
    var zoom = 'translate(' + n1(L[0]) + ' ' + n1(L[1]) + ') scale(' + kz + ') translate(' + n1(-eye[0]) + ' ' + n1(-eye[1]) + ')';
    var lensInner = '';
    G.sq.forEach(function (q, k) { if (k < 5) lensInner += '<path d="' + dOf(squarePts(q), true) + '"/>'; });
    body += '<g class="f"' + win(0.64, 0.71) + '><circle cx="' + n1(L[0]) + '" cy="' + n1(L[1]) + '" r="' + R + '" fill="' + BP + '" stroke="' + BPL + '" stroke-width="1.2"/>' +
      '<g clip-path="url(#bp-lens)"><g transform="' + zoom + '" fill="none" stroke="' + BPL + '" stroke-width="1.1" vector-effect="non-scaling-stroke">' +
      lensInner.replace(/<path /g, '<path vector-effect="non-scaling-stroke" ') + '</g></g></g>';
    body += '<g clip-path="url(#bp-lens)"><g transform="' + zoom + '">' +
      path(dOf(fibSpiralPts(5)), 'd', 0.9, 1, ' fill="none" stroke="' + BPL + '" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linecap="round"') + '</g></g>';
    // title block, bottom right
    var tbx = f.w - 112, tby = f.h - 44;
    body += path('M' + tbx + ' ' + tby + 'h96v30h-96zM' + (tbx + 40) + ' ' + tby + 'v30M' + (tbx + 40) + ' ' + (tby + 15) + 'h56',
      'd', 0.68, 0.75, ' fill="none" stroke="' + BPL + '" stroke-width=".8"');
    body += path(dOf(logSpiral(tbx + 20, tby + 15, 11, -0.3 * Math.PI, 1.8, PHI, 40)), 'd', 0.72, 0.75, ' fill="none" stroke="' + BPL + '" stroke-width=".9"');

    // pass 3 (Blueprint 3): look across everything; the diagonals cross at the eye and the spiral appears
    var d1a = map(G.box.x1, G.box.y1), d1b = map(G.box.x0, G.box.y0);
    var last = G.sq[6], d2a = map(G.box.x0, last.y), d2b = map(G.box.x1, G.box.y0);
    body += '<g class="f" stroke="' + BPL + '" stroke-width=".8" stroke-dasharray="6 3 1 3" fill="none"' + win(0.75, 0.82, 0.6) + '>' +
      '<path d="M' + n1(d1a[0]) + ' ' + n1(d1a[1]) + 'L' + n1(d1b[0]) + ' ' + n1(d1b[1]) + '"/>' +
      '<path d="M' + n1(d2a[0]) + ' ' + n1(d2a[1]) + 'L' + n1(d2b[0]) + ' ' + n1(d2b[1]) + '"/></g>';
    body += construction(1.1, 0, 0, null, [0.8, 0.97]);
    body += '<g class="f" stroke="' + BPL + '" stroke-width="1" fill="none"' + win(0.95, 1) + '><circle cx="' + n1(eye[0]) + '" cy="' + n1(eye[1]) + '" r="3.5"/>' +
      '<path d="M' + n1(eye[0] - 7) + ' ' + n1(eye[1]) + 'h14M' + n1(eye[0]) + ' ' + n1(eye[1] - 7) + 'v14"/></g>';
    s += '<g clip-path="url(#bp-clip)">' + body + '</g>';
    return svg('blueprint', f.w, f.h, defs, s);
  }

  /* ---------- 4. the starter repo: printed shell, one state per repo prompt ---------- */
  var INK = '#1d1c21', VER = '#cf4a2b', PAPER = '#f2e8d3';
  function shellGeom() {
    var C = G.C, rB = G.rB, tB = G.tB, D = TAU / 15;
    function Ps(t) { var rr = rB * Math.pow(PHI, (t - tB) / Q); return map(C[0] + rr * Math.cos(t), C[1] + rr * Math.sin(t)); }
    function arc(t0, t1) {
      var n = Math.max(2, Math.ceil(Math.abs(t1 - t0) / 0.04)), pts = [];
      for (var i = 0; i <= n; i++) pts.push(Ps(t0 + (t1 - t0) * i / n));
      return pts;
    }
    function septum(t, bow) { // outer wall to inner whorl, bowed toward the opening (a negative bow curves back)
      var O = Ps(t), I = Ps(t - TAU), T = Ps(t + 0.02), tx = T[0] - O[0], ty = T[1] - O[1], tl = Math.hypot(tx, ty) || 1;
      var len = Math.hypot(O[0] - I[0], O[1] - I[1]), k = bow == null ? 0.22 : bow;
      var m = [(O[0] + I[0]) / 2 + tx / tl * len * k, (O[1] + I[1]) / 2 + ty / tl * len * k], pts = [];
      for (var i = 0; i <= 10; i++) {
        var s = i / 10, a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s;
        pts.push([a * O[0] + b * m[0] + c * I[0], a * O[1] + b * m[1] + c * I[1]]);
      }
      return { pts: pts, len: len };
    }
    var septa = [];
    for (var k = 0; ; k++) {
      var t = tB - 1.1 * D - k * D, sp = septum(t);
      if (sp.len < 2.6) break;
      septa.push({ t: t, pts: sp.pts });
    }
    var chambers = [];
    for (k = 0; k < septa.length - 1; k++) {
      var a = septa[k], b = septa[k + 1];
      chambers.push(arc(b.t, a.t).concat(a.pts, arc(a.t - TAU, b.t - TAU), b.pts.slice().reverse()));
    }
    var lip = septum(tB, -0.2).pts;
    var living = arc(septa[0].t, tB).concat(lip, arc(tB - TAU, septa[0].t - TAU), septa[0].pts.slice().reverse());
    var stripes = [];
    for (var i = 0; i < 10; i++) {
      var t0 = tB - 0.98 * TAU + i * 0.43, w = 0.14, dep = 0.4 + 0.1 * Math.sin(i * 1.9);
      var lerp = function (tt, fr) { var o = Ps(tt), n = Ps(tt - TAU); return [o[0] + (n[0] - o[0]) * fr, o[1] + (n[1] - o[1]) * fr]; };
      stripes.push(arc(t0, t0 + w).concat([lerp(t0 + w * 0.6, dep * 0.75), lerp(t0 - w * 0.3, dep), lerp(t0 + w * 0.05, dep * 0.55)]));
    }
    return { wall: arc(tB - 2.85 * TAU, tB), aperture: lip, septa: septa, chambers: chambers, living: living, stripes: stripes };
  }
  var SHELL = shellGeom();
  function printDefs(p) {
    var d = '';
    [['hA', 3.1, 32, 0.7], ['hB', 3.1, -38, 0.7], ['hC', 2.3, 74, 0.6]].forEach(function (h) {
      d += '<pattern id="' + p + h[0] + '" patternUnits="userSpaceOnUse" width="' + h[1] + '" height="' + h[1] + '" patternTransform="rotate(' + h[2] + ')">' +
        '<path d="M0 0V' + h[1] + '" stroke="' + INK + '" stroke-width="' + h[3] + '"/></pattern>';
    });
    [0.7, 1.05, 1.4, 1.75].forEach(function (rad, i) {
      d += '<pattern id="' + p + 't' + i + '" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(18)">' +
        '<circle cx="2" cy="2" r="' + rad + '" fill="' + VER + '"/></pattern>';
    });
    return d;
  }
  // the print itself. With `still`, every element is drawn finished (used for the plate in the folder).
  function printBody(p, still) {
    var r = rng(53), s = '', f = FRAME, n = SHELL.chambers.length;
    function W(a, b, o) { return still ? (o != null ? ' style="--o:' + o + '"' : '') : win(a, b, o); }
    var card = deckle(8, 8, f.w - 8, f.h - 8, r, 0.8);
    s += '<path d="' + card + '" fill="' + PAPER + '" stroke="#00000022" stroke-width="1"/>';
    // the plan it was built from, ghosted
    var ghost = '';
    G.sq.forEach(function (q) { ghost += '<path d="' + dOf(squarePts(q), true) + '"/>'; });
    s += '<g class="f" fill="none" stroke="' + BP + '" stroke-width=".6"' + W(0.02, 0.18, 0.28) + '>' + ghost + '</g>';
    function reg(x, y, col) {
      return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="none" stroke="' + col + '" stroke-width=".8"/>' +
        '<path d="M' + (x - 8) + ' ' + y + 'h16M' + x + ' ' + (y - 8) + 'v16" stroke="' + col + '" stroke-width=".8"/>';
    }
    // Repo 4 (final round): the colour plate, a little off register, settling as it lands
    var colour = '<path d="' + dOf(SHELL.living, true) + '" fill="url(#' + p + 't0)"/>';
    SHELL.chambers.forEach(function (c, k) {
      var lvl = Math.min(3, Math.floor(k / Math.max(1, n / 4)));
      colour += '<path class="f" d="' + dOf(c, true) + '" fill="url(#' + p + 't' + lvl + ')"' + W(0.8 + 0.12 * k / n, 0.86 + 0.12 * k / n) + '/>';
    });
    SHELL.stripes.forEach(function (st, i) {
      colour += '<path class="f" d="' + dOf(st, true) + '" fill="' + VER + '"' + W(0.88 + i * 0.015, 0.92 + i * 0.015, 0.92) + '/>';
    });
    colour += reg(26, 24, VER) + reg(f.w - 26, f.h - 24, VER);
    s += '<g class="' + (still ? '' : 'm f') + '"' + (still ? ' transform="translate(1.3 -0.9)"' : W(0.8, 1)) + '>' + colour + '</g>';
    s += '<g class="f"' + W(0, 0.12) + '>' + reg(26, 24, INK) + reg(f.w - 26, f.h - 24, INK) + '</g>';
    // Repo 3 (research dive): engraving dives inward, chamber by chamber
    SHELL.chambers.forEach(function (c, k) {
      var a = 0.6 + 0.17 * k / n, pat = k % 2 ? 'hB' : 'hA';
      s += '<path class="f" d="' + dOf(c, true) + '" fill="url(#' + p + pat + ')"' + W(a, a + 0.03, 0.85) + '/>';
      if (k > n * 0.45) s += '<path class="f" d="' + dOf(c, true) + '" fill="url(#' + p + 'hC)"' + W(a + 0.01, a + 0.04, 0.7) + '/>';
    });
    // Repo 2 (repair and build): the chambers are built outward, newest last
    SHELL.septa.slice().reverse().forEach(function (sp, i, all) {
      var a = 0.4 + 0.18 * i / all.length;
      s += path(dOf(sp.pts), 'd', a, a + 0.03, ' fill="none" stroke="' + INK + '" stroke-width="1.1" stroke-linecap="round"');
    });
    // Repo 1 (review): the outline is traced over the plan
    s += path(dOf(SHELL.wall), 'd', 0.2, 0.36, ' fill="none" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"');
    s += path(dOf(SHELL.aperture), 'd', 0.36, 0.4, ' fill="none" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"');
    return s;
  }
  function repo() {
    return svg('repo', FRAME.w, FRAME.h, printDefs('pr-'), printBody('pr-', false));
  }

  /* ---------- 5. Ready for Work: the finished print is filed with the others ---------- */
  function ready() {
    var r = rng(67), s = '', MAN = '#d6b06b', MAN2 = '#a9853f';
    s += '<path d="M24 122H204L212 104H284L290 122V322H24Z" fill="' + MAN + '" stroke="' + MAN2 + '" stroke-width="1.2"/>';
    // other projects already in the folder: a blueprint and a pencil sheet
    s += '<g transform="rotate(-6 110 190)"><path d="' + deckle(50, 86, 176, 290, r, 0.8) + '" fill="' + BP + '"/>' +
      '<path d="M64 102h70v70h-70zM134 102h32v32h-32z" fill="none" stroke="' + BPL + '" stroke-width=".7" opacity=".7"/></g>';
    s += '<g transform="rotate(5 220 190)"><path d="' + deckle(164, 80, 288, 290, r, 0.8) + '" fill="#ece5d7"/>' +
      '<path d="' + dOf(sketch(densify(logSpiral(246, 118, 24, 0, 1.6, 1.5, 50), 3), r, 1.2, 4)) + '" fill="none" stroke="#4a4640" stroke-width="1.3" opacity=".8"/></g>';
    // the new print slides in from above
    s += '<g class="sl"' + win(0, 1) + '><g transform="translate(88 20) scale(.46)" style="--p:1">' + printBody('rd-', true) + '</g></g>';
    s += '<path d="M14 228L306 218V326H14Z" fill="#dcb676" stroke="' + MAN2 + '" stroke-width="1.2"/>';
    s += '<path d="M14 228L306 218" stroke="#f3dca6" stroke-width="1.4" opacity=".7"/>';
    s += '<rect x="34" y="250" width="132" height="28" fill="#f5eedd" stroke="' + MAN2 + '" stroke-width=".8" transform="rotate(-1.2 100 264)"/>';
    s += '<text x="100" y="269" text-anchor="middle" transform="rotate(-1.2 100 264)" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="14" fill="#3b2f19">Ready for Work</text>';
    return svg('ready', 320, 334, printDefs('rd-'), s);
  }

  /* ---------- mounting and progress ---------- */
  var plan = [
    { sel: 'main > .hero', side: 'right', make: hero, name: 'hero', time: true },
    { sel: '#brainstorm', side: 'left', make: brainstorm, name: 'brainstorm', anchors: ['h2', 'p:nth-of-type(1)', 'p:nth-of-type(2)', '.watch'] },
    { sel: '#blueprint', side: 'right', make: blueprint, name: 'blueprint', anchors: ['h2', '#b1-card', '#b2-card', '#b3-card'] },
    { sel: '#repo', side: 'left', make: repo, name: 'repo', anchors: ['h2', '#r1-card', '#r2-card', '#r3-card', '#r4-card'] },
    { sel: '#ready', side: 'right', make: ready, name: 'ready', anchors: ['h2', 'p'] }
  ];
  var pieces = [];
  plan.forEach(function (pl) {
    var sec = document.querySelector(pl.sel);
    if (!sec) return;
    var box = document.createElement('div');
    box.className = 'art art--' + pl.side + ' art--' + pl.name;
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<div class="art-stage">' + pl.make() + '</div>';
    // after the heading: wide, the box is absolute (its place in the flow doesn't matter); narrow, it floats beside
    // the section's opening paragraph
    var head = sec.querySelector(':scope > h1, :scope > h2');
    sec.insertBefore(box, head ? head.nextSibling : sec.firstChild);
    // the section's colour band grows to hold its piece: art.css reads the piece's height-to-width ratio
    var vb = box.querySelector('svg').viewBox.baseVal;
    sec.style.setProperty('--ar', (vb.height / vb.width).toFixed(3));
    pieces.push({
      name: pl.name, box: box, svg: box.querySelector('svg'), time: pl.time,
      anchors: (pl.anchors || []).map(function (q) { return sec.querySelector(q); }).filter(Boolean),
      p: -1, held: null
    });
  });

  function setP(pc, p) {
    p = clamp(p, 0, 1);
    if (Math.abs(p - pc.p) < 0.0005) return;
    pc.p = p;
    pc.svg.style.setProperty('--p', p.toFixed(4));
  }
  function still() { return finalAll || reduceMQ.matches; }
  function anchorP(el, vh, from, len) { return clamp((vh * from - el.getBoundingClientRect().top) / (vh * len), 0, 1); }
  function update() {
    var vh = window.innerHeight || 800, wide = wideMQ.matches;
    pieces.forEach(function (pc) {
      if (pc.held != null) return setP(pc, pc.held);
      if (still()) return setP(pc, 1);
      if (pc.time) return;
      var p;
      if (wide && pc.anchors.length) {
        var sum = 0;
        pc.anchors.forEach(function (a, i) { sum += i ? anchorP(a, vh, 0.8, 0.3) : anchorP(a, vh, 0.95, 0.4); });
        p = sum / pc.anchors.length;
      } else {
        p = anchorP(pc.box, vh, 0.95, 0.55);
      }
      setP(pc, p);
    });
  }

  // the hero draws itself once on load
  var heroPc = pieces.filter(function (pc) { return pc.time; })[0];
  function playHero() {
    if (!heroPc) return;
    if (still()) return setP(heroPc, 1);
    var t0 = null, dur = 2300;
    setP(heroPc, 0);
    function step(ts) {
      if (heroPc.held != null || still()) return update();
      if (t0 == null) t0 = ts;
      var x = clamp((ts - t0 - 250) / dur, 0, 1), e = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      setP(heroPc, e);
      boil();
      if (x < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // pencil lines "boil" (redraw slightly) while the page moves, and stop when it stops
  var boilEls = Array.prototype.slice.call(document.querySelectorAll('.art .boil')), boilSeed = 1, boilT = 0, boilTimer = null;
  function boil() {
    if (still()) return;
    var now = Date.now();
    if (now - boilT < 110) return;
    boilT = now;
    boilSeed = boilSeed % 3 + 1;
    boilEls.forEach(function (b) { b.setAttribute('seed', String(boilSeed)); });
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; update(); boil(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  [reduceMQ, wideMQ].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', function () { pieces.forEach(function (pc) { pc.p = -1; }); update(); });
  });
  update();
  playHero();

  // hooks for the preview bar and the screenshot script
  window.__art = {
    final: function (on) { finalAll = !!on; pieces.forEach(function (pc) { pc.p = -1; }); update(); if (!on) playHero(); },
    hold: function (name, p) { pieces.forEach(function (pc) { if (pc.name === name) { pc.held = p; pc.p = -1; } }); update(); },
    release: function () { pieces.forEach(function (pc) { pc.held = null; pc.p = -1; }); update(); },
    names: pieces.map(function (pc) { return pc.name; })
  };
})();
