# DESIGN.md · DJ Chris in la Casa

Guía de estilo de djchrisinlacasa.github.io. Cualquier IA (Claude, Cursor, Codex…) que toque esta web debe leer este archivo antes y seguirlo, para que todo lo nuevo parezca hecho por la misma mano.

## Idea central
Club de noche en Madrid: fondo casi negro y cálido, foto real de cabina y pista como protagonista, un único acento amarillo-oro que marca lo importante (nombre, fechas de hoy, botón de contratar). Tipografía grande y apretada, sin adornos. La web es de un DJ de house, afro house y tech house: nunca hablar de reggae.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0c0b09` | Fondo de toda la web (negro cálido, nunca `#000`) |
| `--surface` | `#171510` | Tarjetas, huecos de imagen, reproductores sin cargar |
| `--ink` | `#f3eee4` | Texto principal (blanco hueso, nunca `#fff`). También fondo de la sección Booking |
| `--muted` | `#a59d8e` | Textos secundarios, etiquetas, pies de foto |
| `--accent` | `#f5b700` | Oro. Botón principal, "in la Casa", fecha de hoy, foco. Hover `#ffc928` |
| `--accent-ink` | `#0c0b09` | Texto encima del oro |
| `--pink` | `#ff3db0` | Solo en la sección Merch (camiseta Love House de Tormenta) |
| línea | `#26221b` | Separadores de 1px |

Reglas: un solo acento por pantalla. El rosa no sale de Merch. Sin degradados de colores ni sombras de colores; el único degradado permitido es negro→transparente sobre fotos para leer el texto.

## Tipografía
- Familia única: **General Sans** (Fontshare) 400 / 500 / 700, de reserva Helvetica Neue, Arial.
- `--small` 13–14px · `--body` 17–19px · `--lead` 20–26px · `--head` 38–88px (todo con `clamp`).
- Títulos h1/h2: peso 700, `line-height:.95`, `letter-spacing:-.04em`, `text-wrap:balance`. El h1 del hero va en mayúsculas.
- Etiquetas pequeñas (kicker): mayúsculas, 11–13px, `letter-spacing` positivo, color `--muted`.
- Fechas en formato grande `31.10` + día de la semana pequeño debajo.
- En español: solo mayúscula inicial en títulos ("Próximas fechas", no "Próximas Fechas").

## Espaciado y layout
- Margen lateral `--m`: `clamp(16px,3vw,40px)` (16px en móvil).
- Separación entre secciones: `clamp(72px,11vw,180px)`.
- Botones: alto mínimo 52px; zonas táctiles de al menos 44px.
- Móvil primero: Chris y su público miran la web en el móvil. En móvil hay un dock fijo abajo (Fechas · Escuchar · Booking) y el `body` deja hueco para él con `env(safe-area-inset-bottom)`.
- Sin scroll horizontal nunca.

## Esquinas
Casi todo es recto (radio 0): botones, tarjetas, fotos. Redondo solo en píldoras pequeñas (`999px`: botones "Cargar Spotify", selector ES/EN) y círculos de play (`50%`).

## Componentes
- **Botón principal** `.btn`: fondo oro, texto negro, 700, 16px, recto. Hover más claro, `:active` escala .97.
- **Botón secundario** `.btn.ghost`: transparente con borde interior de 2px `--ink`; hover se rellena de `--ink`.
- **Fila de fecha**: fecha grande · nombre de la fiesta · sala y dirección en `--muted` · botón "Entradas" ghost a la derecha. Line-up debajo en pequeño.
- **Reproductores** (Spotify, Mixcloud, YouTube): no se cargan solos. Primero una caja `--surface` con botón píldora "Cargar…" y aviso de cookies (privacidad).
- **Fotos**: reales, de El Sótano / Tormenta / Medias Puri. Siempre con `width`, `height`, `alt` descriptivo y `loading="lazy"` si están bajo el hero.
- **Booking**: sección clara (fondo `--ink`, texto `--bg`) que rompe el negro al final. Contacto por email djchris69@gmail.com, WhatsApp e Instagram.

## Movimiento
- Curva `--ease: cubic-bezier(.23,1,.32,1)`. Duraciones .16–.4s en interacción, hasta 1.2s en apariciones.
- Solo animar `transform` y `opacity`. Nunca `transition: all`.
- Fondo 3D (bola de discoteca de puntos dorados) fijo detrás de todo, `z-index:-1`, sin capturar clics.
- Lenis + GSAP para scroll suave y apariciones `.rise` / `.reveal`.
- Barra dorada de 2px arriba que marca cuánto has bajado; la bio se enciende palabra a palabra al leerla; las fechas ruedan como un display antes de fijarse; portada del álbum y camiseta se inclinan en 3D con el ratón (solo ordenador). Todo en `js/motion.js`.
- Todo se apaga con `prefers-reduced-motion: reduce`.
- **Prohibido**: pantalla de entrada, intro negra con el nombre, destellos o zoom al abrir. La portada sale directamente.

## Accesibilidad
- Foco visible: `outline: 3px solid var(--accent)`.
- Enlace "Saltar al contenido" al principio.
- Nombres de marca y artistas con `translate="no"`.
- `color-scheme: dark` y `theme-color` = `--bg`.
- Nada de `user-scalable=no`.

## Tono de los textos
Español de Madrid, cercano y directo, frases cortas. Botones que dicen lo que hacen ("Escribir por WhatsApp", "Comprar por WhatsApp", "Entradas"). Nada de frases de folleto ni de IA.
