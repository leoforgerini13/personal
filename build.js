#!/usr/bin/env node
// build.js — gera index.html self-contained a partir dos JSONs em /data.
// Sem dependencias externas. Rode: node build.js
// Os JSONs sao a fonte da verdade; index.html e output descartavel.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function readJSON(name, fallback) {
  const p = path.join(DATA_DIR, name);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('[build] nao consegui ler ' + name + ' (' + e.message + '), usando vazio.');
    return fallback;
  }
}

const DATA = {
  projetos: readJSON('projetos.json', []),
  rotina: readJSON('rotina.json', { habitos: [], registros: {} }),
  carreira: readJSON('carreira.json', []),
  agenda: readJSON('agenda.json', []),
  log: readJSON('log.json', []),
  geradoEm: new Date().toISOString()
};

// ---------- CSS ----------
const STYLE = `
:root{
  --bg:#15120f; --surface:#1e1a16; --surface-2:#26211c; --border:#2b2621;
  --hi:#f5f0ea; --mid:#a89f96; --lo:#6b635b;
  --accent:#ff6a3d; --ambar:#b8824e; --neutro:#8a817a;
  --r:18px;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:var(--bg); color:var(--hi);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-weight:400; -webkit-font-smoothing:antialiased; line-height:1.45;
}
.label{font-size:10.5px;text-transform:uppercase;letter-spacing:.16em;color:var(--lo);font-weight:600}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
input,textarea{font-family:inherit;color:var(--hi);background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:8px 10px;font-size:14px;width:100%}
textarea{resize:vertical;min-height:54px}

#app{display:grid;grid-template-columns:210px 1fr;min-height:100vh}
#nav{border-right:1px solid var(--border);padding:34px 20px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:2px}
#nav .brand{font-size:15px;font-weight:700;letter-spacing:-.01em;margin-bottom:6px}
#nav .brand span{color:var(--lo);font-weight:400;display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-top:6px}
.navitem{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:11px;color:var(--mid);font-size:14px;font-weight:500;text-align:left;transition:color .15s,background .15s;margin-top:2px}
.navitem:hover{color:var(--hi);background:var(--surface)}
.navitem.active{color:var(--hi);background:var(--surface)}
.navitem .dot{width:5px;height:5px;border-radius:50%;background:transparent}
.navitem.active .dot{background:var(--hi)}

#main{padding:46px 54px 90px;max-width:1080px}
.view{display:none;animation:fade .25s ease}
.view.active{display:block}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

.vhead{margin-bottom:34px}
.vhead h1{font-size:13px;text-transform:uppercase;letter-spacing:.18em;color:var(--lo);font-weight:600}
.vhead .big{font-size:30px;font-weight:200;letter-spacing:-.02em;color:var(--hi);margin-top:8px}
.vhead .big b{font-weight:600}

/* HOJE */
.hoje-grid{display:grid;grid-template-columns:1fr 300px;gap:44px}
.block-title{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:var(--lo);font-weight:600;margin-bottom:16px}
.prio{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}
.prio .idx{font-size:12px;color:var(--lo);width:16px;flex:none;padding-top:3px;font-variant-numeric:tabular-nums}
.prio .txt{flex:1;font-size:17px;font-weight:400;color:var(--hi);outline:none;min-height:24px}
.prio .txt.empty{color:var(--lo)}
.prio .txt.done{text-decoration:line-through;color:var(--lo)}
.prio .check{flex:none;width:20px;height:20px;border:1.5px solid var(--border);border-radius:7px;color:transparent;font-size:12px;line-height:17px;text-align:center;transition:.15s}
.prio .check:hover{border-color:var(--mid)}
.prio .check.on{background:var(--mid);border-color:var(--mid);color:var(--bg)}
.sugestao{margin-top:22px;padding:16px 18px;background:var(--surface);border-radius:var(--r);display:flex;align-items:center;gap:14px}
.sugestao .label{margin-bottom:4px}
.sugestao .s-main{font-size:15px;color:var(--hi)}
.sugestao .s-main b{font-weight:600}
.sugestao .add{margin-left:auto;flex:none;font-size:12px;color:var(--mid);border:1px solid var(--border);border-radius:9px;padding:7px 12px}
.sugestao .add:hover{color:var(--hi);border-color:var(--mid)}

.agenda-item{padding:13px 0;border-bottom:1px solid var(--border)}
.agenda-item .hora{font-size:12px;color:var(--lo);font-variant-numeric:tabular-nums;letter-spacing:.02em}
.agenda-item .tit{font-size:14.5px;color:var(--hi);margin-top:3px}
.agenda-empty{color:var(--lo);font-size:14px;padding:13px 0}

/* FRENTES */
.frentes{display:flex;flex-direction:column;gap:14px}
.card{background:var(--surface);border-radius:var(--r);padding:22px 24px;border:1px solid transparent;transition:border-color .15s,background .15s}
.card:hover{background:var(--surface-2)}
.card.accent{border-color:rgba(255,106,61,.32)}
.card-top{display:flex;align-items:baseline;gap:22px;cursor:pointer}
.card .num{font-size:46px;font-weight:600;line-height:.9;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--neutro);flex:none;width:78px}
.card.t-ambar .num{color:var(--ambar)}
.card.t-quente .num{color:var(--neutro)}
.card.accent .num{color:var(--accent)}
.card .num small{display:block;font-size:9.5px;font-weight:600;letter-spacing:.14em;color:var(--lo);margin-top:8px;text-transform:uppercase}
.card .body{flex:1;min-width:0}
.card .nome{font-size:19px;font-weight:600;letter-spacing:-.01em}
.card .meta{font-size:12.5px;color:var(--mid);margin-top:3px}
.card .marco{font-size:12px;color:var(--lo);margin-top:12px}
.card .marco b{color:var(--mid);font-weight:500}
.card.accent .marco b{color:var(--accent)}
.card .actions{display:flex;gap:8px;flex:none;align-self:flex-start}
.iconbtn{font-size:11.5px;color:var(--lo);border:1px solid var(--border);border-radius:9px;padding:6px 10px}
.iconbtn:hover{color:var(--hi);border-color:var(--mid)}
.expand{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);display:none}
.expand.open{display:block}
.expand .lg{font-size:13px;color:var(--mid);padding:7px 0;display:flex;gap:12px}
.expand .lg .d{color:var(--lo);font-variant-numeric:tabular-nums;flex:none;font-size:12px;padding-top:1px}
.expand .none{font-size:13px;color:var(--lo)}
.edit{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);display:none;gap:12px;flex-direction:column}
.edit.open{display:flex}
.edit .row{display:flex;gap:12px}
.edit .row>div{flex:1}
.edit .savebar{display:flex;gap:10px;justify-content:flex-end}
.btn{font-size:13px;padding:8px 16px;border-radius:10px;font-weight:500}
.btn.primary{background:var(--hi);color:var(--bg)}
.btn.ghost{color:var(--mid);border:1px solid var(--border)}
.btn.ghost:hover{color:var(--hi)}

/* ROTINA */
.heat{display:flex;flex-direction:column;gap:16px;margin-top:6px}
.heat-row{display:grid;grid-template-columns:150px 1fr 88px;align-items:center;gap:18px}
.heat-row .hn{font-size:14px;font-weight:500}
.grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px}
.cell{width:12px;height:12px;border-radius:3px;background:var(--surface);transition:transform .1s}
.cell.on{background:var(--mid)}
.cell.today{outline:1.5px solid var(--lo);outline-offset:1px}
.cell.today.on{background:var(--accent);outline-color:var(--accent)}
.cell.clickable{cursor:pointer}
.cell.clickable:hover{transform:scale(1.35)}
.heat-row .wk{font-size:12px;color:var(--mid);text-align:right;font-variant-numeric:tabular-nums}
.heat-row .wk b{color:var(--hi);font-weight:600}
.heat-legend{margin-top:26px;display:flex;align-items:center;gap:8px;color:var(--lo);font-size:11px}
.heat-legend .cell{width:11px;height:11px}

/* AMSTERDAM */
.ams{display:flex;flex-direction:column;gap:2px;max-width:560px}
.ams-item{display:flex;align-items:center;gap:16px;padding:17px 20px;border-radius:14px;transition:background .15s}
.ams-item .st{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--border);flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--lo)}
.ams-item.done .st{background:var(--mid);border-color:var(--mid);color:var(--bg)}
.ams-item.andamento .st{border-color:var(--mid);color:var(--mid)}
.ams-item .t{font-size:15px;color:var(--hi)}
.ams-item .t .nota{display:block;font-size:12px;color:var(--lo);margin-top:2px}
.ams-item.blocked{opacity:.4}
.ams-item.blocked .t .nota{color:var(--lo)}
.ams-item.clickable{cursor:pointer}
.ams-item.clickable:hover{background:var(--surface)}
.ams-item.next{background:var(--surface)}
.ams-item.next .st{border-color:var(--accent);color:var(--accent)}
.ams-item.next .t{color:var(--hi)}
.ams-conn{width:1px;height:12px;background:var(--border);margin-left:31px}

/* LOG */
.log-filter{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px}
.chip{font-size:12px;color:var(--mid);border:1px solid var(--border);border-radius:20px;padding:6px 14px}
.chip:hover{color:var(--hi)}
.chip.on{background:var(--surface);color:var(--hi);border-color:var(--mid)}
.log-week{margin-bottom:30px}
.log-week .wl{margin-bottom:12px}
.log-entry{display:flex;gap:16px;padding:11px 0;border-bottom:1px solid var(--border)}
.log-entry .d{font-size:12px;color:var(--lo);flex:none;width:52px;font-variant-numeric:tabular-nums;padding-top:2px}
.log-entry .c .p{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--mid);font-weight:600;margin-bottom:3px}
.log-entry .c .x{font-size:14px;color:var(--hi)}
.log-empty{color:var(--lo);font-size:14px}

/* TOAST + PATCH */
#toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);background:var(--surface-2);border:1px solid var(--border);border-radius:13px;padding:13px 18px;display:flex;align-items:center;gap:18px;opacity:0;pointer-events:none;transition:.22s;z-index:50;box-shadow:0 12px 40px rgba(0,0,0,.4)}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
#toast .m{font-size:14px}
#toast .u{font-size:13px;color:var(--accent);font-weight:600}
#patchbtn{position:fixed;right:26px;bottom:26px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:10px 16px;font-size:13px;color:var(--mid);z-index:40;display:none;align-items:center;gap:9px;transition:.15s}
#patchbtn:hover{color:var(--hi);border-color:var(--mid)}
#patchbtn.show{display:flex}
#patchbtn .bd{width:7px;height:7px;border-radius:50%;background:var(--accent)}

@media(max-width:820px){
  #app{grid-template-columns:1fr}
  #nav{position:static;height:auto;flex-direction:row;flex-wrap:wrap;padding:18px}
  #main{padding:28px 22px 90px}
  .hoje-grid{grid-template-columns:1fr;gap:30px}
  .heat-row{grid-template-columns:110px 1fr;gap:12px}
  .heat-row .wk{grid-column:2;text-align:left}
}
`;

