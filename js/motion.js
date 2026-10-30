/* Movimiento de la web: scroll suave (Lenis), animaciones al hacer scroll (GSAP)
   y dos detalles interactivos (botones magnéticos y rejilla de puntos en Booking).
   Si algo falla o la persona prefiere menos movimiento, la web funciona igual sin esto. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) return;

  /* 1 · Scroll suave con Lenis (rueda y trackpad; en el móvil el scroll sigue siendo el nativo) */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, anchors: true, stopInertiaOnNavigate: true });
    // El álbum se abre por encima de todo: mientras está abierto, Lenis se para
    new MutationObserver(function () {
      if (root.classList.contains('lb-open')) lenis.stop(); else lenis.start();
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  var hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  } else if (lenis) {
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  if (hasGsap) {
    /* 2 · Títulos que suben palabra a palabra desde detrás de una máscara */
    document.querySelectorAll('h2.rise').forEach(function (h) {
      var soloTexto = [].every.call(h.childNodes, function (n) { return n.nodeType === 3; });
      if (!soloTexto) return;
      var texto = h.textContent.trim();
      h.setAttribute('aria-label', texto);
      h.classList.remove('rise');
      h.innerHTML = texto.split(/\s+/).map(function (w) {
        return '<span class="w" aria-hidden="true"><span>' + w + '</span></span>';
      }).join(' ');
      gsap.from(h.querySelectorAll('.w > span'), {
        yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.08,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });

    /* 3 · La cinta amarilla acelera y cambia de sentido con el scroll, como un pitch */
    var track = document.querySelector('.marquee .track');
    if (track) {
      track.style.animation = 'none';
      var loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
      var dir = 1;
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onUpdate: function (self) {
          dir = self.direction;
          var v = Math.min(Math.abs(self.getVelocity()) / 220, 5);
          gsap.to(loop, { timeScale: dir * (1 + v), duration: 0.2, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
        }
      });
    }

    /* 4 · "In la Casa" del pie: las letras entran siguiendo el scroll */
    var big = document.querySelector('footer .big');
    if (big) {
      big.innerHTML = big.textContent.split('').map(function (c) {
        return c === ' ' ? ' ' : '<span class="ch">' + c + '</span>';
      }).join('');
      gsap.from(big.querySelectorAll('.ch'), {
        yPercent: 60, opacity: 0, stagger: 0.05, ease: 'power2.out',
        scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 }
      });
    }
  }

  /* 5 · Botones magnéticos (solo con ratón) */
  if (fine) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.classList.add('mag');
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* 6 · Rejilla de puntos en Booking: se encienden en dorado alrededor del dedo o del ratón */
  var bk = document.querySelector('.booking');
  if (bk) {
    var cv = document.createElement('canvas');
    cv.className = 'dots';
    cv.setAttribute('aria-hidden', 'true');
    bk.insertBefore(cv, bk.firstChild);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, gap = 22, px = -999, py = -999, tx = -999, ty = -999, on = false, raf = 0;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = bk.clientWidth; H = bk.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      px += (tx - px) * 0.18; py += (ty - py) * 0.18;
      for (var y = gap / 2; y < H; y += gap) {
        for (var x = gap / 2; x < W; x += gap) {
          var d = Math.hypot(x - px, y - py), k = Math.max(0, 1 - d / 140);
          ctx.fillStyle = k > 0 ? 'rgba(245,183,0,' + (0.18 + k * 0.82).toFixed(2) + ')' : 'rgba(12,11,9,.13)';
          ctx.beginPath(); ctx.arc(x, y, 1.4 + k * 2.2, 0, 6.2832); ctx.fill();
        }
      }
      if (on && (Math.abs(tx - px) > 0.5 || Math.abs(ty - py) > 0.5)) raf = requestAnimationFrame(draw); else raf = 0;
    }
    function move(e) {
      var r = bk.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (px < -900) { px = tx; py = ty; }
      on = true; if (!raf) raf = requestAnimationFrame(draw);
    }
    bk.addEventListener('pointermove', move, { passive: true });
    bk.addEventListener('pointerdown', move, { passive: true });
    bk.addEventListener('pointerleave', function () { tx = ty = -999; px = py = -999; on = false; draw(); });
    window.addEventListener('resize', size);
    size();
  }
})();
