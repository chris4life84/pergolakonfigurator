// UI-Controls für Terrassenplatten-Texturen und Outdoor-Möbel

export function initializeTerraceTextureControls() {
    // Finde die Befestigungs-Gruppe in Step 4
    const fasteningGroup = document.querySelector('#fastening-type')?.closest('.control-group');
    
    if (!fasteningGroup) {
        console.warn('Befestigungs-Gruppe nicht gefunden - erstelle Controls woanders');
        return;
    }
    
    // Erstelle Terrassenplatten-Textur Gruppe NACH Befestigung
    const terraceTextureGroup = document.createElement('div');
    terraceTextureGroup.className = 'control-group';
    terraceTextureGroup.innerHTML = `
        <h4 style="color:rgb(51, 51, 51)">🪨 Terrassenbelag</h4><br>
        <label>Terrassenplatten-Optik</label>
        <div class="option-card-grid" id="terrace-texture-cards" role="radiogroup" aria-label="Terrassenplatten-Textur">
            <button type="button" class="option-card option-card--texture active" data-value="stein" aria-pressed="true">
                <span class="option-card-illustration" aria-hidden="true">
                    <svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="stone-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect width="20" height="20" fill="#9ca3af"/>
                                <rect x="1" y="1" width="18" height="18" fill="#b5bcc3"/>
                                <rect x="2" y="2" width="16" height="16" fill="#cbd2d9"/>
                            </pattern>
                        </defs>
                        <rect x="15" y="20" width="90" height="35" rx="2" fill="url(#stone-pattern)"/>
                    </svg>
                </span>
                <span class="option-card-label">Steinoptik</span>
            </button>
            <button type="button" class="option-card option-card--texture" data-value="holz" aria-pressed="false">
                <span class="option-card-illustration" aria-hidden="true">
                    <svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="wood-grain" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#8b6f47"/>
                                <stop offset="50%" stop-color="#a07d4d"/>
                                <stop offset="100%" stop-color="#8b6f47"/>
                            </linearGradient>
                        </defs>
                        <rect x="15" y="20" width="90" height="35" rx="2" fill="url(#wood-grain)"/>
                        <line x1="15" y1="27" x2="105" y2="27" stroke="#6b5435" stroke-width="0.5"/>
                        <line x1="15" y1="40" x2="105" y2="40" stroke="#6b5435" stroke-width="0.5"/>
                    </svg>
                </span>
                <span class="option-card-label">Holzoptik</span>
            </button>
        </div>
        <small>Wählen Sie zwischen Stein- und Holzoptik für Ihre Terrassenplatten</small>
    `;
    
    // Füge nach Befestigungs-Gruppe ein
    fasteningGroup.parentNode.insertBefore(terraceTextureGroup, fasteningGroup.nextSibling);
    
    // Event Listeners für Textur-Buttons
    const textureCards = terraceTextureGroup.querySelectorAll('.option-card--texture');
    
    textureCards.forEach(card => {
        card.addEventListener('click', () => {
            const value = card.dataset.value;
            
            console.log(`🔘 Terrassenplatten-Button geklickt: ${value}`);
            
            // Aktualisiere Button-Status
            textureCards.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            });
            card.classList.add('active');
            card.setAttribute('aria-pressed', 'true');
            
            // Aktualisiere Konfiguration
            if (window.PergolaKonfigurator && window.PergolaKonfigurator.renderEngine) {
                console.log(`🪨 Terrassenplatten-Textur geändert zu: ${value}`);
                
                const pergola = window.PergolaKonfigurator.renderEngine.gibPergola();
                pergola.konfiguration.aktualisiereKonfiguration({
                    terrassenplattenTextur: value
                });
                
                console.log(`🔄 Erstelle Pergola neu...`);
                // Erstelle Pergola neu, um Texturen zu aktualisieren
                pergola.neuErstellen();
            } else {
                console.error('❌ PergolaKonfigurator nicht gefunden!', window.PergolaKonfigurator);
            }
        });
    });
    
    console.log('✅ Terrassenplatten-Textur Controls initialisiert');
}

export function initializeOutdoorFurnitureControls() {
    // Finde die Terrassenplatten-Textur Gruppe
    const textureGroup = document.querySelector('#terrace-texture-cards')?.closest('.control-group');
    
    if (!textureGroup) {
        console.warn('Terrassenplatten-Textur Gruppe nicht gefunden');
        return;
    }
    
    // Erstelle Outdoor-Dekoration Gruppe
    const furnitureGroup = document.createElement('div');
    furnitureGroup.className = 'control-group';
    furnitureGroup.innerHTML = `
        <h4 style="color:rgb(51, 51, 51)">🌱 Outdoor-Dekoration</h4><br>
        <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="toggle-outdoor-furniture" style="margin-right: 0.5rem;">
            <span style="font-weight: 600;">Pflanzen anzeigen</span>
        </label>
        <small style="color: #666; margin-top: 0.5rem; display: block;">
            Zeigt dekorative Topfpflanzen rund um die Pergola
        </small>
    `;
    
    // Füge nach Textur-Gruppe ein
    textureGroup.parentNode.insertBefore(furnitureGroup, textureGroup.nextSibling);
    
    const furnitureToggle = document.getElementById('toggle-outdoor-furniture');
    
    furnitureToggle.addEventListener('change', (e) => {
        const showFurniture = e.target.checked;
        console.log(`🌱 Pflanzen: ${showFurniture ? 'anzeigen' : 'ausblenden'}`);
        
        if (window.PergolaKonfigurator && window.PergolaKonfigurator.renderEngine) {
            const pergola = window.PergolaKonfigurator.renderEngine.gibPergola();
            pergola.konfiguration.aktualisiereKonfiguration({
                outdoorMoebel: showFurniture
            });
            
            // Erstelle Pergola neu, um Pflanzen hinzuzufügen/zu entfernen
            pergola.neuErstellen();
        }
    });
    
    console.log('✅ Outdoor-Dekoration Controls initialisiert');
}
