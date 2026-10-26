-- MDO Manager 2.10 - abilitazioni individuali alla segnalazione anomalie
-- Non tocca rifornimenti, mezzi, movimenti o record di anomalie esistenti.
-- Eseguire dopo la migrazione 2.9.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mdo_anomalie_abilitati (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  livello text NOT NULL CHECK (livello IN ('CUM','SPECIALISTA','CT')),
  attivo boolean NOT NULL DEFAULT true,
  aggiornato_da uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mdo_anomalie_abilitati ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mdo_anomalie_abilitati FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mdo_anomalie_abilitati TO authenticated;
DROP POLICY IF EXISTS mdo30_abilitazioni_lettura ON public.mdo_anomalie_abilitati;
CREATE POLICY mdo30_abilitazioni_lettura
  ON public.mdo_anomalie_abilitati FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (SELECT public.mdo_is_admin()));
DROP POLICY IF EXISTS mdo30_abilitazioni_admin ON public.mdo_anomalie_abilitati;
CREATE POLICY mdo30_abilitazioni_admin
  ON public.mdo_anomalie_abilitati FOR ALL TO authenticated
  USING ((SELECT public.mdo_is_admin()))
  WITH CHECK ((SELECT public.mdo_is_admin()));

CREATE OR REPLACE FUNCTION public.mdo30_puo_segnalare()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
 SELECT auth.uid() IS NOT NULL
  AND (
    public.mdo_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.mdo_anomalie_abilitati a
       JOIN public.mdo_utenti u ON u.user_id = a.user_id
       WHERE a.user_id = auth.uid()
         AND a.attivo = true AND a.livello IN ('CUM','SPECIALISTA','CT')
    )
  );
$fn$;
REVOKE ALL ON FUNCTION public.mdo30_puo_segnalare() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mdo30_puo_segnalare() TO authenticated;

-- Consenti inserimenti all'utente autenticato autorizzato.
GRANT INSERT ON public.mdo_anomalie TO authenticated;
DROP POLICY IF EXISTS mdo30_inserimento_anomalie ON public.mdo_anomalie;
CREATE POLICY mdo30_inserimento_anomalie
 ON public.mdo_anomalie FOR INSERT TO authenticated
 WITH CHECK ((SELECT public.mdo30_puo_segnalare()));

-- Ulteriore protezione anche qualora una vecchia policy INSERT sia più permissiva.
CREATE OR REPLACE FUNCTION public.mdo30_controlla_inserimento_anomalia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
    AND NOT public.mdo30_puo_segnalare() THEN
    RAISE EXCEPTION 'Non abilitato a inserire anomalie MDO'
       USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$fn$;
DROP TRIGGER IF EXISTS mdo30_verifica_segnalante ON public.mdo_anomalie;
CREATE TRIGGER mdo30_verifica_segnalante
 BEFORE INSERT ON public.mdo_anomalie
 FOR EACH ROW EXECUTE FUNCTION public.mdo30_controlla_inserimento_anomalia();

-- L'amministratore sceglie un account che abbia accesso a MDO Manager.
CREATE OR REPLACE FUNCTION public.mdo30_elenca_personale()
RETURNS TABLE(
 user_id uuid, email text, nome text, cognome text, cid text,
 livello text, attivo boolean
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
BEGIN
 IF NOT public.mdo_is_admin() THEN
   RAISE EXCEPTION 'Funzione riservata amministratore' USING ERRCODE='42501';
 END IF;
 RETURN QUERY
 SELECT u.user_id, a.email::text, u.nome, u.cognome, u.cid,
        p.livello, COALESCE(p.attivo,false)
 FROM public.mdo_utenti u
 JOIN auth.users a ON a.id=u.user_id
 LEFT JOIN public.mdo_anomalie_abilitati p ON p.user_id=u.user_id
 ORDER BY u.cognome NULLS LAST,u.nome NULLS LAST,a.email;
END
$fn$;
REVOKE ALL ON FUNCTION public.mdo30_elenca_personale() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mdo30_elenca_personale() TO authenticated;

CREATE OR REPLACE FUNCTION public.mdo30_imposta_abilitazione(
 p_user_id uuid, p_livello text, p_attivo boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
BEGIN
 IF NOT public.mdo_is_admin() THEN
   RAISE EXCEPTION 'Funzione riservata amministratore' USING ERRCODE='42501';
 END IF;
 IF p_livello NOT IN ('CUM','SPECIALISTA','CT') THEN
   RAISE EXCEPTION 'Livello non valido (CUM / SPECIALISTA / CT)';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.mdo_utenti WHERE user_id=p_user_id) THEN
   RAISE EXCEPTION 'Utente non abilitato a MDO Manager';
 END IF;
 INSERT INTO public.mdo_anomalie_abilitati(user_id,livello,attivo,aggiornato_da,updated_at)
 VALUES(p_user_id,p_livello,COALESCE(p_attivo,false),auth.uid(),now())
 ON CONFLICT(user_id) DO UPDATE
 SET livello=EXCLUDED.livello,attivo=EXCLUDED.attivo,
 aggiornato_da=EXCLUDED.aggiornato_da,updated_at=EXCLUDED.updated_at;
END
$fn$;
REVOKE ALL ON FUNCTION public.mdo30_imposta_abilitazione(uuid,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mdo30_imposta_abilitazione(uuid,text,boolean) TO authenticated;

COMMIT;

-- Verifiche non distruttive. Sono normali se l'elenco è inizialmente vuoto.
SELECT tablename,policyname,cmd FROM pg_policies
WHERE schemaname='public' AND tablename IN ('mdo_anomalie','mdo_anomalie_abilitati')
ORDER BY tablename,policyname;
SELECT user_id,livello,attivo FROM public.mdo_anomalie_abilitati ORDER BY updated_at DESC;
