// Catálogo fixo (temas, bairros, preços) e carregamento de data/lugares.json.

// glifo: desenho do carimbo (js/carimbos.js). As cores são tintas de gravura,
// todas com contraste de pelo menos 3,7:1 contra o recorte em papel.
export const TEMAS = [
  { slug: "gastronomia", nome: "Gastronomia e cafés", curto: "Gastronomia", glifo: "peixe", cor: "#c83d24" },
  { slug: "parques", nome: "Parques e dog-friendly", curto: "Parques", glifo: "cao", cor: "#277a4c" },
  { slug: "esporte", nome: "Esporte", curto: "Esporte", glifo: "medalha", cor: "#17798b" },
  { slug: "lojas", nome: "Lojas e design", curto: "Lojas", glifo: "sacola", cor: "#b53b5e" },
  { slug: "feiras", nome: "Feiras de rua", curto: "Feiras", glifo: "toldo", cor: "#a86e1f" },
  { slug: "bares", nome: "Bares", curto: "Bares", glifo: "cerveja", cor: "#8a4a2b" },
  { slug: "baladas", nome: "Baladas e shows", curto: "Baladas", glifo: "trompete", cor: "#2a55c9" },
  { slug: "coffeeshops", nome: "Coffeeshops", curto: "Coffeeshops", glifo: "folha", cor: "#5a7a20" },
  { slug: "museus", nome: "Museus", curto: "Museus", glifo: "museu", cor: "#1d2a5a" },
  { slug: "canais", nome: "Canais e pontes", curto: "Canais", glifo: "ponte", cor: "#2f67ad" },
].map((t, i) => ({ ...t, semente: 3 + i }));

export const BAIRROS = [
  "Centrum", "Jordaan", "Westerpark", "Oud-West", "De Pijp", "Oud-Zuid", "Oost",
  "Oostelijke Eilanden", "Noord", "Nieuw-West", "Zuidas / Amstelveen", "Zuidoost",
].map((nome) => ({ slug: slugify(nome), nome }));

export const PRECOS = [
  { slug: "gratis", nome: "grátis", rotulo: "Grátis", dica: "grátis" },
  { slug: "1", nome: "€", rotulo: "€", dica: "até ~€15 por pessoa" },
  { slug: "2", nome: "€€", rotulo: "€€", dica: "~€15–35 por pessoa" },
  { slug: "3", nome: "€€€", rotulo: "€€€", dica: "acima de ~€35 por pessoa" },
];

const TEMA_POR_NOME = new Map(TEMAS.map((t) => [t.nome, t]));
const BAIRRO_POR_NOME = new Map(BAIRROS.map((b) => [b.nome, b]));
const PRECO_POR_NOME = new Map(PRECOS.map((p) => [p.nome, p]));

/** Minúsculas, sem acentos e sem pontuação: para busca tolerante. */
export function normalize(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9€]+/g, " ")
    .trim();
}

export function slugify(texto) {
  return normalize(texto).replace(/\s+/g, "-");
}

export class DadosAusentes extends Error {}

async function buscarJSON(url) {
  // Versão de arquivo único (scripts/arquivo_unico.py): os dados vêm embutidos na página.
  if (globalThis.LUGARES_EMBUTIDOS) return globalThis.LUGARES_EMBUTIDOS;
  let resp;
  try {
    resp = await fetch(url, { cache: "no-cache" });
  } catch (e) {
    throw new DadosAusentes(`não foi possível abrir ${url}`);
  }
  if (!resp.ok) throw new DadosAusentes(`${url} respondeu ${resp.status}`);
  return resp.json();
}

export async function carregarLugares(url = "data/lugares.json") {
  const json = await buscarJSON(url);
  return (json.lugares || []).map((l) => {
    const tema = TEMA_POR_NOME.get(l.tema);
    const bairro = BAIRRO_POR_NOME.get(l.bairro);
    const preco = PRECO_POR_NOME.get(l.preco);
    if (!tema || !bairro || !preco) console.warn("lugar com tema/bairro/preço desconhecido:", l.id);
    const temCoord = typeof l.lat === "number" && typeof l.lng === "number";
    return {
      ...l,
      cidade: l.cidade || "Amsterdam",
      tema: tema || TEMAS[0],
      bairro: bairro || { slug: slugify(l.bairro), nome: l.bairro },
      preco: preco || { slug: "", nome: l.preco, rotulo: l.preco, dica: "" },
      temCoord,
      texto: normalize(`${l.nome} ${l.descricao}`),
    };
  });
}
