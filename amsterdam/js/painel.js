// Painel inferior arrastável (celular). No desktop vira a coluna lateral e
// este módulo fica inativo.

const ESTADOS = ["baixo", "meio", "alto"];
const mqDesktop = window.matchMedia("(min-width: 900px)");

export class Painel {
  constructor(el, { cabeca, alca, topo, onMudar }) {
    this.el = el;
    this.cabeca = cabeca;
    this.alca = alca;
    this.topo = topo;
    this.onMudar = onMudar || (() => {});
    this.estado = el.dataset.estado || "baixo";
    this._arrasto();
    // O cabeçalho inteiro é alvo de toque (a alça sozinha é baixa demais).
    cabeca.addEventListener("click", (e) => {
      if (this._arrastou || this.desktop) return;
      if (e.target.closest("select, input, a, label, button:not(.painel__alca)")) return;
      this.definir(this.estado === "baixo" ? "meio" : this.estado === "meio" ? "alto" : "baixo");
    });
    window.addEventListener("resize", () => this.aplicar(false));
    mqDesktop.addEventListener("change", () => this.aplicar(false));
    this.aplicar(false);
  }

  get desktop() {
    return mqDesktop.matches;
  }

  alturas() {
    const vh = window.innerHeight;
    const topo = this.topo.getBoundingClientRect().bottom;
    const baixo = this.cabeca.offsetHeight + parseFloat(getComputedStyle(this.el).paddingBottom || 0);
    const alto = vh - topo - 8;
    return { baixo, meio: Math.min(Math.max(vh * 0.5, baixo + 120), alto), alto, total: alto };
  }

  /** Quanto do painel está visível (px), para centralizar o mapa acima dele. */
  visivel() {
    if (this.desktop) return 0;
    return this.alturas()[this.estado];
  }

  definir(estado, animar = true) {
    if (!ESTADOS.includes(estado) || this.desktop) return;
    this.estado = estado;
    this.aplicar(animar);
    this.onMudar(estado);
  }

  aplicar(animar = true) {
    const el = this.el;
    if (this.desktop) {
      el.style.removeProperty("--painel-altura");
      el.style.removeProperty("transform");
      return;
    }
    const a = this.alturas();
    el.dataset.estado = this.estado;
    el.style.setProperty("--painel-altura", `${a.total}px`);
    el.classList.toggle("painel--animar", animar);
    el.style.transform = `translateY(${a.total - a[this.estado]}px)`;
    const expandido = this.estado !== "baixo";
    this.alca.setAttribute("aria-expanded", String(expandido));
    this.alca.setAttribute("aria-label", this.estado === "alto" ? "Recolher lista" : "Expandir lista");
  }

  _arrasto() {
    let inicioY = 0;
    let inicioT = 0;
    let ultimoY = 0;
    let ultimoT = 0;
    let vel = 0;
    let ativo = false;
    const alvo = this.cabeca;

    alvo.addEventListener("pointerdown", (e) => {
      if (this.desktop || e.button !== 0) return;
      if (e.target.closest("select, input, a, label, button:not(.painel__alca)")) return;
      const a = this.alturas();
      ativo = true;
      this._arrastou = false;
      inicioY = ultimoY = e.clientY;
      inicioT = a.total - a[this.estado];
      ultimoT = performance.now();
      vel = 0;
      this.el.classList.remove("painel--animar");
    });

    alvo.addEventListener("pointermove", (e) => {
      if (!ativo) return;
      const dy = e.clientY - inicioY;
      if (!this._arrastou && Math.abs(dy) > 6) {
        this._arrastou = true;
        // só captura quando vira arrasto, para o toque simples gerar click normal
        alvo.setPointerCapture(e.pointerId);
      }
      if (!this._arrastou) return;
      const a = this.alturas();
      const t = Math.min(Math.max(inicioT + dy, 0), a.total - a.baixo);
      this.el.style.transform = `translateY(${t}px)`;
      const agora = performance.now();
      vel = (e.clientY - ultimoY) / Math.max(agora - ultimoT, 1);
      ultimoY = e.clientY;
      ultimoT = agora;
    });

    const fim = (e) => {
      if (!ativo) return;
      ativo = false;
      if (!this._arrastou) return;
      const a = this.alturas();
      const visivel = a.total - (inicioT + (e.clientY - inicioY));
      let estado;
      if (vel > 0.6) estado = this.estado === "alto" ? "meio" : "baixo";
      else if (vel < -0.6) estado = this.estado === "baixo" ? "meio" : "alto";
      else estado = ESTADOS.reduce((m, s) => (Math.abs(a[s] - visivel) < Math.abs(a[m] - visivel) ? s : m), "baixo");
      this.definir(estado);
      setTimeout(() => (this._arrastou = false), 0);
    };
    alvo.addEventListener("pointerup", fim);
    alvo.addEventListener("pointercancel", fim);
  }
}
