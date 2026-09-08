// Script de verificacion puntual (no toca clientes reales, solo lee "comidas").
// Reimplementa el mismo criterio que src/lib/seleccion-comidas.ts para
// contrastar los margenes elegidos (calorico 10%/20%, proteina 30% con
// relajacion) contra el catalogo real.
// Uso: node scripts/verify-modo-flexible-fase1.js (requiere .env.local con
// NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY).
const fs = require('fs');
function cargarEnvLocal(path) {
  const contenido = fs.readFileSync(path, 'utf-8').replace(/^﻿/, '');
  for (const linea of contenido.split('\n')) {
    const l = linea.trim();
    if (!l || l.startsWith('#')) continue;
    const idx = l.indexOf('=');
    if (idx === -1) continue;
    const k = l.slice(0, idx).trim();
    let v = l.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}
cargarEnvLocal('.env.local');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local');
  process.exit(1);
}
const supabase = createClient(url, key);

const MARGEN_PROTEINA_BASE = 0.3;

function dentroDeMargenCalorico(resto, referencia, margen) {
  return resto.filter((c) => Math.abs(c.calorias - referencia.calorias) <= referencia.calorias * margen);
}

function dentroDeMargenProteina(candidatas, proteinaReferencia, margen) {
  if (proteinaReferencia === null) return candidatas;
  return candidatas.filter(
    (c) => c.proteinas_g !== null && Math.abs(c.proteinas_g - proteinaReferencia) <= proteinaReferencia * margen
  );
}

async function main() {
  const { data, error } = await supabase
    .from('comidas')
    .select('id, tipo_comida, nombre, calorias, proteinas_g')
    .eq('activo', true);
  if (error) {
    console.error('Error consultando comidas:', error.message);
    process.exit(1);
  }

  const porTipo = {};
  for (const c of data) {
    (porTipo[c.tipo_comida] ??= []).push(c);
  }

  console.log(`Catalogo activo: ${data.length} comidas totales.`);
  console.log(`Margen base de proteina: +-${MARGEN_PROTEINA_BASE * 100}%`);
  let totalCasos = 0;
  let sinAlternativasNiConRelajacion = 0;
  let relajados = 0;
  let promedioAlternativasSuma = 0;

  for (const [tipo, comidas] of Object.entries(porTipo)) {
    console.log(`\n== ${tipo} (${comidas.length} comidas) ==`);
    for (const elegida of comidas) {
      totalCasos++;
      const resto = comidas.filter((c) => c.id !== elegida.id);
      let candidatasPorCalorias = dentroDeMargenCalorico(resto, elegida, 0.1);
      if (candidatasPorCalorias.length === 0) {
        candidatasPorCalorias = dentroDeMargenCalorico(resto, elegida, 0.2);
      }

      let alternativas = dentroDeMargenProteina(candidatasPorCalorias, elegida.proteinas_g, MARGEN_PROTEINA_BASE);
      let margenUsado = MARGEN_PROTEINA_BASE;
      let fueRelajado = false;
      if (alternativas.length === 0 && candidatasPorCalorias.length > 0) {
        const pasos = [0.4, 0.6, 1, Infinity];
        for (const m of pasos) {
          alternativas = dentroDeMargenProteina(candidatasPorCalorias, elegida.proteinas_g, m);
          if (alternativas.length > 0) {
            margenUsado = m;
            fueRelajado = true;
            relajados++;
            break;
          }
        }
      }

      if (alternativas.length === 0) {
        sinAlternativasNiConRelajacion++;
        console.log(
          `  [SIN ALTERNATIVAS] "${elegida.nombre}" (${elegida.calorias} kcal, prot=${elegida.proteinas_g}) — pool calorico=${candidatasPorCalorias.length}, tras filtro proteina=0 incluso relajado`
        );
      } else {
        promedioAlternativasSuma += Math.min(alternativas.length, 2);
        const marca = fueRelajado ? `  [relajado a ±${margenUsado === Infinity ? 'sin limite' : margenUsado * 100 + '%'}]` : '';
        console.log(
          `  "${elegida.nombre}" (${elegida.calorias} kcal, prot=${elegida.proteinas_g}) -> ${alternativas.length} candidatas tras margen proteina (pool calorico=${candidatasPorCalorias.length})${marca}`
        );
      }
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Total comidas evaluadas: ${totalCasos}`);
  console.log(`Requirieron relajar el margen de proteina: ${relajados} (${((relajados / totalCasos) * 100).toFixed(1)}%)`);
  console.log(`Se quedaron sin ninguna alternativa incluso relajado al maximo: ${sinAlternativasNiConRelajacion}`);
  console.log(`Media de alternativas mostradas (tope 2) cuando hay pool: ${(promedioAlternativasSuma / totalCasos).toFixed(2)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
