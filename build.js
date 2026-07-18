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
  tarefas: readJSON('tarefas.json', []),
  gastos: readJSON('gastos.json', []),
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
input,textarea,select{font-family:inherit;color:var(--hi);background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:8px 10px;font-size:14px;width:100%}
textarea{resize:vertical;min-height:54px}
select{cursor:pointer}

#app{display:grid;grid-template-columns:210px 1fr;min-height:100vh}
#nav{border-right:1px solid var(--border);padding:34px 20px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:2px}
#nav .brand{font-size:15px;font-weight:700;letter-spacing:-.01em;margin-bottom:14px}
#nav .brand span{color:var(--lo);font-weight:400;display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-top:6px}
.navitem{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:11px;color:var(--mid);font-size:14px;font-weight:500;text-align:left;transition:color .15s,background .15s}
.navitem:hover{color:var(--hi);background:var(--surface)}
.navitem.active{color:var(--hi);background:var(--surface)}
.navitem .dot{width:5px;height:5px;border-radius:50%;background:transparent}
.navitem.active .dot{background:var(--hi)}

#main{padding:46px 54px 100px;max-width:1120px}
.view{display:none}
.view.active{display:block;animation:fade .25s ease}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

.vhead{margin-bottom:30px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
.vhead h1{font-size:13px;text-transform:uppercase;letter-spacing:.18em;color:var(--lo);font-weight:600}
.vhead .big{font-size:30px;font-weight:200;letter-spacing:-.02em;color:var(--hi);margin-top:8px}
.vhead .big b{font-weight:600}

.block-title{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:var(--lo);font-weight:600;margin-bottom:16px}
.addbtn{font-size:12.5px;color:var(--mid);border:1px dashed var(--border);border-radius:10px;padding:8px 14px;white-space:nowrap;flex:none}
.addbtn:hover{color:var(--hi);border-color:var(--mid)}
.seg{display:inline-flex;background:var(--surface);border-radius:11px;padding:3px;gap:2px}
.seg button{font-size:13px;color:var(--mid);padding:6px 16px;border-radius:9px;font-weight:500}
.seg button.on{background:var(--surface-2);color:var(--hi)}

/* form generico */
.form{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;margin:12px 0}
.form .row{display:flex;gap:12px;flex-wrap:wrap}
.form .row>div{flex:1;min-width:120px}
.savebar{display:flex;gap:10px;justify-content:flex-end}
.btn{font-size:13px;padding:8px 16px;border-radius:10px;font-weight:500}
.btn.primary{background:var(--hi);color:var(--bg)}
.btn.ghost{color:var(--mid);border:1px solid var(--border)}
.btn.ghost:hover{color:var(--hi)}
.btn.danger{color:#d98a6a;border:1px solid var(--border)}
.iconbtn{font-size:11.5px;color:var(--lo);border:1px solid var(--border);border-radius:9px;padding:5px 9px}
.iconbtn:hover{color:var(--hi);border-color:var(--mid)}

/* prioridade / status */
.pdot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}
.pdot.alta{background:var(--accent)}
.pdot.media{background:var(--mid)}
.pdot.baixa{background:transparent;border:1px solid var(--lo)}
.pill{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--mid);border:1px solid var(--border);border-radius:20px;padding:3px 9px;font-weight:600}
.ptag{font-size:11px;color:var(--lo)}

/* HOJE */
.hoje-grid{display:grid;grid-template-columns:1fr 300px;gap:44px}
.prio{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}
.prio .idx{font-size:12px;color:var(--lo);width:16px;flex:none;padding-top:3px;font-variant-numeric:tabular-nums}
.prio .txt{flex:1;font-size:17px;font-weight:400;color:var(--hi);outline:none;min-height:24px}
.prio .txt.empty{color:var(--lo)}
.prio .txt.done{text-decoration:line-through;color:var(--lo)}
.prio .check{flex:none;width:20px;height:20px;border:1.5px solid var(--border);border-radius:7px;color:transparent;font-size:12px;line-height:17px;text-align:center;transition:.15s}
.prio .check:hover{border-color:var(--mid)}
.prio .check.on{background:var(--mid);border-color:var(--mid);color:var(--bg)}
.today-task{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--border)}
.today-task .tt{flex:1;font-size:14.5px}
.today-task .tt.done{text-decoration:line-through;color:var(--lo)}
.sugestao{margin-top:22px;padding:16px 18px;background:var(--surface);border-radius:var(--r);display:flex;align-items:center;gap:14px}
.sugestao .label{margin-bottom:4px}
.sugestao .s-main{font-size:15px;color:var(--hi)}
.sugestao .s-main b{font-weight:600}
.sugestao .add{margin-left:auto;flex:none;font-size:12px;color:var(--mid);border:1px solid var(--border);border-radius:9px;padding:7px 12px}
.sugestao .add:hover{color:var(--hi);border-color:var(--mid)}
.agenda-item{padding:13px 0;border-bottom:1px solid var(--border)}
.agenda-item .hora{font-size:12px;color:var(--lo);font-variant-numeric:tabular-nums}
.agenda-item .tit{font-size:14.5px;color:var(--hi);margin-top:3px}
.agenda-empty,.empty{color:var(--lo);font-size:14px;padding:10px 0}

/* FRENTES */
.frentes{display:flex;flex-direction:column;gap:14px}
.card{background:var(--surface);border-radius:var(--r);padding:22px 24px;border:1px solid transparent;transition:border-color .15s,background .15s}
.card:hover{background:var(--surface-2)}
.card.accent{border-color:rgba(255,106,61,.32)}
.card-top{display:flex;align-items:baseline;gap:22px;cursor:pointer}
.card .num{font-size:46px;font-weight:600;line-height:.9;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--neutro);flex:none;width:78px}
.card.t-ambar .num{color:var(--ambar)}
.card.accent .num{color:var(--accent)}
.card .num small{display:block;font-size:9.5px;font-weight:600;letter-spacing:.14em;color:var(--lo);margin-top:8px;text-transform:uppercase}
.card .body{flex:1;min-width:0}
.card .nome{font-size:19px;font-weight:600;letter-spacing:-.01em}
.card .meta{font-size:12.5px;color:var(--mid);margin-top:3px}
.card .marco{font-size:12px;color:var(--lo);margin-top:12px}
.card .marco b{color:var(--mid);font-weight:500}
.card.accent .marco b{color:var(--accent)}
.card .actions{display:flex;gap:8px;flex:none;align-self:flex-start}
.expand{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);display:none}
.expand.open{display:block}
.expand .lg{font-size:13px;color:var(--mid);padding:7px 0;display:flex;gap:12px}
.expand .lg .d{color:var(--lo);font-variant-numeric:tabular-nums;flex:none;font-size:12px}
.edit{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);display:none;gap:12px;flex-direction:column}
.edit.open{display:flex}

/* TAREFAS: semana */
.wknav{display:flex;align-items:center;gap:16px;margin-bottom:20px}
.wknav button{font-size:16px;color:var(--mid);width:30px;height:30px;border-radius:8px;border:1px solid var(--border)}
.wknav button:hover{color:var(--hi)}
.wknav .wl{font-size:14px;color:var(--hi);font-weight:500}
.days{display:grid;grid-template-columns:repeat(7,1fr);gap:12px}
.day{background:var(--surface);border-radius:14px;padding:14px 12px;min-height:120px;display:flex;flex-direction:column;gap:8px}
.day.is-today{border:1px solid rgba(255,106,61,.3)}
.day .dh{display:flex;align-items:baseline;justify-content:space-between}
.day .dh .dn{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--lo);font-weight:600}
.day .dh .dd{font-size:13px;color:var(--mid);font-variant-numeric:tabular-nums}
.day.is-today .dh .dd{color:var(--accent)}
.tsk{background:var(--surface-2);border-radius:10px;padding:9px 10px;display:flex;flex-direction:column;gap:5px;cursor:pointer}
.tsk:hover{outline:1px solid var(--border)}
.tsk .l1{display:flex;align-items:center;gap:7px}
.tsk .l1 .tx{font-size:13px;line-height:1.3}
.tsk.done .tx{text-decoration:line-through;color:var(--lo)}
.tsk .l2{font-size:10.5px;color:var(--lo);display:flex;gap:8px;align-items:center}
.dayadd{font-size:18px;color:var(--lo);align-self:flex-start;padding:2px 6px;border-radius:7px}
.dayadd:hover{color:var(--hi);background:var(--surface-2)}

