(function() {
    'use strict';

    window.initChecklistSystemPro = function() {
        if (window.checklistSystemPro) return;

        console.log("[GeoFS-V3.9_Checklist-System] Initializing Deep Pro Checklist Engine...");

        if (typeof window.registerHUDTab !== 'function') {
            console.error("[GeoFS-V3.9_Checklist-System] FATAL: window.registerHUDTab not found! Core Library might be outdated or failing.");
            return;
        }

        const DEFAULT_CHECKLISTS = {
            "boeing 737": [
                { 
                    title: "COCKPIT PREPARATION", 
                    items: [
                        { text: "Parking Brake - SET", desc: "Ensure the aircraft does not roll during power-up." },
                        { text: "Battery Switch - ON/GUARD", desc: "Main DC power is required for all systems." },
                        { text: "Standby Power - AUTO", desc: "Backup power for critical instruments." },
                        { text: "L/R Fuel Pumps - ON", desc: "Provides fuel pressure to the APU." },
                        { text: "APU - START", desc: "Wait for 'APU GEN OFF BUS' light before continuing." }
                    ] 
                },
                { 
                    title: "BEFORE TAXI", 
                    items: [
                        { text: "Generators 1 & 2 - ON", desc: "Transfer power from APU to engine generators." },
                        { text: "Probe Heat - ON", desc: "Prevents ice buildup on speed sensors." },
                        { text: "Flaps - 5", desc: "Standard takeoff configuration for 737." },
                        { text: "Flight Controls - CHECK", desc: "Move stick and rudder to ensure full travel." }
                    ] 
                },
                { 
                    title: "DESCENT & APPROACH", 
                    items: [
                        { text: "Altimeter - SET", desc: "Update barometric pressure to local airport setting." },
                        { text: "Auto-brake - 2", desc: "Sets the automatic braking intensity for landing." },
                        { text: "Speed Brake - ARMED", desc: "Spoilers will deploy automatically upon touchdown." },
                        { text: "Landing Gear - DOWN", desc: "Must be confirmed down before 1,000ft AGL." }
                    ] 
                }
            ],
            "airbus a320": [
                { 
                    title: "PRELIMINARY COCKPIT PREP", 
                    items: [
                        { text: "Batteries 1 & 2 - ON", desc: "Check voltage is above 25.5V." },
                        { text: "External Power - AS REQ", desc: "Use ground power if available to save fuel." },
                        { text: "ADIRS 1, 2, 3 - NAV", desc: "Aligns the Inertial Reference System (takes 7-10 mins)." },
                        { text: "Crew Oxygen - CHECK", desc: "Ensure pressure is sufficient for the flight." }
                    ] 
                },
                { 
                    title: "AFTER START", 
                    items: [
                        { text: "APU Bleed - OFF", desc: "Engines now provide air pressure for air conditioning." },
                        { text: "Engine Anti-ice - AS REQ", desc: "Turn ON if OAT is below 10°C in visible moisture." },
                        { text: "ECAM Status - CHECK", desc: "Ensure no 'BLUE' items remain on the status page." }
                    ] 
                },
                { 
                    title: "LANDING CONFIG", 
                    items: [
                        { text: "Auto-land - MONITOR", desc: "Confirm CAT III status if performing an auto-land." },
                        { text: "Flaps - FULL", desc: "Landing configuration for shortest rollout." },
                        { text: "Cabin - READY", desc: "Confirm cabin crew have secured the galley." }
                    ] 
                }
            ],
            "cessna 172": [
                { 
                    title: "PRE-FLIGHT", 
                    items: [
                        { text: "Fuel Selector - BOTH", desc: "Ensure fuel flows from both wing tanks." },
                        { text: "Mixture - RICH", desc: "Maximum fuel flow for engine start." },
                        { text: "Master Switch - ON", desc: "Activates the electrical bus." },
                        { text: "Beacon Light - ON", desc: "Warns ground crew that engine is about to start." }
                    ] 
                },
                { 
                    title: "BEFORE TAKEOFF", 
                    items: [
                        { text: "Elevator Trim - TAKEOFF", desc: "Set neutral pitch for rotation." },
                        { text: "Magnetos - CHECK", desc: "Run-up at 1800 RPM to check ignition systems." },
                        { text: "Carb Heat - COLD", desc: "Ensure full engine power for takeoff." }
                    ] 
                }
            ],
            "generic": [
                { 
                    title: "PRE-FLIGHT", 
                    items: [
                        { text: "Parking Brake - SET", desc: "Prevent uncommanded movement." },
                        { text: "Fuel Level - CHECK", desc: "Verify sufficient fuel for planned route." },
                        { text: "Instruments - SET", desc: "Check PFD and Navigation displays." }
                    ] 
                },
                { 
                    title: "TAKEOFF", 
                    items: [
                        { text: "Lights - ON", desc: "Landing and Strobe lights for visibility." },
                        { text: "Flaps - SET", desc: "Standard takeoff flap setting." },
                        { text: "Throttle - MAX", desc: "Apply full power smoothly." }
                    ] 
                },
                { 
                    title: "LANDING", 
                    items: [
                        { text: "Gear - DOWN", desc: "Confirm three green lights." },
                        { text: "Flaps - FULL", desc: "Increase drag and lower stall speed." },
                        { text: "Airspeed - VREF", desc: "Maintain stable approach speed." }
                    ] 
                }
            ]
        };

        const engine = {
            currentAircraft: "Detecting...",
            currentChecklist: [],
            completedItems: new Set(),

            init: function() {
                const checksHTML = `
                    <div id="hud-checklist-display" style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border: 1px solid rgba(100,200,255,0.1); margin: 4px 0; min-height: 50px;">
                        <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-align: center; padding-top: 15px;">Initializing Checklists...</div>
                    </div>
                `;
                window.registerHUDTab('checks', 'CHECKS', checksHTML, false);
                setTimeout(() => this.detectAircraft(), 1000);
            },

            detectAircraft: function() {
                let name = "Generic Aircraft";
                if (geofs.aircraft.instance) {
                    name = (geofs.aircraft.instance.definition.externalName || geofs.aircraft.instance.definition.name || "").toLowerCase();
                }
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
                
                if (window._checkCurrId !== (geofs.aircraft.instance?.id || "none")) {
                    this.completedItems.clear();
                }
                
                this.updateUI();
            },

            updateUI: function() {
                const container = document.getElementById("hud-checklist-display");
                if (!container) {
                    setTimeout(() => this.updateUI(), 500);
                    return;
                }

                let html = `<div style="font-size: 10px; color: #64c8ff; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(100,200,255,0.2); padding-bottom: 4px;">Current: ${this.currentAircraft}</div>`;

                if (this.currentChecklist.length === 0) {
                    html += `<div style="color: rgba(255,255,255,0.3); font-size: 10px; text-align: center;">No checklists available.</div>`;
                } else {
                    this.currentChecklist.forEach((section, sIdx) => {
                        html += `<div style="margin-bottom: 15px;">
                            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #fff; background: rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 4px;">${section.title}</div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">`;
                        
                        section.items.forEach((item, iIdx) => {
                            const id = `check-${sIdx}-${iIdx}`;
                            const isDone = this.completedItems.has(id);
                            html += `
                                <div onclick="window.checklistSystemPro.toggleItem('${id}')" style="display: flex; flex-direction: column; cursor: pointer; padding: 6px; border-radius: 4px; background: ${isDone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)'}; transition: all 0.2s; border: 1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'transparent'};">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="min-width: 12px; height: 12px; border: 1px solid ${isDone ? '#10b981' : 'rgba(255,255,255,0.3)'}; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                            ${isDone ? '<span style="color: #10b981; font-size: 9px;">✓</span>' : ''}
                                        </div>
                                        <span style="font-size: 11px; font-weight: 600; color: ${isDone ? 'rgba(255,255,255,0.5)' : '#fff'}; text-decoration: ${isDone ? 'line-through' : 'none'};">${item.text}</span>
                                    </div>
                                    ${!isDone ? `<div style="font-size: 9px; color: rgba(255,255,255,0.4); margin-left: 20px; margin-top: 2px; font-style: italic;">${item.desc}</div>` : ''}
                                </div>
                            `;
                        });
                        html += `</div></div>`;
                    });

                    html += `<button onclick="window.checklistSystemPro.reset()" class="addonpack-btn success" style="width: 100%; margin-top: 10px; height: 28px; font-size: 10px; background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #10b981; border-radius: 4px; cursor: pointer; font-weight: 800;">RESET CHECKLIST</button>`;
                }
                
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