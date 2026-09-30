import { TEMAS, BAIRROS, PRECOS, carregarLugares, DadosAusentes } from "./data.js";
import { store } from "./store.js";
import { aplicar, contarAtivos, escreverURL, filtrosVazios, lerURL, RAIOS, VISITAS } from "./filtros.js";
import { bike, formatarKm, formatarMin, linkGoogleMaps, linkRotaBike, NOTA_ESTIMATIVA } from "./geo.js";
import { icon } from "./icons.js";
import { seloTema, seloMarca } from "./carimbos.js";
import { Mapa, tilesPadrao } from "./mapa.js";
import { Painel } from "./painel.js";

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const mqDesktop = window.matchMedia("(min-width: 900px)");

document.getElementById("marca-selo").src = seloMarca();

// Ícones declarados no HTML com data-icon.
for (const el of document.querySelectorAll("[data-icon]")) {
  el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));
}

const url = lerURL();
const app = {
  lugares: [],
  porId: new Map(),
  f: url.filtros,
  selecionado: url.lugar,
  resultado: [],
};

const estadoPin = (id) => ({ visitado: store.visitado(id), favorito: store.favorito(id) });

// ------------------------------------------------------------------ mapa e painel

const painel = new Painel($("#painel"), {
  cabeca: $("#painel-cabeca"),
  alca: $("#painel-alca"),
  topo: $("#topo"),
});

const mapa = new Mapa($("#mapa"), {
  onSelecionar: (id) => selecionar(id, { origem: "mapa" }),
  onCliqueMapa: (latlng) => {
    esconderAviso();
    definirCasa({ lat: latlng.lat, lng: latlng.lng, nome: "Ponto escolhido no mapa" });
  },
  onMoverCasa: (latlng) => definirCasa({ lat: latlng.lat, lng: latlng.lng, nome: "Ponto ajustado no mapa" }, false),
  onLegenda: (slug) => {
    alternar(app.f.temas, slug);
    render();
  },
  areaLivre: () => ({
    top: mqDesktop.matches ? 0 : $("#topo").getBoundingClientRect().bottom,
    bottom: painel.visivel(),
  }),
});
mapa.definirTiles(tilesPadrao());

// Altura do topo em CSS, para os controles do mapa ficarem abaixo dele no celular.
new ResizeObserver(() => {
  document.documentElement.style.setProperty("--topo-h", `${$("#topo").getBoundingClientRect().bottom}px`);
  painel.aplicar(false);
}).observe($("#topo"));

// ------------------------------------------------------------------ render

