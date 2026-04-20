# Audio del juego

Coloca aquí los archivos referenciados en `src/modules/sfxVolumes.js` (precarga vía `BootScene`) y en `audioManager.js`:

| Archivo | Uso |
|--------|-----|
| `selva-loop.mp3` | Música ambiente (HTML, loop) |
| `acierto.mp3` | Respuesta correcta / ítems (Phaser `sfx_ok`) |
| `error-sound.mp3` | Error / choque (Phaser `sfx_error`) |
| `mision-completada.mp3` | Misión completada (Phaser `sfx_mission_complete`) |
| `reliquia-encontrada.mp3` | Reliquia / orbes (Phaser `sfx_relic`; el juego también limita la duración por código) |
| `sfx_jump.wav` | Salto en Misión 2 (runner), ~0,1 s. Se genera con `node scripts/generate-jump-sfx.mjs`; puedes sustituirlo por tu propio WAV/MP3 y actualizar la ruta en `PHASE_SFX_FILES` (`sfxVolumes.js`). |

## Recorte físico de la reliquia (opcional)

Si instalas [ffmpeg](https://ffmpeg.org/) y quieres un archivo ya cortado a 2 s:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/trim-reliquia-audio.ps1
```

(Revisa la ruta del script en `scripts/trim-reliquia-audio.ps1`.)
