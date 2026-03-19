import "./style.css";
import { renderP01 } from "./screens/p01-menu/p01Menu.js";
import { renderP02 } from "./screens/p02-registro/p02Registro.js";
import { renderP03 } from "./screens/p03-introduccion/p03Introduccion.js";
import { renderP04 } from "./screens/p04-mapa/p04Mapa.js";
import { renderP05 } from "./screens/p05-parada/p05Parada.js";
import { renderP06 } from "./screens/p06-mision1/p06Mision1.js";
import { renderP07 } from "./screens/p07-mision2/p07Mision2.js";
import { renderP08 } from "./screens/p08-mision3/p08Mision3.js";

const app = document.querySelector("#app");

const routes = {
  "#/p01": renderP01,
  "#/p02": renderP02,
  "#/p03": renderP03,
  "#/p04": renderP04,
  "#/p05": renderP05,
  "#/p06": renderP06,
  "#/p07": renderP07,
  "#/p08": renderP08,
};

function renderCurrentRoute() {
  const route = window.location.hash || "#/p01";
  const renderScreen = routes[route] || renderP01;
  renderScreen(app);
}

window.addEventListener("hashchange", renderCurrentRoute);
renderCurrentRoute();
