require('dotenv').config()
const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Datos del cliente ficticio
const cliente = {
  nombre: 'Ana García',
  edad: 35,
  objetivo: 'perder 5 kg en 3 meses',
  restricciones: 'sin gluten, intolerante a la lactosa',
  actividad: '3 días de ejercicio por semana'
}

async function generarPlan() {
  console.log(`Generando plan para ${cliente.nombre}...`)

  const respuesta = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Eres un nutricionista profesional. Genera un plan nutricional semanal para este cliente:
      - Nombre: ${cliente.nombre}
      - Edad: ${cliente.edad} años
      - Objetivo: ${cliente.objetivo}
      - Restricciones: ${cliente.restricciones}
      - Actividad física: ${cliente.actividad}
      
      El plan debe incluir desayuno, comida y cena para cada día. Sé concreto y práctico.`
    }]
  })

  console.log('\n=== PLAN GENERADO POR CLAUDE ===\n')
  console.log(respuesta.content[0].text)
}

generarPlan()