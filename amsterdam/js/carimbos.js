// Carimbos dos temas (direção visual "Carimbo", gravura em linóleo).
// Desenhos originais em SVG, com borda irregular e tinta falhada. Cada
// carimbo vira uma imagem data: URI, gerada uma vez e reutilizada em pins,
// lista, legenda, filtros e progresso (barato para o navegador: é só <img>).

export const PAPEL = "#f6efdf";
export const VERMELHO = "#c23a22";
export const MARINHO = "#1d2a5a";

// Mancha de tinta levemente irregular (48×48).
const MANCHA = "M24 2.5c11.5-.4 21 8.6 21.3 20.4.3 12.3-8.7 22.4-21 22.6C12 45.7 2.8 36.6 2.7 24.4 2.5 12.6 12 2.9 24 2.5z";

// Glifos 48×48. p = cor do recorte (papel), f = cor da tinta por trás.
const GLIFOS = {
  peixe: (p, f) =>
    `<path d="M4 24c7-9 21-11 31-4l9-7-2 11 2 11-9-7c-10 7-24 5-31-4z" fill="${p}"/>` +
    `<circle cx="11.5" cy="22" r="2.1" fill="${f}"/>` +
    `<path d="M17 16.5c3 4.5 3 10.5 0 15l2 .5c2.8-4.8 2.8-11.2 0-16z" fill="${f}"/>` +
    `<path d="M23 20.5h1.8v7H23zM27.5 20h1.8v8h-1.8zM32 21h1.8v6H32z" fill="${f}"/>`,
  cao: (p, f) =>
    `<ellipse cx="12" cy="18" rx="7" ry="6.5" fill="${p}"/><path d="M2 21.5 7 15l4 7z" fill="${p}"/>` +
    `<rect x="11" y="20" width="29" height="12" rx="5.5" fill="${p}"/>` +
    `<rect x="13.5" y="27" width="5" height="15" rx="2.2" fill="${p}"/><rect x="33" y="27" width="5" height="15" rx="2.2" fill="${p}"/>` +
    `<path d="M37.5 23c3.5-2 5.5-6 6.5-11.5l2.4 1c-1 6.5-3.4 11-7.6 14z" fill="${p}"/>` +
    `<path d="M11 11.5c3.5-1.4 6.5.2 6.5 3.4l-1.4 8c-2.4-.4-4.2-2.6-5.2-5.6z" fill="${f}"/><circle cx="8.6" cy="16.6" r="1.3" fill="${f}"/>`,
  medalha: (p, f) =>
    `<path d="M13 3h8l5 13h-8zM35 3h-8l-5 13h8z" fill="${p}"/><circle cx="24" cy="30" r="13" fill="${p}"/>` +
    `<path d="M24 22.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" fill="${f}"/>`,
  sacola: (p, f) =>
    `<path d="M8 17h32l-3 27H11z" fill="${p}"/>` +
    `<path d="M16.5 20v-6a7.5 7.5 0 0 1 15 0v6" fill="none" stroke="${p}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<circle cx="16.5" cy="22" r="1.8" fill="${f}"/><circle cx="31.5" cy="22" r="1.8" fill="${f}"/><path d="M13 36h22v2.4H13z" fill="${f}"/>`,
  toldo: (p, f) =>
    `<path d="M4 10h40v10c0 3-2.6 5-5 5s-5-2-5-5c0 3-2.6 5-5 5s-5-2-5-5c0 3-2.6 5-5 5s-5-2-5-5c0 3-2.6 5-5 5S4 23 4 20z" fill="${p}"/>` +
    `<path d="M12 10h6v10h-6zM30 10h6v10h-6z" fill="${f}"/>` +
    `<path d="M6.5 25h3v18h-3zM38.5 25h3v18h-3zM4 33h40v4H4z" fill="${p}"/>` +
    `<circle cx="15" cy="30" r="2.8" fill="${p}"/><circle cx="24" cy="29.5" r="3.2" fill="${p}"/><circle cx="33" cy="30" r="2.8" fill="${p}"/>`,
  cerveja: (p, f) =>
    `<path d="M11 15h22l-2 28H13z" fill="${p}"/>` +
    `<path d="M8.5 16c-.5-4.5 3-7 6.5-5.8 1.5-3.6 6.2-4.2 8.5-1.8 2.6-2.4 7.6-2 9 1.6 3.4-1 6.6 1.6 5.5 6z" fill="${p}"/>` +
    `<path d="M33 20h4.5a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5H33v-4h4.2a1.6 1.6 0 0 0 1.6-1.6v-4a1.6 1.6 0 0 0-1.6-1.6H33z" fill="${p}"/>` +
    `<circle cx="18" cy="26" r="1.5" fill="${f}"/><circle cx="24.5" cy="32" r="1.5" fill="${f}"/><circle cx="20" cy="37" r="1.1" fill="${f}"/>`,
  trompete: (p, f) =>
    `<path d="M1.5 21h3.5v7H1.5zM5 22.5h23l14-10v24l-14-10H5z" fill="${p}"/>` +
    `<path d="M12 13h3.6v10H12zM17.6 13h3.6v10h-3.6zM23.2 13h3.6v10h-3.6z" fill="${p}"/>` +
    `<path d="M10 26.5v6a4.5 4.5 0 0 0 4.5 4.5h11a4.5 4.5 0 0 0 4.5-4.5v-6" fill="none" stroke="${p}" stroke-width="3.2"/>` +
    `<path d="M36 17v15" stroke="${f}" stroke-width="1.6"/>`,
  folha: (p, f) =>
    `<path d="M24 45C11 36 7 21 24 3c17 18 13 33 0 42z" fill="${p}"/><path d="M23.1 11h1.8v31h-1.8z" fill="${f}"/>` +
    `<path d="M24 22l-7-5M24 22l7-5M24 31l-8-5M24 31l8-5" fill="none" stroke="${f}" stroke-width="1.6" stroke-linecap="round"/>`,
  museu: (p, f) =>
    `<path d="M3 17 24 5l21 12z" fill="${p}"/>` +
    `<path d="M6 18.5h36v4H6zM8 23.5h5v14H8zM17 23.5h5v14h-5zM26 23.5h5v14h-5zM35 23.5h5v14h-5zM3 38.5h42v5H3z" fill="${p}"/>` +
    `<circle cx="24" cy="12.6" r="2" fill="${f}"/>`,
  ponte: (p, f) =>
    `<path d="M2 18h44v17H2z" fill="${p}"/><path d="M10.5 35a13.5 13.5 0 0 1 27 0z" fill="${f}"/>` +
    `<path d="M4 12h3v6H4zM14 12h3v6h-3zM31 12h3v6h-3zM41 12h3v6h-3zM2 11h44v2.4H2z" fill="${p}"/>` +
    `<path d="M3 42c3-2.2 5.5-2.2 8.5 0s5.5 2.2 8.5 0 5.5-2.2 8.5 0 5.5 2.2 8.5 0 5.5-2.2 8.5 0" fill="none" stroke="${p}" stroke-width="2.6" stroke-linecap="round"/>`,
  casa: (p, f) =>
    `<path d="M7 24 24 9l17 15v19H7z" fill="${p}"/><path d="M20 43V31h8v12z" fill="${f}"/>` +
    `<path d="M11.5 27h5v5h-5zM31.5 27h5v5h-5z" fill="${f}"/>`,
  cruzes: (p) =>
    `<g fill="none" stroke="${p}" stroke-width="4" stroke-linecap="round">` +
    `<path d="M15 8l18 7M33 8l-18 7M15 20.5l18 7M33 20.5l-18 7M15 33l18 7M33 33l-18 7"/></g>`,
};

