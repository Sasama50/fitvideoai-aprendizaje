export function youtubeSearchUrl(nombreEjercicio: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(nombreEjercicio + ' ejercicio técnica')}`
}
