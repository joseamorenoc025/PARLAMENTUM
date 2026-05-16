import crypto from 'crypto';

// Diccionario de 256 palabras comunes en español para la generación de la frase de recuperación
export const SPANISH_WORDLIST = [
  "abrir", "acceso", "actriz", "agua", "alerta", "amigo", "anillo", "apoyo",
  "arbol", "arena", "arte", "asunto", "atleta", "autor", "banco", "barco",
  "basico", "bebida", "billar", "blanco", "bloque", "bosque", "broma", "bronce",
  "bueno", "buscar", "cadena", "caja", "calma", "camino", "campo", "canal",
  "canto", "capaz", "carne", "carta", "casco", "causa", "centro", "cielo",
  "cinta", "ciudad", "claro", "clima", "cobre", "codigo", "colega", "color",
  "compra", "comun", "correo", "costa", "crear", "crisis", "cuarto", "cuenta",
  "cuerpo", "culto", "cuota", "danza", "dato", "deber", "debil", "dedo",
  "defensa", "denso", "deseo", "deuda", "diario", "doble", "doctor", "dolor",
  "drama", "duda", "dulce", "duro", "edad", "efecto", "ejemplo", "elevar",
  "emisor", "empate", "empleo", "energia", "enlace", "equipo", "error", "escala",
  "escudo", "esfuerzo", "espacio", "estado", "etapa", "exito", "extra", "falso",
  "fama", "familia", "fase", "fecha", "feliz", "feria", "fibra", "fiel",
  "finca", "firma", "fisico", "flota", "fondo", "forma", "frase", "fuego",
  "fuente", "fuerte", "funda", "futuro", "ganar", "gasto", "genio", "global",
  "globo", "golpe", "gracia", "grado", "granja", "gratis", "grupo", "guante",
  "guerra", "guia", "habito", "hacer", "hambre", "hecho", "heroe", "hielo",
  "hijo", "hogar", "hoja", "hombre", "hora", "hotel", "humor", "idea",
  "idioma", "imagen", "impacto", "impulso", "indice", "inicio", "insecto", "isla",
  "jabon", "jardin", "jefe", "joven", "juego", "juicio", "junta", "justo",
  "labor", "lado", "lago", "largo", "lector", "legal", "lejos", "lento",
  "leon", "leyenda", "libre", "limite", "linea", "lista", "local", "lucha",
  "lugar", "lujo", "luz", "madre", "magia", "maleta", "mando", "mano",
  "mapa", "marca", "marino", "masa", "mayor", "medida", "medio", "mejor",
  "menor", "mente", "mercado", "mesa", "metal", "metro", "miedo", "mito",
  "modelo", "molde", "monto", "motor", "movil", "mucho", "mundo", "nacion",
  "nadar", "nave", "negocio", "nido", "nieve", "nino", "nivel", "noche",
  "norma", "norte", "nota", "nube", "nuevo", "numero", "obra", "ocio",
  "oeste", "oficio", "oido", "ojo", "onda", "orden", "origen", "oro",
  "oscuro", "padre", "pago", "pais", "palabra", "panel", "papel", "parque",
  "parte", "paso", "patron", "pausa", "paz", "pecho", "pena", "perfil"
];

/**
 * Genera una frase de recuperación aleatoria de `wordCount` palabras usando crypto de Node.
 * @param {number} wordCount - Número de palabras (por defecto 12).
 * @returns {string} - Frase generada, separada por espacios.
 */
export function generateRecoveryPhrase(wordCount = 12) {
  const phrase = [];
  const buffer = crypto.randomBytes(wordCount * 2); // 2 bytes por palabra
  
  for (let i = 0; i < wordCount; i++) {
    // Leemos 2 bytes como un uint16
    const randomValue = buffer.readUInt16LE(i * 2);
    const randomIndex = randomValue % SPANISH_WORDLIST.length;
    phrase.push(SPANISH_WORDLIST[randomIndex]);
  }
  
  return phrase.join(' ');
}
