/* Fondo 3D de la web: Bola de discoteca. Bola de espejos girando con destellos y puntos de luz
   en las paredes que se encienden con el bombo (124 BPM). Los otros diseños siguen en el motor. */
/* Fondos 3D para DJ Chris in la Casa. Puntos dorados en WebGL puro, sin librerías.
   Todos laten a 124 BPM, se mueven con el scroll y un poco con el dedo / ratón.
   Uso: Fondo3D(canvas, 'tunel' | 'ecualizador' | 'esfera' | 'laseres') -> { stop() } */
(function (global) {
  var HEAD = 'attribute vec4 a;uniform mat4 uP,uV;uniform float uT,uBeat,uDpr,uS;varying float vA,vH;\n';
  var TAIL = function (size, alpha) {
    return '  vec4 v=uV*vec4(p,1.0);gl_Position=uP*v;float zc=max(-v.z,0.1);\n' +
      '  gl_PointSize=' + size + '*uDpr*(9.0/zc)*vis;\n' +
      '  vA=' + alpha + '*vis;\n}';
  };
  var FS = 'precision mediump float;varying float vA,vH;void main(){vec2 c=gl_PointCoord-0.5;' +
    'float m=smoothstep(0.5,0.12,length(c));vec3 gold=vec3(0.96,0.72,0.0);vec3 ink=vec3(0.95,0.93,0.89);' +
    'vec3 col=mix(gold*0.5,mix(gold,ink,0.45),vH);gl_FragColor=vec4(col*m*vA,1.0);}';

  var DESIGNS = {
    /* Túnel de anillos que viene hacia ti, como entrar en el club */
    tunel: function (small) {
      var R = small ? 64 : 96, P = small ? 72 : 110, d = [];
      for (var r = 0; r < R; r++) for (var k = 0; k < P; k++) d.push((k / P) * 6.2832, r, Math.random(), 0);
      return {
        data: d, eye: function (t, s, mx, my) { return [mx * 0.6, my * 0.4, 2.0]; },
        look: function (t, s, mx, my) { return [Math.sin(t * 0.3) * 0.6 + s * 1.5, Math.cos(t * 0.23) * 0.4 - s * 0.8, -10]; },
        vs: HEAD + 'void main(){float L=' + (R * 0.55).toFixed(1) + ';\n' +
          '  float z=-mod(a.y*0.55+uT*3.0,L);\n' +
          '  float ang=a.x+z*0.07+uT*0.15;\n' +
          '  float r=3.2+0.5*uBeat*exp(z*0.06)+0.18*sin(ang*6.0+uT*1.5);\n' +
          '  vec3 p=vec3(cos(ang)*r,sin(ang)*r,z);\n' +
          '  float ring=mod(a.y,8.0);vH=ring<0.5?1.0:0.25+0.3*uBeat;\n' +
          '  float vis=smoothstep(L,L*0.55,-z)*smoothstep(0.0,2.5,-z+1.0);\n' +
          TAIL('4.0', '0.75')
      };
    },
    /* Ecualizador 3D: columnas de puntos que suben y bajan con el bombo */
    ecualizador: function (small) {
      var N = small ? 16 : 24, LV = small ? 18 : 22, d = [];
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) for (var k = 0; k < LV; k++)
        d.push((i - (N - 1) / 2) * 0.6, (j - (N - 1) / 2) * 0.6, k / (LV - 1), 0);
      return {
        data: d,
        eye: function (t, s, mx, my) { var a = t * 0.05 + s * 1.6 + mx * 0.3; return [Math.sin(a) * 9.5, 3.2 - s * 1.8 + my, Math.cos(a) * 9.5]; },
        look: function () { return [0, -0.6, 0]; },
        vs: HEAD + 'void main(){vec2 q=a.xy;float d=length(q);\n' +
          '  float h=0.45+0.35*sin(q.x*0.55+uT*1.3)*cos(q.y*0.45-uT*0.9);\n' +
          '  h+=uBeat*exp(-d*0.22)*0.55;h=clamp(h,0.06,1.0);\n' +
          '  float vis=step(a.z,h);\n' +
          '  vec3 p=vec3(q.x,a.z*4.2-3.0,q.y);\n' +
          '  vH=smoothstep(h-0.18,h,a.z);\n' +
          TAIL('7.0', '0.85')
      };
    },
    /* Esfera de sonido que respira y se deforma con el ritmo */
    esfera: function (small) {
      var N = small ? 2400 : 4200, d = [], g = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < N; i++) {
        var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = g * i;
        d.push(Math.cos(th) * rr, y, Math.sin(th) * rr, 0);
      }
      var RG = small ? 360 : 620;
      for (var k = 0; k < RG; k++) d.push((k / RG) * 6.2832, 3.4 + Math.random() * 0.5, Math.random(), 1);
      return {
        data: d,
        eye: function (t, s, mx, my) { return [mx * 1.2, 0.8 - s * 3.0 + my * 0.8, 8.5]; },
        look: function (t, s) { return [0, -s * 1.5, 0]; },
        vs: HEAD + 'mat3 ry(float t){float c=cos(t),s=sin(t);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}\n' +
          'mat3 rx(float t){float c=cos(t),s=sin(t);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}\n' +
          'void main(){vec3 p;float vis=1.0;\n' +
          '  if(a.w<0.5){vec3 n=a.xyz;\n' +
          '    float w=sin(n.x*4.0+uT*1.2)*sin(n.y*5.0-uT*0.9)*sin(n.z*3.0+uT*0.7);\n' +
          '    float r=2.2+0.45*w+0.35*uBeat;\n' +
          '    p=ry(uT*0.15+uS*3.0)*rx(0.35)*(n*r);vH=clamp(w*1.4+0.45,0.0,1.0);\n' +
          '  } else {float th=a.x+uT*0.25;p=rx(1.25)*vec3(cos(th)*a.y,sin(a.z*40.0+uT)*0.05,sin(th)*a.y);vH=0.3;}\n' +
          TAIL('3.6', '0.75')
      };
    },
    /* Láseres de club que barren la pista, con humo */
    laseres: function (small) {
      var B = small ? 14 : 22, S = small ? 200 : 280, H = small ? 700 : 1400, d = [];
      for (var b = 0; b < B; b++) for (var s = 0; s < S; s++) d.push(b, s / (S - 1), Math.random(), 0);
      for (var h = 0; h < H; h++) d.push((Math.random() - 0.5) * 22, Math.random() * 9 - 3, (Math.random() - 0.5) * 14 - 2, 1);
      return {
        data: d,
        eye: function (t, s, mx, my) { return [mx * 1.0, 0.5 - s * 2.0 + my * 0.5, 9]; },
        look: function (t, s) { return [0, 0.5 - s * 1.0, -4]; },
        vs: HEAD + 'float hash(float n){return fract(sin(n)*43758.5453);}\n' +
          'void main(){vec3 p;float vis=1.0;\n' +
          '  if(a.w<0.5){float f=a.x/' + (B - 1) + '.0-0.5;\n' +
          '    float bar=floor(uT*124.0/60.0/2.0);\n' +
          '    float ang=f*1.9+sin(uT*0.7+a.x*0.35)*0.5;\n' +
          '    vec3 src=vec3(0.0,5.5,-9.0);\n' +
          '    vec3 end=vec3(sin(ang)*16.0,-3.0+sin(uT*1.1+a.x)*1.2,-9.0+cos(ang)*16.0);\n' +
          '    p=mix(src,end,a.y);\n' +
          '    vis=step(0.35,hash(a.x*12.9+bar*3.1))*smoothstep(1.0,0.6,a.y);\n' +
          '    vH=1.0-a.y*0.8;\n' +
          '  } else {p=vec3(a.x+sin(uT*0.1+a.z)*0.6,mod(uT*0.15+a.y+3.0,9.0)-3.0,a.z);\n' +
          '    vH=0.15;vis=0.5+0.5*uBeat;}\n' +
          TAIL('5.0', '1.0')
      };
    },
    /* Ondas de sonido: líneas de onda una detrás de otra, como un espectro en 3D */
    ondas: function (small) {
      var L = small ? 24 : 36, P = small ? 170 : 260, d = [];
      for (var l = 0; l < L; l++) for (var k = 0; k < P; k++) d.push(l, (k / (P - 1)) * 2 - 1, Math.random(), 0);
      return {
        data: d,
        eye: function (t, s, mx, my) { return [mx * 1.5, 1.8 - s * 2.2 + my, 8]; },
        look: function (t, s) { return [0, -0.7 - s * 0.8, -8]; },
        vs: HEAD + 'void main(){float vis=1.0;float x=a.y*13.0;\n' +
          '  float env=exp(-x*x*0.018);float amp=env*(0.55+0.9*uBeat*exp(-a.x*0.06));\n' +
          '  float y=sin(x*0.85+uT*2.0+a.x*0.32)*amp*0.9+sin(x*2.1-uT*1.4+a.x)*0.25*amp;\n' +
          '  vec3 p=vec3(x,y-0.3,4.0-a.x*0.75);\n' +
          '  vH=mod(a.x,6.0)<0.5?1.0:clamp(abs(y)*0.9,0.0,0.7);\n' +
          '  vis=smoothstep(' + L + '.0,' + (L * 0.4).toFixed(1) + ',a.x);\n' +
          TAIL('4.4', '1.0')
      };
    },
    /* Galaxia: remolino de partículas con tres brazos que gira despacio */
    galaxia: function (small) {
      var N = small ? 5500 : 10000, d = [];
      for (var i = 0; i < N; i++) {
        var arm = i % 3, rr = Math.pow(Math.random(), 0.65) * 6.5;
        var ang = arm * 2.0944 + rr * 0.85 + (Math.random() - 0.5) * (0.9 - rr * 0.08);
        var y = (Math.random() + Math.random() - 1) * 0.35 * (1.2 - rr / 6.5);
        d.push(rr, ang, y, Math.random());
      }
      return {
        data: d,
        eye: function (t, s, mx, my) { var a = s * 2.2 + mx * 0.4; return [Math.sin(a) * 8, 4.2 - s * 3.2 + my, Math.cos(a) * 8]; },
        look: function () { return [0, -0.4, 0]; },
        vs: HEAD + 'void main(){float vis=1.0;\n' +
          '  float r=a.x*(1.0+0.05*uBeat);float th=a.y+uT*(0.55/(a.x+0.9));\n' +
          '  vec3 p=vec3(cos(th)*r,a.z+sin(uT+a.w*6.28)*0.04,sin(th)*r);\n' +
          '  vH=clamp(1.15-a.x/4.0,0.0,1.0)+0.25*uBeat*step(0.85,a.w);\n' +
          TAIL('3.4', '(0.45+0.5*step(0.92,a.w))')
      };
    },
    /* Bola de discoteca girando, con destellos y puntos de luz en las paredes */
    bola: function (small) {
      var M = small ? 28 : 38, d = [];
      for (var i = 0; i < M; i++) {
        var lat = (i + 0.5) / M * Math.PI - Math.PI / 2, n = Math.max(6, Math.round(2 * M * Math.cos(lat)));
        for (var k = 0; k < n; k++) d.push(lat, (k / n) * 6.2832 + i * 0.13, Math.random(), 0);
      }
      var W = small ? 260 : 420;
      for (var w = 0; w < W; w++) d.push(Math.asin(Math.random() * 1.6 - 0.8), Math.random() * 6.2832, Math.random(), 1);
      return {
        data: d,
        eye: function (t, s, mx, my) { return [mx * 1.2, 0.6 - s * 0.5 + my * 0.8, 7.5]; },
        look: function (t, s) { return [0, 0.9 - s * 0.3, 0]; },
        vs: HEAD + 'void main(){float vis=1.0;float lon=a.y+uT*0.45+uS*6.0;\n' +
          '  vec3 n=vec3(cos(a.x)*cos(lon),sin(a.x),cos(a.x)*sin(lon));\n' +
          '  vec3 L1=normalize(vec3(0.6,0.7,0.9)),L2=normalize(vec3(-0.8,0.2,0.6));\n' +
          '  float g=pow(max(dot(n,L1),0.0),10.0)+pow(max(dot(n,L2),0.0),16.0)*0.8;\n' +
          '  float tw=step(0.985,fract(a.z*91.0+uT*0.7));\n' +
          '  vec3 p;\n' +
          '  if(a.w<0.5){p=n*2.0+vec3(0.0,1.3,0.0);vH=clamp(g*1.5+tw,0.0,1.0);\n' +
          '    vis=0.42+0.6*clamp(g*1.5+tw,0.0,1.0)+0.2*uBeat;\n' +
          '  } else {p=n*13.0+vec3(0.0,1.3,0.0);vH=0.6;vis=(0.2+0.6*uBeat)*step(0.4,a.z);}\n' +
          TAIL('(a.w<0.5?6.0:10.0)', '0.85')
      };
    },
    /* Altavoz: el cono vibra con el bombo y suelta ondas hacia fuera */
    altavoz: function (small) {
      var R = small ? 36 : 54, d = [];
      for (var r = 0; r < R; r++) {
        var rad = 0.25 + (r / (R - 1)) * 9.5, n = Math.round((small ? 22 : 34) * (0.6 + rad));
        for (var k = 0; k < n; k++) d.push(rad, (k / n) * 6.2832 + r * 0.21, Math.random(), 0);
      }
      return {
        data: d,
        eye: function (t, s, mx, my) { var a = 0.5 + s * 0.5 + mx * 0.3; return [Math.sin(a) * 9, 2.0 - s * 2.5 + my, Math.cos(a) * 9]; },
        look: function () { return [0, 0, 0]; },
        vs: HEAD + 'void main(){float vis=1.0;float r=a.x;float ph=fract(uT*124.0/60.0);\n' +
          '  vec3 p;\n' +
          '  if(r<4.6){float cone=-(1.0-r/4.6)*1.6;\n' +
          '    float rip=sin(r*3.2-uT*7.0)*0.08*(0.4+uBeat);\n' +
          '    float push=uBeat*0.7*exp(-r*1.1);\n' +
          '    p=vec3(cos(a.y)*r,sin(a.y)*r,cone+rip+push);\n' +
          '    vH=r<1.0?0.9:(r>4.2?1.0:clamp(rip*8.0+0.3,0.0,1.0));\n' +
          '  } else {float front=4.6+ph*5.0;\n' +
          '    p=vec3(cos(a.y)*r,sin(a.y)*r,0.0);\n' +
          '    vis=exp(-abs(r-front)*2.5)*(1.0-ph)+0.06;vH=0.7;}\n' +
          TAIL('4.2', '0.85')
      };
    }
  };

  function persp(f, asp, n, fa) {
    var t = 1 / Math.tan(f / 2), nf = 1 / (n - fa);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0];
  }
  function lookAt(e, c) {
    var z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]], l = Math.hypot(z[0], z[1], z[2]);
    z = [z[0] / l, z[1] / l, z[2] / l];
    var x = [z[2], 0, -z[0]]; l = Math.hypot(x[0], x[2]) || 1; x = [x[0] / l, 0, x[2] / l];
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  }

  global.Fondo3D = function (canvas, kind) {
    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return { stop: function () {} };
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small = window.matchMedia('(max-width: 760px)').matches;
    var D = DESIGNS[kind](small);
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(o)); return null; } return o; }
    var pr = gl.createProgram(), v = sh(gl.VERTEX_SHADER, D.vs), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return { stop: function () {} };
    gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(D.data), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
    var U = {}; ['uP', 'uV', 'uT', 'uBeat', 'uDpr', 'uS'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.disable(gl.DEPTH_TEST);
    var COUNT = D.data.length / 4, dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    var mx = 0, my = 0, tx = 0, ty = 0, sm = 0, run = true, raf, t0 = performance.now();
    function size() { canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr); gl.viewport(0, 0, canvas.width, canvas.height); }
    function move(e) { var p = e.touches ? e.touches[0] : e; tx = (p.clientX / innerWidth - 0.5) * 2; ty = -(p.clientY / innerHeight - 0.5) * 2; }
    addEventListener('resize', size); addEventListener('pointermove', move, { passive: true });
    size();
    function frame(now) {
      if (!run) return;
      var t = reduce ? 8 : (now - t0) / 1000;
      var ph = (t * 124 / 60) % 1, beat = reduce ? 0 : Math.pow(1 - ph, 4);
      var max = document.documentElement.scrollHeight - innerHeight, s = max > 0 ? scrollY / max : 0;
      sm += (s - sm) * 0.08; mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uP, false, persp(small ? 1.15 : 0.95, canvas.width / canvas.height, 0.1, 80));
      gl.uniformMatrix4fv(U.uV, false, lookAt(D.eye(t, sm, mx, my), D.look(t, sm, mx, my)));
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uBeat, beat); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uS, sm);
      gl.drawArrays(gl.POINTS, 0, COUNT);
      raf = reduce ? 0 : requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); } else if (run && !reduce) { raf = requestAnimationFrame(frame); } });
    return { stop: function () { run = false; cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('pointermove', move); var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } };
  };
})(window);
(function () {
  var c = document.createElement('canvas');
  c.className = 'fondo3d';
  c.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(c, document.body.firstChild);
  if (!c.getContext('webgl')) { c.remove(); return; }
  Fondo3D(c, 'bola');
})();
