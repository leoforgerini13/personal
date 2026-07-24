#!/usr/bin/env node
// server.js — app local do dashboard com CHAT (Sonnet 5) que edita os dados por linguagem natural.
//
// Uso:
//   npm install                     (instala @anthropic-ai/sdk)
//   ANTHROPIC_API_KEY=sk-... node server.js
//   abra http://localhost:4178
//
// Diferente do artifact (claude.ai), aqui a agenda NÃO é ao vivo (usa o último snapshot em
// agenda.json — rode /hoje para atualizar). O chat conversa com o Sonnet 5 via API da Anthropic
// e aplica as mudanças direto nos JSONs de /data, regenerando o dashboard.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { STYLE, APP, build, readData, DATA_DIR } = require('./build.js');

const PORT = process.env.PORT || 4178;
const MODEL = 'claude-sonnet-5';

// ---------- data helpers ----------
function readJSON(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8')); }
  catch (e) { return fallback; }
}
function writeJSON(name, obj) {
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
function today() { const d = new Date(); const p = n => (n < 10 ? '0' : '') + n; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
function newId(pfx) { return pfx + '-' + Date.now().toString(36); }
function norm(s) { return String(s || '').trim().toLowerCase(); }

function findProjeto(ref) {
  const ps = readJSON('projetos.json', []);
  return ps.find(p => p.id === ref) || ps.find(p => norm(p.nome) === norm(ref)) ||
    ps.find(p => norm(p.nome).indexOf(norm(ref)) >= 0);
}
function findHabito(ref) {
  const r = readJSON('rotina.json', { habitos: [], registros: {} });
  return (r.habitos || []).find(h => h.id === ref) || (r.habitos || []).find(h => norm(h.nome) === norm(ref)) ||
    (r.habitos || []).find(h => norm(h.nome).indexOf(norm(ref)) >= 0);
}

// ---------- tool handlers (retornam objeto simples; {error} sinaliza falha) ----------
const HANDLERS = {
  add_tarefa(a) {
    const ts = readJSON('tarefas.json', []);
    if (!a.titulo) return { error: 'titulo obrigatório' };
    let projeto = '';
    if (a.projeto) { const p = findProjeto(a.projeto); if (!p) return { error: 'projeto não encontrado: ' + a.projeto }; projeto = p.id; }
    const t = { id: newId('tk'), projeto: projeto, titulo: a.titulo, descricao: a.descricao || '',
      data: a.data || '', dataFim: a.dataFim || '', prioridade: a.prioridade || 'media',
      status: a.status || 'a_fazer', criadaEm: today() };
    ts.push(t); writeJSON('tarefas.json', ts);
    return { ok: true, id: t.id, titulo: t.titulo };
  },
  update_tarefa(a) {
    const ts = readJSON('tarefas.json', []);
    let t = ts.find(x => x.id === a.id);
    if (!t && a.titulo_match) t = ts.find(x => norm(x.titulo).indexOf(norm(a.titulo_match)) >= 0);
    if (!t) return { error: 'tarefa não encontrada (id/titulo_match)' };
    ['titulo', 'projeto', 'data', 'dataFim', 'prioridade', 'status', 'descricao'].forEach(k => {
      if (a[k] != null) {
        if (k === 'projeto' && a[k]) { const p = findProjeto(a[k]); t.projeto = p ? p.id : t.projeto; }
        else t[k] = a[k];
      }
    });
    writeJSON('tarefas.json', ts);
    return { ok: true, id: t.id, status: t.status };
  },
  registrar_toque(a) {
    const p = findProjeto(a.projeto); if (!p) return { error: 'projeto não encontrado: ' + a.projeto };
    if (!a.texto) return { error: 'texto obrigatório' };
    const log = readJSON('log.json', []);
    log.push({ data: today(), projeto: p.id, texto: a.texto });
    writeJSON('log.json', log);
    const ps = readJSON('projetos.json', []); const pp = ps.find(x => x.id === p.id);
    if (pp && today() > (pp.ultimoToque || '')) { pp.ultimoToque = today(); writeJSON('projetos.json', ps); }
    return { ok: true, projeto: p.nome };
  },
  marcar_habito(a) {
    const h = findHabito(a.habito); if (!h) return { error: 'hábito não encontrado: ' + a.habito };
    const r = readJSON('rotina.json', { habitos: [], registros: {} });
    const d = a.data || today(); const arr = (r.registros[d] || []).slice();
    const has = arr.indexOf(h.id) >= 0; const feito = a.feito == null ? true : !!a.feito;
    if (feito && !has) arr.push(h.id);
    if (!feito && has) arr.splice(arr.indexOf(h.id), 1);
    r.registros[d] = arr; writeJSON('rotina.json', r);
    return { ok: true, habito: h.nome, data: d, feito: feito };
  },
  log_paginas(a) {
    const L = readJSON('leitura.json', { totalPaginas: 0, paginaAtual: 0, registros: {} });
    const n = parseInt(a.paginas, 10); if (!n || n < 1) return { error: 'paginas deve ser > 0' };
    L.paginaAtual = Math.min(L.totalPaginas || (L.paginaAtual + n), (L.paginaAtual || 0) + n);
    L.registros = L.registros || {}; L.registros[today()] = (L.registros[today()] || 0) + n;
    writeJSON('leitura.json', L);
    return { ok: true, paginaAtual: L.paginaAtual, total: L.totalPaginas };
  },
  add_gasto(a) {
    const gs = readJSON('gastos.json', []);
    if (!a.item) return { error: 'item obrigatório' };
    const g = { id: newId('gt'), item: a.item, categoria: a.categoria || '',
      estimadoBRL: +a.estimadoBRL || 0, estimadoEUR: +a.estimadoEUR || 0,
      pagoBRL: +a.pagoBRL || 0, pagoEUR: +a.pagoEUR || 0, nota: a.nota || '' };
    gs.push(g); writeJSON('gastos.json', gs);
    return { ok: true, id: g.id, item: g.item };
  },
  update_gasto(a) {
    const gs = readJSON('gastos.json', []);
    let g = gs.find(x => x.id === a.id) || gs.find(x => norm(x.item).indexOf(norm(a.item_match || '')) >= 0 && a.item_match);
    if (!g) return { error: 'gasto não encontrado (id/item_match)' };
    ['item', 'categoria', 'estimadoBRL', 'estimadoEUR', 'pagoBRL', 'pagoEUR', 'nota'].forEach(k => {
      if (a[k] != null) g[k] = (k.indexOf('BRL') >= 0 || k.indexOf('EUR') >= 0) ? +a[k] : a[k];
    });
    writeJSON('gastos.json', gs);
    return { ok: true, id: g.id };
  },
  add_frente(a) {
    const ps = readJSON('projetos.json', []);
    if (!a.nome) return { error: 'nome obrigatório' };
    const p = { id: newId('proj'), nome: a.nome, cliente: a.cliente || '', tipo: a.tipo || 'freela',
      status: 'ativo', cadenciaEsperada: 3, ultimoToque: today(), inicio: a.inicio || today(),
      previsaoFim: a.previsaoFim || '', notas: a.notas || '', marcos: [] };
    ps.push(p); writeJSON('projetos.json', ps);
    return { ok: true, id: p.id, nome: p.nome };
  }
};

// ---------- tool definitions (JSON schema) ----------
const TOOLS = [
  { name: 'add_tarefa', description: 'Cria uma nova tarefa no dashboard.', input_schema: { type: 'object', properties: {
    titulo: { type: 'string', description: 'A ação, curta, no infinitivo.' },
    projeto: { type: 'string', description: 'id ou nome do projeto/frente. Vazio se não houver.' },
    data: { type: 'string', description: 'Data/início YYYY-MM-DD, ou vazio.' },
    dataFim: { type: 'string', description: 'Prazo final YYYY-MM-DD, opcional.' },
    prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] },
    status: { type: 'string', enum: ['a_fazer', 'fazendo', 'feito'] },
    descricao: { type: 'string' } }, required: ['titulo'] } },
  { name: 'update_tarefa', description: 'Atualiza uma tarefa existente (status, datas, prioridade, etc.). Identifique por id, ou por titulo_match.', input_schema: { type: 'object', properties: {
    id: { type: 'string' }, titulo_match: { type: 'string', description: 'trecho do título para localizar' },
    titulo: { type: 'string' }, projeto: { type: 'string' }, data: { type: 'string' }, dataFim: { type: 'string' },
    prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] }, status: { type: 'string', enum: ['a_fazer', 'fazendo', 'feito'] }, descricao: { type: 'string' } }, required: [] } },
  { name: 'registrar_toque', description: 'Registra no log que o usuário tocou/trabalhou numa frente hoje.', input_schema: { type: 'object', properties: {
    projeto: { type: 'string', description: 'id ou nome do projeto' }, texto: { type: 'string', description: 'o que foi feito' } }, required: ['projeto', 'texto'] } },
  { name: 'marcar_habito', description: 'Marca (ou desmarca) um hábito num dia.', input_schema: { type: 'object', properties: {
    habito: { type: 'string' }, data: { type: 'string', description: 'YYYY-MM-DD; padrão hoje' }, feito: { type: 'boolean', description: 'true marca, false desmarca; padrão true' } }, required: ['habito'] } },
  { name: 'log_paginas', description: 'Registra páginas lidas hoje do livro atual (soma na página atual).', input_schema: { type: 'object', properties: {
    paginas: { type: 'integer', description: 'quantas páginas lidas hoje' } }, required: ['paginas'] } },
  { name: 'add_gasto', description: 'Adiciona um gasto da mudança (Amsterdam), em R$ e/ou €.', input_schema: { type: 'object', properties: {
    item: { type: 'string' }, categoria: { type: 'string' }, estimadoBRL: { type: 'number' }, estimadoEUR: { type: 'number' }, pagoBRL: { type: 'number' }, pagoEUR: { type: 'number' }, nota: { type: 'string' } }, required: ['item'] } },
  { name: 'update_gasto', description: 'Atualiza um gasto (ex: registrar valor pago). Identifique por id ou item_match.', input_schema: { type: 'object', properties: {
    id: { type: 'string' }, item_match: { type: 'string' }, item: { type: 'string' }, categoria: { type: 'string' }, estimadoBRL: { type: 'number' }, estimadoEUR: { type: 'number' }, pagoBRL: { type: 'number' }, pagoEUR: { type: 'number' }, nota: { type: 'string' } }, required: [] } },
  { name: 'add_frente', description: 'Cria uma nova frente/projeto ativo.', input_schema: { type: 'object', properties: {
    nome: { type: 'string' }, cliente: { type: 'string' }, tipo: { type: 'string', enum: ['agencia', 'freela', 'pessoal'] }, inicio: { type: 'string' }, previsaoFim: { type: 'string' }, notas: { type: 'string' } }, required: ['nome'] } }
];