function render({ rolarPara = null } = {}) {
  const casa = store.casa();
  app.resultado = aplicar(app.lugares, app.f, store, casa);
  if (app.selecionado && !app.resultado.some((r) => r.lugar.id === app.selecionado)) {
    app.selecionado = null;
    mapa.selecionar(null, estadoPin);
  }
  mapa.mostrar(app.resultado.map((r) => r.lugar.id));
  mapa.marcarLegenda(app.f.temas);
  for (const l of app.lugares) mapa.atualizarPin(l.id, estadoPin(l.id));

  renderLista(casa);
  renderAtivos();
  renderContagem();
  atualizarDialogoFiltros();

  $("#ordem").value = app.f.ordem;
  $("#ordem").querySelector('[value="perto"]').disabled = !casa;
  $("#ponto-casa").hidden = !casa;
  const n = contarAtivos(app.f);
  $("#contador-filtros").hidden = !n;
  $("#contador-filtros").textContent = n;
  $("#btn-filtros").setAttribute("aria-label", n ? `Filtros (${n} ativos)` : "Filtros");
  $("#busca-limpar").hidden = !app.f.q;
  escreverURL(app.f, app.selecionado);

  if (rolarPara) {
    const item = document.querySelector(`.item[data-id="${CSS.escape(rolarPara)}"]`);
    if (item) item.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

function renderContagem() {
  const total = app.lugares.length;
  const n = app.resultado.length;
  const visitados = app.lugares.filter((l) => store.visitado(l.id)).length;
  $("#marca-resumo").textContent = `${total} lugares · ${visitados} visitados`;
  $("#contagem").textContent = n === total ? `${total} lugares` : `${n} de ${total} lugares`;
}

function metaBike(b) {
  return b ? `${icon("bike", "icone-inline")} ${formatarMin(b.min)}` : "";
}

function renderLista(casa) {
  const lista = $("#lista");
  const foco = document.activeElement && lista.contains(document.activeElement)
    ? { id: document.activeElement.closest(".item")?.dataset.id, acao: document.activeElement.dataset.acao }
    : null;

  lista.innerHTML = app.resultado.map(({ lugar: l, bike: b }) => itemHTML(l, b, casa)).join("");

  const vazio = $("#vazio");
  vazio.hidden = app.resultado.length > 0;
  if (!app.resultado.length) vazio.innerHTML = vazioHTML();

  if (foco && foco.id) {
    const alvo = lista.querySelector(`.item[data-id="${CSS.escape(foco.id)}"] [data-acao="${foco.acao}"]`);
    if (alvo) alvo.focus({ preventScroll: true });
  }
}

function itemHTML(l, b, casa) {
  const aberto = app.selecionado === l.id;
  const visitado = store.visitado(l.id);
  const favorito = store.favorito(l.id);
  const meta = [esc(l.bairro.nome), `<span title="${esc(l.preco.dica)}">${esc(l.preco.rotulo)}</span>`];
  if (b) meta.push(metaBike(b));
  // Só marca a falta de coordenada quando ela é exceção (sem nenhuma, o aviso inicial explica).
  if (!l.temCoord && app.algumaCoord) meta.push(`<span class="sem-local">sem localização</span>`);
  const toggles = aberto
    ? ""
    : `<button type="button" class="btn-icone btn-toggle" data-acao="favorito" aria-pressed="${favorito}" aria-label="Favorito: ${esc(l.nome)}">${icon("heart")}</button>` +
      `<button type="button" class="btn-icone btn-toggle" data-acao="visitado" aria-pressed="${visitado}" aria-label="Visitei: ${esc(l.nome)}">${icon("check")}</button>`;

  return (
    `<li class="item${aberto ? " item--aberto" : ""}${visitado ? " item--visitado" : ""}" data-id="${esc(l.id)}">` +
    `<div class="item__linha">` +
    `<button type="button" class="item__principal" data-acao="abrir" aria-expanded="${aberto}" aria-controls="card-${esc(l.id)}">` +
    seloTema(l.tema) +
    `<span class="item__textos"><span class="item__nome">${esc(l.nome)}` +
    (favorito ? `<span class="marca-mini marca-mini--favorito" title="Favorito">${icon("heart")}<span class="sr-only">favorito</span></span>` : "") +
    (visitado ? `<span class="marca-mini marca-mini--visitado" title="Visitado">${icon("check")}<span class="sr-only">visitado</span></span>` : "") +
    `</span><span class="item__meta">${meta.join('<span aria-hidden="true"> · </span>')}</span></span>` +
    `</button>${toggles}</div>` +
    (visitado ? seloVisitei(store.dataVisita(l.id)) : "") +
    (aberto ? cardHTML(l, b, casa, visitado, favorito) : "") +
    `</li>`
  );
}

// Carimbo de passaporte do lugar visitado (decorativo: o estado vem no botão Visitei).
function seloVisitei(data) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data || "");
  const quando = m ? `${m[3]}·${m[2]}·${m[1].slice(2)}` : "";
  return `<span class="selo-visitei" aria-hidden="true">Visitei${quando ? `<small>${quando}</small>` : ""}</span>`;
}

