-- pagos no tenía ninguna FK hacia profesionales; el vínculo "quién pagó qué"
-- vivía solo en el código de aplicación, emparejando por email de texto libre
-- (el que el comprador escribe en el checkout de Stripe, no necesariamente el
-- de su cuenta). Añade un vínculo robusto por id.
alter table public.pagos add column if not exists profesional_id uuid references public.profesionales(id);
