// Catálogo fixo (temas, bairros, preços) e carregamento de data/lugares.json.

export const TEMAS = [
  { slug: "gastronomia", nome: "Gastronomia e cafés", curto: "Gastronomia", icone: "utensils", cor: "#d9480f" },
  { slug: "parques", nome: "Parques e dog-friendly", curto: "Parques", icone: "trees", cor: "#2b8a3e" },
  { slug: "esporte", nome: "Esporte", curto: "Esporte", icone: "medal", cor: "#0c8599" },
  { slug: "lojas", nome: "Lojas e design", curto: "Lojas", icone: "shopping-bag", cor: "#c2255c" },
  { slug: "feiras", nome: "Feiras de rua", curto: "Feiras", icone: "store", cor: "#8b5a2b" },
  { slug: "bares", nome: "Bares", curto: "Bares", icone: "beer", cor: "#c92a2a" },
  { slug: "baladas", nome: "Baladas e shows", curto: "Baladas", icone: "music", cor: "#6741d9" },
  { slug: "coffeeshops", nome: "Coffeeshops", curto: "Coffeeshops", icone: "leaf", cor: "#5c940d" },
  { slug: "museus", nome: "Museus", curto: "Museus", icone: "landmark", cor: "#364fc7" },
  { slug: "canais", nome: "Canais e pontes", curto: "Canais", icone: "waves", cor: "#1971c2" },
];

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

export async function carregarLugares(url = "data/lugares.json") {
  let resp;
  try {
    resp = await fetch(url, { cache: "no-cache" });
  } catch (e) {
    throw new DadosAusentes(`não foi possível abrir ${url}`);
  }
  if (!resp.ok) throw new DadosAusentes(`${url} respondeu ${resp.status}`);
  const json = await resp.json();
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