function cardHTML(l, b, casa, visitado, favorito) {
  let distancia = "";
  if (b) {
    distancia =
      `<p class="card__bike">${icon("bike")} <span><span><strong>≈ ${formatarMin(b.min)} de bike</strong> · ${formatarKm(b.km)}</span>` +
      `<small>${NOTA_ESTIMATIVA}</small></span></p>`;
  } else if (!casa && l.temCoord) {
    distancia = `<p class="card__casa">${icon("house", "icone-inline")} <button type="button" class="link" data-acao="definir-casa">Defina sua casa</button> para ver o tempo de bike.</p>`;
  }
  const rota = casa
    ? `<a class="btn" href="${esc(linkRotaBike(casa, l))}" target="_blank" rel="noopener">${icon("route")} Rota de bike</a>`
    : "";
  return (
    `<div class="card" id="card-${esc(l.id)}">` +
    `<p class="card__tags"><span class="tag tag--tema" style="--cor:${l.tema.cor}">${seloTema(l.tema, "tema-selo--p")} ${esc(l.tema.nome)}</span>` +
    `<span class="tag">${esc(l.bairro.nome)}</span><span class="tag" title="${esc(l.preco.dica)}">${esc(l.preco.rotulo)}` +
    (l.preco.slug !== "gratis" ? ` <small>${esc(l.preco.dica)}</small>` : "") +
    `</span></p>` +
    `<p class="card__descricao">${esc(l.descricao)}</p>` +
    (!l.temCoord ? `<p class="nota">${icon("circle-alert", "icone-inline")} Localização não encontrada no mapa. O link do Google Maps funciona.</p>` : "") +
    distancia +
    `<div class="card__acoes">` +
    `<button type="button" class="btn btn-toggle" data-acao="visitado" aria-pressed="${visitado}">${icon("check")} ${visitado ? "Visitei" : "Marcar visitado"}</button>` +
    `<button type="button" class="btn btn-toggle" data-acao="favorito" aria-pressed="${favorito}">${icon("heart")} ${favorito ? "Favorito" : "Favoritar"}</button>` +
    `<a class="btn" href="${esc(linkGoogleMaps(l))}" target="_blank" rel="noopener">${icon("external-link")} Abrir no Google Maps</a>` +
    rota +
    `</div></div>`
  );
}

function vazioHTML() {
  const temBusca = Boolean(app.f.q.trim());
  const n = contarAtivos(app.f);
  return (
    `<div class="vazio__ilustracao" aria-hidden="true">${seloTema(TEMAS[0], "tema-selo--g")}</div>` +
    `<p class="vazio__titulo">Nenhum lugar por aqui</p>` +
    `<p class="vazio__texto">${
      temBusca ? `Nada encontrado para “${esc(app.f.q.trim())}”${n ? " com os filtros atuais" : ""}.` : "Os filtros escolhidos não combinam com nenhum lugar."
    } Tente afrouxar um pouco.</p>` +
    `<div class="vazio__acoes">` +
    (temBusca ? `<button type="button" class="btn" data-acao="limpar-busca">Limpar busca</button>` : "") +
    (n ? `<button type="button" class="btn btn--primario" data-acao="limpar-filtros">Limpar filtros</button>` : "") +
    `</div>`
  );
}

// Chips removíveis com os filtros ativos.
function renderAtivos() {
  const f = app.f;
  const chips = [];
  const chip = (grupo, valor, rotulo, cor) =>
    chips.push(
      `<button type="button" class="chip chip--ativo" data-remover="${grupo}" data-valor="${esc(valor)}" aria-label="Remover filtro ${esc(rotulo)}"` +
        (cor ? ` style="--cor:${cor}"` : "") +
        `>${esc(rotulo)} ${icon("x")}</button>`,
    );
  for (const t of TEMAS) if (f.temas.has(t.slug)) chip("temas", t.slug, t.curto, t.cor);
  for (const b of BAIRROS) if (f.bairros.has(b.slug)) chip("bairros", b.slug, b.nome);
  for (const p of PRECOS) if (f.precos.has(p.slug)) chip("precos", p.slug, p.rotulo);
  if (f.visitas !== "todos") chip("visitas", "", VISITAS.find((v) => v.valor === f.visitas).rotulo);
  if (f.favoritos) chip("favoritos", "", "Só favoritos");
  if (f.raio) chip("raio", "", `Até ${f.raio} min de bike`);
  if (chips.length > 1) chips.push(`<button type="button" class="chip chip--limpar" data-remover="tudo">Limpar</button>`);
  const el = $("#ativos");
  el.innerHTML = chips.join("");
  el.hidden = !chips.length;
  document.body.classList.toggle("tem-ativos", chips.length > 0);
}

// ------------------------------------------------------------------ ações

function alternar(set, valor) {
  if (set.has(valor)) set.delete(valor);
  else set.add(valor);
}

