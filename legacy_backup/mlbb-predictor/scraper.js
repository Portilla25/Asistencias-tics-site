// ----------------------------------------------------
// Scraper Client-Side (Extracción de Datos de Liquipedia)
// ----------------------------------------------------
// Usamos un proxy CORS (AllOrigins) para poder hacer fetch de HTML directamente desde el navegador.

const CORS_PROXY = "https://api.allorigins.win/get?url=";
// URL global de Liquipedia que contiene todos los partidos próximos y en curso de todas las ligas
const MATCHES_URL = "https://liquipedia.net/mobilelegends/Liquipedia:Matches";

const Scraper = {
    /**
     * Extrae el HTML de una URL pasada por el proxy CORS
     */
    async fetchHTML(url) {
        try {
            console.log(`Scraping de: ${url}...`);
            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
            const data = await response.json();
            
            // Convertir el string HTML en un objeto DOM parseable
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, "text/html");
            return doc;
        } catch (error) {
            console.error("Error en el Scraping:", error);
            return null;
        }
    },

    /**
     * Extrae equipos y sus resultados (Histórico básico)
     */
    async getTeamsAndStandings(leagueUrl) {
        // En una app completa, iteraríamos por las páginas de cada liga.
        // Por ahora, retornamos un arreglo vacío para que el predictor use el ELO base estadístico.
        return [];
    },

    /**
     * Extrae partidos próximos reales de la página global de Liquipedia
     */
    async getUpcomingMatches() {
        console.log("Buscando partidos actuales en Liquipedia...");
        const doc = await this.fetchHTML(MATCHES_URL);
        if (!doc) return [];

        let matches = [];
        
        // Liquipedia usa tablas o divs específicos para el ticker de partidos.
        // Buscamos los contenedores de partidos (infobox_matches_content o wikitable)
        const matchElements = doc.querySelectorAll('.infobox_matches_content, table.wikitable');
        
        matchElements.forEach((matchEl, index) => {
            try {
                // Seleccionar nombres de equipos (usualmente en la clase team-left y team-right o td.team-left)
                const team1El = matchEl.querySelector('.team-left a, td.team-left a, .team-template-text a');
                // Para el equipo 2, buscamos el último elemento de equipo en la fila
                const teamEls = matchEl.querySelectorAll('.team-right a, td.team-right a, .team-template-text a');
                const team2El = teamEls.length > 0 ? teamEls[teamEls.length - 1] : null;
                
                // Extraer el nombre de la liga (usualmente en .match-filler o un span abajo)
                const leagueEl = matchEl.querySelector('.match-filler a, .league-icon-small a');
                
                if (team1El && team2El && team1El.textContent !== team2El.textContent) {
                    const t1 = team1El.textContent.trim();
                    const t2 = team2El.textContent.trim();
                    const league = leagueEl ? leagueEl.title || leagueEl.textContent.trim() : "Torneo Global";
                    
                    // Evitar duplicados (Liquipedia a veces repite elementos en móvil/desktop)
                    const isDuplicate = matches.find(m => m.team1 === t1 && m.team2 === t2);
                    
                    if (t1 && t2 && !isDuplicate) {
                        matches.push({
                            id: index,
                            team1: t1,
                            team2: t2,
                            league: league.replace('page does not exist', '').trim()
                        });
                    }
                }
            } catch (e) {
                // Ignorar filas que no cumplen el formato
            }
        });

        // Si el DOM de Liquipedia cambió dramáticamente y no encontró nada, usar un fallback real de la temporada actual
        if (matches.length === 0) {
            console.warn("No se pudo parsear el DOM exacto, usando Fallback manual temporal de ligas actuales.");
            matches = [
                { id: 1, team1: "ONIC", team2: "EVOS", league: "MPL ID" },
                { id: 2, team1: "RRQ", team2: "BTR", league: "MPL ID" },
                { id: 3, team1: "AP.Bren", team2: "Blacklist", league: "MPL PH" },
                { id: 4, team1: "ECHO", team2: "RSG PH", league: "MPL PH" },
                { id: 5, team1: "HomeBois", team2: "Team HAQ", league: "MPL MY" }
            ];
        }

        return matches;
    }
};
