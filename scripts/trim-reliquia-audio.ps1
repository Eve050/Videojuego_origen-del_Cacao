# Recorte físico de "reliquia encontrada" a 2 s (requiere ffmpeg en PATH).
# Uso: desde la raíz del proyecto:
#   powershell -ExecutionPolicy Bypass -File scripts/trim-reliquia-audio.ps1

$ErrorActionPreference = "Stop"
$src = Join-Path $PSScriptRoot "..\public\assets\audio\reliquia-encontrada.mp3"
$out = Join-Path $PSScriptRoot "..\public\assets\audio\reliquia-encontrada-2s.mp3"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "ffmpeg no está instalado o no está en PATH. Instálalo y vuelve a ejecutar este script."
  exit 1
}
if (-not (Test-Path $src)) {
  Write-Host "No se encontró: $src"
  exit 1
}

ffmpeg -y -i $src -t 2 -c:a libmp3lame -q:a 4 $out
Write-Host "Listo: $out"
Write-Host "Si quieres usarlo en el juego, renombra el original a .bak y este archivo a reliquia-encontrada.mp3 (o actualiza BootScene.js)."
