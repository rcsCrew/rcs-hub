"use strict";
/// <reference path="../../rcs.core.ts" />
var RCSHub;
(function (RCSHub) {
    var Console;
    (function (Console) {
        const STYLE_ID = "rcs-hub-console-style";
        const CSS = `
    .rcs-hub__console-toolbar {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .rcs-hub__console-stream {
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(79,140,255,0.02);
      border-radius: 8px;
      max-height: 230px;
      overflow-y: auto;
      padding: 4px 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11.5px;
    }
    .rcs-hub__console-line {
      display: grid;
      grid-template-columns: 52px 48px 1fr;
      gap: 6px;
      align-items: center;
      padding: 2px 0;
    }
    .rcs-hub__console-ts {
      color: rgba(249,250,250,0.28);
      font-size: 10px;
    }
    .rcs-hub__console-level {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.01);
      border-radius: 4px;
      padding: 1px 4px 0;
      text-align: center;
    }
    .rcs-hub__console-msg {
      word-break: break-word;
    }
    .rcs-hub__console-line--log .rcs-hub__console-level { color: #fff; }
    .rcs-hub__console-line--info .rcs-hub__console-level { color: #4f8cff; }
    .rcs-hub__console-line--warn .rcs-hub__console-level { color: #f6c744; }
    .rcs-hub__console-line--error .rcs-hub__console-level { color: #ff5c5c; }
  `;
        function injectStyle() {
            RCSHub.appendStyle(STYLE_ID, CSS);
        }
        Console.injectStyle = injectStyle;
    })(Console = RCSHub.Console || (RCSHub.Console = {}));
})(RCSHub || (RCSHub = {}));
