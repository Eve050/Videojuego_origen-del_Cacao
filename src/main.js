import "./style.css";
import { destroyPhaserGame } from "./phaser/phaserHost.js";
import { renderP01 } from "./screens/p01-menu/p01Menu.js";
import { renderP02 } from "./screens/p02-registro/p02Registro.js";
import { renderP03 } from "./screens/p03-introduccion/p03Introduccion.js";
import { renderP04 } from "./screens/p04-mapa/p04Mapa.js";
import { renderP05 } from "./screens/p05-parada/p05Parada.js";
import { renderP06 } from "./screens/p06-mision1/p06Mision1.js";
import { renderP07 } from "./screens/p07-mision2/p07Mision2.js";
import { renderP08 } from "./screens/p08-mision3/p08Mision3.js";
import { renderP09 } from "./screens/p09-revelacion/p09Revelacion.js";
import { renderP10 } from "./screens/p10-certificado/p10Certificado.js";
import { renderP11PhaserLab } from "./screens/p11-phaser-lab/p11PhaserLab.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("Falta el elemento #app en index.html");
}

const routes = {
  "#/p01": renderP01,
  "#/p02": renderP02,
  "#/p03": renderP03,
  "#/p04": renderP04,
  "#/p05": renderP05,
  "#/p06": renderP06,
  "#/p07": renderP07,
  "#/p08": renderP08,
  "#/p09": renderP09,
  "#/p10": renderP10,
  "#/phaser": renderP11PhaserLab,
};

function renderCurrentRoute() {
  document.body.classList.remove("enigma-lock-scroll");
  document.documentElement.classList.remove("enigma-lock-scroll");
  destroyPhaserGame();
  const route = window.location.hash || "#/p01";
  const renderScreen = routes[route] || renderP01;
  try {
    renderScreen(app);
  } catch (err) {
    console.error(err);
    app.innerHTML = `
      <section class="screen screen--form" style="padding:2rem;text-align:center;max-width:420px;margin:0 auto;">
        <h1 style="color:#f9f2dd;">Algo salio mal</h1>
        <p style="color:rgba(255,255,255,.85);">Recarga la pagina. Si sigue igual, abre la consola del navegador (F12) y revisa el error.</p>
        <p><a href="#/p01" style="color:#c8921a;">Volver al inicio</a></p>
      </section>
    `;
  }
}

window.addEventListener("hashchange", renderCurrentRoute);
renderCurrentRoute();
