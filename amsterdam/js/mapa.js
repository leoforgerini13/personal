// Mapa Leaflet: pins por tema, clusters, seleção, casa e legenda.
/* global L */

import { TEMAS } from "./data.js";
import { icon } from "./icons.js";
import { carimboURL, seloTema, seloCasa } from "./carimbos.js";

export const CENTRO = [52.3676, 4.9041];
const LIMITES = [[52.2, 4.6], [52.5, 5.2]];

export const TILES = {
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
};

function escapar(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function htmlPin(lugar, { visitado, favorito, selecionado }) {
  const cls = ["pin", visitado && "pin--visitado", favorito && "pin--favorito", selecionado && "pin--selecionado"]
    .filter(Boolean)
    .join(" ");
  return (
    `<span class="${cls}">` +
    `<img class="pin__corpo" src="${carimboURL(lugar.tema.glifo, lugar.tema.cor, lugar.tema.semente)}" alt="" draggable="false">` +
    (visitado ? `<span class="pin__selo pin__selo--visitado">${icon("check")}</span>` : "") +
    (favorito ? `<span class="pin__selo pin__selo--favorito">${icon("heart")}</span>` : "") +
    `</span>`
  );
}

export class Mapa {
  /**
   * @param {HTMLElement} el
   * @param {{onSelecionar(id), onCliqueMapa(latlng), onMoverCasa(latlng), onLegenda(slug), areaLivre(): {top, bottom}}} cb
   */
  constructor(el, cb) {
    this.cb = cb;
    this.marcadores = new Map();
    this.estado = new Map(); // id -> {visitado, favorito}
    this.selecionado = null;
    this.modoCasa = false;

    this.map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: LIMITES,
      minZoom: 11,
      maxZoom: 19,
      tap: true,
    }).setView(CENTRO, 13);

    this.zoom = L.control.zoom({ position: "bottomright", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" });
    this.atribuicao = L.control.attribution({ prefix: false });

    this.cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 44,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        return L.divIcon({
          html: `<span class="cluster" aria-label="${n} lugares">${n}</span>`,
          className: "cluster-wrap",
          iconSize: [44, 44],
        });
      },
    });
    this.map.addLayer(this.cluster);

    this.map.on("click", (e) => {
      if (this.modoCasa) {
        this.modoCasa = false;
        el.classList.remove("modo-casa");
        this.cb.onCliqueMapa(e.latlng);
      }
    });

    this._legenda();
    this._layout();
    window.matchMedia("(min-width: 900px)").addEventListener("change", () => this._layout());
  }

  // Controles mudam de canto entre celular e desktop: no celular o painel
  // inferior cobre a parte de baixo do mapa, então a atribuição sobe.
  _layout() {
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    this.zoom.remove();
    this.atribuicao.remove();
    this.legenda.remove();
    if (desktop) this.zoom.addTo(this.map);
    this.atribuicao.setPosition(desktop ? "bottomright" : "topright").addTo(this.map);
    this.legenda.setPosition(desktop ? "bottomleft" : "topright").addTo(this.map);
    this.map.getContainer().classList.toggle("mapa--desktop", desktop);
  }

  _legenda() {
    const self = this;
    const Legenda = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create("div", "legenda");
        const aberta = window.matchMedia("(min-width: 900px)").matches;
        div.innerHTML =
          `<button type="button" class="legenda__botao" aria-expanded="${aberta}" aria-controls="legenda-lista">` +
          `${icon("list")}<span>Legenda</span></button>` +
          `<ul class="legenda__lista" id="legenda-lista" ${aberta ? "" : "hidden"}>` +
          TEMAS.map(
            (t) =>
              `<li><button type="button" class="legenda__item" data-tema="${t.slug}" aria-pressed="false" title="Filtrar por ${escapar(t.nome)}">` +
              `${seloTema(t)}<span>${escapar(t.nome)}</span></button></li>`,
          ).join("") +
          `</ul>`;
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        const botao = div.querySelector(".legenda__botao");
        const lista = div.querySelector(".legenda__lista");
        botao.addEventListener("click", () => {
          const abrir = lista.hidden;
          lista.hidden = !abrir;
          botao.setAttribute("aria-expanded", String(abrir));
        });
        lista.addEventListener("click", (e) => {
          const b = e.target.closest("[data-tema]");
          if (b) self.cb.onLegenda(b.dataset.tema);
        });
        self.legendaEl = div;
        return div;
      },
    });
    this.legenda = new Legenda();
  }

  definirTiles(cfg) {
    if (this.camada) this.map.removeLayer(this.camada);
    this.camada = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      subdomains: cfg.subdomains,
      maxZoom: cfg.maxZoom,
      detectRetina: false,
    }).addTo(this.map);
    this.map.setMaxZoom(cfg.maxZoom);
  }

  marcarLegenda(ativos) {
    if (!this.legendaEl) return;
    for (const b of this.legendaEl.querySelectorAll("[data-tema]")) {
      b.setAttribute("aria-pressed", String(ativos.has(b.dataset.tema)));
    }
  }

  criarMarcadores(lugares, estadoDe) {
    for (const l of lugares) {
      if (!l.temCoord) continue;
      const m = L.marker([l.lat, l.lng], { title: l.nome, alt: l.nome, riseOnHover: true, keyboard: true });
      m.lugar = l;
      m.on("click", () => this.cb.onSelecionar(l.id));
      this.marcadores.set(l.id, m);
      this.atualizarPin(l.id, estadoDe(l.id));
    }
  }

  atualizarPin(id, { visitado, favorito }) {
    const m = this.marcadores.get(id);
    if (!m) return;
    const selecionado = this.selecionado === id;
    const atual = this.estado.get(id);
    if (atual && atual.visitado === visitado && atual.favorito === favorito && atual.selecionado === selecionado) return;
    this.estado.set(id, { visitado, favorito, selecionado });
    m.setIcon(
      L.divIcon({
        html: htmlPin(m.lugar, { visitado, favorito, selecionado }),
        className: "pin-wrap",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    );
    m.setZIndexOffset(selecionado ? 1000 : visitado ? -100 : 0);
  }

  mostrar(ids) {
    const chave = [...ids].sort().join("|");
    if (chave === this._visiveis) return;
    this._visiveis = chave;
    const visiveis = [];
    for (const id of ids) {
      const m = this.marcadores.get(id);
      if (m) visiveis.push(m);
    }
    this.cluster.clearLayers();
    this.cluster.addLayers(visiveis);
  }

  selecionar(id, estadoDe, { centralizar = false } = {}) {
    const anterior = this.selecionado;
    this.selecionado = id;
    if (anterior) this.atualizarPin(anterior, estadoDe(anterior));
    if (!id) return;
    this.atualizarPin(id, estadoDe(id));
    const m = this.marcadores.get(id);
    if (!m || !centralizar) return;
    if (!this.cluster.hasLayer(m)) {
      this.centralizar(m.getLatLng(), 16);
      return;
    }
    this.cluster.zoomToShowLayer(m, () => this.centralizar(m.getLatLng(), Math.max(this.map.getZoom(), 15)));
  }

  /** Centraliza o ponto na área do mapa que não está coberta pelo painel. */
  centralizar(latlng, zoom = this.map.getZoom()) {
    const { top, bottom } = this.cb.areaLivre();
    const tamanho = this.map.getSize();
    const deslocY = (bottom - top) / 2; // positivo: o centro visível está acima do centro do mapa
    const alvo = this.map.project(latlng, zoom).add([0, deslocY]);
    const centro = this.map.unproject(alvo, zoom);
    if (tamanho.y) this.map.setView(centro, zoom, { animate: true });
  }

  ajustarA(lugares) {
    const pts = lugares.filter((l) => l.temCoord).map((l) => [l.lat, l.lng]);
    if (!pts.length) return;
    const { top, bottom } = this.cb.areaLivre();
    this.map.fitBounds(pts, { paddingTopLeft: [24, top + 24], paddingBottomRight: [24, bottom + 24], maxZoom: 15, animate: false });
  }

  // ------------------------------------------------------------ casa

  definirCasa(casa) {
    if (!casa) {
      if (this.casa) this.map.removeLayer(this.casa);
      this.casa = null;
      return;
    }
    const pos = [casa.lat, casa.lng];
    if (!this.casa) {
      this.casa = L.marker(pos, {
        draggable: true,
        title: "Casa (arraste para ajustar)",
        alt: "Casa",
        zIndexOffset: 2000,
        icon: L.divIcon({
          html: `<img class="casa-pin" src="${seloCasa()}" alt="" draggable="false">`,
          className: "pin-wrap",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      }).addTo(this.map);
      this.casa.on("dragend", () => this.cb.onMoverCasa(this.casa.getLatLng()));
    } else {
      this.casa.setLatLng(pos);
    }
  }

  iniciarModoCasa() {
    this.modoCasa = true;
    this.map.getContainer().classList.add("modo-casa");
  }

  cancelarModoCasa() {
    this.modoCasa = false;
    this.map.getContainer().classList.remove("modo-casa");
  }

  invalidar() {
    this.map.invalidateSize({ pan: false });
  }
}
