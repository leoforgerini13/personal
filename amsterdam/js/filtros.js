// Estado dos filtros, aplicação sobre a lista e sincronização com a URL.

import { TEMAS, BAIRROS, PRECOS, normalize } from "./data.js";
import { bike } from "./geo.js";

export const RAIOS = [0, 10, 20, 30]; // minutos; 0 = qualquer distância
export const VISITAS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "nao-visitados", rotulo: "Não visitados" },
  { valor: "visitados", rotulo: "Só visitados" },
];

export function filtrosVazios() {
  return {
    temas: new Set(),
    bairros: new Set(),
    precos: new Set(),
    q: "",
    visitas: "todos",
    favoritos: false,
    raio: 0,
    ordem: "nome", // "nome" | "perto"
  };
}

export function contarAtivos(f) {
  return (
    f.temas.size + f.bairros.size + f.precos.size +
    (f.visitas !== "todos" ? 1 : 0) + (f.favoritos ? 1 : 0) + (f.raio ? 1 : 0)
  );
}

/**
 * Lugares que passam nos filtros, já ordenados.
 * Cada item volta com .bike ({km, min} ou null) calculado para a casa atual.
 */
export function aplicar(lugares, f, store, casa) {
  const termos = normalize(f.q).split(" ").filter(Boolean);
  const out = [];
  for (const l of lugares) {
    if (f.temas.size && !f.temas.has(l.tema.slug)) continue;
    if (f.bairros.size && !f.bairros.has(l.bairro.slug)) continue;
    if (f.precos.size && !f.precos.has(l.preco.slug)) continue;
    if (termos.length && !termos.every((t) => l.texto.includes(t))) continue;
    const visitado = store.visitado(l.id);
    if (f.visitas === "visitados" && !visitado) continue;
    if (f.visitas === "nao-visitados" && visitado) continue;
    if (f.favoritos && !store.favorito(l.id)) continue;
    const b = bike(casa, l);
    if (casa && f.raio && (!b || b.min > f.raio)) continue;
    out.push({ lugar: l, bike: b });
  }
  const porNome = (a, b) => a.lugar.nome.localeCompare(b.lugar.nome, "pt-BR", { sensitivity: "base" });
  if (f.ordem === "perto" && casa) {
    out.sort((a, b) => (a.bike ? a.bike.km : Infinity) - (b.bike ? b.bike.km : Infinity) || porNome(a, b));
  } else {
    out.sort(porNome);
  }
  return out;
}

// ------------------------------------------------------------------ URL

const SLUGS = {
  temas: new Set(TEMAS.map((t) => t.slug)),
  bairros: new Set(BAIRROS.map((b) => b.slug)),
  precos: new Set(PRECOS.map((p) => p.slug)),
};

function lerLista(params, chave, validos) {
  const bruto = params.get(chave);
  if (!bruto) return new Set();
  return new Set(bruto.split(",").filter((s) => validos.has(s)));
}

/** Lê filtros e lugar selecionado de location.search. */
export function lerURL(search = location.search) {
  const p = new URLSearchParams(search);
  const f = filtrosVazios();
  f.temas = lerLista(p, "tema", SLUGS.temas);
  f.bairros = lerLista(p, "bairro", SLUGS.bairros);
  f.precos = lerLista(p, "preco", SLUGS.precos);
  f.q = p.get("q") || "";
  const visitas = p.get("visitas");
  if (VISITAS.some((v) => v.valor === visitas)) f.visitas = visitas;
  f.favoritos = p.get("favoritos") === "1";
  const raio = Number(p.get("raio"));
  if (RAIOS.includes(raio)) f.raio = raio;
  if (p.get("ordem") === "perto") f.ordem = "perto";
  return { filtros: f, lugar: p.get("lugar") || null };
}

/** Escreve o estado na URL sem criar entradas no histórico. */
export function escreverURL(f, lugarId, extras = {}) {
  const p = new URLSearchParams();
  const lista = (s) => [...s].sort().join(",");
  if (f.temas.size) p.set("tema", lista(f.temas));
  if (f.bairros.size) p.set("bairro", lista(f.bairros));
  if (f.precos.size) p.set("preco", lista(f.precos));
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.visitas !== "todos") p.set("visitas", f.visitas);
  if (f.favoritos) p.set("favoritos", "1");
  if (f.raio) p.set("raio", String(f.raio));
  if (f.ordem !== "nome") p.set("ordem", f.ordem);
  if (lugarId) p.set("lugar", lugarId);
  for (const [k, v] of Object.entries(extras)) if (v) p.set(k, v);
  const qs = p.toString().replace(/%2C/g, ",");
  const url = location.pathname + (qs ? `?${qs}` : "") + location.hash;
  try {
    history.replaceState(null, "", url);
  } catch {
    /* ex.: file:// em alguns navegadores */
  }
}
