// ----------------------------------------------------
// Predictor - Modelo Estadístico Base
// ----------------------------------------------------

const Predictor = {
    /**
     * Calcula la probabilidad de victoria de dos equipos basados en sus estadísticas.
     * En una fase más avanzada, esto integrará KDA y oro/min de jugadores.
     */
    calculateProbability(team1Stats, team2Stats) {
        // Valores por defecto si no hay stats previas
        if (!team1Stats) team1Stats = { winRate: 50, elo: 1200 };
        if (!team2Stats) team2Stats = { winRate: 50, elo: 1200 };

        // 1. Diferencia de Elo (Power Ranking Base)
        const eloDiff = team1Stats.elo - team2Stats.elo;
        // Fórmula de probabilidad de ELO estándar: 1 / (1 + 10 ^ (diff / 400))
        let probT1Elo = 1 / (1 + Math.pow(10, (-eloDiff / 400)));

        // 2. Ajuste por WinRate Reciente
        const wrDiff = (team1Stats.winRate - team2Stats.winRate) / 100;
        
        // Promediamos ambos factores (dando un peso al ELO y al momentum reciente)
        // Probabilidad cruda
        let finalProbT1 = (probT1Elo * 0.7) + (0.5 + (wrDiff * 0.5)) * 0.3;
        
        // Limitar entre 10% y 90% (los upsets siempre son posibles en MLBB)
        if (finalProbT1 > 0.9) finalProbT1 = 0.9;
        if (finalProbT1 < 0.1) finalProbT1 = 0.1;

        const probT2 = 1 - finalProbT1;

        return {
            team1: Math.round(finalProbT1 * 100),
            team2: Math.round(probT2 * 100)
        };
    },

    /**
     * Genera la predicción completa para un partido, analizando los datos 
     */
    async analyzeMatch(match, historicalData) {
        // Buscar stats en el histórico
        const t1Stats = historicalData.find(t => t.name === match.team1);
        const t2Stats = historicalData.find(t => t.name === match.team2);

        // Simulamos stats si no se encontraron en el scraper (mock para visualización)
        const mockT1 = t1Stats || { winRate: 65 + (Math.random()*10), elo: 1300 + Math.random()*200 };
        const mockT2 = t2Stats || { winRate: 45 + (Math.random()*10), elo: 1100 + Math.random()*200 };

        const probs = this.calculateProbability(mockT1, mockT2);

        return {
            ...match,
            prediction: probs,
            reasoning: probs.team1 > probs.team2 
                ? `${match.team1} tiene un mejor momentum y win-rate.` 
                : `${match.team2} estadísticamente supera el power ranking actual.`
        };
    }
};
