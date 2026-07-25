-- Revoca el acceso RPC a handle_new_user: es un trigger, no un endpoint público.
-- Al ser SECURITY DEFINER, quedaba invocable directamente vía
-- POST /rest/v1/rpc/handle_new_user por cualquiera (incluso sin sesión), detectado
-- por los security advisors (anon/authenticated_security_definer_function_executable).
-- El trigger on_auth_user_created en auth.users la sigue ejecutando igual: se
-- dispara como su definer (owner), sin depender del EXECUTE de los roles cliente.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
