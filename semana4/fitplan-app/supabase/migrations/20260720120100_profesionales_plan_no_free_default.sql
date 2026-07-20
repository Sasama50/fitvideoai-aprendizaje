-- profesionales.plan defaulteaba a 'pro', lo que daba plan Pro completo gratis
-- a cualquier fila nueva sin pago. NULL ahora significa "sin plan activo".
-- El código de aplicación (límites de clientes, gate de acceso) debe tratar
-- NULL como "sin acceso", no como plan gratuito.
alter table public.profesionales alter column plan drop default;

-- Necesario para el gate de acceso (item 4): distingue "todavía no ha hecho
-- el onboarding" de "ya lo hizo pero no tiene plan". No existía ningún campo
-- que registrara esto de forma persistente.
alter table public.profesionales add column if not exists onboarding_completado boolean not null default false;

-- Backfill puntual: la única fila existente antes de esta migración
-- (caminantepaciente@protonmail.com / Manu_Fundador) ya completó el
-- onboarding real (tiene avatar HeyGen "ready"), solo que el default de la
-- columna nueva la marcaría como pendiente. Es un fix de datos de una sola
-- fila, no un backfill genérico.
update public.profesionales
set onboarding_completado = true
where user_id = '1596a2eb-e7d1-4868-b81d-a9d2effc87dd';
