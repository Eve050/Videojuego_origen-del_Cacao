# Cumplimiento vs documento técnico (v1.0)

Comparación del código en `enigma-santa-ana` con lo descrito en el **documento técnico para desarrolladores** y la propuesta de minijuegos. Fecha de revisión: marzo 2026.

**Leyenda:** ✅ cumple o muy cercano · ⚠️ parcial / distinto · ❌ no implementado

---

## General / motor

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Phaser 3.x | ✅ | `phaser` ^3.90 |
| Canvas 1280×720 + `Scale.FIT` | ✅ | `layout.js` + `phaserHost.js` |
| Zonas HUD 60 + juego 480 + hint 40 + controles ~120 | ⚠️ | Suma doc = 700; sobran ~20 px (`CONTROLS_H_ACTUAL: 140`) |
| Build + Netlify (`dist`, SPA redirect) | ✅ | `netlify.toml` + `vite build` (el doc ejemplo usa Webpack; equivalente) |
| Node 18 en Netlify | ❌ | No está `NODE_VERSION` en `netlify.toml` (opcional) |
| Headers seguridad (X-Frame-Options, etc.) | ❌ | No en `netlify.toml` |
| Música + SFX en los 3 juegos | ❌ | Solo `selva-loop.mp3` en shell web; Phaser no carga `sfx_*` / `music_*` |
| Joystick virtual + zona táctil dedicada | ❌ | Runner: todo el canvas salta; laberinto: teclado; sin joystick como en figura |
| Analytics (Netlify / GA4) | ❌ | No integrado |
| Carga &lt; 5 s en 4G | ⚠️ | No medido en CI |
| README de instrucciones / GitHub | ⚠️ | Depende del repo global del usuario |

---

## Flujo expedición (P06–P08) vs demo `#/phaser`

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Boot salta menú si misión 1–3 | ✅ | `BootScene` + `missionContext` |
| Intro / instrucciones Phaser antes de jugar | ❌ | En expedición se entra **directo** a `Game1/2/3`; textos oficiales están en `MiniIntroScene` / `MiniInstructionsScene` (ruta lab/demo) |
| Tres juegos accesibles desde un menú | ✅ | `MenuScene` en `#/phaser` |

---

## Juego 1 — El Origen del Cacao

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Título, subtítulo, botones inicio / instrucciones / volver | ✅ | `introCopy.js` + `MiniIntroScene` |
| Instrucciones: misión + máx 300 + 3 intentos | ⚠️ | Mismo contenido; doc une línea con `\|`; aquí dos bullets |
| Objetos: botella, vasija, turquesa + quiz | ✅ | `questions.json` + `Game1Scene` + `QuizScene` |
| 3 intentos, +100 acierto, mensajes error / 3 fallos | ✅ | `QuizScene.js` |
| Textos resultado por tramos 300 / 200–299 / 100–199 / &lt;100 | ✅ | `ResultScene.tierExplore` |
| Prompt objeto (E + tocar) | ⚠️ | Cerca; salto de línea; overlap abre quiz sin pulsar E (rápido) |
| Textos narrativos botella / vasija / turquesa literales | ⚠️ | JSON usa “Has hallado…”; doc a veces «Has encontrado…»; turquesa con comillas tipo doc |
| Quiz: “PREGUNTA X/3”, 4 opciones A–D | ✅ | |
| Tras 3 fallos: “La respuesta correcta era: [letra]” | ⚠️ | Solo letra; doc puede pedir texto completo |
| Pantallas post-juego: datos históricos, mapa, jugar de nuevo | ✅ | `ResultScene` (modo lab); en expedición: “CONTINUAR EXPEDICIÓN” + reintento |
| Exploración: escenario 3 áreas del yacimiento | ❌ | Un solo `tileSprite` verde; sin plazas / plataformas progresivas |
| Assets: `player_topdown`, `items_j1`, `tileset_salf` | ❌ | Placeholders `BootScene.generatePlaceholderTextures` |
| Mapa del sitio desbloqueado al terminar | ❌ | No hay pantalla de mapa del yacimiento en Phaser |

---

