/* Fondo 3D: una pista de puntos dorados que ondula al ritmo de un bombo a 124 BPM
   y un vinilo de partículas girando encima. Se mueve con el scroll y con el ratón.
   WebGL puro, sin librerías. Si el navegador no tiene WebGL, la web se ve igual que antes. */
(function () {
  var canvas = document.createElement('canvas');
  canvas.className = 'fondo3d';
  canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return;
  document.body.insertBefore(canvas, document.body.firstChild);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 760px)').matches;

  /* ---------- geometría: pista (rejilla) + vinilo (anillos) ---------- */
  var GRID = small ? 84 : 140, SPAN = 16;
  var RINGS = small ? 34 : 58, PER = small ? 110 : 180;
  var data = [];
  for (var i = 0; i < GRID; i++) {
    for (var j = 0; j < GRID; j++) {
      data.push((i / (GRID - 1) - 0.5) * SPAN * 2, 0, (j / (GRID - 1) - 0.5) * SPAN * 2, 0);
    }
  }
  for (var r = 0; r < RINGS; r++) {
    var rad = 0.55 + (r / (RINGS - 1)) * 2.6;      // del sello al borde del disco
    var n = Math.round(PER * (0.35 + rad / 3.15));
    for (var k = 0; k < n; k++) {
      data.push(rad, (k / n) * Math.PI * 2 + r * 0.37, 0, 1);
    }
  }
  var COUNT = data.length / 4;
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  /* ---------- shaders ---------- */
  var vs = [
    'attribute vec4 a;',
    'uniform mat4 uP, uV;',
    'uniform float uT, uBeat, uSpin, uDpr, uLift;',
    'varying float vA; varying float vH;',
    'void main(){',
    '  vec3 p;',
    '  if (a.w < 0.5) {',
    '    vec2 q = a.xz;',
    '    float d = length(q);',
    '    float h = sin(q.x*0.45 + uT*0.6)*0.35 + cos(q.y*0.38 - uT*0.45)*0.35;',
    '    h += sin(d*1.4 - uT*3.2) * exp(-d*0.16) * (0.35 + 0.55*uBeat);',
    '    p = vec3(q.x, h - 1.6, q.y);',
    '    vH = clamp(h*0.8 + 0.3, 0.0, 1.0);',
    '  } else {',
    '    float th = a.y + uSpin;',
    '    vec3 disc = vec3(cos(th)*a.x, sin(a.x*9.0 + uT*2.0)*0.025, sin(th)*a.x);',
    '    float tilt = 0.0;',
    '    p = vec3(disc.x, disc.y*cos(tilt) - disc.z*sin(tilt), disc.y*sin(tilt) + disc.z*cos(tilt));',
    '    p.y += 0.55 + uLift + uBeat*0.06;',
    '    vH = a.x < 0.75 ? 1.0 : 0.55 + 0.45*step(0.98, fract(a.x*3.1));',
    '  }',
    '  vec4 v = uV * vec4(p, 1.0);',
    '  gl_Position = uP * v;',
    '  float z = -v.z;',
    '  gl_PointSize = (a.w < 0.5 ? 5.0 : 4.0) * uDpr * (9.0 / z);',
    '  vA = clamp(1.4 - z/26.0, 0.0, 1.0) * (a.w < 0.5 ? 0.8 : 0.6);',
    '}'
  ].join('\n');
  var fs = [
    'precision mediump float;',
    'varying float vA; varying float vH;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float m = smoothstep(0.5, 0.15, length(c));',
    '  vec3 gold = vec3(0.96, 0.72, 0.0);',
    '  vec3 ink = vec3(0.95, 0.93, 0.89);',
    '  vec3 col = mix(gold*0.55, mix(gold, ink, 0.35), vH);',
    '  gl_FragColor = vec4(col, m * vA);',
    '}'
  ].join('\n');
  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var prog = gl.createProgram();
  var v1 = sh(gl.VERTEX_SHADER, vs), f1 = sh(gl.FRAGMENT_SHADER, fs);
  if (!v1 || !f1) { canvas.remove(); return; }
  gl.attachShader(prog, v1); gl.attachShader(prog, f1); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  var loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uP', 'uV', 'uT', 'uBeat', 'uSpin', 'uDpr', 'uLift'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);   // los puntos suman luz, como en una cabina
  gl.clearColor(0, 0, 0, 0);

  /* ---------- matemáticas de cámara ---------- */
  function persp(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
  }
  function lookAt(e, c) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    var l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xz); xx /= l; xz /= l; // up = (0,1,0)
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }

  /* ---------- tamaño ---------- */
  var dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(U.uP, false, persp(0.9, W / H, 0.1, 60));
    gl.uniform1f(U.uDpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- entrada: ratón y scroll (suavizados) ---------- */
  var mx = 0, my = 0, sx = 0, sy = 0, sp = 0;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX / W * 2 - 1; my = e.clientY / H * 2 - 1;
  }, { passive: true });
  function progress() {
    var max = document.documentElement.scrollHeight - H;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  sp = progress();

  var BPM = 124, t0 = performance.now(), running = true;
  function frame(now) {
    var t = (now - t0) / 1000;
    var beatPhase = (t * BPM / 60) % 1;
    var beat = Math.pow(1 - beatPhase, 4);   // golpe de bombo que cae rápido

    sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
    sp += (progress() - sp) * 0.08;

    var ang = 0.35 + sp * Math.PI * 1.35 + sx * 0.35 + (small ? Math.sin(t * 0.15) * 0.25 : 0);
    var radius = 8.5 - sp * 2.5;
    var eye = [Math.sin(ang) * radius, 5.6 - sp * 2.4 - sy * 0.7, Math.cos(ang) * radius];
    gl.uniformMatrix4fv(U.uV, false, lookAt(eye, [0, -0.2 + sp * 0.4, 0]));
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uBeat, reduce ? 0.3 : beat);
    gl.uniform1f(U.uSpin, t * (33.3 / 60) * 0.6 + sp * 6.0);  // ~33 rpm, más vueltas al bajar
    gl.uniform1f(U.uLift, sp * 0.6);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    if (running && !reduce) requestAnimationFrame(frame);
  }

  if (reduce) {
    // Menos movimiento: una sola imagen fija, que se redibuja si cambia el tamaño
    frame(t0 + 2000);
    window.addEventListener('resize', function () { frame(t0 + 2000); });
    return;
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function () {
    var was = running;
    running = !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  });
})();