/* TAREFAS: board */
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.bcol{background:var(--surface);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px}
.bcol .bh{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.bcol .bh .bt{font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:600;color:var(--mid)}
.bcol .bh .bc{font-size:12px;color:var(--lo);font-variant-numeric:tabular-nums}
.bcard{background:var(--surface-2);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}
.bcard .l1{display:flex;align-items:flex-start;gap:8px}
.bcard .l1 .tx{font-size:13.5px;line-height:1.35;flex:1}
.bcard.done .tx{color:var(--lo)}
.bcard .l2{display:flex;align-items:center;justify-content:space-between;gap:8px}
.bcard .l2 .meta{font-size:11px;color:var(--lo);display:flex;gap:8px;align-items:center}
.bcard .mv{display:flex;gap:4px}
.bcard .mv button{font-size:13px;color:var(--lo);width:22px;height:22px;border-radius:6px;border:1px solid var(--border)}
.bcard .mv button:hover{color:var(--hi)}

/* TIMELINE */
.tl-axis{position:relative;height:22px;margin-left:170px;margin-bottom:6px}
.tl-axis .wk{position:absolute;font-size:10.5px;color:var(--lo);font-variant-numeric:tabular-nums;transform:translateX(-1px);border-left:1px solid var(--border);padding-left:5px;height:14px;bottom:0}
.tl-row{display:grid;grid-template-columns:170px 1fr;align-items:center;gap:0;height:46px}
.tl-row .rl{font-size:13px;color:var(--hi);padding-right:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-track{position:relative;height:46px;border-left:1px solid var(--border)}
.tl-base{position:absolute;top:50%;height:2px;background:var(--border);transform:translateY(-50%)}
.tl-mk{position:absolute;top:50%;width:11px;height:11px;background:var(--neutro);transform:translate(-50%,-50%) rotate(45deg);border-radius:2px;cursor:default}
.tl-mk.done{background:var(--surface-2);border:1px solid var(--neutro)}
.tl-mk.accent{background:var(--accent)}
.tl-tick{position:absolute;bottom:7px;width:5px;height:5px;border-radius:50%;background:var(--lo);transform:translateX(-50%)}
.tl-today{position:absolute;top:0;bottom:0;width:0;border-left:1px dashed var(--lo);opacity:.6}
.marcos-mgr{margin-top:34px}
.mrow{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.mrow .mp{font-size:11px;color:var(--mid);width:180px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mrow .mt{flex:1;font-size:13.5px}
.mrow .mt.done{color:var(--lo);text-decoration:line-through}
.mrow .md{font-size:12px;color:var(--lo);font-variant-numeric:tabular-nums;flex:none}

/* ROTINA */
.heat{display:flex;flex-direction:column;gap:16px;margin-top:6px}
.heat-row{display:grid;grid-template-columns:150px 1fr 92px;align-items:center;gap:18px}
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
.heat-legend{margin-top:22px;display:flex;align-items:center;gap:8px;color:var(--lo);font-size:11px}
.heat-legend .cell{width:11px;height:11px}
.months{display:grid;grid-template-columns:repeat(3,1fr);gap:24px 30px;margin-top:8px}
.month .mlabel{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--mid);font-weight:600;margin-bottom:10px}
.mgrid-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.mgrid-row .mhn{font-size:10.5px;color:var(--lo);width:26px;flex:none}
.mgrid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:2px}
.mcell{width:8px;height:8px;border-radius:2px;background:var(--surface)}
.mcell.on{background:var(--mid)}
.mcell.today.on{background:var(--accent)}

/* AMSTERDAM */
.ams{display:flex;flex-direction:column;gap:2px;max-width:600px}
.ams-item{display:flex;align-items:center;gap:16px;padding:15px 18px;border-radius:14px;transition:background .15s}
.ams-item .st{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--border);flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--lo);cursor:pointer}
.ams-item.done .st{background:var(--mid);border-color:var(--mid);color:var(--bg)}
.ams-item.andamento .st{border-color:var(--mid);color:var(--mid)}
.ams-item .t{flex:1}
.ams-item .t .tt{font-size:15px;color:var(--hi)}
.ams-item .t .nota{display:block;font-size:12px;color:var(--lo);margin-top:2px}
.ams-item.blocked{opacity:.4}
.ams-item.next{background:var(--surface)}
.ams-item.next .st{border-color:var(--accent);color:var(--accent)}
.ams-conn{width:1px;height:10px;background:var(--border);margin-left:30px}
.ams-actions{display:flex;gap:6px;flex:none}
.sec{margin-top:48px}
.gastos-tot{display:flex;gap:40px;flex-wrap:wrap;margin-bottom:24px}
.gt-block{min-width:200px}
.gt-block .gv{font-size:26px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.gt-block .gv small{font-size:13px;color:var(--lo);font-weight:400}
.bar{height:6px;background:var(--surface-2);border-radius:4px;margin-top:10px;overflow:hidden}
.bar > i{display:block;height:100%;background:var(--neutro);border-radius:4px}
.gtable{display:flex;flex-direction:column}
.grow{display:grid;grid-template-columns:1fr 130px 130px 84px;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)}
.grow.gh{color:var(--lo);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.grow .gi .gn{font-size:14px}
.grow .gi .gc{font-size:11px;color:var(--lo)}
.grow .gm{font-size:13px;font-variant-numeric:tabular-nums;text-align:right}
.grow .gm .est{color:var(--lo);font-size:11px;display:block}
.grow .ga{display:flex;gap:6px;justify-content:flex-end}

/* TOAST + PATCH */
#toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);background:var(--surface-2);border:1px solid var(--border);border-radius:13px;padding:13px 18px;display:flex;align-items:center;gap:18px;opacity:0;pointer-events:none;transition:.22s;z-index:50;box-shadow:0 12px 40px rgba(0,0,0,.4)}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
#toast .m{font-size:14px}
#toast .u{font-size:13px;color:var(--accent);font-weight:600}
#patchbtn{position:fixed;right:26px;bottom:26px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:10px 16px;font-size:13px;color:var(--mid);z-index:40;display:none;align-items:center;gap:9px;transition:.15s}
#patchbtn:hover{color:var(--hi);border-color:var(--mid)}
#patchbtn.show{display:flex}
#patchbtn .bd{width:7px;height:7px;border-radius:50%;background:var(--accent)}

@media(max-width:900px){
  #app{grid-template-columns:1fr}
  #nav{position:static;height:auto;flex-direction:row;flex-wrap:wrap;padding:16px}
  #main{padding:26px 20px 100px}
  .hoje-grid{grid-template-columns:1fr;gap:30px}
  .days{grid-template-columns:1fr}
  .board{grid-template-columns:1fr}
  .months{grid-template-columns:1fr}
  .heat-row{grid-template-columns:110px 1fr;gap:12px}
  .heat-row .wk{grid-column:2;text-align:left}
}
`;

// ---------- CLIENT APP (sem template literals / sem cifrao-chave) ----------
const APP = `
(function(){
  'use strict';
  var D = window.__DATA__;
  var LS_KEY = 'atencao_buffer_v2';

  function pad(n){ return (n<10?'0':'')+n; }
  function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parseYmd(s){ var p=String(s).split('-'); return new Date(+p[0], (+p[1])-1, +p[2]); }
  function daysBetween(a,b){ return Math.round((parseYmd(b).getTime()-parseYmd(a).getTime())/86400000); }
  function addDays(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function mondayOf(d){ var x=new Date(d.getTime()); var day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
  var TODAY = ymd(new Date());

  var MESES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var DIAS=['domingo','segunda-feira','terca-feira','quarta-feira','quinta-feira','sexta-feira','sabado'];
  var DIAS_ABREV=['dom','seg','ter','qua','qui','sex','sab'];
  var MES_ABREV=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var STATUS=[['a_fazer','A fazer'],['fazendo','Fazendo'],['feito','Feito']];
  var PRIOS=[['alta','Alta'],['media','Media'],['baixa','Baixa']];
  var PRANK={alta:0,media:1,baixa:2};
  function statusLabel(s){ for(var i=0;i<STATUS.length;i++) if(STATUS[i][0]===s) return STATUS[i][1]; return s; }

  // ---- buffer ----
  function emptyColl(){ return {add:[],update:{},remove:[]}; }
  function emptyBuf(){ return { registros:{}, toques:[], prioridades:null,
    projetos:emptyColl(), tarefas:emptyColl(), gastos:emptyColl(), carreira:emptyColl(), habitos:emptyColl() }; }
  function loadBuf(){ try{ var b=JSON.parse(localStorage.getItem(LS_KEY)); if(!b||typeof b!=='object') return emptyBuf();
      var e=emptyBuf(); for(var k in e){ if(b[k]!=null) e[k]=b[k]; } return e; }catch(err){ return emptyBuf(); } }
  var BUF = loadBuf();
  function saveBuf(){ localStorage.setItem(LS_KEY, JSON.stringify(BUF)); refreshPatchBtn(); }
  function collEmpty(c){ return !c || (c.add.length===0 && Object.keys(c.update).length===0 && c.remove.length===0); }
  function bufEmpty(){
    return Object.keys(BUF.registros).length===0 && BUF.toques.length===0 &&
      collEmpty(BUF.projetos)&&collEmpty(BUF.tarefas)&&collEmpty(BUF.gastos)&&collEmpty(BUF.carreira)&&collEmpty(BUF.habitos) &&
      (!BUF.prioridades || BUF.prioridades.every(function(p){return !p.texto && !p.feito;}));
  }
  function newId(pfx){ return (pfx||'new')+'-'+Date.now()+'-'+Math.floor(Math.random()*1000); }
  function patchItem(coll,id,fields){ var p=BUF[coll]; var a=p.add.filter(function(x){return x.id===id;})[0];
    if(a){ for(var k in fields)a[k]=fields[k]; } else { p.update[id]=Object.assign(p.update[id]||{},fields); } saveBuf(); }
  function addItem(coll,obj){ BUF[coll].add.push(obj); saveBuf(); }
  function removeItem(coll,id){ var p=BUF[coll]; var i=p.add.map(function(x){return x.id;}).indexOf(id);
    if(i>=0){ p.add.splice(i,1);} else { if(p.remove.indexOf(id)<0)p.remove.push(id); delete p.update[id]; } saveBuf(); }

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
  function mergeColl(base, patch){
    var rm = patch&&patch.remove?patch.remove:[];
    var out = base.filter(function(x){return rm.indexOf(x.id)<0;}).map(function(x){
      var o={}; for(var k in x)o[k]=x[k];
      var up = patch&&patch.update?patch.update[x.id]:null; if(up){ for(var k2 in up)o[k2]=up[k2]; }
      return o;
    });
    if(patch&&patch.add) patch.add.forEach(function(a){ if(rm.indexOf(a.id)<0) out.push(a); });
    return out;
  }
  function mergedProjetos(){
    var arr=mergeColl(D.projetos, BUF.projetos);
    arr.forEach(function(o){ BUF.toques.forEach(function(t){ if(t.projeto===o.id && t.data>(o.ultimoToque||'')) o.ultimoToque=t.data; }); });
    return arr.filter(function(o){ return o.status!=='arquivado'; });
  }
  function mergedTarefas(){ return mergeColl(D.tarefas, BUF.tarefas); }
  function mergedGastos(){ return mergeColl(D.gastos, BUF.gastos); }
  function mergedCarreira(){ return mergeColl(D.carreira, BUF.carreira); }
  function mergedLog(){ return D.log.concat(BUF.toques); }
  function getReg(date){ if(BUF.registros[date]) return BUF.registros[date].slice(); return (D.rotina.registros[date]||[]).slice(); }
  function projNome(id){ var p=mergedProjetos().filter(function(x){return x.id===id;})[0]; return p?p.nome:(id||'—'); }
  function proximoMarco(p){
    var ms=(p.marcos||[]).filter(function(m){return !m.feito;}).sort(function(a,b){return a.data<b.data?-1:1;});
    return ms[0]||null;
  }
  function tempOf(p){ var dias=Math.max(0, daysBetween(p.ultimoToque, TODAY)); var cad=p.cadenciaEsperada||1; var ratio=dias/cad;
    return { dias:dias, ratio:ratio, state: ratio>2?'quente':(ratio>1?'ambar':'neutro') }; }

  // ---- toast / patch ----
  var toastEl, toastTimer, patchBtn;
  function toast(msg, undoFn){ clear(toastEl); toastEl.appendChild(el('span',{class:'m',text:msg}));
    if(undoFn) toastEl.appendChild(el('button',{class:'u',text:'Desfazer',onclick:function(){ hideToast(); undoFn(); }}));
    toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(hideToast, undoFn?6000:2600); }
  function hideToast(){ toastEl.classList.remove('show'); }
  function refreshPatchBtn(){ if(patchBtn) patchBtn.classList.toggle('show', !bufEmpty()); }
  function copyPatch(){
    var out={};
    if(Object.keys(BUF.registros).length) out.registros=BUF.registros;
    if(BUF.toques.length) out.toques=BUF.toques;
    ['projetos','tarefas','gastos','carreira','habitos'].forEach(function(c){ if(!collEmpty(BUF[c])) out[c]=BUF[c]; });
    if(BUF.prioridades && BUF.prioridades.some(function(p){return p.texto;})) out.prioridades=BUF.prioridades;
    var txt=JSON.stringify(out,null,2);
    function ok(){ toast('Patch copiado. Cole no Claude Code com /sync.'); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(ok,function(){fallbackCopy(txt);ok();}); }
    else { fallbackCopy(txt); ok(); }
  }
  function fallbackCopy(txt){ var ta=el('textarea',{}); ta.value=txt; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); }

  // ---- form helpers ----
  function field(lbl,node){ return el('div',{},[ el('div',{class:'label',text:lbl}), el('div',{style:'margin-top:6px'},[node]) ]); }
  function inp(val,type){ return el('input',{value:(val==null?'':val),type:type||'text'}); }
  function selectEl(pairs,value){ var s=el('select',{}); pairs.forEach(function(pr){ var o=el('option',{value:pr[0]},pr[1]); if(pr[0]===value)o.setAttribute('selected','selected'); s.appendChild(o); }); return s; }
  function projPairs(){ return [['','— sem projeto']].concat(mergedProjetos().map(function(p){return [p.id,p.nome];})); }

  // ---- money ----
  function money(n,cur){ n=Math.round(n||0); var s=String(Math.abs(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.'); return (n<0?'-':'')+(cur==='EUR'?'€ ':'R$ ')+s; }

  // =================== HOJE ===================
  function renderHoje(root){
    clear(root);
    var d=new Date();
    root.appendChild(el('div',{class:'vhead'},[ el('div',{},[ el('h1',{text:'Hoje'}),
      el('div',{class:'big',html:'<b>'+DIAS[d.getDay()]+'</b>, '+d.getDate()+' de '+MESES[d.getMonth()]}) ]) ]));
    var grid=el('div',{class:'hoje-grid'});
    var col=el('div',{});
    // prioridades
    col.appendChild(el('div',{class:'block-title',text:'Prioridades'}));
    if(!BUF.prioridades) BUF.prioridades=[{texto:'',feito:false},{texto:'',feito:false},{texto:'',feito:false}];
    var listNode=el('div',{});
    BUF.prioridades.forEach(function(p,i){ listNode.appendChild(prioRow(p,i)); });
    col.appendChild(listNode);
    // tarefas de hoje
    var hojeTasks=mergedTarefas().filter(function(t){return t.data===TODAY;}).sort(function(a,b){return PRANK[a.prioridade]-PRANK[b.prioridade];});
    if(hojeTasks.length){
      col.appendChild(el('div',{class:'block-title',style:'margin-top:28px',text:'Tarefas de hoje'}));
      var tn=el('div',{});
      hojeTasks.forEach(function(t){ tn.appendChild(todayTaskRow(t)); });
      col.appendChild(tn);
    }
    // sugestao dormente
    var ps=mergedProjetos().map(function(p){return {p:p,t:tempOf(p)};}).sort(function(a,b){return b.t.ratio-a.t.ratio;});
    if(ps.length && ps[0].t.ratio>1){ var sug=ps[0];
      col.appendChild(el('div',{class:'sugestao'},[ el('div',{},[ el('div',{class:'label',text:'Sugestao de atencao'}),
        el('div',{class:'s-main',html:'<b>'+esc(sug.p.nome)+'</b> esta ha '+sug.t.dias+' dias sem toque'}) ]),
        el('button',{class:'add',text:'Adicionar',onclick:function(){ addSugestao(sug.p, listNode); }}) ]));
    }
    grid.appendChild(col);
    var ag=el('div',{});
    ag.appendChild(el('div',{class:'block-title',text:'Compromissos de hoje'}));
    var hoje=D.agenda.filter(function(e){ return String(e.inicio).slice(0,10)===TODAY; }).sort(function(a,b){return a.inicio<b.inicio?-1:1;});
    if(!hoje.length) ag.appendChild(el('div',{class:'agenda-empty',text:'Sem compromissos hoje.'}));
    hoje.forEach(function(e){ ag.appendChild(el('div',{class:'agenda-item'},[
      el('div',{class:'hora',text: e.diaInteiro?'dia inteiro':(hhmm(e.inicio)+' – '+hhmm(e.fim))}), el('div',{class:'tit',text:e.titulo}) ])); });
    grid.appendChild(ag);
    root.appendChild(grid);
  }
  function prioRow(p,i){
    var txt=el('div',{class:'txt'+(p.texto?'':' empty')+(p.feito?' done':''),contenteditable:'true',text:p.texto||'Escreva uma prioridade…'});
    txt.addEventListener('focus',function(){ if(!p.texto){ txt.textContent=''; txt.classList.remove('empty'); } });
    txt.addEventListener('blur',function(){ var v=txt.textContent.trim(); p.texto=v; saveBuf(); if(!v){ txt.classList.add('empty'); txt.textContent='Escreva uma prioridade…'; } });
    var check=el('button',{class:'check'+(p.feito?' on':''),text:'✓',onclick:function(){ var prev=p.feito; p.feito=!p.feito; saveBuf();
      check.classList.toggle('on',p.feito); txt.classList.toggle('done',p.feito); }});
    return el('div',{class:'prio'},[ el('div',{class:'idx',text:(i+1)}), txt, check ]);
  }
  function todayTaskRow(t){
    var done=t.status==='feito';
    var chk=el('button',{class:'check'+(done?' on':''),text:'✓',onclick:function(){ var ns=done?'a_fazer':'feito';
      patchItem('tarefas',t.id,{status:ns}); renderCurrent(); }});
    return el('div',{class:'today-task'},[ chk, el('span',{class:'pdot '+t.prioridade}), el('div',{class:'tt'+(done?' done':''),text:t.titulo}),
      el('span',{class:'ptag',text:projNome(t.projeto)}) ]);
  }
  function addSugestao(proj, listNode){ var slot=BUF.prioridades.filter(function(p){return !p.texto;})[0];
    if(!slot){ toast('As 3 prioridades ja estao preenchidas.'); return; } slot.texto='Tocar em '+proj.nome; saveBuf();
    var i=BUF.prioridades.indexOf(slot); listNode.replaceChild(prioRow(slot,i), listNode.children[i]); toast('Adicionada as prioridades.'); }

  // =================== TAREFAS (Semana / Board) ===================
  var tarefaSub='semana', weekOffset=0;
  function renderTarefas(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[
      el('div',{},[ el('h1',{text:'Tarefas'}), el('div',{class:'big',html:'O que fazer <b>esta semana</b>'}) ]),
      el('div',{class:'seg'},[
        el('button',{class:tarefaSub==='semana'?'on':'',text:'Semana',onclick:function(){ tarefaSub='semana'; renderCurrent(); }}),
        el('button',{class:tarefaSub==='board'?'on':'',text:'Board',onclick:function(){ tarefaSub='board'; renderCurrent(); }})
      ])
    ]));
    var body=el('div',{}); root.appendChild(body);
    if(tarefaSub==='semana') renderSemana(body); else renderBoard(body);
  }
  function taskForm(container, init, onDone){
    var t=init||{titulo:'',projeto:(mergedProjetos()[0]||{}).id||'',data:TODAY,prioridade:'media',status:'a_fazer',descricao:''};
    var iT=inp(t.titulo), iP=selectEl(projPairs(),t.projeto), iD=inp(t.data,'date'), iPr=selectEl(PRIOS,t.prioridade), iS=selectEl(STATUS,t.status), iDesc=el('textarea',{},t.descricao||'');
    var form=el('div',{class:'form'},[
      field('Tarefa (a ação)',iT),
      el('div',{class:'row'},[ field('Projeto',iP), field('Data',iD), field('Prioridade',iPr), field('Status',iS) ]),
      field('Descrição (opcional)',iDesc),
      el('div',{class:'savebar'},[
        el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ container.removeChild(form); }}),
        el('button',{class:'btn primary',text:'Salvar',onclick:function(){
          var obj={titulo:iT.value.trim(),projeto:iP.value,data:iD.value,prioridade:iPr.value,status:iS.value,descricao:iDesc.value.trim()};
          if(!obj.titulo){ toast('Dê um título à tarefa.'); return; }
          if(init && init.id){ patchItem('tarefas',init.id,obj); toast('Tarefa atualizada.'); }
          else { obj.id=newId('tk'); obj.criadaEm=TODAY; addItem('tarefas',obj); toast('Tarefa adicionada.'); }
          onDone&&onDone();
        }})
      ])
    ]);
    container.appendChild(form);
  }
  function renderSemana(body){
    var mon=addDays(mondayOf(new Date()), weekOffset*7);
    var sun=addDays(mon,6);
    body.appendChild(el('div',{class:'wknav'},[
      el('button',{text:'‹',onclick:function(){ weekOffset--; renderCurrent(); }}),
      el('div',{class:'wl',text: (weekOffset===0?'Esta semana · ':'')+mon.getDate()+' '+MES_ABREV[mon.getMonth()]+' – '+sun.getDate()+' '+MES_ABREV[sun.getMonth()]}),
      el('button',{text:'›',onclick:function(){ weekOffset++; renderCurrent(); }}),
      el('button',{class:'addbtn',style:'margin-left:auto',text:'+ Tarefa',onclick:function(){ taskForm(body,{data:ymd(mon),titulo:'',projeto:(mergedProjetos()[0]||{}).id||'',prioridade:'media',status:'a_fazer',descricao:''}, renderCurrent); }})
    ]));
    var all=mergedTarefas();
    var days=el('div',{class:'days'});
    for(var i=0;i<7;i++){ (function(dayDate){
      var ds=ymd(dayDate); var isToday=ds===TODAY;
      var box=el('div',{class:'day'+(isToday?' is-today':'')});
      box.appendChild(el('div',{class:'dh'},[ el('div',{class:'dn',text:DIAS_ABREV[dayDate.getDay()]}), el('div',{class:'dd',text:dayDate.getDate()}) ]));
      var dayTasks=all.filter(function(t){return t.data===ds;}).sort(function(a,b){return PRANK[a.prioridade]-PRANK[b.prioridade];});
      dayTasks.forEach(function(t){ box.appendChild(taskChip(t)); });
      box.appendChild(el('button',{class:'dayadd',text:'+',title:'Adicionar tarefa',onclick:function(){ taskForm(body,{data:ds,titulo:'',projeto:(mergedProjetos()[0]||{}).id||'',prioridade:'media',status:'a_fazer',descricao:''}, renderCurrent); }}));
      days.appendChild(box);
    })(addDays(mon,i)); }
    body.appendChild(days);
    var semDatas=all.filter(function(t){return (!t.data) && t.status!=='feito';});
    if(semDatas.length){ body.appendChild(el('div',{class:'block-title',style:'margin-top:30px',text:'Sem data'}));
      var sd=el('div',{class:'days',style:'grid-template-columns:1fr'}); var box=el('div',{class:'day'});
      semDatas.forEach(function(t){ box.appendChild(taskChip(t)); }); sd.appendChild(box); body.appendChild(sd); }
  }
  function taskChip(t){
    var done=t.status==='feito';
    return el('div',{class:'tsk'+(done?' done':''),onclick:function(){ taskDetail(t); }},[
      el('div',{class:'l1'},[ el('span',{class:'pdot '+t.prioridade}), el('div',{class:'tx',text:t.titulo}) ]),
      el('div',{class:'l2'},[ el('span',{text:projNome(t.projeto)}), el('span',{text:statusLabel(t.status)}) ])
    ]);
  }
  function renderBoard(body){
    body.appendChild(el('div',{class:'wknav'},[ el('div',{class:'wl',text:'Todas as tarefas'}),
      el('button',{class:'addbtn',style:'margin-left:auto',text:'+ Tarefa',onclick:function(){ taskForm(body,null,renderCurrent); }}) ]));
    var all=mergedTarefas();
    var board=el('div',{class:'board'});
    STATUS.forEach(function(st){ var sid=st[0];
      var col=el('div',{class:'bcol'});
      var items=all.filter(function(t){return t.status===sid;}).sort(function(a,b){ if((a.data||'')!==(b.data||'')) return (a.data||'9')<(b.data||'9')?-1:1; return PRANK[a.prioridade]-PRANK[b.prioridade]; });
      col.appendChild(el('div',{class:'bh'},[ el('div',{class:'bt',text:st[1]}), el('div',{class:'bc',text:items.length}) ]));
      items.forEach(function(t){ col.appendChild(boardCard(t)); });
      col.appendChild(el('button',{class:'dayadd',text:'+',onclick:function(){ taskForm(col,{titulo:'',projeto:(mergedProjetos()[0]||{}).id||'',data:TODAY,prioridade:'media',status:sid,descricao:''}, renderCurrent); }}));
      board.appendChild(col);
    });
    body.appendChild(board);
  }
  function boardCard(t){
    var idx=STATUS.map(function(s){return s[0];}).indexOf(t.status);
    var mv=el('div',{class:'mv'});
    if(idx>0) mv.appendChild(el('button',{text:'‹',title:'Voltar status',onclick:function(){ patchItem('tarefas',t.id,{status:STATUS[idx-1][0]}); renderCurrent(); }}));
    if(idx<2) mv.appendChild(el('button',{text:'›',title:'Avançar status',onclick:function(){ patchItem('tarefas',t.id,{status:STATUS[idx+1][0]}); renderCurrent(); }}));
    return el('div',{class:'bcard'+(t.status==='feito'?' done':'')},[
      el('div',{class:'l1'},[ el('span',{class:'pdot '+t.prioridade}), el('div',{class:'tx',text:t.titulo}) ]),
      el('div',{class:'l2'},[ el('div',{class:'meta'},[ el('span',{text:projNome(t.projeto)}), t.data?el('span',{text:fmtData(t.data)}):null ]), mv ]),
      el('div',{class:'l2'},[ el('button',{class:'iconbtn',text:'Editar',onclick:function(ev){ ev.stopPropagation(); taskDetail(t); }}),
        el('button',{class:'iconbtn',text:'Excluir',onclick:function(){ delTask(t); }}) ])
    ]);
  }
  function taskDetail(t){ // abre editor no topo da view
    var body=document.querySelector('#view-tarefas .vhead').nextSibling;
    var host=el('div',{}); body.insertBefore(host, body.firstChild);
    host.appendChild(el('div',{class:'savebar',style:'justify-content:space-between'},[
      el('div',{class:'block-title',text:'Editar tarefa'}),
      el('button',{class:'btn danger',text:'Excluir',onclick:function(){ delTask(t); }})
    ]));
    taskForm(host, t, renderCurrent);
  }
  function delTask(t){ removeItem('tarefas',t.id); renderCurrent(); toast('Tarefa excluída.', function(){ if(String(t.id).indexOf('tk-new')===0||String(t.id).indexOf('new')===0){ addItem('tarefas',t);} else { var p=BUF.tarefas; var i=p.remove.indexOf(t.id); if(i>=0)p.remove.splice(i,1); saveBuf(); } renderCurrent(); }); }

  // =================== FRENTES ===================
  function renderFrentes(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[
      el('div',{},[ el('h1',{text:'Frentes'}), el('div',{class:'big',html:'Ordenadas por <b>urgencia de atencao</b>'}) ]),
      el('button',{class:'addbtn',text:'+ Frente',onclick:function(){ frenteForm(root); }})
    ]));
    var wrap=el('div',{class:'frentes'});
    var arr=mergedProjetos().map(function(p){return {p:p,t:tempOf(p)};}).sort(function(a,b){return b.t.ratio-a.t.ratio;});
    arr.forEach(function(o,i){ wrap.appendChild(frenteCard(o.p,o.t,i===0 && o.t.ratio>1)); });
    root.appendChild(wrap);
  }
  function frenteForm(root, init){
    var p=init||{nome:'',cliente:'',tipo:'freela',cadenciaEsperada:3,notas:'',ultimoToque:TODAY};
    var iN=inp(p.nome),iC=inp(p.cliente),iT=selectEl([['agencia','Agência'],['freela','Freela'],['pessoal','Pessoal']],p.tipo),iCad=inp(p.cadenciaEsperada,'number'),iNo=el('textarea',{},p.notas||'');
    var host=el('div',{}); root.querySelector('.vhead').insertAdjacentElement('afterend',host);
    host.appendChild(el('div',{class:'form'},[
      el('div',{class:'label',text: init?'Editar frente':'Nova frente'}),
      field('Nome',iN),
      el('div',{class:'row'},[ field('Cliente',iC), field('Tipo',iT), field('Cadência (dias)',iCad) ]),
      field('Notas',iNo),
      el('div',{class:'savebar'},[
        el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ host.parentNode.removeChild(host); }}),
        el('button',{class:'btn primary',text:'Salvar',onclick:function(){
          var obj={nome:iN.value.trim(),cliente:iC.value.trim(),tipo:iT.value,cadenciaEsperada:parseInt(iCad.value,10)||3,notas:iNo.value.trim()};
          if(!obj.nome){ toast('Dê um nome à frente.'); return; }
          if(init&&init.id){ patchItem('projetos',init.id,obj); toast('Frente atualizada.'); }
          else { obj.id=newId('proj'); obj.status='ativo'; obj.ultimoToque=TODAY; obj.marcos=[]; addItem('projetos',obj); toast('Frente adicionada.'); }
          renderCurrent();
        }})
      ])
    ]));
  }
  function frenteCard(p,t,isAccent){
    var expand=el('div',{class:'expand'});
    var pm=proximoMarco(p);
    var card=el('div',{class:'card t-'+t.state+(isAccent?' accent':'')},[
      el('div',{class:'card-top',onclick:function(){ expand.classList.toggle('open'); if(expand.classList.contains('open')) fillExpand(expand,p); }},[
        el('div',{class:'num'},[ document.createTextNode(String(t.dias)), el('small',{text:'dias sem toque'}) ]),
        el('div',{class:'body'},[ el('div',{class:'nome',text:p.nome}),
          el('div',{class:'meta',text:(p.cliente||'—')+' · '+(p.tipo||'')+' · cadencia '+p.cadenciaEsperada+'d'}),
          pm?el('div',{class:'marco',html:'Proximo marco: <b>'+esc(pm.titulo)+'</b> · '+fmtData(pm.data)}):null ]),
        el('div',{class:'actions'},[
          el('button',{class:'iconbtn',text:'Toque',onclick:function(ev){ ev.stopPropagation(); registrarToque(p); }}),
          el('button',{class:'iconbtn',text:'Editar',onclick:function(ev){ ev.stopPropagation(); frenteForm(document.getElementById('view-frentes'), p); }}),
          el('button',{class:'iconbtn',text:'Excluir',onclick:function(ev){ ev.stopPropagation(); delFrente(p); }})
        ])
      ]), expand
    ]);
    return card;
  }
  function fillExpand(node,p){ clear(node);
    var logs=mergedLog().filter(function(l){return l.projeto===p.id;}).sort(function(a,b){return a.data<b.data?1:-1;}).slice(0,3);
    node.appendChild(el('div',{class:'label',style:'margin-bottom:8px',text:'Últimos toques'}));
    if(!logs.length){ node.appendChild(el('div',{class:'empty',text:'Nenhum toque registrado ainda.'})); }
    logs.forEach(function(l){ node.appendChild(el('div',{class:'lg'},[ el('span',{class:'d',text:fmtData(l.data)}), el('span',{text:l.texto}) ])); });
  }
  function registrarToque(p){ var texto=prompt('O que voce tocou em "'+p.nome+'" hoje?'); if(texto==null) return; texto=texto.trim()||'Toque registrado.';
    var entry={data:TODAY,projeto:p.id,texto:texto}; BUF.toques.push(entry); saveBuf(); renderCurrent();
    toast('Toque registrado em '+p.nome+'.', function(){ var i=BUF.toques.indexOf(entry); if(i>=0)BUF.toques.splice(i,1); saveBuf(); renderCurrent(); }); }
  function delFrente(p){ removeItem('projetos',p.id); renderCurrent(); toast('Frente removida.', function(){ var r=BUF.projetos; var i=r.remove.indexOf(p.id); if(i>=0){r.remove.splice(i,1);saveBuf();} else { addItem('projetos',p);} renderCurrent(); }); }

  // =================== TIMELINE ===================
  function renderTimeline(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('div',{},[ el('h1',{text:'Timeline'}), el('div',{class:'big',html:'Marcos das frentes nas <b>próximas semanas</b>'}) ]) ]));
    var mon=mondayOf(new Date()); var startStr=ymd(mon); var DAYS=77;
    var projs=mergedProjetos();
    // nearest upcoming marco (accent)
    var accentKey=null, accentDate=null;
    projs.forEach(function(p){ (p.marcos||[]).forEach(function(m){ if(!m.feito && m.data>=TODAY){ if(accentDate==null||m.data<accentDate){accentDate=m.data;accentKey=p.id+'|'+m.id;} } }); });
    function pct(dstr){ var off=daysBetween(startStr,dstr); return Math.max(0,Math.min(100, off/DAYS*100)); }
    // axis
    var axis=el('div',{class:'tl-axis'});
    for(var w=0; w<=DAYS/7; w++){ var wd=addDays(mon,w*7); axis.appendChild(el('span',{class:'wk',style:'left:'+(w*7/DAYS*100)+'%',text: wd.getDate()+'/'+pad(wd.getMonth()+1)})); }
    root.appendChild(axis);
    // rows
    var rows=el('div',{});
    projs.sort(function(a,b){ var ma=proximoMarco(a),mb=proximoMarco(b); var da=ma?ma.data:'9999',db=mb?mb.data:'9999'; return da<db?-1:1; });
    projs.forEach(function(p){
      var track=el('div',{class:'tl-track'});
      track.appendChild(el('div',{class:'tl-today',style:'left:'+pct(TODAY)+'%'}));
      var inrange=(p.marcos||[]).filter(function(m){return m.data>=startStr && daysBetween(startStr,m.data)<=DAYS;});
      if(inrange.length>1){ var xs=inrange.map(function(m){return pct(m.data);}); var lo=Math.min.apply(null,xs),hi=Math.max.apply(null,xs);
        track.appendChild(el('div',{class:'tl-base',style:'left:'+lo+'%;width:'+(hi-lo)+'%'})); }
      inrange.forEach(function(m){ var isA=(p.id+'|'+m.id)===accentKey;
        track.appendChild(el('div',{class:'tl-mk'+(m.feito?' done':'')+(isA?' accent':''),style:'left:'+pct(m.data)+'%',title:m.titulo+' · '+fmtData(m.data)})); });
      mergedTarefas().filter(function(t){return t.projeto===p.id && t.data>=startStr && daysBetween(startStr,t.data)<=DAYS;}).forEach(function(t){
        track.appendChild(el('div',{class:'tl-tick',style:'left:'+pct(t.data)+'%',title:t.titulo+' · '+fmtData(t.data)})); });
      rows.appendChild(el('div',{class:'tl-row'},[ el('div',{class:'rl',text:p.nome}), track ]));
    });
    root.appendChild(rows);
    // gestor de marcos (editavel)
    var mgr=el('div',{class:'marcos-mgr'});
    mgr.appendChild(el('div',{class:'vhead'},[ el('div',{},[ el('h1',{text:'Marcos'}), el('div',{class:'big',html:'Editar &amp; adicionar'}) ]) ]));
    projs.forEach(function(p){
      mgr.appendChild(el('div',{class:'block-title',style:'margin-top:20px',text:p.nome}));
      (p.marcos||[]).slice().sort(function(a,b){return a.data<b.data?-1:1;}).forEach(function(m){
        mgr.appendChild(el('div',{class:'mrow'},[
          el('button',{class:'iconbtn',text:m.feito?'✓':'○',title:'Concluir',onclick:function(){ toggleMarco(p,m); }}),
          el('div',{class:'mt'+(m.feito?' done':''),text:m.titulo}),
          el('div',{class:'md',text:fmtData(m.data)}),
          el('button',{class:'iconbtn',text:'Editar',onclick:function(){ marcoForm(mgr,p,m); }}),
          el('button',{class:'iconbtn',text:'×',onclick:function(){ delMarco(p,m); }})
        ]));
      });
      mgr.appendChild(el('button',{class:'addbtn',style:'margin-top:10px',text:'+ Marco',onclick:function(){ marcoForm(mgr,p,null); }}));
    });
    root.appendChild(mgr);
  }
  function setMarcos(p,arr){ patchItem('projetos',p.id,{marcos:arr}); }
  function toggleMarco(p,m){ var arr=(p.marcos||[]).map(function(x){ return x.id===m.id?Object.assign({},x,{feito:!x.feito}):x; }); setMarcos(p,arr); renderCurrent(); }
  function delMarco(p,m){ var arr=(p.marcos||[]).filter(function(x){return x.id!==m.id;}); setMarcos(p,arr); renderCurrent(); toast('Marco removido.'); }
  function marcoForm(host,p,m){
    var init=m||{titulo:'',data:TODAY}; var iT=inp(init.titulo),iD=inp(init.data,'date');
    var form=el('div',{class:'form'},[ el('div',{class:'label',text:(m?'Editar':'Novo')+' marco · '+p.nome}),
      el('div',{class:'row'},[ field('Título',iT), field('Data',iD) ]),
      el('div',{class:'savebar'},[ el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ host.removeChild(form); }}),
        el('button',{class:'btn primary',text:'Salvar',onclick:function(){ if(!iT.value.trim()){toast('Título?');return;}
          var arr=(p.marcos||[]).slice();
          if(m){ arr=arr.map(function(x){return x.id===m.id?Object.assign({},x,{titulo:iT.value.trim(),data:iD.value}):x;}); }
          else { arr.push({id:newId('mk'),titulo:iT.value.trim(),data:iD.value,feito:false}); }
          setMarcos(p,arr); renderCurrent();
        }}) ]) ]);
    host.appendChild(form);
  }

  // =================== ROTINA ===================
  function renderRotina(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('div',{},[ el('h1',{text:'Rotina'}), el('div',{class:'big',html:'12 semanas · <b>sem drama de streak</b>'}) ]),
      el('button',{class:'addbtn',text:'+ Hábito',onclick:function(){ habitoForm(root); }}) ]));
    var WEEKS=12, DAYS=WEEKS*7; var today=parseYmd(TODAY); var start=addDays(today,-(DAYS-1)); start=addDays(start,-start.getDay());
    var heat=el('div',{class:'heat'});
    mergedHabitos().forEach(function(h){
      var grid=el('div',{class:'grid'}); var cur=new Date(start.getTime());
      while(cur<=today || cur.getDay()!==0){ (function(dateStr){ var on=getReg(dateStr).indexOf(h.id)>=0; var isToday=dateStr===TODAY; var future=dateStr>TODAY;
        var cell=el('div',{class:'cell'+(on?' on':'')+(isToday?' today':'')+(future?'':' clickable'),title:dateStr});
        if(!future){ cell.addEventListener('click',function(){ toggleHabit(h.id,dateStr,cell,wk); }); } grid.appendChild(cell); })(ymd(cur));
        cur.setDate(cur.getDate()+1); if(cur>today && cur.getDay()===0) break; }
      var wk=el('div',{class:'wk'}); updateWk(wk,h);
      heat.appendChild(el('div',{class:'heat-row'},[ el('div',{class:'hn',text:h.nome}), grid, wk ]));
    });
    root.appendChild(heat);
    root.appendChild(el('div',{class:'heat-legend'},[ el('span',{text:'menos'}), el('span',{class:'cell'}), el('span',{class:'cell on'}), el('span',{class:'cell today on'}), el('span',{text:'hoje'}) ]));
    // historico mensal
    root.appendChild(el('div',{class:'vhead sec'},[ el('div',{},[ el('h1',{text:'Histórico mensal'}), el('div',{class:'big',html:'Últimos <b>6 meses</b>'}) ]) ]));
    var months=el('div',{class:'months'}); var now=new Date();
    for(var mi=5; mi>=0; mi--){ (function(monthDate){
      var y=monthDate.getFullYear(), mo=monthDate.getMonth(); var ndays=new Date(y,mo+1,0).getDate();
      var block=el('div',{class:'month'}); block.appendChild(el('div',{class:'mlabel',text:MES_ABREV[mo]+' '+y}));
      mergedHabitos().forEach(function(h){ var g=el('div',{class:'mgrid'}); var first=new Date(y,mo,1); var pad0=first.getDay();
        for(var k=0;k<pad0;k++) g.appendChild(el('div',{class:'mcell',style:'background:transparent'}));
        for(var dnum=1; dnum<=ndays; dnum++){ var dstr=y+'-'+pad(mo+1)+'-'+pad(dnum); var on=getReg(dstr).indexOf(h.id)>=0; var isToday=dstr===TODAY;
          g.appendChild(el('div',{class:'mcell'+(on?' on':'')+(isToday?' today':''),title:dstr})); }
        block.appendChild(el('div',{class:'mgrid-row'},[ el('div',{class:'mhn',text:h.nome.slice(0,3)}), g ]));
      });
      months.appendChild(block);
    })(new Date(now.getFullYear(), now.getMonth()-mi, 1)); }
    root.appendChild(months);
  }
  function mergedHabitos(){ return mergeColl(D.rotina.habitos, BUF.habitos); }
  function weekBounds(){ return mondayOf(new Date()); }
  function countWeek(hid){ var mon=weekBounds(); var c=0; for(var i=0;i<7;i++){ if(getReg(ymd(addDays(mon,i))).indexOf(hid)>=0)c++; } return c; }
  function updateWk(node,h){ var c=countWeek(h.id); clear(node); node.appendChild(el('b',{text:c})); node.appendChild(document.createTextNode('/'+(h.meta?h.meta.alvo:'?')+' sem.')); }
  function toggleHabit(hid,dateStr,cell,wkNode){ var cur=getReg(dateStr); var idx=cur.indexOf(hid); var was=idx>=0;
    if(was) cur.splice(idx,1); else cur.push(hid); BUF.registros[dateStr]=cur; saveBuf(); cell.classList.toggle('on',!was);
    var h=mergedHabitos().filter(function(x){return x.id===hid;})[0]; updateWk(wkNode,h);
    toast(!was?(h.nome+' marcado.'):(h.nome+' desmarcado.'), function(){ var c2=getReg(dateStr); var j=c2.indexOf(hid); if(was){if(j<0)c2.push(hid);}else{if(j>=0)c2.splice(j,1);} BUF.registros[dateStr]=c2; saveBuf(); cell.classList.toggle('on',was); updateWk(wkNode,h); }); }
  function habitoForm(root){ var iN=inp(''),iA=inp(3,'number'); var host=el('div',{}); root.querySelector('.vhead').insertAdjacentElement('afterend',host);
    host.appendChild(el('div',{class:'form'},[ el('div',{class:'label',text:'Novo hábito'}),
      el('div',{class:'row'},[ field('Nome',iN), field('Meta semanal',iA) ]),
      el('div',{class:'savebar'},[ el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ host.parentNode.removeChild(host); }}),
        el('button',{class:'btn primary',text:'Salvar',onclick:function(){ if(!iN.value.trim()){toast('Nome?');return;}
          addItem('habitos',{id:newId('hab'),nome:iN.value.trim(),meta:{tipo:'semanal',alvo:parseInt(iA.value,10)||1}}); renderCurrent(); toast('Hábito adicionado.'); }}) ]) ])); }

  // =================== AMSTERDAM ===================
  function isBlocked(item, all){ for(var i=0;i<all.length;i++){ var o=all[i]; if(o.bloqueia&&o.bloqueia.indexOf(item.id)>=0 && o.estado!=='feito') return o.titulo; } return null; }
  function renderAmsterdam(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('div',{},[ el('h1',{text:'Amsterdam'}), el('div',{class:'big',html:'O <b>caminho crítico</b> da mudança'}) ]),
      el('button',{class:'addbtn',text:'+ Etapa',onclick:function(){ carreiraForm(root,null); }}) ]));
    var wrap=el('div',{class:'ams'}); var all=mergedCarreira(); var nextId=null;
    for(var i=0;i<all.length;i++){ var it=all[i]; if(it.estado!=='feito' && !isBlocked(it,all)){ nextId=it.id; break; } }
    all.forEach(function(it,i){ var blockedBy=isBlocked(it,all); wrap.appendChild(amsItem(it,blockedBy,it.id===nextId,all));
      if(i<all.length-1) wrap.appendChild(el('div',{class:'ams-conn'})); });
    root.appendChild(wrap);
    // GASTOS
    root.appendChild(el('div',{class:'vhead sec'},[ el('div',{},[ el('h1',{text:'Gastos da mudança'}), el('div',{class:'big',html:'Estimado vs. <b>pago</b>'}) ]),
      el('button',{class:'addbtn',text:'+ Gasto',onclick:function(){ gastoForm(root,null); }}) ]));
    var gs=mergedGastos();
    var estBRL=0,estEUR=0,pagBRL=0,pagEUR=0; gs.forEach(function(g){ estBRL+=+g.estimadoBRL||0; estEUR+=+g.estimadoEUR||0; pagBRL+=+g.pagoBRL||0; pagEUR+=+g.pagoEUR||0; });
    root.appendChild(el('div',{class:'gastos-tot'},[ totBlock('Reais',pagBRL,estBRL,'BRL'), totBlock('Euros',pagEUR,estEUR,'EUR') ]));
    var table=el('div',{class:'gtable'});
    table.appendChild(el('div',{class:'grow gh'},[ el('div',{text:'Item'}), el('div',{class:'gm',text:'Reais (pago/est.)'}), el('div',{class:'gm',text:'Euros (pago/est.)'}), el('div',{}) ]));
    gs.forEach(function(g){ table.appendChild(gastoRow(g,root)); });
    root.appendChild(table);
  }
  function totBlock(lbl,pago,est,cur){ var pctv=est>0?Math.min(100,Math.round(pago/est*100)):0;
    return el('div',{class:'gt-block'},[ el('div',{class:'label',text:lbl}),
      el('div',{class:'gv',html: money(pago,cur)+' <small>/ '+money(est,cur)+'</small>'}),
      el('div',{class:'bar'},[ el('i',{style:'width:'+pctv+'%'}) ]),
      el('div',{class:'label',style:'margin-top:6px',text: pctv+'% pago · falta '+money(est-pago,cur)}) ]); }
  function gastoRow(g,root){
    return el('div',{class:'grow'},[
      el('div',{class:'gi'},[ el('div',{class:'gn',text:g.item}), el('div',{class:'gc',text:(g.categoria||'')+(g.nota?(' · '+g.nota):'')}) ]),
      el('div',{class:'gm'},[ document.createTextNode(money(g.pagoBRL,'BRL')), el('span',{class:'est',text:'de '+money(g.estimadoBRL,'BRL')}) ]),
      el('div',{class:'gm'},[ document.createTextNode(money(g.pagoEUR,'EUR')), el('span',{class:'est',text:'de '+money(g.estimadoEUR,'EUR')}) ]),
      el('div',{class:'ga'},[ el('button',{class:'iconbtn',text:'Editar',onclick:function(){ gastoForm(root,g); }}),
        el('button',{class:'iconbtn',text:'×',onclick:function(){ removeItem('gastos',g.id); renderCurrent(); toast('Gasto removido.'); }}) ])
    ]);
  }
  function gastoForm(root,g){ var init=g||{item:'',categoria:'',estimadoBRL:0,estimadoEUR:0,pagoBRL:0,pagoEUR:0,nota:''};
    var iI=inp(init.item),iC=inp(init.categoria),iEB=inp(init.estimadoBRL,'number'),iEE=inp(init.estimadoEUR,'number'),iPB=inp(init.pagoBRL,'number'),iPE=inp(init.pagoEUR,'number'),iNo=inp(init.nota);
    var host=el('div',{}); root.querySelectorAll('.vhead')[1].insertAdjacentElement('afterend',host);
    host.appendChild(el('div',{class:'form'},[ el('div',{class:'label',text:(g?'Editar':'Novo')+' gasto'}),
      el('div',{class:'row'},[ field('Item',iI), field('Categoria',iC) ]),
      el('div',{class:'row'},[ field('Estimado R$',iEB), field('Estimado €',iEE), field('Pago R$',iPB), field('Pago €',iPE) ]),
      field('Nota',iNo),
      el('div',{class:'savebar'},[ el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ host.parentNode.removeChild(host); }}),
        el('button',{class:'btn primary',text:'Salvar',onclick:function(){ if(!iI.value.trim()){toast('Item?');return;}
          var obj={item:iI.value.trim(),categoria:iC.value.trim(),estimadoBRL:+iEB.value||0,estimadoEUR:+iEE.value||0,pagoBRL:+iPB.value||0,pagoEUR:+iPE.value||0,nota:iNo.value.trim()};
          if(g){ patchItem('gastos',g.id,obj); } else { obj.id=newId('gt'); addItem('gastos',obj); } renderCurrent(); toast('Gasto salvo.'); }}) ]) ]));
  }
  function amsItem(it,blockedBy,isNext,all){
    var cls='ams-item'; if(it.estado==='feito')cls+=' done'; else if(it.estado==='em_andamento')cls+=' andamento';
    if(blockedBy)cls+=' blocked'; if(isNext)cls+=' next';
    var mark=it.estado==='feito'?'✓':(it.estado==='em_andamento'?'·':'');
    var nota=blockedBy?('aguardando: '+blockedBy):(it.nota||'');
    var st=el('div',{class:'st',text:mark}); if(!blockedBy){ st.addEventListener('click',function(){ cycleEstado(it); }); }
    return el('div',{class:cls},[ st,
      el('div',{class:'t'},[ el('div',{class:'tt',text:it.titulo}), nota?el('span',{class:'nota',text:nota}):null ]),
      el('div',{class:'ams-actions'},[ el('button',{class:'iconbtn',text:'Editar',onclick:function(){ carreiraForm(document.getElementById('view-amsterdam'),it); }}),
        el('button',{class:'iconbtn',text:'×',onclick:function(){ removeItem('carreira',it.id); renderCurrent(); toast('Etapa removida.'); }}) ]) ]);
  }
  function cycleEstado(it){ var order=['nao_iniciado','em_andamento','feito']; var prev=it.estado; var next=order[(order.indexOf(it.estado)+1)%3];
    patchItem('carreira',it.id,{estado:next}); renderCurrent(); toast('"'+it.titulo+'": '+labelEstado(next), function(){ patchItem('carreira',it.id,{estado:prev}); renderCurrent(); }); }
  function labelEstado(e){ return e==='feito'?'feito':(e==='em_andamento'?'em andamento':'nao iniciado'); }
  function carreiraForm(root,it){ var init=it||{titulo:'',estado:'nao_iniciado',nota:'',bloqueia:[]};
    var iT=inp(init.titulo),iE=selectEl([['nao_iniciado','Não iniciado'],['em_andamento','Em andamento'],['feito','Feito']],init.estado),iN=inp(init.nota);
    var host=el('div',{}); root.querySelector('.vhead').insertAdjacentElement('afterend',host);
    host.appendChild(el('div',{class:'form'},[ el('div',{class:'label',text:(it?'Editar':'Nova')+' etapa'}),
      field('Título',iT), el('div',{class:'row'},[ field('Estado',iE), field('Nota',iN) ]),
      el('div',{class:'savebar'},[ el('button',{class:'btn ghost',text:'Cancelar',onclick:function(){ host.parentNode.removeChild(host); }}),
        el('button',{class:'btn primary',text:'Salvar',onclick:function(){ if(!iT.value.trim()){toast('Título?');return;}
          var obj={titulo:iT.value.trim(),estado:iE.value,nota:iN.value.trim()};
          if(it){ patchItem('carreira',it.id,obj); } else { obj.id=newId('car'); obj.bloqueia=[]; addItem('carreira',obj); } renderCurrent(); toast('Etapa salva.'); }}) ]) ]));
  }

  // =================== LOG ===================
  var logFiltro='todos';
  function renderLog(root){
    clear(root);
    root.appendChild(el('div',{class:'vhead'},[ el('div',{},[ el('h1',{text:'Log'}), el('div',{class:'big',html:'Retrospectiva · <b>matéria-prima do CV</b>'}) ]) ]));
    var filtro=el('div',{class:'log-filter',style:'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px'});
    filtro.appendChild(chip('Todos','todos')); mergedProjetos().forEach(function(p){ filtro.appendChild(chip(p.nome,p.id)); });
    root.appendChild(filtro); var body=el('div',{}); root.appendChild(body); fillLog(body);
    function chip(nome,id){ return el('button',{class:'chip'+(logFiltro===id?' on':''),style:'font-size:12px;color:'+(logFiltro===id?'var(--hi)':'var(--mid)')+';border:1px solid var(--border);border-radius:20px;padding:6px 14px;background:'+(logFiltro===id?'var(--surface)':'transparent'),text:nome,onclick:function(){ logFiltro=id; renderCurrent(); }}); }
  }
  function fillLog(body){ clear(body);
    var entries=mergedLog().filter(function(l){ return logFiltro==='todos'||l.projeto===logFiltro; }).sort(function(a,b){return a.data<b.data?1:-1;});
    if(!entries.length){ body.appendChild(el('div',{class:'empty',text:'Nenhuma entrada.'})); return; }
    var groups={},order=[]; entries.forEach(function(l){ var wk=weekLabel(l.data); if(!groups[wk]){groups[wk]=[];order.push(wk);} groups[wk].push(l); });
    order.forEach(function(wk){ var g=el('div',{style:'margin-bottom:30px'}); g.appendChild(el('div',{class:'label',style:'margin-bottom:12px',text:wk}));
      groups[wk].forEach(function(l){ g.appendChild(el('div',{style:'display:flex;gap:16px;padding:11px 0;border-bottom:1px solid var(--border)'},[
        el('div',{style:'font-size:12px;color:var(--lo);flex:none;width:52px;font-variant-numeric:tabular-nums;padding-top:2px',text:fmtData(l.data)}),
        el('div',{},[ el('div',{style:'font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--mid);font-weight:600;margin-bottom:3px',text:projNome(l.projeto)}),
          el('div',{style:'font-size:14px;color:var(--hi)',text:l.texto}) ]) ])); });
      body.appendChild(g); });
  }
  function weekLabel(dateStr){ var mon=mondayOf(parseYmd(dateStr)); return 'Semana de '+mon.getDate()+' '+MES_ABREV[mon.getMonth()]; }

  // ---- utils ----
  function hhmm(iso){ var m=String(iso).match(/T(\\d\\d):(\\d\\d)/); return m?(m[1]+':'+m[2]):''; }
  function fmtData(s){ if(!s)return''; var p=String(s).split('-'); return (+p[2])+' '+MES_ABREV[(+p[1])-1]; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // =================== NAV / BOOT ===================
  var VIEWS=[
    {id:'hoje',nome:'Hoje',render:renderHoje},
    {id:'tarefas',nome:'Tarefas',render:renderTarefas},
    {id:'frentes',nome:'Frentes',render:renderFrentes},
    {id:'timeline',nome:'Timeline',render:renderTimeline},
    {id:'rotina',nome:'Rotina',render:renderRotina},
    {id:'amsterdam',nome:'Amsterdam',render:renderAmsterdam},
    {id:'log',nome:'Log',render:renderLog}
  ];
  var CURRENT='hoje';
  function viewById(id){ return VIEWS.filter(function(v){return v.id===id;})[0]; }
  function renderCurrent(){ var sec=document.getElementById('view-'+CURRENT); viewById(CURRENT).render(sec); }
  function show(id){ CURRENT=id; VIEWS.forEach(function(v){ var sec=document.getElementById('view-'+v.id); var on=v.id===id;
      sec.classList.toggle('active',on); document.getElementById('nav-'+v.id).classList.toggle('active',on); }); renderCurrent(); }

  function boot(){
    var app=el('div',{id:'app'}); var nav=el('nav',{id:'nav'});
    nav.appendChild(el('div',{class:'brand',html:'Atencao<span>alocacao pessoal</span>'}));
    VIEWS.forEach(function(v){ nav.appendChild(el('button',{id:'nav-'+v.id,class:'navitem',onclick:function(){ show(v.id); }},[ el('span',{class:'dot'}), el('span',{text:v.nome}) ])); });
    var main=el('main',{id:'main'}); VIEWS.forEach(function(v){ main.appendChild(el('section',{id:'view-'+v.id,class:'view'})); });
    app.appendChild(nav); app.appendChild(main); document.body.appendChild(app);
    toastEl=el('div',{id:'toast'}); document.body.appendChild(toastEl);
    patchBtn=el('button',{id:'patchbtn',onclick:copyPatch},[ el('span',{class:'bd'}), el('span',{text:'Copiar patch'}) ]); document.body.appendChild(patchBtn);
    refreshPatchBtn(); show('hoje');
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
console.log('[build] index.html gerado (' + (html.length/1024).toFixed(1) + ' KB) — ' +
  DATA.projetos.length + ' frentes, ' + DATA.tarefas.length + ' tarefas, ' + DATA.gastos.length + ' gastos, ' +
  DATA.rotina.habitos.length + ' habitos, ' + DATA.agenda.length + ' compromissos.');
