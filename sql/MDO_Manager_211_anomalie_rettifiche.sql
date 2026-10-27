-- MDO Manager 2.11 — rettifica e archiviazione anomalie (storico conservato)
-- Eseguire dopo le migrazioni 2.9 e 2.10. Non cancella registrazioni esistenti.
BEGIN;

CREATE OR REPLACE FUNCTION public.mdo31_modifica_anomalia(p_id uuid,p_valori jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 oldrow public.mdo_anomalie%ROWTYPE;
 who text; details jsonb; prev jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.mdo_is_member() THEN
   RAISE EXCEPTION 'Utente non autorizzato' USING ERRCODE='42501';
 END IF;
 SELECT * INTO oldrow FROM public.mdo_anomalie WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Segnalazione non trovata'; END IF;
 IF COALESCE(oldrow.dettagli->>'annullato','false')='true' THEN
   RAISE EXCEPTION 'Segnalazione archiviata: non modificabile';
 END IF;
 IF NOT public.mdo_is_admin() AND (
   oldrow.created_by IS DISTINCT FROM auth.uid()
   OR NOT public.mdo30_puo_segnalare()
 ) THEN RAISE EXCEPTION 'Modifica consentita solo al compilatore autorizzato o amministratore' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_valori) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Formato valori non valido'; END IF;
 IF NULLIF(trim(p_valori->>'descrizione'),'') IS NULL THEN RAISE EXCEPTION 'Descrizione guasto obbligatoria'; END IF;
 IF p_valori->>'gravita' NOT IN ('Basso','Medio','Alto','Ordinaria','Urgente','Da valutare') THEN RAISE EXCEPTION 'Urgenza non valida'; END IF;
 IF p_valori->>'stato' NOT IN ('APERTA','SEGNALATA','IN_LAVORAZIONE','CHIUSA') THEN RAISE EXCEPTION 'Stato non valido'; END IF;
 details=COALESCE(oldrow.dettagli,'{}'::jsonb);
 prev=jsonb_build_object('modificato_il',now(),'modificato_da',auth.uid(),'precedente',
     jsonb_build_object('descrizione',oldrow.descrizione,'azioni',oldrow.azioni,'gravita',oldrow.gravita,'stato',oldrow.stato,
     'luogo',oldrow.luogo,'avviso',details->>'avviso','odl',details->>'odl'));
 details=details||jsonb_build_object(
  'unita',coalesce(p_valori#>>'{dettagli,unita}',details->>'unita',''),
  'sede',coalesce(p_valori#>>'{dettagli,sede}',details->>'sede',''),
  'telefono',coalesce(p_valori#>>'{dettagli,telefono}',details->>'telefono',''),
  'cellulare',coalesce(p_valori#>>'{dettagli,cellulare}',details->>'cellulare',''),
  'tipo_mezzo',coalesce(p_valori#>>'{dettagli,tipo_mezzo}',details->>'tipo_mezzo',''),
  'marca',coalesce(p_valori#>>'{dettagli,marca}',details->>'marca',''),
  'modello',coalesce(p_valori#>>'{dettagli,modello}',details->>'modello',''),
  'codice_servizio',coalesce(p_valori#>>'{dettagli,codice_servizio}',details->>'codice_servizio',''),
  'matricola',coalesce(p_valori#>>'{dettagli,matricola}',details->>'matricola',''),
  'materiali',coalesce(p_valori#>>'{dettagli,materiali}',details->>'materiali',''),
  'avviso',coalesce(p_valori#>>'{dettagli,avviso}',details->>'avviso',''),
  'odl',coalesce(p_valori#>>'{dettagli,odl}',details->>'odl',''),
  'riparazione',COALESCE((p_valori#>>'{dettagli,riparazione}')::boolean,(details->>'riparazione')::boolean,false),
  'fornitura_materiali',COALESCE((p_valori#>>'{dettagli,fornitura_materiali}')::boolean,(details->>'fornitura_materiali')::boolean,false),
  'modificato_il',now(),'modificato_da',auth.uid()::text,
  'revisioni',COALESCE(details->'revisioni','[]'::jsonb)||jsonb_build_array(prev)
 );
 UPDATE public.mdo_anomalie SET
  data_riscontro=COALESCE(NULLIF(p_valori->>'data_riscontro','')::timestamptz,oldrow.data_riscontro),
  luogo=COALESCE(p_valori->>'luogo',''),
  gravita=p_valori->>'gravita',
  stato=p_valori->>'stato',
  descrizione=trim(p_valori->>'descrizione'),
  azioni=COALESCE(p_valori->>'azioni',''),
  destinatario=COALESCE(p_valori->>'destinatario',''),
  dettagli=details
 WHERE id=p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.mdo31_modifica_anomalia(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mdo31_modifica_anomalia(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.mdo31_archivia_anomalia(p_id uuid,p_motivo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE oldrow public.mdo_anomalie%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR NOT public.mdo_is_member() THEN
  RAISE EXCEPTION 'Utente non autorizzato' USING ERRCODE='42501'; END IF;
 SELECT * INTO oldrow FROM public.mdo_anomalie WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Segnalazione non trovata'; END IF;
 IF NOT public.mdo_is_admin() AND (
   oldrow.created_by IS DISTINCT FROM auth.uid()
   OR NOT public.mdo30_puo_segnalare()) THEN
   RAISE EXCEPTION 'Eliminazione consentita solo al compilatore autorizzato o amministratore' USING ERRCODE='42501'; END IF;
 IF COALESCE(oldrow.dettagli->>'annullato','false')='true' THEN RETURN; END IF;
 UPDATE public.mdo_anomalie SET
  dettagli=COALESCE(dettagli,'{}'::jsonb)||
   jsonb_build_object('annullato',true,'annullato_il',now(),'annullato_da',auth.uid()::text,'motivo_annullamento',COALESCE(p_motivo,''))
 WHERE id=p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.mdo31_archivia_anomalia(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mdo31_archivia_anomalia(uuid,text) TO authenticated;
-- Rimozione MdO d'impresa riservata all'amministratore, anche se i permessi
-- DELETE diretti sulle tabelle sono disabilitati. Non applicabile a MdO RFI.
CREATE OR REPLACE FUNCTION public.mdo31_elimina_mezzo_impresa(p_codice_sap text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $
DECLARE n integer;
BEGIN
 IF NOT public.mdo_is_admin() THEN
  RAISE EXCEPTION 'Eliminazione MdO imprese riservata all’amministratore'
    USING ERRCODE='42501';
 END IF;
 IF p_codice_sap IS NULL OR left(p_codice_sap,4)<>'IMP-' THEN
  RAISE EXCEPTION 'Codice impresa non valido';
 END IF;
 DELETE FROM public.mdo_mezzi
 WHERE codice_sap=p_codice_sap AND proprietario='IMPRESA';
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END
$;
REVOKE ALL ON FUNCTION public.mdo31_elimina_mezzo_impresa(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mdo31_elimina_mezzo_impresa(text) TO authenticated;

COMMIT;