function systemPrompt() {
  const d = readData();
  const projs = d.projetos.map(p => '- ' + p.id + ' · ' + p.nome).join('\n') || '(nenhum)';
  const habs = (d.rotina.habitos || []).map(h => '- ' + h.id + ' · ' + h.nome).join('\n') || '(nenhum)';
  const tks = d.tarefas.filter(t => t.status !== 'feito').slice(0, 30).map(t => '- ' + t.id + ' · ' + t.titulo + ' [' + t.status + (t.data ? ', ' + t.data : '') + ']').join('\n') || '(nenhuma)';
  const L = d.leitura || {};
  return [
    'Você é o assistente do "Dashboard de alocação de atenção" do Leo. Aplique o que ele pedir usando as ferramentas e confirme em português, curto e direto. Nunca invente dados; se faltar informação, pergunte. Resolva datas relativas ("amanhã", "sexta") no fuso America/Sao_Paulo.',
    'Hoje é ' + today() + '.',
    'Frentes (id · nome):\n' + projs,
    'Hábitos (id · nome):\n' + habs,
    'Livro atual: ' + (L.titulo || '—') + ' (página ' + (L.paginaAtual || 0) + '/' + (L.totalPaginas || 0) + ').',
    'Tarefas em aberto (id · título [status]):\n' + tks,
    'Prioridades: use as ferramentas para adicionar/atualizar tarefas, registrar toques, marcar hábitos, logar páginas e gastos. Depois, responda em 1-2 frases o que fez.'
  ].join('\n\n');
}

