-- Bucket público para alojar de forma permanente los vídeos de bienvenida.
-- Antes de esto, clientes.video_url guardaba directamente la URL firmada y
-- temporal de HeyGen (Expires=...), que caduca en ~1 semana — mismo patrón
-- que ya se corrigió para el audio (bucket "audios").
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;
