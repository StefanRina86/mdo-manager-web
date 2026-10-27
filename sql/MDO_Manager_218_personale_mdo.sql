-- MDO Manager 2.18 — estensione NON distruttiva anagrafica personale MdO.
-- Eseguire una volta in Supabase SQL Editor prima di pubblicare index.html 2.18.
-- NON assegna abilitazioni automaticamente.
BEGIN;
ALTER TABLE public.mdo_personale_carburante
 ADD COLUMN IF NOT EXISTS livello_mdo text,
 ADD COLUMN IF NOT EXISTS abilitato_guida boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS abilitato_scorta boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS puo_segnalare_anomalie boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS account_user_id uuid,
 ADD COLUMN IF NOT EXISTS note_abilitazioni text;
-- Livelli di ruolo ammessi solo CUM, SPECIALISTA, CT oppure non indicato.
ALTER TABLE public.mdo_personale_carburante
 DROP CONSTRAINT IF EXISTS mdo218_livello_personale_chk;
ALTER TABLE public.mdo_personale_carburante
 ADD CONSTRAINT mdo218_livello_personale_chk
 CHECK (livello_mdo IS NULL OR livello_mdo IN ('CUM','SPECIALISTA','CT','ALTRO'));
CREATE INDEX IF NOT EXISTS mdo218_personale_cid_idx ON public.mdo_personale_carburante(cid);
COMMIT;
-- Il diritto server-side di segnalazione guasti resta gestito dalla funzione
-- mdo30_imposta_abilitazione, associando l'account autenticato al dipendente.
-- Una riga anagrafica senza account non conferisce diritti di accesso.