// ---------- Anthropic chat loop ----------
let Anthropic = null;
try { Anthropic = require('@anthropic-ai/sdk'); } catch (e) { /* avisado no /api/chat */ }
let client = null;
function getClient() {
  if (!Anthropic) throw new Error('SDK não instalado: rode `npm install`.');
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Defina ANTHROPIC_API_KEY no ambiente.');
  if (!client) client = new Anthropic();
  return client;
}

const CONV = []; // histórico em memória (uso local, 1 usuário)

async function runChat(userMessage) {
  const c = getClient();
  CONV.push({ role: 'user', content: userMessage });
  let changed = false, guard = 0;
  while (guard++ < 8) {
    const resp = await c.messages.create({
      model: MODEL, max_tokens: 16000,
      thinking: { type: 'adaptive' }, output_config: { effort: 'low' },
      system: systemPrompt(), tools: TOOLS, messages: CONV
    });
    CONV.push({ role: 'assistant', content: resp.content });
    if (resp.stop_reason === 'tool_use') {
      const results = [];
      for (const block of resp.content) {
        if (block.type === 'tool_use') {
          let out;
          try { out = HANDLERS[block.name] ? HANDLERS[block.name](block.input || {}) : { error: 'ferramenta desconhecida' }; }
          catch (e) { out = { error: String(e && e.message || e) }; }
          if (out && out.ok) changed = true;
          results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out), is_error: !!(out && out.error) });
        }
      }
      CONV.push({ role: 'user', content: results });
      continue;
    }
    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    if (changed) { try { build(); } catch (e) {} }
    return { reply: text || '(sem resposta)', changed: changed };
  }
  if (changed) { try { build(); } catch (e) {} }
  return { reply: 'Parei após muitas etapas — verifique o que foi aplicado.', changed: changed };
}

