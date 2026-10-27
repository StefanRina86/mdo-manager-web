// MDO Manager 2.17 - collaudo correttivo.
// Esecuzione solo dopo il caricamento del programma principale.
// Nessuna mutazione automatica di mezzi, giacenze, scadenze o studi.
let mdo217People=[];
let mdo217Accounts=[];

async function mdo217OpenPeople(){
 if(mdoRole!=='admin')return alert('Gestione riservata all’amministratore');
 try{
  const [p,a]=await Promise.all([
   mdoClient.rpc('mdo217_elenca_personale'),
   mdoClient.rpc('mdo30_elenca_personale')
  ]);
  if(p.error)throw Error(p.error.message+' · Eseguire SQL MDO_Manager_217_operatori_fl.sql');
  if(a.error)throw Error(a.error.message+' · Verificare SQL 2.10');
  mdo217People=p.data||[];
  mdo217Accounts=a.data||[];
  mdo217PeopleModal();
 }catch(e){alert('Anagrafica non caricata: '+e.message)}
}
function mdo217PeopleModal(){
 const rows=mdo217People.map((p,i)=>'<tr>'+
  '<td>'+esc(p.cognome+' '+p.nome)+'<div class="small muted">CID '+esc(p.cid)+' · '+esc(p.nucleo||'Nucleo non indicato')+'</div></td>'+
  '<td>'+(p.abilitato_guida?'Sì':'—')+'</td><td>'+(p.abilitato_scorta?'Sì':'—')+'</td>'+
  '<td>'+(p.puo_prelevare?'Sì':'—')+'</td><td>'+(p.puo_erogare?'Sì':'—')+'</td>'+
  '<td>'+(p.puo_segnalare?'Sì':'—')+'</td><td>'+esc(p.livello||'—')+'</td>'+
  '<td>'+(p.attivo?'Attivo':'Non attivo')+'</td>'+
  '<td><button class="btn" onclick="mdo217EditPerson('+i+')">Modifica</button></td></tr>');
 modal('<h2>Personale abilitato MdO</h2>'+
  '<p class="note">Elenco unico per Guida, Scorta e incarichi operativi. Le abilitazioni reali vanno riscontrate: nessuna persona è dichiarata abilitata automaticamente. Solo l’amministratore assegna i permessi; la segnalazione guasti richiede anche un account MDO collegato.</p>'+
  '<button class="btn primary" onclick="mdo217EditPerson(-1)">+ Inserisci personale</button>'+
  tabella(['Nominativo / CID','Guida','Scorta','Prelievo','Erogazione','Anomalie','Profilo','Stato',''],rows));
}
function mdo217EditPerson(i){
 if(mdoRole!=='admin')return;
 const p=i<0?{}:mdo217People[i];if(!p)return;
 const field=(name,label,type='text')=>'<label>'+label+'<input class="field" name="'+name+'" type="'+type+'" value="'+esc(p[name]||'')+'"></label>';
 const check=(key,label)=>'<label class="small"><input name="'+key+'" type="checkbox" '+(p[key]?'checked ':'')+'> '+label+'</label>';
 const acc='<label>Account MDO associato<select name="user_id" class="field"><option value="">Non associato</option>'+
 mdo217Accounts.map(x=>'<option value="'+esc(x.user_id)+'" '+(p.user_id===x.user_id?'selected':'')+'>'+
 esc(([x.cognome,x.nome].filter(Boolean).join(' ')||x.email)+' · '+(x.cid||'CID mancante'))+'</option>').join('')+'</select></label>';
 const level='<label>Livello<select name="livello" class="field"><option value="">Non assegnato</option>'+
 ['CUM','SPECIALISTA','CT'].map(x=>'<option value="'+x+'" '+(p.livello===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>';
 modal('<h2>'+(i<0?'Inserisci':'Modifica')+' abilitazioni MdO</h2>'+
  '<p class="small muted">Guida e Scorta sono abilitazioni separate; gli incarichi carburante e le segnalazioni non sono concessi automaticamente.</p>'+
  '<form class="formgrid" onsubmit="mdo217SavePerson(event,'+i+')">'+
  field('cognome','Cognome *')+field('nome','Nome *')+field('cid','CID *')+field('nucleo','Nucleo')+
  field('riferimento_abilitazione','Riferimento documentale abilitazione')+
  field('scadenza_guida','Scadenza Guida (se presente)','date')+
  field('scadenza_scorta','Scadenza Scorta (se presente)','date')+
  acc+level+
  '<div class="full formgrid">'+check('abilitato_guida','Abilitato alla guida MdO')+
  check('abilitato_scorta','Abilitato alla scorta MdO')+
  check('puo_prelevare','Autorizzato al prelievo gasolio')+
  check('puo_erogare','Autorizzato all’erogazione gasolio')+
  check('puo_segnalare','Autorizzato a inserire anomalie')+
  check('attivo','Persona attiva')+'</div>'+
  '<div class="actions full"><button class="btn primary" type="submit">Salva abilitazioni</button>'+
  '<button class="btn" type="button" onclick="mdo217PeopleModal()">Indietro</button></div></form>');
}
async function mdo217SavePerson(e,i){
 e.preventDefault();
 if(mdoRole!=='admin')return;
 const b=e.target.querySelector('[type=submit]'),f=new FormData(e.target);
 const p={id:i<0?null:mdo217People[i]?.id,
  cognome:String(f.get('cognome')||'').trim(),nome:String(f.get('nome')||'').trim(),
  cid:String(f.get('cid')||'').trim(),nucleo:String(f.get('nucleo')||'').trim(),
  riferimento_abilitazione:String(f.get('riferimento_abilitazione')||'').trim(),
  scadenza_guida:String(f.get('scadenza_guida')||''),
  scadenza_scorta:String(f.get('scadenza_scorta')||''),
  user_id:String(f.get('user_id')||''),livello:String(f.get('livello')||'')};
 for(const key of ['abilitato_guida','abilitato_scorta','puo_prelevare','puo_erogare','puo_segnalare','attivo'])p[key]=f.has(key);
 if(!p.cid||!p.nome||!p.cognome)return alert('Inserisci nome, cognome e CID');
 if(p.puo_segnalare&&(!p.user_id||!p.livello||!p.attivo))
  return alert('Per segnalare anomalie servono account collegato, livello e persona attiva.');
 b.disabled=true;
 try{
  const {error}=await mdoClient.rpc('mdo217_salva_personale',{p});
  if(error)throw error;
  await mdo24LoadPeople();await mdo217OpenPeople();
  mdoStatus('Abilitazioni personali aggiornate su Supabase');
 }catch(err){alert('Abilitazioni NON salvate: '+err.message)}
 finally{b.disabled=false}
}
const mdo217PreviousAdmin=admin;
admin=function(){
 return (mdoRole==='admin'?'<div class="panel"><h2>Anagrafica unica MdO</h2>'+
  '<p>Guida, scorta, prelievo, erogazione, anomalie e profilo utente: permessi distinti.</p>'+
  '<button class="btn primary" onclick="mdo217OpenPeople()">Gestisci tutto il personale MdO</button></div>':'')+
  mdo217PreviousAdmin();
};

// Le verifiche positive sono distinte da quelle programmate e dalle date di carta.
// Il precedente registro rimane immutato.
const mdo217PriorExpiryLoad=mdo9LoadExpiries;
mdo9LoadExpiries=async function(){
 await mdo217PriorExpiryLoad();
 if(!mdoSession)return;
 const [a,b]=await Promise.all([
  mdoClient.from('mdo_scadenze').select('mezzo_id,ultima_verifica,esito,tipo')
   .eq('tipo','periodica').eq('esito','POSITIVO').order('ultima_verifica',{ascending:false}).limit(1000),
  mdoClient.from('mdo_mezzi').select('id,codice_sap').limit(1000)
 ]);
 if(a.error||b.error)throw Error(a.error?.message||b.error?.message);
 const lookup=new Map(b.data.map(x=>[x.id,x.codice_sap]));
 for(const record of a.data){
  const m=db.mezzi.find(x=>x.id===lookup.get(record.mezzo_id)&&x.proprieta!=='IMPRESA');
  if(m&&(!m.verifiche?.ultima_periodica||record.ultima_verifica>m.verifiche.ultima_periodica)){
   m.verifiche={...(m.verifiche||{}),ultima_periodica:record.ultima_verifica};
  }
 }
};
const mdo217PriorScadenze=scadenze;
scadenze=function(){
 let html=mdo217PriorScadenze();
 for(const m of db.mezzi.filter(x=>x.proprieta!=='IMPRESA')){
  const q=m.verifiche?.ultima_quinquennale,p=m.verifiche?.ultima_periodica;
  if(!q||!p||p<q)continue;
  const start='<td>'+esc(m.id)+'</td><td>Periodica · 33 mesi</td>';
  const i=html.indexOf(start);if(i<0)continue;
  const end=html.indexOf('</tr>',i);if(end<0)continue;
  const replacement=start+'<td>'+esc(q)+'</td><td>'+esc(p)+' · effettuata</td>'+
   '<td>Registrata con esito positivo · nessuna anomalia di data periodica</td>';
  html=html.slice(0,i)+replacement+html.slice(end);
 }
 return html;
};
const mdo217PriorCheckRows=checkRows;
checkRows=function(d){
 const r=mdo217PriorCheckRows(d);
 for(const m of r.ms||[]){
  const q=m.verifiche?.ultima_quinquennale,p=m.verifiche?.ultima_periodica;
  if(!p||!q||p<q)continue;
  for(const c of r.checks){
   if(c.name==='Periodica · 33 mesi · '+m.id){
    c.status='DA VALIDARE';
    c.detail='Verifica periodica positiva registrata il '+p+'; riscontro documentale e stato operativo da verificare.';
   }
  }
 }
 return r;
};
const mdo217PriorExpiryEditor=mdo9EditExpiry;
mdo9EditExpiry=function(id=''){
 mdo217PriorExpiryEditor();
 if(id)document.querySelector('#modal select[name=id]')?.querySelectorAll('option').forEach(o=>{
  o.selected=o.value===id;
 });
};
const mdo217PriorEditCard=mdo33EditCard;
mdo33EditCard=function(id){
 mdo217PriorEditCard(id);
 const f=document.querySelector('#modal form');
 if(f&&mdoRole==='admin'){
  const b=document.createElement('button');
  b.type='button';b.className='btn';
  b.textContent='Registra verifica annuale / periodica / quinquennale eseguita';
  b.onclick=()=>mdo9EditExpiry(id);
  f.querySelector('.actions')?.prepend(b);
 }
};

// Convogli misti soltanto in scenario eccezionale, motivato dall'amministratore.
function mdo217Kinds(d){
 const vals=(d?.ids||[]).map(id=>compMezzo(id)).filter(Boolean);
 return {rfi:vals.some(m=>m.proprieta!=='IMPRESA'&&!m.temporaneo),
  imprese:vals.some(m=>m.proprieta==='IMPRESA'||m.temporaneo)};
}
function mdo217Accept(id){
 const m=compMezzo(id),d=window.compDraft;if(!m||!d)return false;
 const k=mdo217Kinds(d),isFirm=m.proprieta==='IMPRESA'||m.temporaneo;
 if((isFirm&&k.rfi||!isFirm&&k.imprese)&&(!d.mistoEccezionale||!d.motivoMisto)){
  alert('RFI e imprese si studiano separatamente. Eventuali composizioni miste richiedono la funzione eccezionale, riservata all’amministratore e con motivazione.');
  return false;
 }
 return true;
}
const mdo217PriorAddComp=addComp;
addComp=function(){
 const id=document.getElementById('compAdd')?.value;
 if(!id||!mdo217Accept(id))return;
 mdo217PriorAddComp();
};
const mdo217PriorAddFirm=mdo9AddSaved;
mdo9AddSaved=function(){
 const id=document.getElementById('mdo9CompanyMezzo')?.value;
 if(!id||!mdo217Accept(id))return;
 mdo217PriorAddFirm();
};
function mdo217MixToggle(v){
 const d=window.compDraft;if(!d)return;
 if(!v){d.mistoEccezionale=false;d.motivoMisto='';}
 else{
  if(mdoRole!=='admin')return alert('Eccezione riservata all’amministratore');
  const reason=prompt('Motivazione documentata del caso eccezionale (non autorizza la circolazione):',d.motivoMisto||'');
  if(!reason?.trim())return alert('Motivazione obbligatoria: opzione non attivata');
  d.mistoEccezionale=true;d.motivoMisto=reason.trim();
 }
 render();
}
const mdo217PriorResult=renderCompResult;
renderCompResult=function(d){
 let out=mdo217PriorResult(d);
 const k=mdo217Kinds(d);
 if(k.rfi&&k.imprese)out='<div class="note bad"><b>Composizione mista RFI/imprese: '+(d.mistoEccezionale&&d.motivoMisto?'CASO ECCEZIONALE DA VALIDARE':'NON AMMESSA NELLO STUDIO ORDINARIO')+'</b>'+
  (d.motivoMisto?'<p>Motivazione: '+esc(d.motivoMisto)+'</p>':'')+'</div>'+out;
 const tasks=[];
 for(const [key,label] of [['origine','Origine'],['destinazione','Destinazione'],['binario','Binario / direzione'],
 ['linea','Linea / FL'],['fonteTratta','Fonte e versione FL'],['pendenza','Pendenza massima'],
 ['velocitaLinea','Limite velocità della tratta']]){
  if(d[key]==null||d[key]==='')tasks.push('<button class="btn" onclick="mdo217EditStudy(\''+key+'\')">Completa '+esc(label)+'</button>');
 }
 for(const id of d.ids||[]){
  const m=compMezzo(id);if(!m)continue;
  const t=m.tecnica||{};
  if(['massa_vuoto_t','massa_frenata_vuoto_t','massa_frenata_carico_t','numero_assi'].some(key=>t[key]==null||t[key]==='')){
   if(mdoRole==='admin'&&!m.temporaneo)tasks.push('<button class="btn" onclick="mdo33EditCard(\''+esc(id)+'\')">Completa carta '+esc(id)+'</button>');
   else tasks.push('<span class="small">Carta '+esc(id)+' incompleta: richiedere validazione all’amministratore.</span>');
  }
 }
 for(let i=0;i<(d.segmenti||[]).length;i++){
  const s=d.segmenti[i];
  if(!s.validazione)tasks.push('<button class="btn" onclick="mdo217ValidateSegment('+i+')">Verifica origine dati tratto '+(i+1)+'</button>');
 }
 return out+'<div class="panel"><h3>Completa / valida dati dello studio</h3>'+
 '<p class="small muted">Le integrazioni rimangono nello studio finché non lo salvi. La conferma della fonte non equivale a nulla osta alla circolazione.</p>'+
 '<div class="toolbar">'+(tasks.join('')||'<span class="small">Campi preliminari presenti: restano i controlli operativi.</span>')+'</div></div>';
};
function mdo217EditStudy(key){
 const d=window.compDraft;if(!d)return;
 const labels={origine:'Origine',destinazione:'Destinazione',binario:'Binario',linea:'Linea/FL',fonteTratta:'Versione/fonte FL',pendenza:'Pendenza in ‰',velocitaLinea:'Velocità in km/h'};
 const answer=prompt('Inserisci '+(labels[key]||key)+' da fonte verificata:',d[key]||'');
 if(answer===null)return;
 if(['pendenza','velocitaLinea'].includes(key)&&answer.trim()&&(!Number.isFinite(Number(answer))||Number(answer)<0)){
  return alert('Indicare un valore numerico non negativo, senza ipotizzare dati.');
 }
 d[key]=answer.trim();
 render();
}
function mdo217ValidateSegment(i){
 const d=window.compDraft,s=d?.segmenti?.[i];if(!s)return;
 if(!s.da||!s.a||!s.fl||!s.binario||!s.direzione)
  return alert('Completare Da, A, FL, binario e direzione prima di validare la trascrizione.');
 const source=prompt('Fonte e versione verificata per il tratto (obbligatoria):',s.fonte||s.fl||'');
 if(!source?.trim())return;
 s.fonte=source.trim();s.validazione={user:mdoSession?.user?.id||null,data:new Date().toISOString(),fonte:s.fonte};
 render();
}

// Uso di segmenti FL già strutturati, convalidati e direzionali in database.
// NON interpreta automaticamente PDF né deduce pendenze/velocità dalle località.
async function mdo217ApplyFL(){
 const d=window.compDraft;if(!d)return;
 const from=mdo33Stop(d.origine),to=mdo33Stop(d.destinazione);
 if(!from||!to||from===to)return alert('Indica due località diverse di origine e destinazione.');
 const {data,error}=await mdoClient.from('mdo_fl_tratti').select('*')
  .eq('validato',true).limit(5000);
 if(error)return alert('Archivio FL non disponibile o migrazione 2.17 mancante: '+error.message);
 const wanted=mdo33Stop(d.binario);
 const edges=(data||[]).filter(x=>!wanted||mdo33Stop(x.binario)===wanted);
 const paths=[];
 function visit(node,path,seen){
  if(paths.length>=2||path.length>30)return;
  if(node===to){paths.push([...path]);return}
  for(const x of edges){
   const start=mdo33Stop(x.da_localita),end=mdo33Stop(x.a_localita);
   if(start!==node||seen.has(end))continue;
   visit(end,[...path,x],new Set([...seen,end]));
   if(paths.length>=2)return;
  }
 }
 visit(from,[],new Set([from]));
 if(!paths.length)return alert('Nessun percorso completo validato trovato. Verifica versione FL, località, binario e direzione. Nessun valore è stato inventato.');
 if(paths.length>1)return alert('Percorso ambiguo: sono presenti più alternative nei FL. Seleziona il binario/direzione o completa manualmente i tratti.');
 const path=paths[0];
 if(path.some(x=>!x.fonte||!x.versione||!x.direzione))
  return alert('Percorso trovato ma privo di versioni/fonti o direzione complete.');
 d.segmenti=path.map(x=>({
  da:x.da_localita,a:x.a_localita,fl:x.fl+' · '+x.versione,
  binario:x.binario,direzione:x.direzione,
  pendenza:x.pendenza_permille??'',velocita:x.limite_kmh??'',
  categoria:x.categoria||'',lunghezza:x.lunghezza_max_m??'',
  note:'Fonte '+x.fonte,fonte:x.fonte,
  validazione:{fonte:x.fonte,versione:x.versione,archivio:'FL validato',id:x.id}
 }));
 const same=key=>path.every(x=>x[key]===path[0][key]);
 if(same('fl'))d.linea=path[0].fl+' · '+path[0].versione;
 if(same('binario'))d.binario=path[0].binario;
 d.fonteTratta=[...new Set(path.map(x=>x.fl+' '+x.versione+' · '+x.fonte))].join('; ');
 if(path.every(x=>x.pendenza_permille!==null))d.pendenza=Math.max(...path.map(x=>Number(x.pendenza_permille)));
 if(path.every(x=>x.limite_kmh!==null))d.velocitaLinea=Math.min(...path.map(x=>Number(x.limite_kmh)));
 render();
 mdoStatus('Percorso ricostruito con '+path.length+' tratto/i FL validati; controllare dati operativi, binari e prescrizioni.');
}

function mdo217ChangePL(value){
 const d=window.compDraft;if(!d)return;
 d.presenzaPL=value==='SI'?true:value==='NO'?false:null;
 render();
}
const mdo217PriorCalcoli=calcoli;
calcoli=function(){
 let html=mdo217PriorCalcoli();
 const d=window.compDraft;mdo32Init(d);
 const extra='<div class="toolbar"><button class="btn primary" onclick="mdo217ApplyFL()">Compila tratti dai FL validati</button>'+
 (mdoRole==='admin'?'<label class="small"><input type="checkbox" '+(d.mistoEccezionale?'checked ':'')+
 'onchange="mdo217MixToggle(this.checked)"> Abilita scenario misto eccezionale motivato</label>':'')+'</div>'+
 '<p class="small muted">I FL devono prima essere caricati come dati strutturati, controllati e convalidati. L’app non interpreta autonomamente le fiancate PDF.</p>';
 html=html.replace('<div class="panel"><h2>3 · Tratti percorsi e relativi FL</h2>',
 extra+'<div class="panel"><h2>3 · Tratti percorsi e relativi FL</h2>');
 const pl=d.presenzaPL===true?'SI':d.presenzaPL===false?'NO':'';
 const detail='<div class="formgrid">'+
  '<label>Passaggi a livello nel percorso<select class="field" onchange="mdo217ChangePL(this.value)">'+
  '<option value="" '+(!pl?'selected':'')+'>Da accertare su FL e disposizioni</option>'+
  '<option value="SI" '+(pl==='SI'?'selected':'')+'>Presenti</option>'+
  '<option value="NO" '+(pl==='NO'?'selected':'')+'>Assenti</option></select></label>'+
  mdo32GenericInput('faseLavori','Fase di lavoro / invio / ricovero')+
  mdo32GenericInput('kmInizio','Progressiva inizio cantiere')+
  mdo32GenericInput('kmFine','Progressiva fine cantiere')+'</div>';
 html=html.replace('<div class="panel"><h2>5 · Preparazione M.40 MdO (ICMO All. 1)</h2>',
 '<div class="panel"><h2>5 · Preparazione M.40 MdO (ICMO All. 1)</h2>'+detail);
 return html;
};
const mdo217PriorPrintM40=printM40Draft;
printM40Draft=function(){
 const d=window.compDraft;
 if(!d?.ids?.length)return alert('Seleziona i MdO');
 const k=mdo217Kinds(d);
 if(k.rfi&&k.imprese&&(!d.mistoEccezionale||!d.motivoMisto))return alert('Composizione mista non gestibile come ordinaria.');
 const six=mdo33SixCheck(d);
 if(six.status==='BLOCCANTE')return alert('Limite ordinario di 6 rotabili non unificati superato. Correggere la composizione.');
 if(!d.tipoMovimento)return alert('Seleziona prima il tipo di movimento, per distinguere le prescrizioni 1 e 2.');
 const t=mdo32Totals(d),work=/lavor/i.test(d.tipoMovimento);
 const e=x=>esc(x==null?'':String(x));
 const n=(x,unit)=>x===null||x===undefined?'DA COMPLETARE':mdo32Fmt(x,1)+' '+unit;
 const lines=[];
 const add=(no,body)=>lines.push('<tr><td style="width:28px;text-align:center">'+no+'</td><td>'+body+'</td></tr>');
 if(!work){
  add(1,'Trasferimento in interruzione: '+e(d.origine)+' → '+e(d.destinazione)+
  ' · binario '+e(d.binario||'DA INSERIRE')+' · linea '+e(d.linea||'DA INSERIRE')+'.');
 }else{
  add(2,'Circolazione per lavori: binario '+e(d.binario||'DA INSERIRE')+
  ' · origine '+e(d.origine)+' · fase '+e(d.faseLavori||'DA DEFINIRE')+
  ' · p.km inizio '+e(d.kmInizio||'DA INDICARE')+
  ' · p.km fine '+e(d.kmFine||'DA INDICARE')+
  ' · ricovero '+e(d.ricovero||'DA INDICARE')+'.');
 }
 add(3,'Massa rimorchiata: '+n(t.hauled,'t')+' (conteggio preliminare).');
 add(4,'Percentuale di massa frenata esistente: <b>'+n(t.ratio,'%')+'</b> (calcolo preliminare, da verificare).');
 add(5,'Velocità massima rispetto ai veicoli e ai limiti noti: '+n(t.minSpeed,'km/h')+'.');
 add(6,'Massima pendenza del tratto: '+n(t.maxSlope,'‰')+'; verificare binario e direzione.');
 if(d.presenzaPL===true)add(7,'Passaggi a livello presenti: applicare la relativa prescrizione ICMO secondo il caso reale.');
 add(8,'Prova freno: tipo '+e(d.provaTipo||'DA ATTESTARE')+
  ' · esito '+e(d.provaEsito||'DA ATTESTARE')+'. Non generare attestazioni automatiche.');
 if(d.ricovero)add(9,'Ricovero a '+e(d.ricovero)+
  '. Inserire gli ordini ricevuti dal DM/DCO/DU e quanto applicabile.');
 if(d.noteM40||d.note)add(10,e(d.noteM40||d.note));
 const notices=[];
 if(d.presenzaPL!==true)notices.push('Accertare se sono presenti PL e se ricorre la prescrizione 7.');
 if(!d.ricovero)notices.push('Verificare se ricorre la prescrizione 9 per il ricovero.');
 if(work)notices.push('Precisare fasi 1 e 3 e progressive chilometriche del cantiere.');
 if(t.ratio===null)notices.push('Massa frenata/percentuale non calcolabile.');
 const html='<h1>PREPARAZIONE DATI M.40 MdO</h1>'+
  '<p><b>BOZZA DI STUDIO, NON MODULO EMESSO, NOTIFICATO O FIRMATO</b></p>'+
  '<p>UM '+e(d.um||'UM TE1 Gallarate')+' · data '+e(d.data||'DA INDICARE')+
  ' · composizione '+e(d.ids.join(' — '))+'</p>'+
  '<table><tbody>'+lines.join('')+'</tbody></table>'+
  '<p><b>Controlli ancora necessari:</b> '+e(notices.join(' ')||'Verificare tutte le prescrizioni applicabili.')+'</p>'+
  '<p>Le prescrizioni 1/2 sono alternative. La 4 e la 8 sono sempre previste. Le prescrizioni in bianco sono da numerare in ordine, le righe residue annullate nel modulo effettivo.</p>'+
  '<p>Scorta, agente di guida, ora di conferma interruzione, presa consegna e firme: da completare dal personale competente.</p>';
 compPrintDocument('Preparazione M.40 MdO - NON EMESSO',html);
};
if(document.querySelector('.app')?.style.display==='flex')render();
