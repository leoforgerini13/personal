// Visitados, favoritos e casa, salvos no localStorage.
// Se o localStorage não estiver disponível (aba anônima, bloqueio), tudo
// continua funcionando só em memória, sem avisos.

const CHAVE = "mapa-amsterdam:v1";

function vazio() {
  return { visitados: {}, favoritos: {}, casa: null };
}

function ler() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    return sanitizar(JSON.parse(bruto));
  } catch {
    return vazio();
  }
}

function sanitizar(obj) {
  const out = vazio();
  if (obj && typeof obj === "object") {
    for (const [id, v] of Object.entries(obj.visitados || {})) if (v) out.visitados[id] = String(v);
    for (const [id, v] of Object.entries(obj.favoritos || {})) if (v) out.favoritos[id] = true;
    out.casa = casaValida(obj.casa);
  }
  return out;
}

function casaValida(c) {
  if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") return null;
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
  return { lat: c.lat, lng: c.lng, nome: String(c.nome || "Casa") };
}

let dados = ler();
const ouvintes = new Set();

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    /* sem persistência: segue em memória */
  }
  for (const fn of ouvintes) fn();
}

// Mantém abas abertas em sincronia.
try {
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE) return;
    dados = ler();
    for (const fn of ouvintes) fn();
  });
} catch {
  /* ignora */
}

const hoje = () => new Date().toISOString().slice(0, 10);

export const store = {
  onChange(fn) {
    ouvintes.add(fn);
    return () => ouvintes.delete(fn);
  },
  visitado: (id) => Boolean(dados.visitados[id]),
  /** Data da visita (AAAA-MM-DD) ou "" se não visitado. */
  dataVisita: (id) => (dados.visitados[id] && dados.visitados[id] !== "true" ? String(dados.visitados[id]) : ""),
  favorito: (id) => Boolean(dados.favoritos[id]),
  alternarVisitado(id) {
    if (dados.visitados[id]) delete dados.visitados[id];
    else dados.visitados[id] = hoje();
    salvar();
  },
  alternarFavorito(id) {
    if (dados.favoritos[id]) delete dados.favoritos[id];
    else dados.favoritos[id] = true;
    salvar();
  },
  casa: () => dados.casa,
  definirCasa(casa) {
    dados.casa = casaValida(casa);
    salvar();
  },

  exportar() {
    return {
      app: "mapa-amsterdam",
      versao: 1,
      exportado_em: new Date().toISOString(),
      visitados: Object.entries(dados.visitados).map(([id, data]) => ({ id, data })),
      favoritos: Object.keys(dados.favoritos),
      casa: dados.casa,
    };
  },

  /** Junta o backup com o que já existe (não apaga nada). */
  importar(obj) {
    if (!obj || obj.app !== "mapa-amsterdam" || !Array.isArray(obj.visitados) || !Array.isArray(obj.favoritos)) {
      throw new Error("Arquivo não parece um backup do Mapa de Amsterdam.");
    }
    let visitados = 0;
    let favoritos = 0;
    for (const v of obj.visitados) {
      const id = typeof v === "string" ? v : v && v.id;
      if (!id || dados.visitados[id]) continue;
      dados.visitados[id] = (v && v.data) || hoje();
      visitados++;
    }
    for (const id of obj.favoritos) {
      if (typeof id !== "string" || dados.favoritos[id]) continue;
      dados.favoritos[id] = true;
      favoritos++;
    }
    let casa = false;
    if (!dados.casa && casaValida(obj.casa)) {
      dados.casa = casaValida(obj.casa);
      casa = true;
    }
    salvar();
    return { visitados, favoritos, casa };
  },
};
