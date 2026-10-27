/* MDO Manager 2.14 — carta di circolazione Allegato J, fogli 1–4.
   Fields are data entry, not a certification or a change to railway rules.
   Source shape: DOI PA SE FU 02.03 1 1. No sample-company data baked into public code.
*/
(function(){
"use strict";
const extra=[
 ['data_rilascio_carta','Data rilascio carta di circolazione','date'],
 ['proprietario_ragione_sociale','Proprietario · ragione sociale','text'],
 ['proprietario_sede','Proprietario · sede / indirizzo','text'],
 ['equipment_sap','Equipment / identificativo amministrativo','text'],
 ['classe_mdo','Definizione classe mezzo (dalla carta)','text'],
 ['certificato_autorizzazione','Estremi certificato autorizzazione alla circolazione','text'],
 ['costruttore','Costruttore','text'],
 ['costruttore_sede','Località / sede costruttore','text'],
 ['anno_costruzione','Anno di costruzione','number'],
 ['data_prima_immatricolazione','Data prima immatricolazione','date'],
 ['matricola_costruttore','Matricola del costruttore','text'],
 ['persone_max_cabina','Persone massime in cabina/e','number'],
 ['passo_interperno_mm','Passo o interperno (mm)','number'],
 ['passo_carrello_mm','Passo carrello (mm)','number'],
 ['diametro_ruote_nuove_mm','Diametro ruote a nuovo (mm)','number'],
 ['interasse_binario_min_lavoro_mm','Interasse minimo binari in fase di lavoro (mm)','number'],
 ['pendenza_max_salita_discesa','Pendenza massima salita/discesa binario (come da carta)','number'],
 ['sopraelevazione_max_salita_discesa','Sopraelevazione massima salita/discesa binario (come da carta)','number'],
 ['sopraelevazione_max_lavoro','Sopraelevazione massima in lavoro (come da carta)','number'],
 ['trazione_fase_lavoro','Trazione in fase di lavoro','select',['MOTORE ENDOTERMICO','ELETTRICA','IDRAULICA','NESSUNA','ALTRA']],
 ['sospensioni_tipo','Tipologia sospensioni','text'],
 ['ruote_tipo','Tipologia ruote','text'],
 ['freno_continuo_automatico_tipo','Freno continuo automatico','select',['UNIFICATO','NON UNIFICATO','ASSENTE','ALTRO']],
 ['freno_stazionamento','Freno di stazionamento','select',['SI','NO']],
 ['freno_diretto_tipo','Freno diretto','select',['UNIFICATO','NON UNIFICATO','ASSENTE','ALTRO']],
 ['condotta_freno_tipo','Condotta del freno','select',['UNIFICATA','NON UNIFICATA','ASSENTE','ALTRO']],
 ['aggancio_descrizione','Tipologia organi di aggancio · dicitura originale','text'],
 ['repulsione_descrizione','Tipologia organi di repulsione · dicitura originale','text'],
 ['fanali_segnalamento_tipo','Fanali e luci di segnalamento','text'],
 ['fischi_trombe_tipo','Fischi e trombe','text'],
 ['pendenza_max_stazionamento','Pendenza massima di stazionamento (come da carta)','number'],
 ['manovra_spinta','Manovra a spinta','select',['SI','NO','CONDIZIONATA']],
 ['necessita_carro_scudo','Necessità di carro scudo','select',['SI','NO']],
 ['aziona_pedali','Aziona i pedali','select',['SI','NO','CONDIZIONATA']],
 ['idoneo_traino','Idoneo al traino di altri mezzi','select',['SI','NO','CONDIZIONATA']],
 ['rispetta_profilo_limite','Rispetta il profilo limite','select',['SI','NO','CONDIZIONATA']],
 ['prescrizioni_sagoma','Prescrizioni di sagoma','textarea'],
 ['prescrizioni_circolazione_aggiuntive','Prescrizioni di circolazione (secondo riquadro)','textarea'],
 ['ecm_codice','ECM · identificativo / certificato','text'],
 ['ecm_nome','ECM · denominazione','text'],
 ['dot_bandiera_rossa','Bandiera rossa con asta','select',['SI','NO','NON INDICATO']],
 ['dot_tabella_coda','Tabella di coda','select',['SI','NO','NON INDICATO']],
 ['dot_fanali_coda','Fanali di coda','select',['SI','NO','NON INDICATO']],
 ['dot_torcia_fiamma','Torcia a fiamma rossa','select',['SI','NO','NON INDICATO']],
 ['dot_shunt_cdb','Dispositivo di shuntaggio CdB','select',['SI','NO','NON INDICATO']],
 ['dot_lanterna','Lanterna a luce rossa e bianca','select',['SI','NO','NON INDICATO']],
 ['dot_barra_traino','Barra di traino','select',['SI','NO','NON INDICATO']],
 ['dot_estintore','Estintore per ogni cabina','select',['SI','NO','NON INDICATO']],
 ['dot_scarpe','Scarpe per stazionamento','select',['SI','NO','NON INDICATO']],
 ['dot_vaschetta','Vaschetta raccolta liquidi','select',['SI','NO','NON INDICATO']]
];
for(const item of extra){if(!mdo33Specs.some(x=>x[0]===item[0]))mdo33Specs.push(item)}
const groupDefs=[
 ['Identificazione e autorizzazioni', 'Allegato J · foglio 1',
 ['codice_identificazione','equipment_sap','numero_carta','data_rilascio_carta','numero_rin','proprietario_ragione_sociale','proprietario_sede','classe_mdo','tipo_mdo','certificato_autorizzazione','costruttore','costruttore_sede','anno_costruzione','data_prima_immatricolazione','matricola_costruttore','persone_max_cabina','modello','fonte_carta']],
 ['Dimensioni, meccanica e trazione','Allegato J · foglio 1',
 ['potenza_kw','massa_vuoto_t','carico_massimo_t','massa_massima_t','lunghezza_mm','passo_interperno_mm','passo_carrello_mm','diametro_ruote_nuove_mm','interasse_binario_min_lavoro_mm','pendenza_max_salita_discesa','sopraelevazione_max_salita_discesa','sopraelevazione_max_lavoro','trazione_fase_lavoro','trazione','numero_assi','carico_assiale_max_t','sospensioni_tipo','ruote_tipo','raggio_minimo_m','massa_rimorchiabile_t']],
 ['Velocità e frenatura','Allegato J · foglio 1',
 ['velocita_isolato_kmh','velocita_composizione_kmh','velocita_lavoro_kmh','velocita_trazione_attiva_kmh','velocita_trainato_kmh','velocita_deviata_kmh','massa_frenata_vuoto_t','massa_frenata_carico_t','massa_frenata_stazionamento_t','freno_continuo_automatico_tipo','freno_stazionamento','freno_diretto_tipo','condotta_freno_tipo','frenatura','freno_continuo']],
 ['Organi, segnalamento e stazionamento','Allegato J · foglio 1',
 ['aggancio_unificato','aggancio','aggancio_descrizione','organi_repulsione','repulsione_descrizione','fanali_segnalamento_tipo','fischi_trombe_tipo','pendenza_max_stazionamento','manovra_spinta']],
 ['Prescrizioni di circolazione','Allegato J · foglio 1',
 ['obbligo_coda','necessita_carro_scudo','occupazione_cdb','aziona_pedali','idoneo_traino','rispetta_profilo_limite','ammesso_composizione','categoria_linea','prescrizioni_sagoma','limiti_circolazione','prescrizioni_circolazione_aggiuntive','limite_pezzi_carta','ecm_codice','ecm_nome']],
 ['Dotazioni di bordo','Allegato J · foglio 4',
 ['dot_bandiera_rossa','dot_tabella_coda','dot_fanali_coda','dot_torcia_fiamma','dot_shunt_cdb','dot_lanterna','dot_barra_traino','dot_estintore','dot_scarpe','dot_vaschetta']]
];
const historic=[
 {key:'interventi_officina',title:'Interventi manutentivi obbligatori · Officina qualificata',cols:[['data','Data','date'],['officina','Officina qualificata','text'],['intervento','Tipo / descrizione','text'],['riferimento','Riferimento e timbro/firma','text']]},
 {key:'controlli_periodici_straordinari',title:'Controlli periodici / straordinari',cols:[['data','Data','date'],['tipo','Tipo di controllo','text'],['esito','Esito registrato','text'],['riferimento','Riferimento e timbro/firma','text']]},
 {key:'variazioni_proprietario',title:'Variazioni del proprietario',cols:[['data','Data','date'],['ragione_sociale','Ragione sociale','text'],['indirizzo','Indirizzo','text']]},
 {key:'variazioni_utilizzatore',title:"Variazioni dell'utilizzatore",cols:[['data','Data','date'],['ragione_sociale','Ragione sociale','text'],['indirizzo','Indirizzo','text']]}
];
const originalFields=mdo33Fields;
function fieldInfo(key){
 return mdo33Specs.find(x=>x[0]===key)||[key,key,'text'];
}
function fieldControl(key,t){
 const [k,label,type,opts]=fieldInfo(key);
 const value=t[k]??'';
 if(type==='select'){
  const list=[...(opts||[])];
  if(value&&!list.includes(value))list.unshift(value); // preserve original free-text value from an older card
  return '<label>'+esc(label)+'<select class="field" name="card_'+k+'"><option value="">Non indicato</option>'+
   list.map(x=>'<option value="'+esc(x)+'" '+(x===value?'selected':'')+'>'+esc(x.replaceAll('_',' '))+'</option>').join('')+'</select></label>';
 }
 if(type==='textarea')return '<label class="full">'+esc(label)+'<textarea class="field" name="card_'+k+'" rows="3">'+esc(value)+'</textarea></label>';
 const inputType=type==='date'?'date':type==='number'?'number':'text';
 return '<label>'+esc(label)+'<input class="field" name="card_'+k+'" type="'+inputType+'"'+
  (type==='number'?' step="any" min="0"':'')+' value="'+esc(value)+'"></label>';
}
function historyRow(def,values={}){
 const controls=def.cols.map(([key,label,type])=>
 '<label class="small">'+esc(label)+'<input class="field" data-history-field="'+key+'" type="'+type+'" value="'+esc(values[key]??'')+'"></label>').join('');
 return '<div class="mdo34-history-row" style="border:1px solid #d7e1e9;border-radius:8px;padding:10px;margin:7px 0">'+
 '<div class="formgrid">'+controls+'</div><button type="button" class="btn" onclick="mdo34RemoveRow(this)">Rimuovi riga</button></div>';
}
function historyBlock(def,t){
 const arr=Array.isArray(t[def.key])?t[def.key]:[];
 return '<div class="full" data-mdo34-history="'+def.key+'"><h4>'+esc(def.title)+'</h4>'+
 '<p class="small muted">Registrazione storica: la data non dimostra da sola che la verifica sia stata completata con esito positivo.</p>'+
 '<input type="hidden" name="hist_present_'+def.key+'" value="1">'+
 '<div class="mdo34-history-list">'+arr.map(x=>historyRow(def,x)).join('')+'</div>'+
 '<button type="button" class="btn" onclick="mdo34AddRow(this,\''+def.key+'\')">+ Aggiungi registrazione</button></div>';
}
window.mdo34AddRow=function(button,key){
 const def=historic.find(h=>h.key===key);
 if(!def)return;
 button.closest('[data-mdo34-history]')?.querySelector('.mdo34-history-list')
  ?.insertAdjacentHTML('beforeend',historyRow(def));
};
window.mdo34RemoveRow=function(button){button.closest('.mdo34-history-row')?.remove()};
mdo33Fields=function(t={}){
 const displayed=new Set();
 const section=(title,sub,keys,open=false)=>{
  const controls=keys.map(k=>{displayed.add(k);return fieldControl(k,t)}).join('');
  return '<details class="full" '+(open?'open ':'')+
   'style="border:1px solid #d7e1e9;border-radius:10px;padding:10px 12px;margin:5px 0">'+
   '<summary style="cursor:pointer;font-weight:700;padding:5px;color:#153951">'+esc(title)+'</summary>'+
   '<p class="small muted">'+esc(sub)+'</p><div class="formgrid">'+controls+'</div></details>';
 };
 const groups=groupDefs.map((g,i)=>section(g[0],g[1],g[2],i===0)).join('');
 const remainder=mdo33Specs.filter(x=>!displayed.has(x[0])).map(x=>x[0]);
 const extraSection=remainder.length?section('Altri dati tecnici presenti nella precedente versione','Campi già disponibili nel gestionale; nessun dato viene perso.',remainder):'';
 const hist='<details class="full" style="border:1px solid #d7e1e9;border-radius:10px;padding:10px 12px;margin:5px 0">'+
  '<summary style="cursor:pointer;font-weight:700;padding:5px;color:#153951">Storico e variazioni · fogli 2 e 3</summary>'+
  '<p class="small muted">Registra le date e gli estremi riportati sulla carta senza trasformarli automaticamente in scadenze future.</p>'+
  historic.map(x=>historyBlock(x,t)).join('')+'</details>';
 return '<div class="full note">Scheda completa da carta di circolazione · Allegato J (fogli 1–4). Lascia vuoto ciò che non è riportato sul documento, senza inventare valori. Le prescrizioni testuali restano vincolanti.</div>'+
  groups+extraSection+hist;
};
const previousParse=mdo33ParseForm;
mdo33ParseForm=function(formData,original={}){
 const t=previousParse(formData,original);
 // FormData includes only inputs with name; the dynamic history rows are numbered at submit.
 for(const def of historic){
  if(formData.get('hist_present_'+def.key)!=='1')continue;
  const map=new Map(),pattern=new RegExp('^hist_'+def.key+'_(\\d+)_([a-z_]+)$');
  for(const [key,value] of formData.entries()){
   const match=key.match(pattern);if(!match)continue;
   const i=Number(match[1]),field=match[2];
   if(!def.cols.some(c=>c[0]===field))continue;
   if(!map.has(i))map.set(i,{});
   map.get(i)[field]=String(value||'').trim();
  }
  t[def.key]=[...map.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1])
   .filter(row=>Object.values(row).some(v=>v!==''));
 }
 return t;
};
// Assign deterministic name attributes immediately before FormData reads a form.
function numberHistoryRows(form){
 form.querySelectorAll('[data-mdo34-history]').forEach(block=>{
  const type=block.getAttribute('data-mdo34-history');
  block.querySelectorAll('.mdo34-history-row').forEach((row,index)=>{
   row.querySelectorAll('[data-history-field]').forEach(input=>{
    input.name='hist_'+type+'_'+index+'_'+input.getAttribute('data-history-field');
   });
  });
 });
}
const previousSaveCard=mdo33SaveCard;
mdo33SaveCard=async function(e,id){
 numberHistoryRows(e.target);
 return previousSaveCard(e,id);
};
const previousSaveCompany=mdo9SaveCompany;
mdo9SaveCompany=async function(e){
 numberHistoryRows(e.target);
 return previousSaveCompany(e);
};
// Additional editing is possible from the public fleet list, not only the admin editor.
window.mdo34ViewCard=function(id){
 const m=db.mezzi.find(x=>x.id===id);if(!m)return alert('Mezzo non trovato');
 const t=m.tecnica||{},groups=groupDefs.map(group=>{
  const rows=group[2].map(k=>{
   const val=t[k];
   if(val===null||val===undefined||String(val)==='')return '';
   return '<tr><td style="width:45%">'+esc(fieldInfo(k)[1])+'</td><td><b>'+esc(val)+'</b></td></tr>';
  }).filter(Boolean).join('');
  return rows?'<h3>'+esc(group[0])+'</h3>'+tabella(['Voce','Valore'],rows):'';
 }).join('');
 const past=historic.map(def=>{
  const arr=Array.isArray(t[def.key])?t[def.key]:[];
  return arr.length?'<h3>'+esc(def.title)+'</h3>'+
  tabella(def.cols.map(c=>c[1]),arr.map(item=>'<tr>'+def.cols.map(c=>'<td>'+esc(item[c[0]]||'')+'</td>').join('')+'</tr>')):'';
 }).join('');
 modal('<h2>Carta di circolazione · '+esc(m.nome||id)+'</h2>'+
 '<p class="small">Identificativo archivio: '+esc(id)+' · Codice identificazione: '+esc(t.codice_identificazione||m.matricola||'—')+'</p>'+
 '<p class="note">I dati provengono dalla trascrizione della carta. Consulta sempre le prescrizioni originali per la circolazione.</p>'+
 '<div style="max-height:65vh;overflow:auto">'+(groups||'<p>Dati ancora da compilare.</p>')+past+'</div>'+
 (mdoRole==='admin'?'<div class="actions"><button class="btn primary" type="button" onclick="mdo33EditCard(\''+esc(id)+'\')">Modifica dati carta</button></div>':''));
};
const oldGroup=mdo15ShowGroup;
mdo15ShowGroup=function(group,history=false){
 oldGroup(group,history);
 const dest=document.getElementById('mdo9Group');if(!dest)return;
 const rows=db.mezzi.filter(m=>group==='RFI'
   ?m.proprieta!=='IMPRESA'&&!!m.archiviato===history
   :m.proprieta==='IMPRESA'&&m.impresa===group&&!m.archiviato);
 const trs=dest.querySelectorAll('tbody tr');
 trs.forEach((tr,i)=>{
   const m=rows[i],cell=tr.querySelector('td:last-child');if(!m||!cell)return;
   const b=document.createElement('button');b.className='btn';b.type='button';
   b.textContent='Scheda carta';b.onclick=()=>window.mdo34ViewCard(m.id);
   cell.prepend(b);
 });
};
// Card limitations are used as structured restrictions in consist analysis.
const previousCheck=checkRows;
checkRows=function(d){
 const r=previousCheck(d);
 (d.ids||[]).forEach((id,i)=>{
  const m=compMezzo(id),t=m?.tecnica||{};if(!m)return;
  const label=id+' · '+(m.nome||'MdO');
  if(String(t.ammesso_composizione||'').toUpperCase()==='NO'&&d.ids.length>1)
   r.checks.push({name:'Ammissibilità MdO in composizione',status:'BLOCCANTE',
    detail:label+': carta indica NON ammesso in composizione.',source:'Carta di circolazione · Prescrizioni'});
  if(String(t.obbligo_coda||'').toUpperCase()==='SI'&&i!==d.ids.length-1)
   r.checks.push({name:'Obbligo di coda assoluta',status:'BLOCCANTE',
    detail:label+': da collocare in coda assoluta secondo carta.',source:'Carta di circolazione · Prescrizioni'});
  if(String(t.idoneo_traino||'').toUpperCase()==='NO'&&d.voci?.[i]?.ruolo==='MOTRICE'&&d.ids.length>1)
   r.checks.push({name:'Idoneità al traino',status:'BLOCCANTE',
    detail:label+': la carta esclude il traino di altri mezzi.',source:'Carta di circolazione · Prescrizioni'});
  if(String(t.necessita_carro_scudo||'').toUpperCase()==='SI')
   r.checks.push({name:'Prescrizione carro scudo',status:'DA VALIDARE',
    detail:label+': carta prescrive carro scudo. Verificare presenza e collocazione nella composizione.',source:'Carta di circolazione · Prescrizioni'});
  if(String(t.occupazione_cdb||'').toUpperCase()==='NO')
   r.checks.push({name:'Occupazione circuiti di binario',status:'DA VALIDARE',
    detail:label+': mezzo NON occupa i circuiti di binario; applicare le prescrizioni specifiche.',source:'Carta di circolazione · Prescrizioni'});
  if(t.limiti_circolazione||t.prescrizioni_circolazione_aggiuntive)
   r.checks.push({name:'Prescrizioni individuali da carta',status:'DA VALIDARE',
    detail:label+': '+[t.limiti_circolazione,t.prescrizioni_circolazione_aggiuntive].filter(Boolean).join(' · '),
    source:'Carta di circolazione · Prescrizioni'});
 });
 return r;
};
})();