// ---------- HTTP ----------
function pageHTML() {
  const d = readData();
  return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Atencao — app local</title>\n<style>' + STYLE + CHAT_CSS + '</style>\n</head>\n<body>\n' +
    '<script>window.__DATA__ = ' + JSON.stringify(d) + '; window.__SERVER__ = true;</script>\n' +
    '<script>' + APP + '</script>\n<script>' + CHAT_JS + '</script>\n</body>\n</html>\n';
}

function body(req) { return new Promise((res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => res(b)); }); }

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(pageHTML()); return;
    }
    if (req.method === 'GET' && req.url === '/api/data') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(readData())); return;
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
      const raw = await body(req); let msg = '';
      try { msg = (JSON.parse(raw || '{}').message || '').toString(); } catch (e) {}
      if (!msg.trim()) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'mensagem vazia' })); return; }
      try {
        const out = await runChat(msg);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: String(e && e.message || e) }));
      }
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('erro: ' + (e && e.message || e));
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Dashboard (app local + chat Sonnet 5): http://localhost:' + PORT);
    if (!Anthropic) console.log('  ⚠ @anthropic-ai/sdk não instalado — rode `npm install` para habilitar o chat.');
    else if (!process.env.ANTHROPIC_API_KEY) console.log('  ⚠ ANTHROPIC_API_KEY não definida — o chat responderá com erro até você exportá-la.');
  });
}

module.exports = { HANDLERS: HANDLERS, TOOLS: TOOLS, runChat: runChat, server: server, systemPrompt: systemPrompt };

