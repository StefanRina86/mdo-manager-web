# MDO Manager 2.17 - Collaudo correttivo

## Stato
- Base: 2.16, collaudo segnalato dall'utente: 34/40, esito error.
- Patch predisposta in branch, NON pubblicata su main e NON installata nel database.
- L'installazione SQL 2.17 e i test con login Supabase richiedono esecuzione controllata.
- Nessun dato aziendale reale (mezzi, scadenze, rifornimenti, giacenze) è stato modificato.

## Prima di installare
1. Salvare backup del database e verificare che siano presenti le migrazioni 2.9, 2.10, 2.11.
2. Applicare \`sql/MDO_Manager_217_operatori_fl.sql\` in un ambiente di test.
3. Verificare nomi di colonna e tipo PK della tabella \`mdo_personale_carburante\` (atteso uuid), non verificabili offline.
4. Popolare l'anagrafica MdO esclusivamente da elenco delle abilitazioni ufficiale (Guida e Scorta separatamente). Nessuna abilitazione inferita dalla semplice appartenenza alla UM.
5. Importare righe FL solo dopo averle trascritte e validate con versione, binario e direzione; non caricare dati numerici presunti.

## Prove locali su codice (eseguite senza Supabase)
- [x] JavaScript del file principale e della patch sintatticamente valido
- [x] MdO test: tara 8 t + carico 2 t = massa 10 t
- [x] MdO test: massa frenata da carta a carico 7 t; rapporto aritmetico 70%
- [x] 7 rotabili non unificati: controllo segnala BLOCCANTE, senza deroga di carta
- [x] Composizione mista: aggiunta ordinaria bloccata
- [x] M.40: trasferimento usa solo la prescrizione 1; lavori solo la 2
- [x] M.40: percentuale presente in bozza, con avviso NON EMESSO
- [x] FL validati: percorso unico A-B-C -> 2 tratti, pendenza più restrittiva 15‰, velocità minima 40 km/h
- [x] FL: percorso ambiguo non applica automaticamente dati
- [ ] E2E: inserimento/variazione profili e CID con account reale, RLS e trigger
- [ ] E2E: autorizzato apre anomalia con intervento, avviso e ODL
- [ ] E2E: registrazione nuova annuale, periodica e quinquennale positiva e ricalcolo
- [ ] E2E: verifica che lo Studio integri e mantenga dati mancanti dopo salvataggio
- [ ] E2E: verifica aggiornamento TV301 e prelievi con autorizzazioni lato database
- [ ] E2E: M.40 stampabile senza attestare firme, ora conferma e prova non eseguite
- [ ] E2E: snapshot pre/post di giacenze, mezzi e scadenze reali

## Nota normativa M.40
ICMO Allegato 1, retro modulo: prescrizioni 1 e 2 in alternativa; 4 e 8 sempre; 3 massa rimorchiata, 5 velocità, 6 pendenza dove ricorre, 7 se vi sono PL, 9 per ricovero. I dati preparatori non sono un modulo emesso né una certificazione della circolabilità.

## Rollout
Unire il branch soltanto dopo migrazione SQL in ambiente di prova, verifica delle abilitazioni ufficiali, controllo dei permessi RLS e collaudo E2E. Non inviare automatismi di modifica/azzeramento ai record reali.
