"use strict";
// src/commands/console/console.layout.ts
/// <reference path="../../rcs.core.ts" />
var RCSHub;
(function (RCSHub) {
    var Console;
    (function (Console) {
        const TAB_ID = "console-live";
        const TAB_SEL = '[data-rcs-content="console-live"]';
        function renderLayout() {
            const tab = document.querySelector(TAB_SEL);
            if (!tab)
                return;
            tab.innerHTML = `
      <h2 class="rcs-hub__section-title">console runtime</h2>
      <p class="rcs-hub__section-sub">tudo que cair em console.* desta aba aparece aqui</p>

      <div class="rcs-hub__console-toolbar">
        <button class="rcs-hub__tool-btn" data-rcs-console-filter="all">all</button>
        <button class="rcs-hub__tool-btn" data-rcs-console-filter="log">log</button>
        <button class="rcs-hub__tool-btn" data-rcs-console-filter="info">info</button>
        <button class="rcs-hub__tool-btn" data-rcs-console-filter="warn">warn</button>
        <button class="rcs-hub__tool-btn" data-rcs-console-filter="error">error</button>
        <button class="rcs-hub__tool-btn" id="rcs-hub-console-clear">clear</button>
      </div>

      <div class="rcs-hub__console-stream" id="rcs-hub-console-stream">
        <!-- entries -->
      </div>
    `;
        }
        Console.renderLayout = renderLayout;
    })(Console = RCSHub.Console || (RCSHub.Console = {}));
})(RCSHub || (RCSHub = {}));