function selecionar(id, { origem }) {
  const fechar = id && app.selecionado === id && origem === "lista";
  app.selecionado = fechar ? null : id;
  mapa.selecionar(app.selecionado, estadoPin, { centralizar: origem === "lista" && Boolean(app.selecionado) });
  if (!mqDesktop.matches && app.selecionado) {
    if (origem === "mapa" && painel.estado === "baixo") painel.definir("meio");
    if (origem === "lista" && painel.estado === "alto") painel.definir("meio");
  }
  render({ rolarPara: app.selecionado });
  if (origem === "mapa" && app.selecionado && !mqDesktop.matches) {
    const l = app.porId.get(id);
    if (l && l.temCoord) mapa.centralizar({ lat: l.lat, lng: l.lng });
  }
}

function definirCasa(casa, reordenar = true) {
  const primeira = !store.casa();
  store.definirCasa(casa);
  mapa.definirCasa(store.casa());
  if (primeira && reordenar) app.f.ordem = "perto";
  render();
  renderCasa();
  if (reordenar) mostrarAviso("Casa definida. A lista agora mostra o tempo de bike.");
}

$("#lista").addEventListener("click", (e) => {
  const alvo = e.target.closest("[data-acao]");
  if (!alvo) return;
  const item = alvo.closest(".item");
  const id = item && item.dataset.id;
  switch (alvo.dataset.acao) {
    case "abrir":
      selecionar(id, { origem: "lista" });
      break;
    case "favorito":
      store.alternarFavorito(id);
      break;
    case "visitado":
      store.alternarVisitado(id);
      break;
    case "definir-casa":
      abrirDialogo("dlg-casa");
      break;
  }
});

$("#vazio").addEventListener("click", (e) => {
  const acao = e.target.closest("[data-acao]")?.dataset.acao;
  if (acao === "limpar-busca") {
    app.f.q = "";
    $("#busca").value = "";
  }
  if (acao === "limpar-filtros") limparFiltros();
  render();
});

function limparFiltros() {
  const { q, ordem } = app.f;
  app.f = { ...filtrosVazios(), q, ordem };
}

$("#ativos").addEventListener("click", (e) => {
  const b = e.target.closest("[data-remover]");
  if (!b) return;
  const { remover, valor } = b.dataset;
  if (remover === "tudo") limparFiltros();
  else if (remover === "visitas") app.f.visitas = "todos";
  else if (remover === "favoritos") app.f.favoritos = false;
  else if (remover === "raio") app.f.raio = 0;
  else app.f[remover].delete(valor);
  render();
});

let tBusca;
$("#busca").addEventListener("input", (e) => {
  app.f.q = e.target.value;
  clearTimeout(tBusca);
  tBusca = setTimeout(() => {
    render();
    if (!mqDesktop.matches && app.f.q && painel.estado === "baixo") painel.definir("meio");
  }, 120);
});
$("#busca-limpar").addEventListener("click", () => {
  app.f.q = "";
  $("#busca").value = "";
  render();
  $("#busca").focus();
});

$("#ordem").addEventListener("change", (e) => {
  app.f.ordem = e.target.value;
  render();
});

store.onChange(() => render());

// ------------------------------------------------------------------ diálogos

function abrirDialogo(id) {
  const d = document.getElementById(id);
  if (id === "dlg-filtros") renderDialogoFiltros();
  if (id === "dlg-casa") renderCasa();
  if (id === "dlg-menu") renderProgresso();
  d.showModal();
}

for (const d of document.querySelectorAll("dialog")) {
  d.addEventListener("click", (e) => {
    if (e.target === d || e.target.closest("[data-fechar]")) d.close();
  });
}

$("#btn-filtros").addEventListener("click", () => abrirDialogo("dlg-filtros"));
$("#btn-casa").addEventListener("click", () => abrirDialogo("dlg-casa"));
$("#btn-menu").addEventListener("click", () => abrirDialogo("dlg-menu"));

// Filtros ---------------------------------------------------------

function contagens(chave) {
  const out = new Map();
  for (const l of app.lugares) {
    const k = l[chave].slug;
    const c = out.get(k) || { total: 0, visitados: 0 };
    c.total++;
    if (store.visitado(l.id)) c.visitados++;
    out.set(k, c);
  }
  return out;
}

