-- Fondo personalizado configurable por profesional para los vídeos generados
-- por API. Si tiene valor, generar-video activa remove_background + usa esta
-- imagen; si es NULL, se mantiene el fondo original de la grabación (sin
-- regresión para profesionales que no configuren fondo).
alter table public.profesionales add column if not exists heygen_background_url text null;