// Borda irregular + tinta falhada. A semente muda o desenho da falha.
function filtro(semente) {
  return (
    `<filter id="t" x="-15%" y="-15%" width="130%" height="130%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" seed="${semente}" result="r"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="r" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="1" seed="${semente + 8}" result="g"/>` +
    `<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 6.5" result="m"/>` +
    `<feComposite in="d" in2="m" operator="in"/></filter>`
  );
}

const cache = new Map();

/** Carimbo como data: URI. `glifo` é a chave em GLIFOS; `cor` a tinta. */
export function carimboURL(glifo, cor, semente = 3) {
  const chave = `${glifo}|${cor}|${semente}`;
  let url = cache.get(chave);
  if (!url) {
    const desenho = GLIFOS[glifo];
    const miolo = glifo === "cruzes" ? desenho(PAPEL) : `<g transform="translate(9.6 9.6) scale(.6)">${desenho(PAPEL, cor)}</g>`;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 52 52" width="52" height="52">` +
      `<defs>${filtro(semente)}</defs><g filter="url(#t)"><path d="${MANCHA}" fill="${cor}"/>${miolo}</g></svg>`;
    url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    cache.set(chave, url);
  }
  return url;
}

/** <img> do carimbo de um tema. Decorativo: o nome do tema vem sempre em texto ao lado. */
export function seloTema(tema, cls = "") {
  return `<img class="tema-selo ${cls}" src="${carimboURL(tema.glifo, tema.cor, tema.semente)}" alt="" width="48" height="48" draggable="false">`;
}

export const seloCasa = () => carimboURL("casa", VERMELHO, 5);
export const seloMarca = () => carimboURL("cruzes", VERMELHO, 4);
