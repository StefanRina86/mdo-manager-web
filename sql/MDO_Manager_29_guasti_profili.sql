-- MDO Manager 2.9 - PROFILI E SCHEDA GUASTI
-- Migrazione additiva: non cancella dati, RLS e policy esistenti rimangono.
ALTER TABLE public.mdo_utenti
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS cognome text,
  ADD COLUMN IF NOT EXISTS cid text,
  ADD COLUMN IF NOT EXISTS funzione text,
  ADD COLUMN IF NOT EXISTS nucleo text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS cellulare text;

ALTER TABLE public.mdo_anomalie
  ADD COLUMN IF NOT EXISTS dettagli jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Permette di aggiornare unicamente il proprio profilo di compilazione,
-- senza concedere agli utenti modifiche alla colonna ruolo o ad altri account.
CREATE OR REPLACE FUNCTION public.mdo_aggiorna_profilo(
  p_nome text, p_cognome text, p_cid text, p_funzione text,
  p_nucleo text, p_telefono text, p_cellulare text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.mdo_is_member() THEN
    RAISE EXCEPTION 'Utente non abilitato MDO';
  END IF;
  IF nullif(btrim(p_nome),'') IS NULL OR nullif(btrim(p_cognome),'') IS NULL THEN
    RAISE EXCEPTION 'Nome e cognome sono obbligatori';
  END IF;
  UPDATE public.mdo_utenti SET
    nome=btrim(p_nome),cognome=btrim(p_cognome),
    cid=nullif(btrim(p_cid),''),funzione=nullif(btrim(p_funzione),''),
    nucleo=nullif(btrim(p_nucleo),''),telefono=nullif(btrim(p_telefono),''),
    cellulare=nullif(btrim(p_cellulare),'')
  WHERE user_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Account non presente negli utenti MDO'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.mdo_aggiorna_profilo(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mdo_aggiorna_profilo(text,text,text,text,text,text,text) TO authenticated;
-- Controllo colonne aggiunte
SELECT table_name,column_name
FROM information_schema.columns
WHERE table_schema='public'
  AND ((table_name='mdo_anomalie' AND column_name='dettagli')
    OR (table_name='mdo_utenti' AND column_name IN ('nome','cognome','cid','funzione','nucleo','telefono','cellulare')))
ORDER BY table_name,column_name;
