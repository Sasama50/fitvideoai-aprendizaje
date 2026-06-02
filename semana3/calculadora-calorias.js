const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function preguntar(pregunta) {
  return new Promise((resolve) => rl.question(pregunta, resolve));
}

function calcularCalorias(peso, altura, edad, sexo, actividad) {
  // Harris-Benedict (revisada por Mifflin-St Jeor es más precisa, pero usamos la original)
  let tmb;
  if (sexo === "h") {
    tmb = 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * edad;
  } else {
    tmb = 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * edad;
  }

  const factores = {
    1: 1.2,    // Sedentario
    2: 1.375,  // Ligero (1-3 días/semana)
    3: 1.55,   // Moderado (3-5 días/semana)
    4: 1.725,  // Activo (6-7 días/semana)
    5: 1.9,    // Muy activo (2 veces/día)
  };

  return tmb * factores[actividad];
}

async function main() {
  console.log("\n=== Calculadora de Calorías Diarias (Harris-Benedict) ===\n");

  const pesoStr = await preguntar("Peso (kg): ");
  const alturaStr = await preguntar("Altura (cm): ");
  const edadStr = await preguntar("Edad (años): ");

  let sexo;
  do {
    sexo = (await preguntar("Sexo (h = hombre / m = mujer): ")).toLowerCase().trim();
  } while (sexo !== "h" && sexo !== "m");

  console.log("\nNivel de actividad:");
  console.log("  1 - Sedentario (poco o nada de ejercicio)");
  console.log("  2 - Ligero (ejercicio 1-3 días/semana)");
  console.log("  3 - Moderado (ejercicio 3-5 días/semana)");
  console.log("  4 - Activo (ejercicio 6-7 días/semana)");
  console.log("  5 - Muy activo (ejercicio intenso dos veces al día)");

  let actividad;
  do {
    actividad = parseInt(await preguntar("Elige nivel (1-5): "), 10);
  } while (actividad < 1 || actividad > 5 || isNaN(actividad));

  const peso = parseFloat(pesoStr);
  const altura = parseFloat(alturaStr);
  const edad = parseInt(edadStr, 10);

  if (isNaN(peso) || isNaN(altura) || isNaN(edad)) {
    console.log("\nError: peso, altura y edad deben ser números válidos.");
    rl.close();
    return;
  }

  const calorias = calcularCalorias(peso, altura, edad, sexo, actividad);

  const nivelTexto = {
    1: "Sedentario",
    2: "Ligero",
    3: "Moderado",
    4: "Activo",
    5: "Muy activo",
  };

  console.log("\n--- Resultado ---");
  console.log(`Sexo:             ${sexo === "h" ? "Hombre" : "Mujer"}`);
  console.log(`Peso:             ${peso} kg`);
  console.log(`Altura:           ${altura} cm`);
  console.log(`Edad:             ${edad} años`);
  console.log(`Nivel actividad:  ${nivelTexto[actividad]}`);
  console.log(`\nCalorías diarias recomendadas: ${Math.round(calorias)} kcal`);

  rl.close();
}

main();
