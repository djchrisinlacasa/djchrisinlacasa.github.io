/* Pilares de la portada: 3x3 columnas negras en vista isométrica que suben y bajan
   como un ecualizador a 124 BPM, con filos y luz dorada que laten con el bombo.
   Canvas 2D, sin librerías. Se para cuando la portada no se ve y respeta
   prefers-reduced-motion. Uso: <canvas class="hero-fondo" id="heroImg"> dentro de .hero
   (js/ondas.js es el diseño anterior de la portada, por si se quiere volver). */
(function () {
  var cv = document.querySelector('.hero-fondo');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Ajustes ---
  var BPM = 124;     // ritmo
  var N = 3;         // pilares por lado
  var ONDA = 0.55;   // cuánto suben y bajan (relativo al escalón)
  var GOLPE = 0.25;  // salto en cada bombo
  var BG = '#0c0b09';
  var ORO = '245,183,0';

  var W = 0, H = 0, running = false, raf = 0, visible = true;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce || !running) draw(0);
  }

  function poly(pts, fill) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function line(pts, color, w) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  }

  function draw(ms) {
    var beat = (ms / 1000) * BPM / 60;
    var kick = reduce ? 0.3 : Math.exp(-(beat % 1) * 6);
    var ancho = W > 820;

    var a = (ancho ? Math.min(W * 0.4, H * 0.5) : Math.min(W * 0.62, H * 0.42)) / (2 * N);
    var b = a * 0.52;
    var step = b * 1.35;
    var cx = ancho ? W * 0.7 : W / 2;
    var y0 = H * (ancho ? 0.36 : 0.22);
    var fondo = H + 50;
    function P(u, v, h) { return [cx + (u - v) * a, y0 + (u + v) * b - h]; }

    // fondo negro cálido con un halo dorado que late
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    var r = a * N * 2.2;
    var halo = ctx.createRadialGradient(cx, y0, 0, cx, y0, r);
    halo.addColorStop(0, 'rgba(' + ORO + ',' + (0.10 + 0.08 * kick) + ')');
    halo.addColorStop(1, 'rgba(' + ORO + ',0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

    var orden = [];
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) orden.push([i, j]);
    orden.sort(function (p, q) { return (p[0] + p[1]) - (q[0] + q[1]); });

    for (var n = 0; n < orden.length; n++) {
      var ci = orden[n][0], cj = orden[n][1], d = ci + cj;
      var ola = Math.sin(beat * Math.PI / 2 - d * 0.9);
      var salto = kick * GOLPE * (1 - d / (2 * N));
      var h = (2 * (N - 1) - d) * step + (ola * ONDA + salto) * step + step * 0.4;

      var t0 = P(ci, cj, h), t1 = P(ci + 1, cj, h), t2 = P(ci + 1, cj + 1, h), t3 = P(ci, cj + 1, h);
      function abajo(p) { return [p[0], fondo]; }

      // cara derecha: negra, con reflejo dorado arriba
      var rg = ctx.createLinearGradient(0, t1[1], 0, t1[1] + a * 2.5);
      rg.addColorStop(0, 'rgba(' + ORO + ',' + (0.10 + 0.12 * kick) + ')');
      rg.addColorStop(0.25, '#0b0a07'); rg.addColorStop(1, '#040302');
      poly([t1, t2, abajo(t2), abajo(t1)], rg);

      // cara izquierda: algo más clara
      var lg = ctx.createLinearGradient(0, t3[1], 0, t3[1] + a * 3);
      lg.addColorStop(0, 'rgba(' + ORO + ',' + (0.16 + 0.16 * kick) + ')');
      lg.addColorStop(0.2, '#16130e'); lg.addColorStop(1, '#080705');
      poly([t3, t2, abajo(t2), abajo(t3)], lg);

      // tapa con brillo
      var tg = ctx.createLinearGradient(t0[0], t0[1], t2[0], t2[1]);
      tg.addColorStop(0, '#2b2519'); tg.addColorStop(0.55, '#15120d'); tg.addColorStop(1, '#0d0b08');
      poly([t0, t1, t2, t3], tg);

      // filos dorados que laten
      line([t3, t0, t1], 'rgba(' + ORO + ',' + (0.55 + 0.45 * kick) + ')', 1.4);
      line([t3, t2, t1], 'rgba(' + ORO + ',' + (0.25 + 0.3 * kick) + ')', 1);
      line([t2, abajo(t2)], 'rgba(' + ORO + ',0.12)', 1);
    }
  }

  function loop(ms) { draw(ms); raf = requestAnimationFrame(loop); }
  function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv);
  else window.addEventListener('resize', resize);
  resize();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting; visible && !document.hidden ? start() : stop();
    }).observe(cv);
  } else start();
  document.addEventListener('visibilitychange', function () { document.hidden || !visible ? stop() : start(); });
})();