function renderDialogoFiltros() {
  const porTema = contagens("tema");
  const porBairro = contagens("bairro");
  const porPreco = contagens("preco");
  const casa = store.casa();
  const chipsGrupo = (grupo, itens) =>
    `<div class="chips">` +
    itens
      .map(
        (i) =>
          `<button type="button" class="chip" data-grupo="${grupo}" data-valor="${esc(i.valor)}" aria-pressed="false"` +
          (i.cor ? ` style="--cor:${i.cor}"` : "") +
          (i.dica ? ` title="${esc(i.dica)}"` : "") +
          `>${i.tema ? seloTema(i.tema, "tema-selo--p") : ""}` +
          `<span>${esc(i.rotulo)}</span><span class="chip__conta">${i.conta}</span></button>`,
      )
      .join("") +
    `</div>`;
  const segmentos = (grupo, itens, desabilitado) =>
    `<div class="segmentos" role="group">` +
    itens
      .map(
        (i) =>
          `<button type="button" class="segmento" data-grupo="${grupo}" data-valor="${i.valor}" aria-pressed="false"${desabilitado ? " disabled" : ""}>${esc(i.rotulo)}</button>`,
      )
      .join("") +
    `</div>`;
  const c = (m, k) => m.get(k) || { total: 0, visitados: 0 };

  $("#filtros-corpo").innerHTML =
    `<fieldset class="secao"><legend>Tema <small>visitados/total</small></legend>` +
    chipsGrupo("temas", TEMAS.map((t) => ({ valor: t.slug, rotulo: t.nome, tema: t, conta: `${c(porTema, t.slug).visitados}/${c(porTema, t.slug).total}` }))) +
    `</fieldset>` +
    `<fieldset class="secao"><legend>Bairro <small>visitados/total</small></legend>` +
    chipsGrupo("bairros", BAIRROS.map((b) => ({ valor: b.slug, rotulo: b.nome, conta: `${c(porBairro, b.slug).visitados}/${c(porBairro, b.slug).total}` }))) +
    `</fieldset>` +
    `<fieldset class="secao"><legend>Preço</legend>` +
    chipsGrupo("precos", PRECOS.map((p) => ({ valor: p.slug, rotulo: p.rotulo, dica: p.dica, conta: c(porPreco, p.slug).total }))) +
    `<p class="nota">€ até ~€15 por pessoa · €€ ~€15–35 · €€€ acima de ~€35</p>` +
    `</fieldset>` +
    `<fieldset class="secao"><legend>Visitas</legend>` +
    segmentos("visitas", VISITAS) +
    `<label class="interruptor"><input type="checkbox" id="f-favoritos"> <span>${icon("heart")} Só favoritos</span></label>` +
    `</fieldset>` +
    `<fieldset class="secao"><legend>Distância de casa, de bike</legend>` +
    segmentos("raio", RAIOS.map((r) => ({ valor: String(r), rotulo: r ? `até ${r} min` : "Qualquer" })), !casa) +
    (casa
      ? `<p class="nota">${NOTA_ESTIMATIVA}</p>`
      : `<p class="nota"><button type="button" class="link" id="f-definir-casa">Defina sua casa</button> para filtrar por distância.</p>`) +
    `</fieldset>`;
  atualizarDialogoFiltros();
}

function atualizarDialogoFiltros() {
  const corpo = $("#filtros-corpo");
  if (!corpo.firstChild) return;
  const f = app.f;
  for (const b of corpo.querySelectorAll("[data-grupo]")) {
    const { grupo, valor } = b.dataset;
    let ativo;
    if (grupo === "visitas") ativo = f.visitas === valor;
    else if (grupo === "raio") ativo = String(f.raio) === valor;
    else ativo = f[grupo].has(valor);
    b.setAttribute("aria-pressed", String(ativo));
  }
  const fav = $("#f-favoritos");
  if (fav) fav.checked = f.favoritos;
  const n = app.resultado.length;
  $("#filtros-ver").textContent = n ? `Ver ${n} ${n === 1 ? "lugar" : "lugares"}` : "Nenhum lugar";
}

