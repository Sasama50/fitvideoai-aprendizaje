-- Crea automáticamente una fila en public.profesionales al registrarse un usuario.
-- Antes de este trigger, la fila solo se creaba a mano o al completar un pago
-- (webhook de Stripe), por lo que cualquier usuario registrado pero sin pagar
-- se encontraba con "profesional_no_encontrado" al intentar generar un cliente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profesionales (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
