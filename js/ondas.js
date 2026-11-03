/* Ondas de la portada: suelo de puntos con ondas que salen del centro.
   Canvas 2D, sin librerías. Se para cuando la portada no se ve y respeta
   prefers-reduced-motion. Uso: <canvas class="hero-ondas" id="heroImg"> dentro de .hero */
(function () {
  var cv = document.querySelector('.hero-ondas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Ajustes ---
  var STEP = 0.36;     // separación entre puntos
  var RMAX = 28;       // tamaño del suelo
  var ALTURA = 0.55;   // altura de las ondas
  var FREQ = 0.9;      // cuántas ondas caben
  var VEL = 2.0;       // velocidad
  var ZC = 16;         // distancia al centro de las ondas
  var HORIZ = 0.16;    // horizonte (fracción de alto)
  var CENTRO = 0.42;   // dónde cae el centro de las ondas (fracción de alto)
  var BG = '#0c0b09', INK = '#f3eee4';

  var pts = [];
  for (var r = 0; r <= RMAX; r += STEP) {
    var n = Math.max(1, Math.round(2 * Math.PI * r / STEP));
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      pts.push(Math.cos(a) * r, Math.sin(a) * r, r);
    }
  }

  var W = 0, H = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce || !running) draw(0);
  }

  function draw(ms) {
    var t = ms * 0.001;
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = INK;

    var f = Math.min(W, H);
    var hy = H * HORIZ;
    var camH = ((CENTRO - HORIZ) * H * ZC) / f;
    var cx = W / 2;

    for (var i = 0; i < pts.length; i += 3) {
      var x = pts[i], zl = pts[i + 1], r = pts[i + 2];
      var z = ZC + zl;
      if (z < 1) continue;

      var s = Math.sin(r * FREQ - t * VEL);
      var y = ALTURA * s * Math.exp(-r * 0.04);

      var sx = cx + (x * f) / z;
      var sy = hy + ((camH - y) * f) / z;
      if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) continue;

      var size = Math.min(3.6, Math.max(0.9, (0.035 * f) / z));
      var niebla = Math.max(0, Math.min(1, (ZC + RMAX - z) / 22));
      var al = niebla * (0.55 + 0.45 * (s + 1) / 2);
      if (al < 0.03) continue;

      ctx.globalAlpha = al;
      ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
    }
  }

  var running = false, raf = 0;
  function loop(ms) { draw(ms); raf = requestAnimationFrame(loop); }
  function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv);
  else window.addEventListener('resize', resize);
  resize();

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting; visible && !document.hidden ? start() : stop();
    }).observe(cv);
  } else start();
  document.addEventListener('visibilitychange', function () { document.hidden || !visible ? stop() : start(); });
})();
