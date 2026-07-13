'use client'
import { useEffect, useRef } from 'react'
import Script from 'next/script'

// ─── CSS (idêntico ao Dashboard_Manutencao.html) ──────────────────────────────
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --red:#C00000;--red-light:#FCE4E4;--red-dark:#900000;
  --navy:#1F4E79;--navy2:#2E75B6;
  --bg:#F4F5F7;--surface:#FFFFFF;--border:#E2E2E2;
  --text:#1A1A1A;--sub:#666666;
  --green:#375623;--green-light:#E2EFDA;
  --orange:#BF8F00;--orange-light:#FFF2CC;
  --sw:264px;
}
html,body{height:100%;overflow:hidden}
body{font-family:Arial,sans-serif;background:var(--bg)!important;color:var(--text);display:flex;height:100vh;overflow:hidden;font-size:13px;opacity:1!important;animation:none!important}
.sb{width:var(--sw);background:var(--navy);display:flex;flex-direction:column;height:100vh;overflow-y:auto;flex-shrink:0}
.sb-logo{padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,.12)}
.sb-logo h2{color:#fff;font-size:14px;font-weight:700;letter-spacing:.3px}
.sb-logo p{color:rgba(255,255,255,.45);font-size:11px;margin-top:3px}
.sb-section{padding:14px 0 6px}
.sb-label{color:rgba(255,255,255,.35);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:0 16px 8px}
.sb-item{display:flex;align-items:center;gap:10px;padding:10px 16px;color:rgba(255,255,255,.7);cursor:pointer;font-size:12.5px;border-left:3px solid transparent;transition:all .15s;user-select:none}
.sb-item:hover{background:rgba(255,255,255,.08);color:#fff}
.sb-item.active{background:rgba(192,0,0,.22);color:#fff;border-left-color:var(--red)}
.sb-item .ico{font-size:15px;flex-shrink:0}
.sb-foot{margin-top:auto;padding:14px 16px;border-top:1px solid rgba(255,255,255,.1)}
.sb-foot span{color:rgba(255,255,255,.35);font-size:10px}
.sb-foot p{color:rgba(255,255,255,.6);font-size:11px;margin-top:2px}
.main{flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden;min-width:0}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 22px;height:54px;display:flex;align-items:center;gap:12px;flex-shrink:0}
.topbar-title{font-size:15px;font-weight:700}
.topbar-sub{font-size:11px;color:var(--sub);margin-top:1px}
.content{flex:1;overflow-y:auto;padding:18px 22px}
.btn{padding:7px 14px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:5px;transition:opacity .15s;white-space:nowrap}
.btn:hover{opacity:.85}
.btn-primary{background:var(--red);color:#fff}
.btn-secondary{background:#fff;color:var(--text);border:1px solid var(--border)}
.btn-sm{padding:5px 10px;font-size:11px}
.btn-icon{padding:5px 7px}
.tabs{display:flex;gap:2px;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:3px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.tab{padding:6px 13px;border-radius:5px;font-size:11.5px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--sub);transition:all .15s;white-space:nowrap}
.tab:hover{color:var(--text);background:var(--bg)}
.tab.active{background:var(--red);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;border-top:3px solid var(--border)}
.kpi.red{border-top-color:var(--red)}.kpi.navy{border-top-color:var(--navy)}.kpi.green{border-top-color:var(--green)}.kpi.orange{border-top-color:var(--orange)}
.kpi-label{font-size:10px;color:var(--sub);font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.kpi-value{font-size:26px;font-weight:700;margin:4px 0 0}
.kpi-sub{font-size:10px;color:var(--sub);margin-top:1px}
.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
.chart-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px}
.chart-card h4{font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)}
.chart-wrap{position:relative;height:190px}
.table-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.tbar{padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.tbar input{padding:6px 10px;border:1px solid var(--border);border-radius:5px;font-size:12px;width:200px}
.tbar input:focus{outline:none;border-color:var(--red)}
.tcount{font-size:11px;color:var(--sub);margin-left:auto}
.twrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:var(--bg);padding:8px 11px;text-align:left;font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:.3px;color:var(--sub);white-space:nowrap;border-bottom:1px solid var(--border);position:sticky;top:0}
td{padding:8px 11px;border-bottom:1px solid #F0F0F0;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}
tr:hover td{background:#FAFAFA}
.empty{text-align:center;padding:36px;color:var(--sub)}
.badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase}
.b-red{background:var(--red-light);color:var(--red)}
.b-green{background:var(--green-light);color:var(--green)}
.b-orange{background:var(--orange-light);color:var(--orange)}
.b-blue{background:#DEEAF1;color:var(--navy)}
.b-gray{background:#F0F0F0;color:#666}
.b-purple{background:#EAD1F5;color:#7030A0}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;align-items:center;justify-content:center}
.overlay.open{display:flex}
.modal{background:#fff;border-radius:10px;width:680px;max-width:96vw;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.2)}
.mhdr{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.mhdr h3{font-size:14px;font-weight:700}
.mclose{background:none;border:none;cursor:pointer;font-size:20px;color:var(--sub);line-height:1;padding:2px 5px;border-radius:4px}
.mclose:hover{background:var(--bg)}
.mbody{padding:18px;overflow-y:auto;flex:1}
.mfooter{padding:12px 18px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.frow{display:flex;flex-direction:column;gap:3px}
.frow.full{grid-column:span 2}
.frow label{font-size:10px;font-weight:700;color:var(--sub);text-transform:uppercase;letter-spacing:.4px}
.frow input,.frow select,.frow textarea{padding:7px 9px;border:1px solid var(--border);border-radius:5px;font-size:12.5px;font-family:Arial,sans-serif;width:100%}
.frow input:focus,.frow select:focus,.frow textarea:focus{outline:none;border-color:var(--red)}
.frow textarea{resize:vertical;min-height:56px}
.reg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px}
.reg-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.reg-hdr{padding:8px 12px;color:#fff;display:flex;justify-content:space-between;align-items:center}
.reg-hdr h4{font-size:12px;font-weight:700}
.reg-body{padding:8px 12px;display:flex;flex-wrap:wrap;gap:4px}
.reg-unit{font-size:10px;color:var(--sub);background:var(--bg);border-radius:3px;padding:3px 7px}
.welcome{display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:14px;color:var(--sub)}
.welcome .w-icon{font-size:52px}
.welcome h2{font-size:18px;font-weight:700;color:var(--text)}
.acts{display:flex;gap:4px}
`

// ─── HTML shell da aplicação ──────────────────────────────────────────────────
const SHELL = `
<aside class="sb">
  <div class="sb-logo">
    <h2>🏭 Plataforma Gabriela</h2>
    <p>Sistema de Controle de Equipamentos</p>
  </div>
  <div class="sb-section">
    <div class="sb-label">Módulos</div>
    <div class="sb-item" id="nav-equip" onclick="setMod('equip')">
      <span class="ico">⚖️</span>Manutenção de Equipamentos
    </div>
    <div class="sb-item" id="nav-liq" onclick="setMod('liq')">
      <span class="ico">🔧</span>Liquidificadores
    </div>
    <div class="sb-item" id="nav-loc" onclick="setMod('loc')">
      <span class="ico">📍</span>Localização de Equipamentos
    </div>
  </div>
  <div class="sb-foot">
    <span>Última atualização</span>
    <p id="last-upd">—</p>
  </div>
</aside>
<main class="main">
  <div class="topbar">
    <div>
      <div class="topbar-title" id="tb-title">Plataforma de Controle</div>
      <div class="topbar-sub" id="tb-sub">Selecione um módulo no menu lateral</div>
    </div>
  </div>
  <div class="content" id="content">
    <div class="welcome">
      <div class="w-icon">📊</div>
      <h2>Bem-vindo à Plataforma de Controle</h2>
      <p>Selecione um módulo no menu lateral para começar</p>
    </div>
  </div>
</main>
<div class="overlay" id="overlay">
  <div class="modal">
    <div class="mhdr">
      <h3 id="m-title">Novo Registro</h3>
      <button class="mclose" onclick="closeModal()">×</button>
    </div>
    <div class="mbody" id="m-body"></div>
    <div class="mfooter">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveRec()">💾 Salvar</button>
    </div>
  </div>
</div>
`

// ─── Toda a lógica JS do dashboard ───────────────────────────────────────────
function initApp() {
  if (typeof window === 'undefined' || !window.Chart) return

  // ─── Constants ─────────────────────────────────────────────────────────────
  const EQUIP_BALANCA=['Balança 30 kg','Balança 300 kg','Balança 1.000 kg','Balança 1.500 kg','Balança 500 kg','Termômetro Ímpar','Termômetro Esperto','Termômetro Digital']
  const TIPOS_SERV=['Calibração','Manutenção','Calibração e Manutenção']
  const STATUS_EQ=['Autorizado','Não Autorizado','Sem Conserto']
  const DESTINO_FINAL=['Sucata','Descarte','Aguardando Decisão','Substituído']
  const EQUIP_LIQ=['Liquidificador 10L','Liquidificador 2L','Liquidificador 25L','Processador']
  const VOLTAGENS=['110V','220V','Bivolt']
  const FORNS_LIQ=['Tec Ramos','StarTec']
  const STATUS_LIQ=['Autorizado','Manutenção Inviável','Não Conforme']
  const EQUIP_LOC=['Liquidificador','Processador','Caldeira']
  const LOC_STATUS=['Na Unidade','Em Manutenção (CD)','No Fornecedor','Concluído']
  const REGIOES={
    iso:          {label:'ISO',           cor:'#1F4E79', unidades:['Shuri','CDPCI','CDPS']},
    grandeVitoria:{label:'Grande Vitória',cor:'#375623', unidades:['Máxima','PSMAI','Promater','Santa Casa']},
    cachoeira:    {label:'Cachoeira',     cor:'#7B3F00', unidades:['IASIS Sul','CPFCI','PRCI','CDPM']},
    colatina:     {label:'Colatina',      cor:'#4B0082', unidades:['PSMECOL','CPFCOL']},
    linhares:     {label:'Linhares',      cor:'#7F6000', unidades:['PRL','CDRL','IASIS Norte']},
    saoMateus:    {label:'São Mateus',    cor:'#C00000', unidades:['EAS','PSSM']}
  }
  const TODAS_UNID=Object.values(REGIOES).flatMap(r=>r.unidades)

  const COLS_EQ_CAD=[
    {k:'nSerie',l:'Nº Série / Patrimônio'},{k:'equipamento',l:'Tipo de Equipamento'},
    {k:'nPatrimonio',l:'Nº Patrimônio'},{k:'modelo',l:'Modelo / Marca'},
    {k:'dataAquisicao',l:'Data de Aquisição',d:1},{k:'obs',l:'Observações'}
  ]
  const COLS_EQ_MAN=[
    {k:'equipamento',l:'Equipamento'},{k:'nSerie',l:'Nº Série/Pat.'},
    {k:'dataEnvio',l:'Data Envio',d:1},{k:'nOrcamento',l:'Nº Orçamento'},
    {k:'valor',l:'Valor (R$)',m:1},{k:'tipoServico',l:'Tipo Serviço'},
    {k:'tipoManutencao',l:'Tipo Manut.'},{k:'status',l:'Status',b:1},
    {k:'dataSaida',l:'Data Saída',d:1},{k:'nNF',l:'Nº NF'},{k:'obs',l:'Obs.'}
  ]
  const COLS_EQ_CON=[
    {k:'equipamento',l:'Equipamento'},{k:'nSerie',l:'Nº Série/Pat.'},
    {k:'dataEnvio',l:'Data Envio',d:1},{k:'nOrcamento',l:'Nº Orçamento'},
    {k:'valor',l:'Valor (R$)',m:1},{k:'tipoServico',l:'Tipo Serviço'},
    {k:'tipoManutencao',l:'Tipo Manut.'},{k:'nNF',l:'Nº NF'},
    {k:'dataSaida',l:'Data Saída',d:1},{k:'dataConclusao',l:'Conclusão',d:1},
    {k:'unidadeDestino',l:'Unidade Destino'},{k:'obs',l:'Obs.'}
  ]
  const COLS_EQ_NC=[
    {k:'equipamento',l:'Equipamento'},{k:'nSerie',l:'Nº Série/Pat.'},
    {k:'dataEnvio',l:'Data Envio',d:1},{k:'nOrcamento',l:'Nº Orçamento'},
    {k:'valor',l:'Valor (R$)',m:1},{k:'tipoServico',l:'Tipo Serviço'},
    {k:'motivo',l:'Motivo'},{k:'nNF',l:'Nº NF'},
    {k:'dataRetorno',l:'Data Retorno',d:1},{k:'destinoFinal',l:'Destino Final',b:1},{k:'obs',l:'Obs.'}
  ]
  const COLS_EQ_CP=[
    {k:'equipamento',l:'Equipamento'},{k:'nSerie',l:'Nº Série/Pat.'},
    {k:'fornecedor',l:'Fornecedor'},{k:'dataPedido',l:'Data Pedido',d:1},
    {k:'nPedido',l:'Nº Pedido'},{k:'valor',l:'Valor (R$)',m:1},
    {k:'statusPedido',l:'Status',b:1},{k:'dataRecebimento',l:'Recebimento',d:1},
    {k:'nfCompra',l:'NF Compra'},{k:'unidadeDestino',l:'Unidade Destino'},{k:'obs',l:'Obs.'}
  ]
  const COLS_LIQ_MAN=[
    {k:'tipo',l:'Tipo'},{k:'nSerie',l:'Nº Série/Pat.'},
    {k:'voltagem',l:'Voltagem'},{k:'modelo',l:'Modelo'},
    {k:'fornecedor',l:'Fornecedor'},{k:'dataEnvio',l:'Data Envio',d:1},
    {k:'nOS',l:'Nº OS'},{k:'valor',l:'Valor (R$)',m:1},
    {k:'tipoManutencao',l:'Tipo Manut.'},{k:'status',l:'Status',b:1},
    {k:'dataRetirada',l:'Data Retirada',d:1},{k:'unidadeDestino',l:'Unidade Destino'},
    {k:'nNF',l:'Nº NF'},{k:'obs',l:'Obs.'}
  ]
  const COLS_LIQ_PR=[
    {k:'tipo',l:'Tipo'},{k:'nSerie',l:'Nº Série/Pat.'},
    {k:'voltagem',l:'Voltagem'},{k:'modelo',l:'Modelo'},
    {k:'fornecedor',l:'Fornecedor'},{k:'nOS',l:'Nº OS'},
    {k:'valor',l:'Valor (R$)',m:1},{k:'tipoManutencao',l:'Tipo Manut.'},
    {k:'dataRetirada',l:'Data Retirada',d:1},{k:'unidadeDestino',l:'Unidade Destino'},
    {k:'nNF',l:'Nº NF'},{k:'dataConclusao',l:'Conclusão',d:1},{k:'obs',l:'Obs.'}
  ]
  const COLS_LOC_REG=[
    {k:'unidade',l:'Unidade'},{k:'tipo',l:'Tipo'},
    {k:'modelo',l:'Modelo'},{k:'nSerie',l:'Nº de Série'},
    {k:'nPatrimonio',l:'Nº Patrimônio'},{k:'capacidade',l:'Capacidade/Litragem'},
    {k:'voltagem',l:'Voltagem'},{k:'dataEnvio',l:'Data Envio',d:1},
    {k:'dataAtualizacao',l:'Atualização',d:1},{k:'obs',l:'Obs.'}
  ]
  const COLS_LOC_MAN=[
    {k:'unidadeOrigem',l:'Unidade Origem'},{k:'tipo',l:'Tipo'},
    {k:'modelo',l:'Modelo'},{k:'nSerie',l:'Nº de Série'},
    {k:'nPatrimonio',l:'Nº Patrimônio'},{k:'capacidade',l:'Capacidade/Litragem'},
    {k:'voltagem',l:'Voltagem'},{k:'dataEnvio',l:'Data Envio',d:1},
    {k:'localizacaoAtual',l:'Localização Atual',b:1},{k:'obs',l:'Obs.'}
  ]

  // ─── State ─────────────────────────────────────────────────────────────────
  let S={
    equip:{equipamentos:[],manutencao:[],concluidos:[],naoConformes:[],compras:[]},
    liq:{emManutencao:[],prontos:[]},
    loc:{iso:[],grandeVitoria:[],cachoeira:[],colatina:[],linhares:[],saoMateus:[],emManutencao:[]}
  }
  let curMod=null,curTab=null,editIdx=null,mCtx=null

  // ─── Persistence ───────────────────────────────────────────────────────────
  function loadS(){
    const d=localStorage.getItem('gab-v2')
    if(d)try{S=JSON.parse(d)}catch(e){}
    if(!S.equip.equipamentos)S.equip.equipamentos=[]
  }
  function saveS(){
    localStorage.setItem('gab-v2',JSON.stringify(S))
    const el=document.getElementById('last-upd')
    if(el)el.textContent=new Date().toLocaleString('pt-BR')
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function fmt(v){return v||'—'}
  function fmtMoney(v){if(!v)return'—';const n=parseFloat(v);return isNaN(n)?v:'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2})}
  function fmtDate(v){if(!v)return'—';try{const[y,m,d]=v.split('-');return d+'/'+m+'/'+y}catch(e){return v}}
  function badge(s){
    const m={'Autorizado':'b-green','Não Autorizado':'b-red','Sem Conserto':'b-gray',
      'Manutenção Inviável':'b-orange','Não Conforme':'b-purple',
      'Na Unidade':'b-blue','Em Manutenção (CD)':'b-orange','No Fornecedor':'b-red','Concluído':'b-green',
      'Sucata':'b-gray','Descarte':'b-gray','Aguardando Decisão':'b-orange','Substituído':'b-blue',
      'Aguardando':'b-orange','Em Trânsito':'b-blue','Recebido':'b-green','Cancelado':'b-gray'}
    return s?`<span class="badge ${m[s]||'b-gray'}">${s}</span>`:'—'
  }
  function getD(k){const p=k.split('.');let o=S;for(const x of p)o=o[x];return o||[]}
  function setD(k,v){const p=k.split('.');let o=S;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=v}

  // ─── Routing ───────────────────────────────────────────────────────────────
  function setMod(m){
    curMod=m; window._curMod=m
    document.querySelectorAll('.sb-item').forEach(el=>el.classList.remove('active'))
    const nav=document.getElementById('nav-'+m)
    if(nav)nav.classList.add('active')
    if(m==='equip')renderEquip('overview')
    if(m==='liq')renderLiq('overview')
    if(m==='loc')renderLoc('overview')
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  function delRec(sk,idx){
    if(!confirm('Excluir este registro?'))return
    const d=getD(sk);d.splice(idx,1);setD(sk,d);saveS();setMod(curMod)
  }
  function exportCSV(data,fn){
    if(!data.length)return alert('Sem dados para exportar.')
    const k=Object.keys(data[0])
    const csv=[k.join(';'),...data.map(r=>k.map(x=>'"'+(r[x]||'')+'"').join(';'))].join('\n')
    const a=document.createElement('a')
    a.href='data:text/csv;charset=utf-8,﻿'+encodeURIComponent(csv)
    a.download=fn;a.click()
  }

  // ─── Table ─────────────────────────────────────────────────────────────────
  function renderTbl(cols,data,tabKey,sk,sid){
    const q=(document.getElementById(sid)?.value||'').toLowerCase()
    const rows=q?data.filter(r=>Object.values(r).some(v=>String(v||'').toLowerCase().includes(q))):data
    let html=`<table><thead><tr>${cols.map(c=>`<th>${c.l}</th>`).join('')}<th>Ações</th></tr></thead><tbody>`
    if(!rows.length){html+=`<tr><td colspan="${cols.length+1}" class="empty">Nenhum registro encontrado.</td></tr>`}
    else rows.forEach((row,i)=>{
      const ri=q?data.indexOf(row):i
      html+=`<tr>${cols.map(c=>`<td title="${row[c.k]||''}">${c.b?badge(row[c.k]):c.m?fmtMoney(row[c.k]):c.d?fmtDate(row[c.k]):fmt(row[c.k])}</td>`).join('')}
      <td><div class="acts">
        <button class="btn btn-secondary btn-sm btn-icon" onclick='openM("${tabKey}","${sk}",${ri})' title="Editar">✏️</button>
        <button class="btn btn-sm btn-icon" style="background:#FEE;color:#C00;border:1px solid #FCC" onclick="delRec('${sk}',${ri})" title="Excluir">🗑️</button>
      </div></td></tr>`
    })
    return html+'</tbody></table>'
  }

  function tblCard(cols,data,tabKey,sk,sid,label){
    return `<div class="table-card">
      <div class="tbar">
        <input type="text" id="${sid}" placeholder="Buscar..." oninput="setMod(window._curMod)">
        <div class="tcount">${data.length} registro(s)</div>
        <button class="btn btn-secondary btn-sm" onclick="exportCSV(getD('${sk}'),'${label}.csv')">📥 CSV</button>
        <button class="btn btn-primary btn-sm" onclick="openM('${tabKey}','${sk}',null)">+ Adicionar</button>
      </div>
      <div class="twrap">${renderTbl(cols,data,tabKey,sk,sid)}</div>
    </div>`
  }

  // ─── MODULE 1 — EQUIPAMENTOS ───────────────────────────────────────────────
  function renderEquip(tab){
    curTab=tab
    document.getElementById('tb-title').textContent='Manutenção de Equipamentos'
    document.getElementById('tb-sub').textContent='Balanças e Termômetros'
    const T=`<div class="tabs">
      <button class="tab ${tab==='overview'?'active':''}" onclick="renderEquip('overview')">📊 Visão Geral</button>
      <button class="tab ${tab==='manutencao'?'active':''}" onclick="renderEquip('manutencao')">🔧 Em Manutenção</button>
      <button class="tab ${tab==='concluidos'?'active':''}" onclick="renderEquip('concluidos')">✅ Concluídos</button>
      <button class="tab ${tab==='naoConformes'?'active':''}" onclick="renderEquip('naoConformes')">⚠️ Não Conformes</button>
      <button class="tab ${tab==='compras'?'active':''}" onclick="renderEquip('compras')">🛒 Compras</button>
      <button class="tab ${tab==='cadastro'?'active':''}" onclick="renderEquip('cadastro')" style="background:var(--navy);color:#fff;font-weight:700;opacity:${tab==='cadastro'?'1':'0.85'}">📋 Cadastro de Equipamentos</button>
      <button class="btn btn-primary btn-sm" style="margin-left:auto;border-radius:5px" onclick="openAddCtx('equip','${tab}')">+ Adicionar</button>
    </div>`
    let body=''
    if(tab==='overview')body=equipOverview()
    else if(tab==='manutencao')body=tblCard(COLS_EQ_MAN,S.equip.manutencao,'equip-manutencao','equip.manutencao','s-em','equip-manutencao')
    else if(tab==='concluidos')body=tblCard(COLS_EQ_CON,S.equip.concluidos,'equip-concluidos','equip.concluidos','s-ec','equip-concluidos')
    else if(tab==='naoConformes')body=tblCard(COLS_EQ_NC,S.equip.naoConformes,'equip-naoConformes','equip.naoConformes','s-enc','equip-naoConformes')
    else if(tab==='compras')body=tblCard(COLS_EQ_CP,S.equip.compras,'equip-compras','equip.compras','s-ecp','equip-compras')
    else if(tab==='cadastro')body=tblCard(COLS_EQ_CAD,S.equip.equipamentos,'equip-cadastro','equip.equipamentos','s-ecad','equip-cadastro')
    document.getElementById('content').innerHTML=T+body
    if(tab==='overview')equipCharts()
  }

  function equipOverview(){
    const m=S.equip.manutencao.length,c=S.equip.concluidos.length,nc=S.equip.naoConformes.length,cp=S.equip.compras.length
    const tv=[...S.equip.manutencao,...S.equip.concluidos].reduce((s,r)=>s+(parseFloat(r.valor)||0),0)
    return `
    <div class="kpi-grid">
      <div class="kpi red"><div class="kpi-label">Em Manutenção</div><div class="kpi-value">${m}</div><div class="kpi-sub">aguardando</div></div>
      <div class="kpi green"><div class="kpi-label">Concluídos</div><div class="kpi-value">${c}</div><div class="kpi-sub">finalizados</div></div>
      <div class="kpi orange"><div class="kpi-label">Não Conformes</div><div class="kpi-value">${nc}</div><div class="kpi-sub">reprovados</div></div>
      <div class="kpi navy"><div class="kpi-label">Compras</div><div class="kpi-value">${cp}</div><div class="kpi-sub">pedidos</div></div>
      <div class="kpi navy"><div class="kpi-label">Valor Total</div><div class="kpi-value" style="font-size:17px">${tv.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card"><h4>Status dos Equipamentos em Manutenção</h4><div class="chart-wrap"><canvas id="ch-eq-st"></canvas></div></div>
      <div class="chart-card"><h4>Manutenções por Tipo de Equipamento</h4><div class="chart-wrap"><canvas id="ch-eq-tp"></canvas></div></div>
    </div>`
  }

  function equipCharts(){
    setTimeout(()=>{
      const c1=document.getElementById('ch-eq-st')
      if(c1&&!c1._ch){
        const sc={};STATUS_EQ.forEach(s=>sc[s]=S.equip.manutencao.filter(r=>r.status===s).length)
        c1._ch=new window.Chart(c1,{type:'doughnut',data:{labels:Object.keys(sc),datasets:[{data:Object.values(sc),backgroundColor:['#375623','#C00000','#888'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:10}}}},cutout:'60%',maintainAspectRatio:false}})
      }
      const c2=document.getElementById('ch-eq-tp')
      if(c2&&!c2._ch){
        const ec={};EQUIP_BALANCA.forEach(e=>ec[e]=S.equip.manutencao.filter(r=>r.equipamento===e).length)
        c2._ch=new window.Chart(c2,{type:'bar',data:{labels:Object.keys(ec),datasets:[{label:'Manutenções',data:Object.values(ec),backgroundColor:'#1F4E79',borderRadius:3}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:'#f0f0f0'},ticks:{font:{size:9},precision:0}},y:{ticks:{font:{size:9}}}},maintainAspectRatio:false}})
      }
    },50)
  }

  // ─── MODULE 2 — LIQUIDIFICADORES ───────────────────────────────────────────
  function renderLiq(tab){
    curTab=tab
    document.getElementById('tb-title').textContent='Manutenção de Liquidificadores'
    document.getElementById('tb-sub').textContent='Liquidificadores e Processadores — Tec Ramos | StarTec'
    const T=`<div class="tabs">
      <button class="tab ${tab==='overview'?'active':''}" onclick="renderLiq('overview')">📊 Visão Geral</button>
      <button class="tab ${tab==='emManutencao'?'active':''}" onclick="renderLiq('emManutencao')">🔧 Em Manutenção</button>
      <button class="tab ${tab==='prontos'?'active':''}" onclick="renderLiq('prontos')">✅ Equipamentos Prontos</button>
      <button class="btn btn-primary btn-sm" style="margin-left:auto;border-radius:5px" onclick="openAddCtx('liq','${tab}')">+ Adicionar</button>
    </div>`
    let body=''
    if(tab==='overview')body=liqOverview()
    else if(tab==='emManutencao')body=tblCard(COLS_LIQ_MAN,S.liq.emManutencao,'liq-emManutencao','liq.emManutencao','s-lm','liq-emManutencao')
    else if(tab==='prontos')body=tblCard(COLS_LIQ_PR,S.liq.prontos,'liq-prontos','liq.prontos','s-lp','liq-prontos')
    document.getElementById('content').innerHTML=T+body
    if(tab==='overview')liqCharts()
  }

  function liqOverview(){
    const m=S.liq.emManutencao.length,p=S.liq.prontos.length
    const tr=S.liq.emManutencao.filter(r=>r.fornecedor==='Tec Ramos').length
    const st=S.liq.emManutencao.filter(r=>r.fornecedor==='StarTec').length
    const tv=[...S.liq.emManutencao,...S.liq.prontos].reduce((s,r)=>s+(parseFloat(r.valor)||0),0)
    return `
    <div class="kpi-grid">
      <div class="kpi red"><div class="kpi-label">Em Manutenção</div><div class="kpi-value">${m}</div><div class="kpi-sub">em andamento</div></div>
      <div class="kpi green"><div class="kpi-label">Prontos</div><div class="kpi-value">${p}</div><div class="kpi-sub">concluídos</div></div>
      <div class="kpi navy"><div class="kpi-label">Tec Ramos</div><div class="kpi-value">${tr}</div><div class="kpi-sub">em manutenção</div></div>
      <div class="kpi orange"><div class="kpi-label">StarTec</div><div class="kpi-value">${st}</div><div class="kpi-sub">em manutenção</div></div>
      <div class="kpi navy"><div class="kpi-label">Valor Total</div><div class="kpi-value" style="font-size:17px">${tv.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card"><h4>Status dos Equipamentos</h4><div class="chart-wrap"><canvas id="ch-liq-st"></canvas></div></div>
      <div class="chart-card"><h4>Em Manutenção vs Prontos por Fornecedor</h4><div class="chart-wrap"><canvas id="ch-liq-fn"></canvas></div></div>
    </div>`
  }

  function liqCharts(){
    setTimeout(()=>{
      const c1=document.getElementById('ch-liq-st')
      if(c1&&!c1._ch){
        const sc={};STATUS_LIQ.forEach(s=>sc[s]=S.liq.emManutencao.filter(r=>r.status===s).length)
        c1._ch=new window.Chart(c1,{type:'doughnut',data:{labels:Object.keys(sc),datasets:[{data:Object.values(sc),backgroundColor:['#375623','#BF8F00','#7030A0'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:10}}}},cutout:'60%',maintainAspectRatio:false}})
      }
      const c2=document.getElementById('ch-liq-fn')
      if(c2&&!c2._ch){
        const tr_m=S.liq.emManutencao.filter(r=>r.fornecedor==='Tec Ramos').length
        const st_m=S.liq.emManutencao.filter(r=>r.fornecedor==='StarTec').length
        const tr_p=S.liq.prontos.filter(r=>r.fornecedor==='Tec Ramos').length
        const st_p=S.liq.prontos.filter(r=>r.fornecedor==='StarTec').length
        c2._ch=new window.Chart(c2,{type:'bar',data:{labels:['Tec Ramos','StarTec'],datasets:[{label:'Em Manutenção',data:[tr_m,st_m],backgroundColor:'#C00000',borderRadius:3},{label:'Prontos',data:[tr_p,st_p],backgroundColor:'#375623',borderRadius:3}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:10}}}},scales:{x:{grid:{display:false}},y:{grid:{color:'#f0f0f0'},ticks:{precision:0}}},maintainAspectRatio:false}})
      }
    },50)
  }

  // ─── MODULE 3 — LOCALIZAÇÃO ────────────────────────────────────────────────
  function renderLoc(tab){
    curTab=tab
    document.getElementById('tb-title').textContent='Localização de Equipamentos'
    document.getElementById('tb-sub').textContent='Controle por Região e Unidade'
    const T=`<div class="tabs">
      <button class="tab ${tab==='overview'?'active':''}" onclick="renderLoc('overview')">📊 Resumo Geral</button>
      ${Object.entries(REGIOES).map(([k,r])=>`<button class="tab ${tab===k?'active':''}" onclick="renderLoc('${k}')">${r.label}</button>`).join('')}
      <button class="tab ${tab==='manut'?'active':''}" onclick="renderLoc('manut')">🔧 Em Manutenção</button>
      <button class="btn btn-primary btn-sm" style="margin-left:auto;border-radius:5px" onclick="openAddCtx('loc','${tab}')">+ Adicionar</button>
    </div>`
    let body=''
    if(tab==='overview')body=locOverview()
    else if(tab==='manut')body=tblCard(COLS_LOC_MAN,S.loc.emManutencao,'loc-manut','loc.emManutencao','s-lmn','loc-manut')
    else if(REGIOES[tab])body=tblCard(COLS_LOC_REG,S.loc[tab],'loc-'+tab,'loc.'+tab,'s-l'+tab,'loc-'+tab)
    document.getElementById('content').innerHTML=T+body
    if(tab==='overview')locCharts()
  }

  function locOverview(){
    let tl=0,tp=0,tc=0,rows=''
    Object.entries(REGIOES).forEach(([k,reg])=>{
      const d=S.loc[k]||[]
      reg.unidades.forEach(u=>{
        const ud=d.filter(r=>r.unidade===u)
        const l=ud.filter(r=>r.tipo==='Liquidificador').length
        const p=ud.filter(r=>r.tipo==='Processador').length
        const c=ud.filter(r=>r.tipo==='Caldeira').length
        tl+=l;tp+=p;tc+=c
        rows+=`<tr>
          <td><span class="badge" style="background:${reg.cor}22;color:${reg.cor};border:1px solid ${reg.cor}44">${reg.label}</span></td>
          <td>${u}</td>
          <td style="text-align:center">${l||'—'}</td>
          <td style="text-align:center">${p||'—'}</td>
          <td style="text-align:center">${c||'—'}</td>
          <td style="text-align:center;font-weight:700">${(l+p+c)||'—'}</td>
        </tr>`
      })
    })
    const em=S.loc.emManutencao?.length||0,tg=tl+tp+tc
    return `
    <div class="kpi-grid">
      <div class="kpi navy"><div class="kpi-label">Total Equipamentos</div><div class="kpi-value">${tg}</div><div class="kpi-sub">em todas as unidades</div></div>
      <div class="kpi navy"><div class="kpi-label">Liquidificadores</div><div class="kpi-value">${tl}</div></div>
      <div class="kpi green"><div class="kpi-label">Processadores</div><div class="kpi-value">${tp}</div></div>
      <div class="kpi orange"><div class="kpi-label">Caldeiras</div><div class="kpi-value">${tc}</div></div>
      <div class="kpi red"><div class="kpi-label">Em Manutenção</div><div class="kpi-value">${em}</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-card"><h4>Distribuição por Tipo</h4><div class="chart-wrap"><canvas id="ch-loc-tp"></canvas></div></div>
      <div class="chart-card"><h4>Regiões e Unidades</h4>
        <div class="reg-grid">
          ${Object.entries(REGIOES).map(([k,r])=>`
            <div class="reg-card">
              <div class="reg-hdr" style="background:${r.cor}"><h4>${r.label}</h4><span style="font-size:10px;opacity:.8">${r.unidades.length} unidades</span></div>
              <div class="reg-body">${r.unidades.map(u=>`<span class="reg-unit">${u}</span>`).join('')}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="table-card">
      <div class="tbar"><span style="font-weight:700;font-size:12px">Resumo por Unidade</span></div>
      <div class="twrap"><table>
        <thead><tr><th>Região</th><th>Unidade</th><th style="text-align:center">Liquidificadores</th><th style="text-align:center">Processadores</th><th style="text-align:center">Caldeiras</th><th style="text-align:center">Total</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="background:var(--navy);color:#fff">
          <td colspan="2" style="padding:8px 11px;font-weight:700">TOTAL GERAL</td>
          <td style="text-align:center;padding:8px 11px;font-weight:700">${tl}</td>
          <td style="text-align:center;padding:8px 11px;font-weight:700">${tp}</td>
          <td style="text-align:center;padding:8px 11px;font-weight:700">${tc}</td>
          <td style="text-align:center;padding:8px 11px;font-weight:700">${tg}</td>
        </tr></tfoot>
      </table></div>
    </div>`
  }

  function locCharts(){
    setTimeout(()=>{
      const c=document.getElementById('ch-loc-tp')
      if(c&&!c._ch){
        let tl=0,tp=0,tc=0
        Object.keys(REGIOES).forEach(k=>{const d=S.loc[k]||[];tl+=d.filter(r=>r.tipo==='Liquidificador').length;tp+=d.filter(r=>r.tipo==='Processador').length;tc+=d.filter(r=>r.tipo==='Caldeira').length})
        c._ch=new window.Chart(c,{type:'bar',data:{labels:['Liquidificadores','Processadores','Caldeiras'],datasets:[{data:[tl,tp,tc],backgroundColor:['#2E75B6','#70AD47','#ED7D31'],borderRadius:3}]},options:{plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{color:'#f0f0f0'},ticks:{precision:0}}},maintainAspectRatio:false}})
      }
    },50)
  }

  // ─── Add context ───────────────────────────────────────────────────────────
  function openAddCtx(mod,tab){
    const map={
      'equip.overview':{tk:'equip-manutencao',sk:'equip.manutencao'},
      'equip.manutencao':{tk:'equip-manutencao',sk:'equip.manutencao'},
      'equip.concluidos':{tk:'equip-concluidos',sk:'equip.concluidos'},
      'equip.naoConformes':{tk:'equip-naoConformes',sk:'equip.naoConformes'},
      'equip.compras':{tk:'equip-compras',sk:'equip.compras'},
      'equip.cadastro':{tk:'equip-cadastro',sk:'equip.equipamentos'},
      'liq.overview':{tk:'liq-emManutencao',sk:'liq.emManutencao'},
      'liq.emManutencao':{tk:'liq-emManutencao',sk:'liq.emManutencao'},
      'liq.prontos':{tk:'liq-prontos',sk:'liq.prontos'},
      'loc.overview':{tk:'loc-iso',sk:'loc.iso'},
      'loc.manut':{tk:'loc-manut',sk:'loc.emManutencao'},
    }
    const ctx=map[mod+'.'+tab]
    if(ctx){openM(ctx.tk,ctx.sk,null);return}
    if(REGIOES[tab])openM('loc-'+tab,'loc.'+tab,null)
  }

  // ─── Lookup ────────────────────────────────────────────────────────────────
  function lookupEquip(){
    const inp=document.getElementById('lookup-nserie')
    const msg=document.getElementById('lookup-msg')
    if(!inp||!msg)return
    const q=(inp.value||'').trim().toLowerCase()
    if(!q){msg.innerHTML='<span style="color:var(--orange)">⚠️ Digite o Nº de Série para buscar.</span>';return}
    const found=S.equip.equipamentos.find(e=>(e.nSerie||'').toLowerCase()===q)
    if(!found){
      msg.innerHTML='<span style="color:var(--red)">❌ Não encontrado. <a href="#" onclick="event.preventDefault();openM(\'equip-cadastro\',\'equip.equipamentos\',null)" style="color:var(--navy);font-weight:700">Cadastrar agora →</a></span>'
      return
    }
    const sel=document.querySelector('select[name="equipamento"]')
    if(sel&&found.equipamento)sel.value=found.equipamento
    const info=[found.equipamento,found.modelo,found.nPatrimonio?'Pat.: '+found.nPatrimonio:''].filter(Boolean).join(' — ')
    msg.innerHTML=`<span style="color:var(--green);font-weight:600">✅ ${info}</span>`
  }

  // ─── Modal ─────────────────────────────────────────────────────────────────
  function openM(tk,sk,idx){
    editIdx=idx; mCtx={tk,sk}
    const d=getD(sk),rec=idx!==null?d[idx]:{}
    document.getElementById('m-title').textContent=idx!==null?'Editar Registro':'Novo Registro'
    document.getElementById('m-body').innerHTML=buildForm(tk,rec)
    document.getElementById('overlay').classList.add('open')
  }
  function closeModal(){
    document.getElementById('overlay').classList.remove('open')
    editIdx=null; mCtx=null
  }
  function saveRec(){
    const inputs=document.getElementById('m-body').querySelectorAll('input,select,textarea')
    const rec={};inputs.forEach(el=>{if(el.name)rec[el.name]=el.value})
    const d=getD(mCtx.sk)
    if(editIdx!==null)d[editIdx]=rec;else d.push(rec)
    setD(mCtx.sk,d);saveS();closeModal();setMod(curMod)
  }

  // ─── Form builder ──────────────────────────────────────────────────────────
  function F(n,l,t='text',opts=null,rec={}){
    const v=rec[n]||''
    if(t==='sel'&&opts)return`<div class="frow"><label>${l}</label><select name="${n}"><option value="">Selecione...</option>${opts.map(o=>`<option${v===o?' selected':''}>${o}</option>`).join('')}</select></div>`
    if(t==='ta')return`<div class="frow full"><label>${l}</label><textarea name="${n}">${v}</textarea></div>`
    if(t==='date')return`<div class="frow"><label>${l}</label><input type="date" name="${n}" value="${v}"></div>`
    if(t==='num')return`<div class="frow"><label>${l}</label><input type="number" step="0.01" name="${n}" value="${v}" placeholder="0,00"></div>`
    return`<div class="frow"><label>${l}</label><input type="text" name="${n}" value="${v}" placeholder="${l}"></div>`
  }

  function buildForm(tk,r){
    const wrap=c=>`<div class="fg">${c}</div>`
    if(tk==='equip-cadastro')return wrap(
      `<div class="frow"><label>Nº Série / Patrimônio</label><input type="text" name="nSerie" value="${r.nSerie||''}" placeholder="Ex: BAL-2024-001" style="font-weight:600"></div>`+
      F('equipamento','Tipo de Equipamento','sel',EQUIP_BALANCA,r)+
      F('nPatrimonio','Nº de Patrimônio','text',[],r)+F('modelo','Modelo / Marca','text',[],r)+
      F('dataAquisicao','Data de Aquisição','date',[],r)+F('obs','Observações','ta',[],r))
    if(tk==='equip-manutencao')return`<div class="fg">
      <div class="frow full" style="margin-bottom:4px">
        <label>Nº Série / Patrimônio</label>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="text" name="nSerie" id="lookup-nserie" value="${r.nSerie||''}" placeholder="Digite o Nº de Série..." style="flex:1">
          <button type="button" onclick="lookupEquip()" title="Buscar pelo Nº de Série" style="padding:7px 12px;background:var(--navy);color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:15px;flex-shrink:0">🔍</button>
        </div>
        <div id="lookup-msg" style="font-size:11px;margin-top:4px;min-height:16px"></div>
      </div>
      ${F('equipamento','Tipo de Equipamento','sel',EQUIP_BALANCA,r)}
      ${F('dataEnvio','Data Envio Fornecedor','date',[],r)}${F('nOrcamento','Nº Orçamento','text',[],r)}
      ${F('valor','Valor Orçamento (R$)','num',[],r)}${F('tipoServico','Tipo de Serviço','sel',TIPOS_SERV,r)}
      ${F('tipoManutencao','Tipo de Manutenção','text',[],r)}${F('status','Status','sel',STATUS_EQ,r)}
      ${F('dataSaida','Data Saída Fornecedor','date',[],r)}${F('nNF','Nº NF','text',[],r)}
      ${F('obs','Observações','ta',[],r)}
    </div>`
    if(tk==='equip-concluidos')return wrap(
      F('equipamento','Equipamento','sel',EQUIP_BALANCA,r)+F('nSerie','Nº Série / Patrimônio','text',[],r)+
      F('dataEnvio','Data Envio Fornecedor','date',[],r)+F('nOrcamento','Nº Orçamento','text',[],r)+
      F('valor','Valor Orçamento (R$)','num',[],r)+F('tipoServico','Tipo de Serviço','sel',TIPOS_SERV,r)+
      F('tipoManutencao','Tipo de Manutenção','text',[],r)+F('nNF','Nº NF','text',[],r)+
      F('dataSaida','Data Saída Fornecedor','date',[],r)+F('dataConclusao','Data de Conclusão','date',[],r)+
      F('unidadeDestino','Unidade Destino','text',[],r)+F('obs','Observações','ta',[],r))
    if(tk==='equip-naoConformes')return wrap(
      F('equipamento','Equipamento','sel',EQUIP_BALANCA,r)+F('nSerie','Nº Série / Patrimônio','text',[],r)+
      F('dataEnvio','Data Envio Fornecedor','date',[],r)+F('nOrcamento','Nº Orçamento','text',[],r)+
      F('valor','Valor Orçamento (R$)','num',[],r)+F('tipoServico','Tipo de Serviço','sel',TIPOS_SERV,r)+
      F('motivo','Motivo da Não Conformidade','text',[],r)+F('nNF','Nº NF','text',[],r)+
      F('dataRetorno','Data Retorno','date',[],r)+F('destinoFinal','Destino Final','sel',DESTINO_FINAL,r)+
      F('obs','Observações','ta',[],r))
    if(tk==='equip-compras')return wrap(
      F('equipamento','Equipamento','sel',EQUIP_BALANCA,r)+F('nSerie','Nº Série / Patrimônio','text',[],r)+
      F('fornecedor','Fornecedor','text',[],r)+F('dataPedido','Data do Pedido','date',[],r)+
      F('nPedido','Nº do Pedido','text',[],r)+F('valor','Valor (R$)','num',[],r)+
      F('statusPedido','Status do Pedido','sel',['Aguardando','Em Trânsito','Recebido','Cancelado'],r)+
      F('dataRecebimento','Data de Recebimento','date',[],r)+F('nfCompra','NF de Compra','text',[],r)+
      F('unidadeDestino','Unidade Destino','text',[],r)+F('obs','Observações','ta',[],r))
    if(tk==='liq-emManutencao')return wrap(
      F('tipo','Tipo de Equipamento','sel',EQUIP_LIQ,r)+F('nSerie','Nº Série / Patrimônio','text',[],r)+
      F('voltagem','Voltagem','sel',VOLTAGENS,r)+F('modelo','Modelo','text',[],r)+
      F('fornecedor','Fornecedor','sel',FORNS_LIQ,r)+F('dataEnvio','Data de Envio ao Fornecedor','date',[],r)+
      F('nOS','Nº de OS','text',[],r)+F('valor','Valor do Orçamento (R$)','num',[],r)+
      F('tipoManutencao','Tipo de Manutenção','text',[],r)+F('status','Status','sel',STATUS_LIQ,r)+
      F('dataRetirada','Data de Retirada','date',[],r)+F('unidadeDestino','Unidade Destino','text',[],r)+
      F('nNF','Nº da NF','text',[],r)+F('obs','Observações','ta',[],r))
    if(tk==='liq-prontos')return wrap(
      F('tipo','Tipo de Equipamento','sel',EQUIP_LIQ,r)+F('nSerie','Nº Série / Patrimônio','text',[],r)+
      F('voltagem','Voltagem','sel',VOLTAGENS,r)+F('modelo','Modelo','text',[],r)+
      F('fornecedor','Fornecedor','sel',FORNS_LIQ,r)+F('nOS','Nº de OS','text',[],r)+
      F('valor','Valor do Orçamento (R$)','num',[],r)+F('tipoManutencao','Tipo de Manutenção','text',[],r)+
      F('dataRetirada','Data de Retirada','date',[],r)+F('unidadeDestino','Unidade Destino','text',[],r)+
      F('nNF','Nº da NF','text',[],r)+F('dataConclusao','Data de Conclusão','date',[],r)+
      F('obs','Observações','ta',[],r))
    if(tk==='loc-manut')return wrap(
      F('unidadeOrigem','Unidade de Origem','sel',TODAS_UNID,r)+F('tipo','Tipo de Equipamento','sel',EQUIP_LOC,r)+
      F('modelo','Modelo','text',[],r)+F('nSerie','Nº de Série','text',[],r)+
      F('nPatrimonio','Nº de Patrimônio','text',[],r)+F('capacidade','Capacidade / Litragem','text',[],r)+
      F('voltagem','Voltagem','sel',VOLTAGENS,r)+F('dataEnvio','Data de Envio p/ Manutenção','date',[],r)+
      F('localizacaoAtual','Localização Atual','sel',LOC_STATUS,r)+F('obs','Observações','ta',[],r))
    for(const[k,reg]of Object.entries(REGIOES)){
      if(tk==='loc-'+k)return wrap(
        F('unidade','Unidade','sel',reg.unidades,r)+F('tipo','Tipo de Equipamento','sel',EQUIP_LOC,r)+
        F('modelo','Modelo','text',[],r)+F('nSerie','Nº de Série','text',[],r)+
        F('nPatrimonio','Nº de Patrimônio','text',[],r)+F('capacidade','Capacidade / Litragem','text',[],r)+
        F('voltagem','Voltagem','sel',VOLTAGENS,r)+F('dataEnvio','Data de Envio à Unidade','date',[],r)+
        F('dataAtualizacao','Data de Atualização','date',[],r)+F('obs','Observações','ta',[],r))
    }
    return '<p style="color:#999;padding:20px">Formulário não disponível.</p>'
  }

  // ─── Expõe funções globalmente (necessário para onclick="..." no HTML) ──────
  Object.assign(window, {
    setMod, renderEquip, renderLiq, renderLoc,
    openM, closeModal, saveRec,
    delRec, exportCSV, getD,
    openAddCtx, lookupEquip,
  })

  // ─── Inicialização ─────────────────────────────────────────────────────────
  loadS()
  const upd = document.getElementById('last-upd')
  if(upd) upd.textContent = new Date().toLocaleString('pt-BR')
  const ov = document.getElementById('overlay')
  if(ov) ov.addEventListener('click', function(e){ if(e.target===this) closeModal() })
}

// ─── Componente React ─────────────────────────────────────────────────────────
export default function AlimentaresPage() {
  const containerRef = useRef(null)
  const initialized = useRef(false)

  const handleChartLoad = () => {
    if (initialized.current || !containerRef.current) return
    initialized.current = true
    containerRef.current.innerHTML = SHELL
    initApp()
  }

  useEffect(() => {
    // Se Chart.js já foi carregado (hot reload / navegação SPA)
    if (window.Chart && !initialized.current) handleChartLoad()
    return () => {
      // Limpa as funções globais ao desmontar
      ;['setMod','renderEquip','renderLiq','renderLoc','openM','closeModal',
        'saveRec','delRec','exportCSV','getD','openAddCtx','lookupEquip','_curMod'
      ].forEach(k => { try { delete window[k] } catch(e){} })
      initialized.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={handleChartLoad}
      />
      <div
        ref={containerRef}
        style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F5F7' }}
      />
    </>
  )
}