// ---------- CLIENT APP (sem template literals / sem cifrao-chave) ----------
const APP = `
(function(){
  'use strict';
  var D = window.__DATA__;
  var LS_KEY = 'atencao_buffer_v1';

  function pad(n){ return (n<10?'0':'')+n; }
  function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parseYmd(s){ var p=String(s).split('-'); return new Date(+p[0], (+p[1])-1, +p[2]); }
  function daysBetween(a,b){ return Math.round((parseYmd(b).getTime()-parseYmd(a).getTime())/86400000); }
  var TODAY = ymd(new Date());

  var MESES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var DIAS=['domingo','segunda-feira','terca-feira','quarta-feira','quinta-feira','sexta-feira','sabado'];
  var MES_ABREV=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  function emptyBuf(){ return { registros:{}, toques:[], projetos:{}, carreira:{}, prioridades:null }; }
  function loadBuf(){ try{ var b=JSON.parse(localStorage.getItem(LS_KEY)); return b&&typeof b==='object'?Object.assign(emptyBuf(),b):emptyBuf(); }catch(e){ return emptyBuf(); } }
  var BUF = loadBuf();
  function saveBuf(){ localStorage.setItem(LS_KEY, JSON.stringify(BUF)); refreshPatchBtn(); }
  function bufEmpty(){
    return Object.keys(BUF.registros).length===0 && BUF.toques.length===0 &&
      Object.keys(BUF.projetos).length===0 && Object.keys(BUF.carreira).length===0 &&
      (!BUF.prioridades || BUF.prioridades.every(function(p){return !p.texto && !p.feito;}));
  }

  function el(tag, attrs, kids){
    var e=document.createElement(tag);
    if(attrs){ for(var k in attrs){ var v=attrs[k];
      if(v==null) continue;
      if(k==='class') e.className=v;
      else if(k==='text') e.textContent=v;
      else if(k==='html') e.innerHTML=v;
      else if(k.slice(0,2)==='on') e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k,v);
    }}
    if(kids!=null){ (Array.isArray(kids)?kids:[kids]).forEach(function(c){ if(c==null) return; e.appendChild(typeof c==='object'?c:document.createTextNode(String(c))); }); }
    return e;
  }
  function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

  // ---- merges ----
  function mergedProjetos(){
    return D.projetos.map(function(p){
      var o={}; for(var k in p) o[k]=p[k];
      var patch=BUF.projetos[p.id];
      if(patch){ for(var k2 in patch) o[k2]=patch[k2]; }
      BUF.toques.forEach(function(t){ if(t.projeto===p.id && t.data>(o.ultimoToque||'')) o.ultimoToque=t.data; });
      return o;
    }).filter(function(o){ return o.status!=='arquivado'; });
  }
  function mergedLog(){ return D.log.concat(BUF.toques); }
  function getReg(date){
    if(BUF.registros[date]) return BUF.registros[date].slice();
    return (D.rotina.registros[date]||[]).slice();
  }
  function mergedCarreira(){
    return D.carreira.map(function(c){
      var o={}; for(var k in c) o[k]=c[k];
      var patch=BUF.carreira[c.id];
      if(patch){ for(var k2 in patch) o[k2]=patch[k2]; }
      return o;
    });
  }
  function tempOf(p){
    var dias=Math.max(0, daysBetween(p.ultimoToque, TODAY));
    var cad=p.cadenciaEsperada||1; var ratio=dias/cad;
    return { dias:dias, ratio:ratio, state: ratio>2?'quente':(ratio>1?'ambar':'neutro') };
  }
  function projById(id){ return mergedProjetos().filter(function(p){return p.id===id;})[0]; }

  // ---- toast ----
  var toastEl, toastTimer;
  function toast(msg, undoFn){
    clear(toastEl);
    toastEl.appendChild(el('span',{class:'m',text:msg}));
    if(undoFn) toastEl.appendChild(el('button',{class:'u',text:'Desfazer',onclick:function(){ hideToast(); undoFn(); }}));
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(hideToast, undoFn?6000:2600);
  }
  function hideToast(){ toastEl.classList.remove('show'); }

  // ---- patch button ----
  var patchBtn;
  function refreshPatchBtn(){ if(patchBtn) patchBtn.classList.toggle('show', !bufEmpty()); }
  function copyPatch(){
    var out={};
    if(Object.keys(BUF.registros).length) out.registros=BUF.registros;
    if(BUF.toques.length) out.toques=BUF.toques;
    if(Object.keys(BUF.projetos).length) out.projetos=BUF.projetos;
    if(Object.keys(BUF.carreira).length) out.carreira=BUF.carreira;
    if(BUF.prioridades && BUF.prioridades.some(function(p){return p.texto;})) out.prioridades=BUF.prioridades;
    var txt=JSON.stringify(out,null,2);
    function ok(){ toast('Patch copiado. Cole no Claude Code com /sync.'); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(ok, function(){ fallbackCopy(txt); ok(); }); }
    else { fallbackCopy(txt); ok(); }
  }
  function fallbackCopy(txt){ var ta=el('textarea',{}); ta.value=txt; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); }

  // =================== HOJE ===================
  function renderHoje(root){
    clear(root);
    var d=new Date();
    root.appendChild(el('div',{class:'vhead'},[
      el('h1',{text:'Hoje'}),
      el('div',{class:'big',html:'<b>'+DIAS[d.getDay()]+'</b>, '+d.getDate()+' de '+MESES[d.getMonth()]})
    ]));
    var grid=el('div',{class:'hoje-grid'});
    // ---- coluna prioridades ----
    var col=el('div',{});
    col.appendChild(el('div',{class:'block-title',text:'Prioridades'}));
    if(!BUF.prioridades) BUF.prioridades=[{texto:'',feito:false},{texto:'',feito:false},{texto:'',feito:false}];
    var listNode=el('div',{});
    BUF.prioridades.forEach(function(p,i){ listNode.appendChild(prioRow(p,i)); });
    col.appendChild(listNode);
    // sugestao dormente
    var ps=mergedProjetos().map(function(p){var t=tempOf(p);return {p:p,t:t};}).sort(function(a,b){return b.t.ratio-a.t.ratio;});
    if(ps.length && ps[0].t.ratio>1){
      var sug=ps[0];
      col.appendChild(el('div',{class:'sugestao'},[
        el('div',{},[
          el('div',{class:'label',text:'Sugestao de atencao'}),
          el('div',{class:'s-main',html:'<b>'+esc(sug.p.nome)+'</b> esta ha '+sug.t.dias+' dias sem toque'})
        ]),
        el('button',{class:'add',text:'Adicionar',onclick:function(){ addSugestao(sug.p, listNode); }})
      ]));
    }
    grid.appendChild(col);
    // ---- coluna agenda ----
    var ag=el('div',{});
    ag.appendChild(el('div',{class:'block-title',text:'Compromissos de hoje'}));
    var hoje=D.agenda.filter(function(e){ return String(e.inicio).slice(0,10)===TODAY; })
      .sort(function(a,b){return a.inicio<b.inicio?-1:1;});
    if(!hoje.length) ag.appendChild(el('div',{class:'agenda-empty',text:'Sem compromissos hoje.'}));
    hoje.forEach(function(e){
      ag.appendChild(el('div',{class:'agenda-item'},[
        el('div',{class:'hora',text: e.diaInteiro?'dia inteiro':(hhmm(e.inicio)+' – '+hhmm(e.fim))}),
        el('div',{class:'tit',text:e.titulo})
      ]));
    });
    grid.appendChild(ag);
    root.appendChild(grid);
  }
  function prioRow(p,i){
    var txt=el('div',{class:'txt'+(p.texto?'':' empty')+(p.feito?' done':''),contenteditable:'true',text:p.texto||'Escreva uma prioridade…'});
    txt.addEventListener('focus',function(){ if(!p.texto){ txt.textContent=''; txt.classList.remove('empty'); } });
    txt.addEventListener('blur',function(){
      var v=txt.textContent.trim(); p.texto=v; saveBuf();
      if(!v){ txt.classList.add('empty'); txt.textContent='Escreva uma prioridade…'; }
    });
    var check=el('button',{class:'check'+(p.feito?' on':''),text:'✓',onclick:function(){
      var prev=p.feito; p.feito=!p.feito; saveBuf();
      check.classList.toggle('on',p.feito); txt.classList.toggle('done',p.feito);
      toast(p.feito?'Prioridade concluida.':'Reaberta.', function(){ p.feito=prev; saveBuf(); check.classList.toggle('on',p.feito); txt.classList.toggle('done',p.feito); });
    }});
    return el('div',{class:'prio'},[ el('div',{class:'idx',text:(i+1)}), txt, check ]);
  }
  function addSugestao(proj, listNode){
    var slot=BUF.prioridades.filter(function(p){return !p.texto;})[0];
    if(!slot){ toast('As 3 prioridades ja estao preenchidas.'); return; }
    slot.texto='Tocar em '+proj.nome; saveBuf();
    var i=BUF.prioridades.indexOf(slot);
    listNode.replaceChild(prioRow(slot,i), listNode.children[i]);
    toast('Adicionada as prioridades.');
  }

  // =================== FRENTES ===================
  function renderFrentes(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('h1',{text:'Frentes'}), el('div',{class:'big',html:'Ordenadas por <b>urgencia de atencao</b>'}) ]));
    var wrap=el('div',{class:'frentes'});
    var arr=mergedProjetos().map(function(p){return {p:p,t:tempOf(p)};}).sort(function(a,b){return b.t.ratio-a.t.ratio;});
    arr.forEach(function(o,i){ wrap.appendChild(frenteCard(o.p,o.t,i===0 && o.t.ratio>1)); });
    root.appendChild(wrap);
  }
  function frenteCard(p,t,isAccent){
    var cls='card t-'+t.state+(isAccent?' accent':'');
    var expand=el('div',{class:'expand'});
    var edit=el('div',{class:'edit'});
    var card=el('div',{class:cls},[
      el('div',{class:'card-top',onclick:function(ev){ if(edit.classList.contains('open'))return; expand.classList.toggle('open'); if(expand.classList.contains('open')) fillExpand(expand,p); }},[
        el('div',{class:'num'},[ document.createTextNode(String(t.dias)), el('small',{text:'dias sem toque'}) ]),
        el('div',{class:'body'},[
          el('div',{class:'nome',text:p.nome}),
          el('div',{class:'meta',text:(p.cliente||'—')+' · '+(p.tipo||'')+' · cadencia '+p.cadenciaEsperada+'d'}),
          p.proximoMarco&&p.proximoMarco.titulo?el('div',{class:'marco',html:'Proximo marco: <b>'+esc(p.proximoMarco.titulo)+'</b> · '+fmtData(p.proximoMarco.data)}):null
        ]),
        el('div',{class:'actions'},[
          el('button',{class:'iconbtn',text:'Toque',onclick:function(ev){ ev.stopPropagation(); registrarToque(p); }}),
          el('button',{class:'iconbtn',text:'Editar',onclick:function(ev){ ev.stopPropagation(); expand.classList.remove('open'); fillEdit(edit,p,card); edit.classList.toggle('open'); }})
        ])
      ]),
      expand, edit
    ]);
    return card;
  }
  function fillExpand(node,p){
    clear(node);
    var logs=mergedLog().filter(function(l){return l.projeto===p.id;}).sort(function(a,b){return a.data<b.data?1:-1;}).slice(0,3);
    if(!logs.length){ node.appendChild(el('div',{class:'none',text:'Nenhum toque registrado ainda.'})); return; }
    logs.forEach(function(l){ node.appendChild(el('div',{class:'lg'},[ el('span',{class:'d',text:fmtData(l.data)}), el('span',{text:l.texto}) ])); });
  }
  function fillEdit(node,p,card){
    clear(node);
    var iNome=el('input',{value:p.nome});
    var iCli=el('input',{value:p.cliente||''});
    var iCad=el('input',{type:'number',value:p.cadenciaEsperada,min:'1'});
    var iMarcoT=el('input',{value:(p.proximoMarco&&p.proximoMarco.titulo)||''});
    var iMarcoD=el('input',{type:'date',value:(p.proximoMarco&&p.proximoMarco.data)||''});
    var iNotas=el('textarea',{},p.notas||'');
    node.appendChild(field('Nome',iNome));
    node.appendChild(el('div',{class:'row'},[ field('Cliente',iCli), field('Cadencia (dias)',iCad) ]));
    node.appendChild(el('div',{class:'row'},[ field('Proximo marco',iMarcoT), field('Data',iMarcoD) ]));
    node.appendChild(field('Notas',iNotas));
    node.appendChild(el('div',{class:'savebar'},[
      el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ node.classList.remove('open'); }}),
      el('button',{class:'btn primary',text:'Salvar',onclick:function(){
        var prev=BUF.projetos[p.id]?JSON.parse(JSON.stringify(BUF.projetos[p.id])):undefined;
        BUF.projetos[p.id]=Object.assign(BUF.projetos[p.id]||{},{
          nome:iNome.value.trim(), cliente:iCli.value.trim(),
          cadenciaEsperada:parseInt(iCad.value,10)||p.cadenciaEsperada,
          proximoMarco:{titulo:iMarcoT.value.trim(),data:iMarcoD.value}, notas:iNotas.value.trim()
        });
        saveBuf(); node.classList.remove('open'); replaceCard(card);
        toast('Frente atualizada.', function(){ if(prev)BUF.projetos[p.id]=prev; else delete BUF.projetos[p.id]; saveBuf(); replaceCard(card); });
      }})
    ]));
  }
  function field(lbl,input){ return el('div',{},[ el('div',{class:'label',text:lbl}), el('div',{style:'margin-top:6px'},[input]) ]); }
  function registrarToque(p){
    var texto=prompt('O que voce tocou em "'+p.nome+'" hoje?');
    if(texto==null) return;
    texto=texto.trim(); if(!texto){ texto='Toque registrado.'; }
    var entry={data:TODAY,projeto:p.id,texto:texto};
    BUF.toques.push(entry); saveBuf();
    // update this card in place
    var card=document.querySelector('[data-frentes]'); // rebuild frentes order (dias mudou)
    renderFrentes(document.getElementById('view-frentes'));
    toast('Toque registrado em '+p.nome+'.', function(){ var i=BUF.toques.indexOf(entry); if(i>=0)BUF.toques.splice(i,1); saveBuf(); renderFrentes(document.getElementById('view-frentes')); });
  }
  function replaceCard(card){ // targeted: rebuild only this card node
    var p=null, t=null;
    var arr=mergedProjetos().map(function(x){return {p:x,t:tempOf(x)};}).sort(function(a,b){return b.t.ratio-a.t.ratio;});
    // simplest correct approach: re-render frentes view (order can change)
    renderFrentes(document.getElementById('view-frentes'));
  }

  // =================== ROTINA ===================
  function renderRotina(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('h1',{text:'Rotina'}), el('div',{class:'big',html:'12 semanas · <b>sem drama de streak</b>'}) ]));
    var WEEKS=12, DAYS=WEEKS*7;
    // dias: do (hoje - DAYS +1) ate hoje, em ordem cronologica; grid preenche por coluna (semana), linhas=dia da semana
    var today=parseYmd(TODAY);
    var start=new Date(today.getTime()); start.setDate(start.getDate()-(DAYS-1));
    // alinhar start ao domingo para colunas semanais limpas
    start.setDate(start.getDate()-start.getDay());
    var heat=el('div',{class:'heat'});
    D.rotina.habitos.forEach(function(h){
      var grid=el('div',{class:'grid'});
      var cur=new Date(start.getTime());
      while(cur<=today || cur.getDay()!==0){
        (function(dateStr){
          var on=getReg(dateStr).indexOf(h.id)>=0;
          var isToday=dateStr===TODAY;
          var future=dateStr>TODAY;
          var cell=el('div',{class:'cell'+(on?' on':'')+(isToday?' today':'')+(future?'':' clickable'),title:dateStr});
          if(!future){ cell.addEventListener('click',function(){ toggleHabit(h.id,dateStr,cell,wk); }); }
          grid.appendChild(cell);
        })(ymd(cur));
        cur.setDate(cur.getDate()+1);
        if(cur>today && cur.getDay()===0) break;
      }
      var wk=el('div',{class:'wk'});
      updateWk(wk,h);
      heat.appendChild(el('div',{class:'heat-row'},[ el('div',{class:'hn',text:h.nome}), grid, wk ]));
    });
    root.appendChild(heat);
    root.appendChild(el('div',{class:'heat-legend'},[ el('span',{text:'menos'}), el('span',{class:'cell'}), el('span',{class:'cell on'}), el('span',{class:'cell today on'}), el('span',{text:'hoje'}) ]));
  }
  function weekBounds(){ var d=parseYmd(TODAY); var day=(d.getDay()+6)%7; var mon=new Date(d.getTime()); mon.setDate(mon.getDate()-day); return mon; }
  function countWeek(hid){ var mon=weekBounds(); var c=0; for(var i=0;i<7;i++){ var dd=new Date(mon.getTime()); dd.setDate(dd.getDate()+i); if(getReg(ymd(dd)).indexOf(hid)>=0)c++; } return c; }
  function updateWk(node,h){ var c=countWeek(h.id); clear(node); node.appendChild(el('b',{text:c})); node.appendChild(document.createTextNode('/'+h.meta.alvo+' sem.')); }
  function toggleHabit(hid,dateStr,cell,wkNode){
    var cur=getReg(dateStr); var idx=cur.indexOf(hid); var was=idx>=0;
    if(was) cur.splice(idx,1); else cur.push(hid);
    BUF.registros[dateStr]=cur; saveBuf();
    cell.classList.toggle('on',!was);
    var h=D.rotina.habitos.filter(function(x){return x.id===hid;})[0];
    updateWk(wkNode,h);
    toast(!was?(h.nome+' marcado.'):(h.nome+' desmarcado.'), function(){
      var c2=getReg(dateStr); var j=c2.indexOf(hid); if(was){ if(j<0)c2.push(hid);} else { if(j>=0)c2.splice(j,1);} BUF.registros[dateStr]=c2; saveBuf(); cell.classList.toggle('on',was); updateWk(wkNode,h);
    });
  }

  // =================== AMSTERDAM ===================
  function isBlocked(item, all){
    for(var i=0;i<all.length;i++){ var o=all[i]; if(o.bloqueia&&o.bloqueia.indexOf(item.id)>=0 && o.estado!=='feito') return o.titulo; }
    return null;
  }
  function renderAmsterdam(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('h1',{text:'Amsterdam'}), el('div',{class:'big',html:'O <b>caminho critico</b> da mudanca'}) ]));
    var wrap=el('div',{class:'ams'});
    var all=mergedCarreira();
    // achar proximo desbloqueado nao-feito
    var nextId=null;
    for(var i=0;i<all.length;i++){ var it=all[i]; if(it.estado!=='feito' && !isBlocked(it,all)){ nextId=it.id; break; } }
    all.forEach(function(it,i){
      var blockedBy=isBlocked(it,all);
      wrap.appendChild(amsItem(it,blockedBy,it.id===nextId,root));
      if(i<all.length-1) wrap.appendChild(el('div',{class:'ams-conn'}));
    });
    root.appendChild(wrap);
  }
  function amsItem(it,blockedBy,isNext,root){
    var cls='ams-item';
    if(it.estado==='feito')cls+=' done'; else if(it.estado==='em_andamento')cls+=' andamento';
    if(blockedBy)cls+=' blocked'; else cls+=' clickable';
    if(isNext)cls+=' next';
    var mark=it.estado==='feito'?'✓':(it.estado==='em_andamento'?'·':'');
    var nota=blockedBy?('aguardando: '+blockedBy):(it.nota||'');
    var node=el('div',{class:cls},[
      el('div',{class:'st',text:mark}),
      el('div',{class:'t'},[ document.createTextNode(it.titulo), nota?el('span',{class:'nota',text:nota}):null ])
    ]);
    if(!blockedBy){ node.addEventListener('click',function(){ cycleEstado(it,root); }); }
    return node;
  }
  function cycleEstado(it,root){
    var order=['nao_iniciado','em_andamento','feito'];
    var prev=it.estado; var next=order[(order.indexOf(it.estado)+1)%3];
    BUF.carreira[it.id]=Object.assign(BUF.carreira[it.id]||{},{estado:next}); saveBuf();
    renderAmsterdam(root); // dependencias mudam varios nos
    toast('"'+it.titulo+'": '+labelEstado(next), function(){ BUF.carreira[it.id]=Object.assign(BUF.carreira[it.id]||{},{estado:prev}); saveBuf(); renderAmsterdam(root); });
  }
  function labelEstado(e){ return e==='feito'?'feito':(e==='em_andamento'?'em andamento':'nao iniciado'); }

  // =================== LOG ===================
  var logFiltro='todos';
  function renderLog(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('h1',{text:'Log'}), el('div',{class:'big',html:'Retrospectiva · <b>materia-prima do CV</b>'}) ]));
    var filtro=el('div',{class:'log-filter'});
    var projs=mergedProjetos();
    filtro.appendChild(chip('Todos','todos'));
    projs.forEach(function(p){ filtro.appendChild(chip(p.nome,p.id)); });
    root.appendChild(filtro);
    var body=el('div',{});
    root.appendChild(body);
    fillLog(body);
    function chip(nome,id){ return el('button',{class:'chip'+(logFiltro===id?' on':''),text:nome,onclick:function(){ logFiltro=id; Array.prototype.forEach.call(filtro.children,function(c){c.classList.remove('on');}); this.classList.add('on'); fillLog(body); }}); }
  }
  function fillLog(body){
    clear(body);
    var nomeOf={}; mergedProjetos().forEach(function(p){nomeOf[p.id]=p.nome;});
    var entries=mergedLog().filter(function(l){ return logFiltro==='todos'||l.projeto===logFiltro; }).sort(function(a,b){return a.data<b.data?1:-1;});
    if(!entries.length){ body.appendChild(el('div',{class:'log-empty',text:'Nenhuma entrada.'})); return; }
    var groups={}, order=[];
    entries.forEach(function(l){ var wk=weekLabel(l.data); if(!groups[wk]){groups[wk]=[];order.push(wk);} groups[wk].push(l); });
    order.forEach(function(wk){
      var g=el('div',{class:'log-week'});
      g.appendChild(el('div',{class:'label wl',text:wk}));
      groups[wk].forEach(function(l){
        g.appendChild(el('div',{class:'log-entry'},[
          el('div',{class:'d',text:fmtData(l.data)}),
          el('div',{class:'c'},[ el('div',{class:'p',text:nomeOf[l.projeto]||l.projeto}), el('div',{class:'x',text:l.texto}) ])
        ]));
      });
      body.appendChild(g);
    });
  }
  function weekLabel(dateStr){ var d=parseYmd(dateStr); var day=(d.getDay()+6)%7; var mon=new Date(d.getTime()); mon.setDate(mon.getDate()-day); return 'Semana de '+mon.getDate()+' '+MES_ABREV[mon.getMonth()]; }

  // ---- utils ----
  function hhmm(iso){ var m=String(iso).match(/T(\\d\\d):(\\d\\d)/); return m?(m[1]+':'+m[2]):''; }
  function fmtData(s){ if(!s)return''; var p=String(s).split('-'); return (+p[2])+' '+MES_ABREV[(+p[1])-1]; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // =================== NAV / BOOT ===================
  var VIEWS=[
    {id:'hoje',nome:'Hoje',render:renderHoje},
    {id:'frentes',nome:'Frentes',render:renderFrentes},
    {id:'rotina',nome:'Rotina',render:renderRotina},
    {id:'amsterdam',nome:'Amsterdam',render:renderAmsterdam},
    {id:'log',nome:'Log',render:renderLog}
  ];
  var built={};
  function show(id){
    VIEWS.forEach(function(v){
      var sec=document.getElementById('view-'+v.id);
      var on=v.id===id;
      sec.classList.toggle('active',on);
      document.getElementById('nav-'+v.id).classList.toggle('active',on);
      if(on && !built[v.id]){ v.render(sec); built[v.id]=true; }
    });
    // Hoje/Frentes/Amsterdam/Rotina dependem de estado que muda; re-render ao voltar mantem consistencia
  }
  function invalidate(){ built={}; }

  function boot(){
    var app=el('div',{id:'app'});
    var nav=el('nav',{id:'nav'});
    nav.appendChild(el('div',{class:'brand',html:'Atencao<span>alocacao pessoal</span>'}));
    VIEWS.forEach(function(v){ nav.appendChild(el('button',{id:'nav-'+v.id,class:'navitem',onclick:function(){ invalidate(); show(v.id); }},[ el('span',{class:'dot'}), el('span',{text:v.nome}) ])); });
    var main=el('main',{id:'main'});
    VIEWS.forEach(function(v){ main.appendChild(el('section',{id:'view-'+v.id,class:'view'})); });
    app.appendChild(nav); app.appendChild(main);
    document.body.appendChild(app);
    toastEl=el('div',{id:'toast'}); document.body.appendChild(toastEl);
    patchBtn=el('button',{id:'patchbtn',onclick:copyPatch},[ el('span',{class:'bd'}), el('span',{text:'Copiar patch'}) ]);
    document.body.appendChild(patchBtn);
    refreshPatchBtn();
    show('hoje');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
`;

// ---------- HTML ----------
const html = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<title>Atencao — alocacao pessoal</title>\n' +
  '<style>' + STYLE + '</style>\n</head>\n<body>\n' +
  '<script>window.__DATA__ = ' + JSON.stringify(DATA) + ';</script>\n' +
  '<script>' + APP + '</script>\n' +
  '</body>\n</html>\n';

fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
console.log('[build] index.html gerado (' + (html.length/1024).toFixed(1) + ' KB) — ' + DATA.projetos.length + ' frentes, ' + DATA.rotina.habitos.length + ' habitos, ' + DATA.agenda.length + ' compromissos.');
