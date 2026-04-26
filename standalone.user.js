// ==UserScript==
// @name         GeoFS-V3.9_Checklist-System
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Advanced interactive checklist framework for GeoFS v3.9.
// @author       AwesomeOddEven-NightKeys-LunarBlink
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @require      https://raw.githack.com/AwesomeOddEven-NightKeys-LunarBlink/GeoFS-V3.9_Design-System/main/design-system_standalone.user.js
// @require      https://raw.githack.com/AwesomeOddEven-NightKeys-LunarBlink/GeoFS-V3.9_Core-Library/main/core-library_standalone.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const checklistUrl = 'https://raw.githack.com/AwesomeOddEven-NightKeys-LunarBlink/GeoFS-V3.9_Checklist-System/main/checklist-system.js';

    function loadChecklistSystemPro() {
        if (window.checklistSystemPro) return;
        const script = document.createElement('script');
        script.src = checklistUrl;
        document.head.appendChild(script);
        console.log('[GeoFS-V3.9_Checklist-System] Standalone module script injected.');
    }

    console.log('[GeoFS-V3.9_Checklist-System] Waiting for Core and Design foundations...');

    const checker = setInterval(() => {
        // Ensure foundations are active before launching
        const coreReady = !!window.SafeInit;
        const designReady = !!document.getElementById('geofs-addon-design-system');

        if (coreReady && designReady) {
            clearInterval(checker);
            console.log('[GeoFS-V3.9_Checklist-System] Foundations confirmed. Booting Pro Checklists...');
            loadChecklistSystemPro();
        }
    }, 1000);
})();
