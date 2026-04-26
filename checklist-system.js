(function() {
    'use strict';

    window.initChecklistSystemPro = function() {
        if (window.checklistSystemPro) return;

        console.log("[GeoFS-V3.9_Checklist-System] Initializing Pro Checklist Engine...");

        const DEFAULT_CHECKLISTS = {
            "boeing 737": [
                { title: "PRE-FLIGHT", items: ["Parking Brake - SET", "Battery - ON", "APU - START", "Fuel Pumps - ON", "FMC - INITIALIZE"] },
                { title: "BEFORE TAKEOFF", items: ["Flaps - 5", "Auto-throttle - ARM", "Strobe Lights - ON", "Transponder - TA/RA"] },
                { title: "APPROACH", items: ["Altimeter - SET", "Auto-brake - 2", "Speed Brake - ARMED", "Landing Gear - DOWN"] }
            ],
            "airbus a320": [
                { title: "COCKPIT PREP", items: ["Batteries - ON", "External Power - ON", "ADIRS - NAV", "Fuel Pumps - ON"] },
                { title: "AFTER START", items: ["APU Bleed - OFF", "Engine Anti-ice - AS REQ", "Ground Spoilers - ARM", "Rudder Trim - ZERO"] },
                { title: "LANDING", items: ["Auto-land - MONITOR", "Flaps - FULL", "Cabin - READY", "Go-Around Altitude - SET"] }
            ],
            "generic": [
                { title: "PRE-FLIGHT", items: ["Flight Controls - FREE", "Fuel - CHECKED", "Instruments - SET", "Engine - START"] },
                { title: "TAKEOFF", items: ["Flaps - SET", "Lights - ON", "Throttle - MAX"] },
                { title: "LANDING", items: ["Gear - DOWN", "Flaps - FULL", "Airspeed - VREF"] }
            ]
        };

        const engine = {
            currentAircraft: "",
            currentChecklist: [],
            completedItems: new Set(),

            init: function() {
                this.detectAircraft();
                this.initDashboard();
                console.log("[GeoFS-V3.9_Checklist-System] Checklist System Pro successfully initialized.");
            },

            detectAircraft: function() {
                if (!geofs.aircraft.instance) return;
                const name = (geofs.aircraft.instance.definition.externalName || geofs.aircraft.instance.definition.name || "").toLowerCase();
                this.currentAircraft = name;
                
                let found = false;
                for (let key in DEFAULT_CHECKLISTS) {
                    if (name.includes(key)) {
                        this.currentChecklist = DEFAULT_CHECKLISTS[key];
                        found = true;
                        console.log(`[GeoFS-V3.9_Checklist-System] Found aircraft-specific checklist for: ${key}`);
                        break;
                    }
                }

                if (!found) {
                    this.currentChecklist = DEFAULT_CHECKLISTS["generic"];
                    console.log("[GeoFS-V3.9_Checklist-System] Using generic checklist for unknown aircraft.");
                }
                this.completedItems.clear();
                this.updateUI();
            },

            initDashboard: function() {
                if (document.getElementById("checklistCard") || document.getElementById("hud-pro-main-container")) {
                    console.log("[GeoFS-V3.9_Checklist-System] HUD Pro detected. Checklist will render inside HUD tab.");
                    return;
                }

                console.log("[GeoFS-V3.9_Checklist-System] Building standalone checklist card.");
                const card = document.createElement("div");
                card.id = "checklistCard";
                card.className = "addonpack-card";
                card.style.width = "350px";
                card.innerHTML = `
                    <div class="addonpack-card-header">
                        <span>📋 Checklist System Pro</span>
                        <button class="close-btn" onclick="document.getElementById('checklistCard').classList.remove('active')">✕</button>
                    </div>
                    <div class="addonpack-card-content" id="checklist-content-standalone" style="max-height: 400px; overflow-y: auto;">
                        <!-- Checklists will render here -->
                    </div>
                `;
                document.body.appendChild(card);
                if (window.initAddonDraggable) window.initAddonDraggable(card);
                this.updateUI();
            },

            updateUI: function() {
                const container = document.getElementById("tab-content-checks") || document.getElementById("checklist-content-standalone");
                if (!container) return;

                let html = `<div style="padding: 10px;">`;
                html += `<div style="font-size: 10px; color: #64c8ff; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Current: ${this.currentAircraft}</div>`;

                this.currentChecklist.forEach((section, sIdx) => {
                    html += `<div style="margin-bottom: 20px;">
                        <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">${section.title}</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">`;
                    
                    section.items.forEach((item, iIdx) => {
                        const id = `check-${sIdx}-${iIdx}`;
                        const isDone = this.completedItems.has(id);
                        html += `
                            <div onclick="window.checklistSystemPro.toggleItem('${id}')" style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px; border-radius: 4px; background: ${isDone ? 'rgba(16,185,129,0.1)' : 'transparent'}; transition: all 0.2s;">
                                <div style="width: 14px; height: 14px; border: 1px solid ${isDone ? '#10b981' : 'rgba(255,255,255,0.3)'}; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    ${isDone ? '<span style="color: #10b981; font-size: 10px;">✓</span>' : ''}
                                </div>
                                <span style="font-size: 11px; color: ${isDone ? 'rgba(255,255,255,0.5)' : '#fff'}; text-decoration: ${isDone ? 'line-through' : 'none'};">${item}</span>
                            </div>
                        `;
                    });

                    html += `</div></div>`;
                });

                html += `<button onclick="window.checklistSystemPro.reset()" class="addonpack-btn success" style="width: 100%; margin-top: 10px; height: 28px; font-size: 10px;">RESET ALL</button>`;
                html += `</div>`;
                container.innerHTML = html;
            },

            toggleItem: function(id) {
                if (this.completedItems.has(id)) {
                    this.completedItems.delete(id);
                } else {
                    this.completedItems.add(id);
                    console.log(`[GeoFS-V3.9_Checklist-System] Item checked: ${id}`);
                }
                this.updateUI();
            },

            reset: function() {
                console.log("[GeoFS-V3.9_Checklist-System] Checklist reset.");
                this.completedItems.clear();
                this.updateUI();
            }
        };

        window.checklistSystemPro = engine;
        engine.init();

        // Watch for aircraft changes
        setInterval(() => {
            if (geofs.aircraft.instance && geofs.aircraft.instance.id !== window._checkCurrId) {
                window._checkCurrId = geofs.aircraft.instance.id;
                engine.detectAircraft();
            }
        }, 3000);
    };

    if (window.SafeInit) {
        window.SafeInit('GeoFS-V3.9_Checklist-System', window.initChecklistSystemPro);
    } else {
        window.initChecklistSystemPro();
    }
})();