$("#filtros-corpo").addEventListener("click", (e) => {
  if (e.target.closest("#f-definir-casa")) {
    $("#dlg-filtros").close();
    abrirDialogo("dlg-casa");
    return;
  }
  const b = e.target.closest("[data-grupo]");
  if (!b || b.disabled) return;
  const { grupo, valor } = b.dataset;
  if (grupo === "visitas") app.f.visitas = valor;
  else if (grupo === "raio") app.f.raio = Number(valor);
  else alternar(app.f[grupo], valor);
  render();
});
$("#filtros-corpo").addEventListener("change", (e) => {
  if (e.target.id === "f-favoritos") {
    app.f.favoritos = e.target.checked;
    render();
  }
});
$("#filtros-limpar").addEventListener("click", () => {
  limparFiltros();
  render();
});
$("#dlg-filtros").addEventListener("close", () => {
  if (!mqDesktop.matches && painel.estado === "baixo" && contarAtivos(app.f)) painel.definir("meio");
});

// Casa ------------------------------------------------------------

const VIEWBOX = "4.72,52.43,5.08,52.26";

function renderCasa() {
  const casa = store.casa();
  $("#casa-atual").innerHTML = casa
    ? `${icon("house", "icone-inline")} <strong>${esc(casa.nome)}</strong><br><small>${casa.lat.toFixed(5)}, ${casa.lng.toFixed(5)} · arraste o marcador no mapa para ajustar</small>`
    : "Defina onde fica sua casa para ver o tempo de bike até cada lugar e ordenar a lista por proximidade.";
  $("#casa-remover").hidden = !casa;
  $("#casa-nota").textContent = NOTA_ESTIMATIVA;
}

$("#casa-busca").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("#casa-endereco").value.trim();
  const ul = $("#casa-resultados");
  if (!q) return;
  ul.innerHTML = `<li class="nota">Buscando…</li>`;
  try {
    const params = new URLSearchParams({
      q,
      format: "jsonv2",
      limit: "5",
      countrycodes: "nl",
      viewbox: VIEWBOX,
      bounded: "1",
      "accept-language": "pt-BR,nl",
    });
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!resp.ok) throw new Error(resp.status);
    const res = await resp.json();
    if (!res.length) {
      ul.innerHTML = `<li class="nota">Nenhum endereço encontrado em Amsterdam/Amstelveen. Tente rua e número, ou escolha no mapa.</li>`;
      return;
    }
    ul.innerHTML = res
      .map(
        (r, i) =>
          `<li><button type="button" class="resultado" data-i="${i}">${icon("map-pin")}<span>${esc(r.display_name)}</span></button></li>`,
      )
      .join("");
    ul.onclick = (ev) => {
      const b = ev.target.closest("[data-i]");
      if (!b) return;
      const r = res[Number(b.dataset.i)];
      const nome = r.display_name.split(",").slice(0, 2).join(",").trim();
      definirCasa({ lat: Number(r.lat), lng: Number(r.lon), nome });
      ul.innerHTML = "";
      $("#dlg-casa").close();
      mapa.centralizar({ lat: Number(r.lat), lng: Number(r.lon) }, 14);
    };
  } catch {
    ul.innerHTML = `<li class="nota">Não foi possível buscar agora (sem conexão?). Você pode escolher no mapa.</li>`;
  }
});

$("#casa-mapa").addEventListener("click", () => {
  $("#dlg-casa").close();
  if (!mqDesktop.matches) painel.definir("baixo");
  mapa.iniciarModoCasa();
  mostrarAviso("Toque no mapa onde fica sua casa.", {
    fixo: true,
    acao: "Cancelar",
    aoAgir: () => mapa.cancelarModoCasa(),
  });
});

$("#casa-remover").addEventListener("click", () => {
  store.definirCasa(null);
  mapa.definirCasa(null);
  app.f.raio = 0;
  if (app.f.ordem === "perto") app.f.ordem = "nome";
  render();
  renderCasa();
});

// Progresso e backup ------------------------------------------------