## Juego 2 — El Viaje del Cacao al Mundo

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Textos menú / instrucciones / banners 5 zonas | ✅ | `introCopy.js` + `zonesConfig.json` alineados al doc |
| 5 zonas con cambio de tint / velocidad | ⚠️ | Avance cada **10 s**; doc pide progreso por recorrido + transición ~1 s |
| Velocidades por zona (280→400 px/s) | ✅ | `zonesConfig.json` actualizado |
| Gravedad **1200** | ✅ | `Game2Scene` (actualizado) |
| Salto **-620** | ✅ | `doJump` |
| Suelo **Y = 450** (superficie) | ✅ | `GROUND_TOP_Y = 450` |
| **3 vidas** + corazones + invulnerabilidad 1.5 s | ✅ | `START_LIVES`, `INVULN_MS`, HUD corazones |
| Barra ruta 5 nodos | ✅ | `buildRouteBar` / `updateRouteBar` |
| Obstáculos / ítems cada X px (300 / 150–400) | ❌ | Spawner por tiempo (1.4 s) |
| Piezas culturales +50 zona 3, etc. | ❌ | Solo vainas normales / doradas; dorada desbloquea `zoneFact` |
| Victoria: 5 zonas completadas | ⚠️ | Tras 5 avances de zona sí; no ligado a “llegar a Europa” por distancia |
| Resultado victoria + cita mensajero | ✅ | `ResultScene` con `allZones` |
| Flecha **arriba** para saltar | ✅ | `KeyCodes.UP` en `Game2Scene` |
| Fondos `bg_zona_1…5`, parallax 3 capas | ❌ | `ph_floor` repetido + tinte |
| Audio por zona / `sfx_jump` | ❌ | |

---

## Juego 3 — Cacao Maze

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Título, subtítulo, 3 niveles + volver mapa | ✅ | `MiniIntroScene` game3 |
| Textos atrapado por KUNKU / SUMAK / ALLPA / WASI | ✅ | `GUARDIAN_CATCH` |
| Resultado victoria / derrota | ✅ | `ResultScene` |
| 4 datos culturales al recoger piezas | ⚠️ | Mismo sentido; redacción ligeramente más corta que cita larga del doc (pieza 1 Nature) |
| HUD: granos, piezas, vidas, nivel, puntos | ✅ | |
| HUD “GRANOS: xx / 80” por nivel | ❌ | Muestra “Granos restantes: a/b” con **b ≈ cantidad del mapa** (~60), no 80/72/64 |
| Laberinto **21×13**, celda **44×44**, colores #5A2A8A / #8855CC | ❌ | Mapa **16×8**, tile **40**, estética genérica |
| Tilemap Tiled JSON (walls / items / specials) | ❌ | Array `MAZE` en código |
| 4 vainas doradas en esquinas + poder 10 s / asustado / +100 | ❌ | **No hay** vaina dorada ni estado `scared` en Phaser |
| IA: BFS / intercept / random / patrol | ⚠️ | BFS en rejilla hacia jugador / predicción / aleatorio / patrulla piezas (sin A* ni pathfinding continuo) |
| Guardianes activos por nivel (2 / 3 / 4) | ✅ | `ACTIVE_BY_LEVEL` |
| Velocidades guardianes 120 / 160 / 200 y BFS cada 800/500/300 ms | ✅ | `GUARDIAN_SPEED_PX` + `AI_INTERVAL_MS` |
| Nivel 3: **2 vidas** | ✅ | `maxLives = 2` si `mazeLevel === 3` |
| Piezas arqueológicas en tilemap + fruta centro | ❌ | Piezas `p` en grid fijo; sin “fruta” aparte |
| Texto “¡PODER ANCESTRAL!” | ❌ | |
| Assets guardianes, scared, items_j3, tileset_maze | ❌ | Placeholders |

---

## Textos globales checklist doc (§5.4)

| Ítem | Estado |
|------|--------|
| “5.500 años” / AP en textos clave | ⚠️ | Presente en muchos sitios; unificar “AP” vs “antes del presente” si el cliente exige forma única |
| “Mayo Chinchipe – Marañón” | ✅ | |
| Botones EXACTOS (CONTINUAR AL MAPA, JUGAR DE NUEVO, VER DATOS…) | ⚠️ | En expedición: **CONTINUAR EXPEDICIÓN**, **REINTENTAR** en lugar de algunas etiquetas del doc |

---

## Resumen ejecutivo

**Ya alineado con el documento:** resolución y escala Phaser, estructura de escenas, copy principal de intros/instrucciones J1–J3, preguntas y datos del quiz J1, lógica de intentos y resultados J1, banners y hechos por zona J2 a nivel de texto, flujo de resultados J2/J3 y botones en modo laboratorio, enlace Netlify SPA.

**Brechas mayores:** assets 2D y audio del §5.1; **J2** sin vidas/invulnerabilidad y sin física/velocidades/barra de ruta del doc; **J3** sin laberinto oficial, sin poder vaina dorada, sin IA real ni recuentos 80/72/64; **controles táctiles** como en la figura; **checklist entrega** (analytics, headers, pruebas multi-navegador documentadas).

Para actualizar este archivo: repetir revisión tras cambios en `Game*Scene`, `QuizScene`, `ResultScene`, `zonesConfig.json`, `questions.json`, `Guardian.js`.
