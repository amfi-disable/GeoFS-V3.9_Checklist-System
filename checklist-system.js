(function() {
    'use strict';

    // Shared HUD Manager
    function ensureSharedHUD() {
        if (!globalThis.hudProVisible) globalThis.hudProVisible = true;
        if (globalThis.hudProMinimized === undefined) globalThis.hudProMinimized = false;

        // Inject Core HUD CSS
        if (!document.getElementById('hudModularStyles')) {
            const style = document.createElement('style');
            style.id = 'hudModularStyles';
            style.textContent = `
                .unified-tabs { display: flex; width: 100%; gap: 2px; margin-bottom: 5px; }
                .unified-tab { flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 10px; padding: 5px 2px; cursor: pointer; transition: all 0.2s; font-family: sans-serif; font-weight: bold; text-transform: uppercase; }
                .unified-tab:hover { background: rgba(255,255,255,0.2); }
                .unified-tab.active { background: rgba(100,200,255,0.3); border-color: #64c8ff; color: #64c8ff; }
                .unified-content { display: none; }
                .unified-content.active { display: block; }
                .unified-content.unified-grid.active { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 10px; }
                #flightDataDisplay.hud-minimized { display: none !important; }
            `;
            document.head.appendChild(style);
        }

        if (!document.getElementById('hudMinimizeBtn')) {
            const btn = document.createElement('div');
            btn.id = 'hudMinimizeBtn';
            btn.innerHTML = '▣';
            btn.title = 'Toggle Info Display';
            btn.style.left = '0px'; 
            btn.style.top = '50%'; 
            btn.style.transform = 'translateY(-50%)';
            btn.onclick = () => {
                globalThis.hudProMinimized = !globalThis.hudProMinimized;
                document.getElementById('flightDataDisplay')?.classList.toggle('hud-minimized', globalThis.hudProMinimized);
                btn.innerHTML = globalThis.hudProMinimized ? '◈' : '▣';
            };
            document.body.appendChild(btn);
            if (window.initAddonDraggable) window.initAddonDraggable(btn, 'geofs-addonpack-hud-icon-pos');
        }

        if (!document.getElementById('flightDataDisplay')) {
            const panel = document.createElement('div');
            panel.id = 'flightDataDisplay';
            panel.innerHTML = `
                <div id="masterCaution" style="display:none; grid-column: 1 / -1; background: #ef4444; color: #fff; text-align: center; font-weight: 900; padding: 4px; border-radius: 6px; margin-bottom: 8px; animation: cautionPulse 1s infinite; letter-spacing: 2px; font-size: 10px; border: 1px solid #fff;">MASTER CAUTION</div>
                <div class="hud-drag-handle" style="font-size: 9px; letter-spacing: 2px; color: rgba(100,200,255,0.6);">GEOFS HUD PRO v3.9</div>
                <div class="unified-tabs" id="hud-unified-tabs"></div>
            `;
            document.body.appendChild(panel);
            if (window.initAddonDraggable) window.initAddonDraggable(panel, 'geofs-addonpack-hud-pos');
        }

        if (!window.switchHUDProTab) {
            window.switchHUDProTab = function(activeTabId) {
                globalThis.activeHudProTab = activeTabId;
                document.querySelectorAll('#flightDataDisplay .unified-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('#flightDataDisplay .unified-content').forEach(c => c.classList.remove('active'));
                
                const tabBtn = document.getElementById(`tab-btn-${activeTabId}`);
                const tabContent = document.getElementById(`tab-content-${activeTabId}`);
                if (tabBtn) tabBtn.classList.add('active');
                if (tabContent) tabContent.classList.add('active');
                
                globalThis.hudProMinimized = false;
                document.getElementById('flightDataDisplay')?.classList.remove('hud-minimized');
                const btn = document.getElementById('hudMinimizeBtn');
                if (btn) btn.innerHTML = '▣';
            };
        }

        // Visibility Controller
        if (!window._hudVisibilityLoop) {
            window._hudVisibilityLoop = setInterval(() => {
                const btn = document.getElementById('hudMinimizeBtn');
                const panel = document.getElementById('flightDataDisplay');
                if (!btn || !panel) return;

                const isVisible = globalThis.hudProVisible !== false;
                const isMinimized = globalThis.hudProMinimized === true;
                const isPaused = typeof geofs !== 'undefined' && geofs.isPaused && geofs.isPaused();

                btn.style.display = isVisible ? 'flex' : 'none';
                
                if (!isVisible || isMinimized || isPaused) {
                    panel.style.display = 'none';
                } else {
                    panel.style.display = 'grid';
                }
            }, 100);
        }
    }

    function registerHUDTab(tabId, label, contentHTML, isGrid) {
        ensureSharedHUD();
        const tabsContainer = document.getElementById('hud-unified-tabs');
        if (!document.getElementById(`tab-btn-${tabId}`)) {
            const btn = document.createElement('button');
            btn.id = `tab-btn-${tabId}`;
            btn.className = 'unified-tab';
            btn.textContent = label;
            
            // Tab ordering: ID, Fuel, Checks, Realism
            const tabOrder = { 'id': 1, 'fuel': 2, 'checks': 3, 'realism': 4 };
            btn.style.order = tabOrder[tabId] || 99;

            btn.onclick = () => window.switchHUDProTab(tabId);
            tabsContainer.appendChild(btn);
            console.log(`[HUD Shared] Registered tab: ${tabId}`);
        }

        const panel = document.getElementById('flightDataDisplay');
        if (!document.getElementById(`tab-content-${tabId}`)) {
            const content = document.createElement('div');
            content.id = `tab-content-${tabId}`;
            content.className = `unified-content ${isGrid ? 'unified-grid' : ''}`;
            content.innerHTML = contentHTML;
            panel.appendChild(content);
        }

        setTimeout(() => {
            const tabs = Array.from(document.querySelectorAll('#hud-unified-tabs .unified-tab'));
            tabs.sort((a, b) => parseInt(a.style.order) - parseInt(b.style.order));
            const firstTab = tabs[0];
            if (firstTab && !document.querySelector('.unified-tab.active')) {
                window.switchHUDProTab(firstTab.id.replace('tab-btn-', ''));
            }
        }, 500);
    }

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
                const checksHTML = `
                    <div id="hud-checklist-display" style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid rgba(100,200,255,0.1); margin: 4px 0;">
                        <!-- Checklists will render here -->
                    </div>
                `;
                registerHUDTab('checks', 'CHECKS', checksHTML, false);
                this.detectAircraft();
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
                        break;
                    }
                }
                if (!found) this.currentChecklist = DEFAULT_CHECKLISTS["generic"];
                this.completedItems.clear();
                this.updateUI();
            },

            updateUI: function() {
                const container = document.getElementById("hud-checklist-display");
                if (!container) return;

                let html = `<div style="font-size: 10px; color: #64c8ff; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Current: ${this.currentAircraft}</div>`;

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
                container.innerHTML = html;
            },

            toggleItem: function(id) {
                if (this.completedItems.has(id)) this.completedItems.delete(id);
                else this.completedItems.add(id);
                this.updateUI();
            },

            reset: function() {
                this.completedItems.clear();
                this.updateUI();
            }
        };

        window.checklistSystemPro = engine;
        engine.init();

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