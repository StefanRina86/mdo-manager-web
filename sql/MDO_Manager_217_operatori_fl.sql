-- MDO Manager 2.17 | Anagrafica unica abilitati MdO + tratti FL strutturati
-- MIGRAZIONE ADDITIVA: NON popola abilitazioni per supposizione, NON tocca
-- giacenze, movimenti carburante, mezzi, verifiche o studi esistenti.
-- Eseguire con ruolo amministratore database, dopo SQL 2.10 e 2.11.
BEGIN;

ALTER TABLE public.mdo_personale_carburante
  ADD COLUMN IF NOT EXISTS abilitato_guida boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abilitato_scorta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS puo_segnalare boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS livello text,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS nucleo text,
  ADD COLUMN IF NOT EXISTS riferimento_abilitazione text,
  ADD COLUMN IF NOT EXISTS scadenza_guida date,
  ADD COLUMN IF NOT EXISTS scadenza_scorta date;

CREATE UNIQUE INDEX IF NOT EXISTS mdo217_personale_utente_univoco
 ON public.mdo_personale_carburante(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mdo217_elenca_personale()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE risultato jsonb;
BEGIN
 IF NOT public.mdo_is_admin() THEN
  RAISE EXCEPTION 'Gestione personale riservata all''amministratore' USING ERRCODE='42501';
 END IF;
 SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.cognome,p.nome),'[]'::jsonb)
 INTO risultato
 FROM (
  SELECT id,cognome,nome,cid,attivo,puo_prelevare,puo_erogare,
         abilitato_guida,abilitato_scorta,puo_segnalare,livello,user_id,
         nucleo,riferimento_abilitazione,scadenza_guida,scadenza_scorta
  FROM public.mdo_personale_carburante
 ) p;
 RETURN risultato;
END
$fn$;
REVOKE ALL ON FUNCTION public.mdo217_elenca_personale() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mdo217_elenca_personale() TO authenticated;