// ---------- chat widget (injetado na página) ----------
const CHAT_CSS = '\n' +
  '#chatbtn{position:fixed;right:26px;bottom:74px;background:var(--accent);color:#fff;border-radius:22px;padding:10px 16px;font-size:13px;font-weight:600;z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}\n' +
  '#chatpanel{position:fixed;right:26px;bottom:74px;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:var(--surface);border:1px solid var(--border);border-radius:16px;z-index:61;display:none;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.45)}\n' +
  '#chatpanel.open{display:flex}\n' +
  '#chatpanel .ch{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)}\n' +
  '#chatpanel .ch .t{font-size:13px;font-weight:600}\n' +
  '#chatpanel .ch .s{font-size:11px;color:var(--lo)}\n' +
  '#chatpanel .ch .x{color:var(--lo);font-size:16px;cursor:pointer;padding:2px 6px}\n' +
  '#chatmsgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}\n' +
  '.cmsg{font-size:13.5px;line-height:1.4;padding:9px 12px;border-radius:12px;max-width:86%;white-space:pre-wrap}\n' +
  '.cmsg.u{align-self:flex-end;background:var(--surface-2)}\n' +
  '.cmsg.a{align-self:flex-start;background:transparent;border:1px solid var(--border)}\n' +
  '.cmsg.e{align-self:flex-start;color:#d98a6a;border:1px solid var(--border)}\n' +
  '.cmsg.think{align-self:flex-start;color:var(--lo);font-style:italic}\n' +
  '#chatform{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border)}\n' +
  '#chatform textarea{flex:1;min-height:40px;max-height:120px}\n' +
  '#chatform button{background:var(--hi);color:var(--bg);border-radius:10px;padding:0 14px;font-weight:600;font-size:13px}\n';

const CHAT_JS = "(function(){\n" +
  "  var btn=document.createElement('button'); btn.id='chatbtn'; btn.textContent='Chat · Sonnet 5';\n" +
  "  var panel=document.createElement('div'); panel.id='chatpanel';\n" +
  "  panel.innerHTML='<div class=\\'ch\\'><div><div class=\\'t\\'>Assistente do dashboard</div><div class=\\'s\\'>Sonnet 5 · edita por linguagem natural</div></div><div class=\\'x\\' id=\\'chatx\\'>\\u2715</div></div>'+\n" +
  "    '<div id=\\'chatmsgs\\'></div>'+\n" +
  "    '<form id=\\'chatform\\'><textarea id=\\'chatinput\\' placeholder=\\'ex: marquei musculação hoje; li 20 páginas; conclui os slides do Dr. Bingo\\'></textarea><button type=\\'submit\\'>Enviar</button></form>';\n" +
  "  document.body.appendChild(btn); document.body.appendChild(panel);\n" +
  "  var msgs=panel.querySelector('#chatmsgs');\n" +
  "  function add(cls,text){ var d=document.createElement('div'); d.className='cmsg '+cls; d.textContent=text; msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; return d; }\n" +
  "  btn.onclick=function(){ panel.classList.add('open'); btn.style.display='none'; setTimeout(function(){var i=panel.querySelector('#chatinput'); if(i)i.focus();},50); if(!msgs.children.length) add('a','Oi! Me diga o que mudou e eu atualizo o painel. Ex: \\u201cadiciona tarefa: revisar deck do Banco Atlântico, quarta, alta\\u201d.'); };\n" +
  "  panel.querySelector('#chatx').onclick=function(){ panel.classList.remove('open'); btn.style.display='block'; };\n" +
  "  var form=panel.querySelector('#chatform'); var input=panel.querySelector('#chatinput'); var busy=false;\n" +
  "  function send(){ if(busy) return; var text=input.value.trim(); if(!text) return; busy=true; add('u',text); input.value=''; var th=add('think','pensando…');\n" +
  "    fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})})\n" +
  "      .then(function(r){return r.json();}).then(function(d){ th.remove(); if(d.error){ add('e','Erro: '+d.error); busy=false; return; } add('a',d.reply||'(ok)'); if(d.changed){ var t=add('think','atualizando o painel…'); setTimeout(function(){ location.reload(); },700); } busy=false; })\n" +
  "      .catch(function(e){ th.remove(); add('e','Falha de rede: '+e); busy=false; }); }\n" +
  "  form.onsubmit=function(e){ e.preventDefault(); send(); };\n" +
  "  input.addEventListener('keydown',function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } });\n" +
  "})();\n";
