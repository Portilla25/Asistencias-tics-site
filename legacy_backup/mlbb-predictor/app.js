// ----------------------------------------------------
// App principal - Lógica de UI y Orquestación
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    const elements = {
        matchesContainer: document.getElementById('matches-container'),
        btnUpdate: document.getElementById('btn-update-data'),
        totalMatches: document.getElementById('total-matches'),
        modelAccuracy: document.getElementById('model-accuracy'),
        navItems: document.querySelectorAll('.nav-item'),
        leagueBadges: document.querySelectorAll('.badge'),
        predictionsSection: document.querySelector('.predictions-section')
    };

    // Estado global de la aplicación
    const state = {
        matches: [],
        predictions: [],
        historicalData: [],
        currentFilter: 'Todas'
    };

    /**
     * Inicializa el dashboard
     */
    function init() {
        console.log("Iniciando MLBB Oracle...");
        
        // 1. Asignar eventos PRIMERO (para que los botones funcionen al instante)
        elements.btnUpdate.addEventListener('click', loadDataAndPredict);
        
        // Eventos para el Sidebar (Navegación)
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Remover clase active de todos
                elements.navItems.forEach(nav => nav.classList.remove('active'));
                // Añadir al clickeado
                item.classList.add('active');
                
                const sectionName = item.textContent.trim();
                if (sectionName === 'Predicciones Hoy') {
                    elements.predictionsSection.style.display = 'block';
                    renderMatches(getFilteredPredictions());
                } else {
                    elements.predictionsSection.style.display = 'block';
                    elements.matchesContainer.innerHTML = `
                        <div class="loading-state">
                            <i class="fa-solid fa-person-digging" style="color:var(--text-secondary)"></i>
                            <p>La sección "${sectionName}" está en desarrollo.</p>
                        </div>
                    `;
                }
            });
        });

        // Eventos para los Filtros de Ligas
        elements.leagueBadges.forEach(badge => {
            badge.addEventListener('click', (e) => {
                elements.leagueBadges.forEach(b => b.classList.remove('active'));
                badge.classList.add('active');
                state.currentFilter = badge.textContent.trim();
                renderMatches(getFilteredPredictions());
            });
        });

        // 2. Cargar datos de fondo (Scraping) sin bloquear la interfaz
        loadDataAndPredict();
    }

    /**
     * Devuelve las predicciones filtradas por la liga seleccionada
     */
    function getFilteredPredictions() {
        if (state.currentFilter === 'Todas') {
            return state.predictions;
        }
        return state.predictions.filter(p => p.league === state.currentFilter);
    }

    /**
     * Orquesta el flujo de Scraping -> Predicción -> UI
     */
    async function loadDataAndPredict() {
        showLoading();
        
        try {
            // 1. Extraer o cargar datos históricos (Scraping)
            state.historicalData = await Scraper.getTeamsAndStandings(TARGET_URL);
            
            // 2. Extraer partidos próximos
            state.matches = await Scraper.getUpcomingMatches(TARGET_URL);
            
            // 3. Generar Predicciones
            state.predictions = [];
            for (let match of state.matches) {
                const pred = await Predictor.analyzeMatch(match, state.historicalData);
                state.predictions.push(pred);
            }
            
            // 4. Actualizar Firebase (si estuviera configurado)
            saveToFirebase(state.predictions);
            
            // 5. Renderizar
            renderMatches(getFilteredPredictions());
            
            // Actualizar stats
            elements.totalMatches.innerText = state.predictions.length;
            elements.modelAccuracy.innerText = "72.4%"; // Simulado por ahora
            
        } catch (error) {
            console.error("Error en el flujo principal:", error);
            elements.matchesContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-red)"></i>
                    <p>Error al cargar las predicciones. Intenta nuevamente.</p>
                </div>
            `;
        }
    }

    /**
     * Renderiza las tarjetas de partidos en el DOM
     */
    function renderMatches(predictions) {
        elements.matchesContainer.innerHTML = '';
        
        if (predictions.length === 0) {
            elements.matchesContainer.innerHTML = `
                <div class="loading-state">
                    <p style="color:var(--text-secondary)">No hay partidos próximos para esta liga.</p>
                </div>
            `;
            return;
        }

        predictions.forEach(p => {
            const isT1Favored = p.prediction.team1 > p.prediction.team2;
            
            const cardHTML = `
                <div class="match-card">
                    <div class="match-header">
                        <span><i class="fa-solid fa-gamepad"></i> ${p.league}</span>
                        <span><i class="fa-regular fa-clock"></i> Hoy</span>
                    </div>
                    
                    <div class="match-teams">
                        <div class="team">
                            <div class="team-logo">${p.team1.substring(0,3)}</div>
                            <div class="team-name" style="color: ${isT1Favored ? 'var(--accent-gold)' : 'var(--text-primary)'}">${p.team1}</div>
                        </div>
                        
                        <div class="vs">VS</div>
                        
                        <div class="team">
                            <div class="team-logo">${p.team2.substring(0,3)}</div>
                            <div class="team-name" style="color: ${!isT1Favored ? 'var(--accent-gold)' : 'var(--text-primary)'}">${p.team2}</div>
                        </div>
                    </div>
                    
                    <div class="prediction-bar">
                        <div class="prob-t1" style="width: ${p.prediction.team1}%"></div>
                        <div class="prob-t2" style="width: ${p.prediction.team2}%"></div>
                    </div>
                    
                    <div class="prediction-stats">
                        <span class="stat-t1">${p.prediction.team1}%</span>
                        <span style="color: var(--text-muted); font-size: 11px; font-weight: normal; text-align: center;">WIN PROBABILITY</span>
                        <span class="stat-t2">${p.prediction.team2}%</span>
                    </div>
                </div>
            `;
            elements.matchesContainer.innerHTML += cardHTML;
        });
    }

    /**
     * Muestra el spinner de carga
     */
    function showLoading() {
        elements.matchesContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Analizando datos recientes y generando modelos...</p>
            </div>
        `;
    }
    
    /**
     * Función mock para guardar en Firebase
     */
    function saveToFirebase(data) {
        if (typeof db !== 'undefined') {
            console.log("Guardando predicciones en Firebase...");
            // db.collection('predictions').add({...});
        }
    }

    // Iniciar app
    init();
});