CREATE OR REPLACE FUNCTION public.mdo217_salva_personale(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_id uuid; v_old_user uuid; v_user uuid;
 v_nome text; v_cognome text; v_cid text; v_livello text;
 v_puo_segnalare boolean; v_attivo boolean;
BEGIN
 IF NOT public.mdo_is_admin() THEN
  RAISE EXCEPTION 'Gestione personale riservata all''amministratore' USING ERRCODE='42501';
 END IF;
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' THEN
  RAISE EXCEPTION 'Dati personale non validi';
 END IF;
 v_id=nullif(p->>'id','')::uuid;
 v_user=nullif(p->>'user_id','')::uuid;
 v_nome=btrim(coalesce(p->>'nome',''));
 v_cognome=btrim(coalesce(p->>'cognome',''));
 v_cid=btrim(coalesce(p->>'cid',''));
 v_livello=nullif(upper(btrim(coalesce(p->>'livello',''))),'');
 v_puo_segnalare=coalesce((p->>'puo_segnalare')::boolean,false);
 v_attivo=coalesce((p->>'attivo')::boolean,false);
 IF v_nome='' OR v_cognome='' OR v_cid='' THEN
  RAISE EXCEPTION 'Nome, cognome e CID obbligatori';
 END IF;
 IF v_livello IS NOT NULL AND v_livello NOT IN ('CUM','SPECIALISTA','CT') THEN
  RAISE EXCEPTION 'Livello ammissibile: CUM, SPECIALISTA o CT';
 END IF;
 IF v_puo_segnalare AND (v_user IS NULL OR v_livello IS NULL OR NOT v_attivo) THEN
  RAISE EXCEPTION 'Segnalazione anomalie richiede operatore attivo, ruolo e account MDO collegato';
 END IF;
 IF v_user IS NOT NULL AND NOT EXISTS
   (SELECT 1 FROM public.mdo_utenti WHERE user_id=v_user) THEN
  RAISE EXCEPTION 'Account non incluso negli utenti abilitati a MDO Manager';
 END IF;
 IF EXISTS(SELECT 1 FROM public.mdo_personale_carburante
            WHERE cid=v_cid AND (v_id IS NULL OR id<>v_id)) THEN
  RAISE EXCEPTION 'Il CID è già presente in anagrafica';
 END IF;
 IF v_id IS NULL THEN
  INSERT INTO public.mdo_personale_carburante
   (cognome,nome,cid,attivo,puo_prelevare,puo_erogare,
    abilitato_guida,abilitato_scorta,puo_segnalare,livello,user_id,
    nucleo,riferimento_abilitazione,scadenza_guida,scadenza_scorta)
  VALUES
   (v_cognome,v_nome,v_cid,v_attivo,coalesce((p->>'puo_prelevare')::boolean,false),
    coalesce((p->>'puo_erogare')::boolean,false),
    coalesce((p->>'abilitato_guida')::boolean,false),
    coalesce((p->>'abilitato_scorta')::boolean,false),v_puo_segnalare,v_livello,v_user,
    nullif(btrim(p->>'nucleo'),''),nullif(btrim(p->>'riferimento_abilitazione'),''),
    nullif(p->>'scadenza_guida','')::date,nullif(p->>'scadenza_scorta','')::date)
   RETURNING id INTO v_id;
 ELSE
  SELECT user_id INTO v_old_user FROM public.mdo_personale_carburante WHERE id=v_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nominativo non trovato'; END IF;
  UPDATE public.mdo_personale_carburante SET
    cognome=v_cognome,nome=v_nome,cid=v_cid,attivo=v_attivo,
    puo_prelevare=coalesce((p->>'puo_prelevare')::boolean,false),
    puo_erogare=coalesce((p->>'puo_erogare')::boolean,false),
    abilitato_guida=coalesce((p->>'abilitato_guida')::boolean,false),
    abilitato_scorta=coalesce((p->>'abilitato_scorta')::boolean,false),
    puo_segnalare=v_puo_segnalare,livello=v_livello,user_id=v_user,
    nucleo=nullif(btrim(p->>'nucleo'),''),
    riferimento_abilitazione=nullif(btrim(p->>'riferimento_abilitazione'),''),
    scadenza_guida=nullif(p->>'scadenza_guida','')::date,
    scadenza_scorta=nullif(p->>'scadenza_scorta','')::date
  WHERE id=v_id;
  IF v_old_user IS NOT NULL AND v_old_user IS DISTINCT FROM v_user THEN
    UPDATE public.mdo_anomalie_abilitati SET attivo=false,aggiornato_da=auth.uid(),updated_at=now()
    WHERE user_id=v_old_user;
  END IF;
 END IF;
 -- Autorizzazione ai guasti applicata anche dal trigger SQL 2.10.
 IF v_user IS NOT NULL THEN
  IF v_livello IS NULL THEN
   UPDATE public.mdo_anomalie_abilitati SET attivo=false,aggiornato_da=auth.uid(),updated_at=now()
   WHERE user_id=v_user;
  ELSE
   INSERT INTO public.mdo_anomalie_abilitati(user_id,livello,attivo,aggiornato_da,updated_at)
   VALUES(v_user,v_livello,(v_attivo AND v_puo_segnalare),auth.uid(),now())
   ON CONFLICT(user_id) DO UPDATE SET
     livello=excluded.livello,attivo=excluded.attivo,
     aggiornato_da=excluded.aggiornato_da,updated_at=excluded.updated_at;
  END IF;
 END IF;
 RETURN v_id;
END
$fn$;
REVOKE ALL ON FUNCTION public.mdo217_salva_personale(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mdo217_salva_personale(jsonb) TO authenticated;

-- Archivio tratti estratti da FL e VALIDATI da un operatore autorizzato.
-- Nessun valore numerico viene dedotto dal nome della località.
CREATE TABLE IF NOT EXISTS public.mdo_fl_tratti (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 fl text NOT NULL,
 versione text NOT NULL,
 da_localita text NOT NULL,
 a_localita text NOT NULL,
 binario text NOT NULL,
 direzione text NOT NULL,
 pendenza_permille numeric,
 limite_kmh numeric,
 categoria text,
 lunghezza_max_m numeric,
 fonte text NOT NULL,
 validato boolean NOT NULL DEFAULT false,
 validato_da uuid REFERENCES auth.users(id),
 validato_il timestamptz,
 inserito_il timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT mdo_fl_pendenza_valida CHECK (pendenza_permille IS NULL OR pendenza_permille>=0),
 CONSTRAINT mdo_fl_velocita_valida CHECK (limite_kmh IS NULL OR limite_kmh>0),
 CONSTRAINT mdo_fl_lunghezza_valida CHECK (lunghezza_max_m IS NULL OR lunghezza_max_m>0)
);
ALTER TABLE public.mdo_fl_tratti ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mdo_fl_tratti FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mdo_fl_tratti TO authenticated;
DROP POLICY IF EXISTS mdo217_fl_lettura ON public.mdo_fl_tratti;
CREATE POLICY mdo217_fl_lettura ON public.mdo_fl_tratti FOR SELECT TO authenticated
 USING (public.mdo_is_admin() OR (validato AND public.mdo_is_member()));
DROP POLICY IF EXISTS mdo217_fl_admin ON public.mdo_fl_tratti;
CREATE POLICY mdo217_fl_admin ON public.mdo_fl_tratti FOR ALL TO authenticated
 USING (public.mdo_is_admin()) WITH CHECK (public.mdo_is_admin());

COMMIT;

-- CONTROLLI DI SOLA LETTURA: nessun mezzo/giacenza/studio modificato.
SELECT count(*) AS nominativi_totali FROM public.mdo_personale_carburante;
SELECT count(*) AS tratti_fl_validati FROM public.mdo_fl_tratti WHERE validato;
