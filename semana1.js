async function obtenerDatos() {
  const respuesta = await fetch('https://jsonplaceholder.typicode.com/todos/1')
  const datos = await respuesta.json()
  console.log('Título:', datos.title)
  console.log('Completado:', datos.completed)
}

obtenerDatos()