function renderProgresso() {
  const total = app.lugares.length;
  const visitados = app.lugares.filter((l) => store.visitado(l.id)).length;
  const favoritos = app.lugares.filter((l) => store.favorito(l.id)).length;
  const barra = (v, t) => `<span class="barra" aria-hidden="true"><span style="width:${t ? (100 * v) / t : 0}%"></span></span>`;
  const linhas = (itens, mapaCont) =>
    itens
      .map((i) => {
        const c = mapaCont.get(i.slug) || { total: 0, visitados: 0 };
        return (
          `<li class="progresso__linha">` +
          (i.glifo ? seloTema(i, "tema-selo--p") : "") +
          `<span class="progresso__nome">${esc(i.nome)}</span>${barra(c.visitados, c.total)}` +
          `<span class="progresso__conta">${c.visitados}/${c.total}</span></li>`
        );
      })
      .join("");
  $("#progresso").innerHTML =
    `<div class="progresso__geral"><p><strong>${visitados}</strong> de ${total} visitados · <strong>${favoritos}</strong> favoritos</p>${barra(visitados, total)}</div>` +
    `<section class="secao"><h3>Por tema</h3><ul class="progresso">${linhas(TEMAS, contagens("tema"))}</ul></section>` +
    `<section class="secao"><h3>Por bairro</h3><ul class="progresso">${linhas(BAIRROS, contagens("bairro"))}</ul></section>`;
}

$("#exportar").addEventListener("click", () => {
  const dados = JSON.stringify(store.exportar(), null, 2);
  const blob = new Blob([dados], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mapa-amsterdam-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("#importar").addEventListener("click", () => $("#importar-arquivo").click());
$("#importar-arquivo").addEventListener("change", async (e) => {
  const arq = e.target.files[0];
  e.target.value = "";
  if (!arq) return;
  try {
    const r = store.importar(JSON.parse(await arq.text()));
    mapa.definirCasa(store.casa());
    renderProgresso();
    mostrarAviso(
      `Importado: ${r.visitados} visitados e ${r.favoritos} favoritos novos${r.casa ? ", e a casa" : ""}.`,
    );
  } catch (err) {
    mostrarAviso(err instanceof SyntaxError ? "Esse arquivo não é um JSON válido." : err.message);
  }
});

// Aviso (toast) -----------------------------------------------------

let tAviso;
function mostrarAviso(texto, { fixo = false, acao = null, aoAgir = null } = {}) {
  const el = $("#aviso");
  $("#aviso-texto").textContent = texto;
  const b = $("#aviso-acao");
  b.hidden = !acao;
  b.textContent = acao || "";
  b.onclick = () => {
    if (aoAgir) aoAgir();
    esconderAviso();
  };
  el.hidden = false;
  clearTimeout(tAviso);
  if (!fixo) tAviso = setTimeout(esconderAviso, 4000);
}
function esconderAviso() {
  $("#aviso").hidden = true;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mapa.modoCasa) {
    mapa.cancelarModoCasa();
    esconderAviso();
  }
});

// ------------------------------------------------------------------ início

async function iniciar() {
  try {
    app.lugares = await carregarLugares();
  } catch (e) {
    const semDados = e instanceof DadosAusentes;
    $("#contagem").textContent = "Sem dados";
    $("#vazio").hidden = false;
    $("#vazio").innerHTML =
      `<div class="vazio__ilustracao" aria-hidden="true">${icon("circle-alert")}</div>` +
      `<p class="vazio__titulo">Não consegui carregar os lugares</p>` +
      `<p class="vazio__texto">${
        semDados
          ? "O arquivo <code>data/lugares.json</code> ainda não existe. Rode <code>python3 scripts/geocode.py</code> e recarregue."
          : esc(e.message)
      }</p>`;
    if (!mqDesktop.matches) painel.definir("meio");
    return;
  }
  app.porId = new Map(app.lugares.map((l) => [l.id, l]));
  app.algumaCoord = app.lugares.some((l) => l.temCoord);
  if (app.selecionado && !app.porId.has(app.selecionado)) app.selecionado = null;
  if (app.f.ordem === "perto" && !store.casa()) app.f.ordem = "nome";
  $("#busca").value = app.f.q;

  mapa.criarMarcadores(app.lugares, estadoPin);
  mapa.definirCasa(store.casa());
  render();
  if (!app.algumaCoord) {
    mostrarAviso("Os lugares ainda não têm coordenadas, então o mapa fica sem pins. A lista e os filtros funcionam.", { fixo: true, acao: "Ok" });
  }

  if (app.selecionado) {
    const id = app.selecionado;
    app.selecionado = null;
    if (!mqDesktop.matches) painel.definir("meio", false);
    selecionar(id, { origem: "lista" });
  } else if (contarAtivos(app.f) || app.f.q) {
    mapa.ajustarA(app.resultado.map((r) => r.lugar));
  }
}

iniciar();
