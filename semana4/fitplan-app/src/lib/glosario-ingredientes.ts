// Glosario curado de ingredientes poco comunes.
// Las claves son el término base en minúsculas (sin cantidades).
// El vocabulario procede de la tabla semilla `comidas`.
export const GLOSARIO_INGREDIENTES: Record<string, string> = {
  "edamame": "Vainas de soja verde recogida antes de madurar; se cuecen y se comen los granos tiernos de dentro. Es una buena fuente de proteína vegetal. En España se encuentra congelado en muchos supermercados.",
  "tofu": "Bloque blanco y firme hecho a partir de leche de soja cuajada. Tiene sabor neutro y es rico en proteína vegetal; absorbe muy bien los aliños.",
  "tempeh": "Preparado firme de soja fermentada, con más textura y sabor que el tofu. Alto en proteína vegetal.",
  "hummus": "Crema para untar hecha de garbanzos triturados con pasta de sésamo (tahini), limón y aceite de oliva.",
  "quinoa": "Semilla de origen andino que se cocina como si fuera un cereal (parecido al arroz) y se hincha al hervir. Aporta proteína. Se pronuncia \"kinoa\".",
  "alga wakame": "Alga marina comestible de color verde, típica de la cocina japonesa. Se usa en sopas (como la de miso) y ensaladas.",
  "miso": "Pasta fermentada de soja, de sabor salado e intenso. Disuelta en caldo caliente forma la sopa de miso japonesa.",
  "caldo de miso": "Caldo caliente con pasta de miso (soja fermentada) disuelta; es la base de la sopa de miso japonesa.",
  "granola": "Mezcla horneada y crujiente de copos de avena con frutos secos, semillas y un toque de miel o sirope. Se usa en desayunos.",
  "boniato": "Tubérculo de piel rojiza y pulpa anaranjada y dulce, parecido a la patata pero más dulce. También se llama batata.",
  "espárragos trigueros": "Espárragos verdes, más finos y de sabor más intenso que los blancos de lata. Se saltean o se hacen a la plancha.",
  "semillas de chía": "Semillas pequeñas y oscuras que, en contacto con líquido, forman un gel. Ricas en fibra y omega-3.",
  "semillas de lino": "Semillas pequeñas (también llamadas linaza) ricas en fibra y omega-3. Se asimilan mejor molidas.",
  "queso feta": "Queso griego blanco, de leche de oveja o cabra. Es salado y se desmenuza con facilidad.",
  "rape": "Pescado blanco de carne firme y sabor suave, prácticamente sin espinas.",
  "picatostes": "Cubitos de pan frito o tostado que se echan por encima de cremas y ensaladas (los \"croutons\").",
  "sirope de arce": "Jarabe dulce natural extraído del árbol del arce. Se usa como la miel, para endulzar.",
  "proteína vegana": "Suplemento en polvo de origen vegetal (guisante, arroz, soja…) que se mezcla con líquido para sumar proteína a una comida.",
  "proteína en polvo": "Suplemento en polvo, de suero de leche o vegetal, que se disuelve en líquido para aumentar la proteína de una comida. Un \"cacito\" es la medida que trae el bote.",
  "pisto de verduras": "Fritada española de calabacín, berenjena, pimiento y tomate cocinados a fuego lento.",
  "crema de cacahuete": "Pasta untable hecha de cacahuetes triturados. Aporta grasas saludables y proteína.",
  "dátiles": "Fruto seco y muy dulce de la palmera datilera; se usa para endulzar de forma natural.",
  "smoothie": "Batido espeso de fruta y/o verdura triturada, normalmente con yogur, leche o bebida vegetal. Se toma frío.",
  "poke bowl": "Plato hawaiano servido en bol: base de arroz con pescado crudo (o tofu), verduras y salsa. Se pronuncia \"poqué\".",
  "poke": "Plato hawaiano de pescado crudo (o tofu) marinado, servido sobre arroz con verduras. Se pronuncia \"poqué\".",
  "wrap": "Rollito hecho enrollando una tortilla de trigo fina alrededor de un relleno (pollo, verduras, hummus…).",
  "porridge": "Gachas de avena cocida con leche o bebida vegetal hasta quedar cremosa; es un desayuno caliente. Se pronuncia \"pórrich\".",
  "huevo poché": "Huevo escalfado: se cuece sin cáscara dentro de agua caliente hasta que la clara cuaja y la yema queda líquida.",
  "poché": "Escalfado: cocido sin cáscara en agua caliente hasta que la clara cuaja y la yema queda líquida.",
  "arroz basmati": "Variedad de arroz de grano largo, fino y aromático, típico de la India.",
  "basmati": "Variedad de arroz de grano largo, fino y aromático, típico de la India.",
  "patatas panaderas": "Patatas cortadas en rodajas finas y asadas al horno con cebolla y aceite de oliva.",
};

// Términos multi-palabra: deben intentarse antes que los de una sola palabra
// para evitar coincidencias parciales (p. ej. "miso" dentro de "caldo de miso").
export const TERMINOS_GLOSARIO = Object.keys(GLOSARIO_INGREDIENTES)
  .sort((a, b) => b.length - a.length); // más largos primero
