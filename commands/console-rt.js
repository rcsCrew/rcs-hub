// src/commands/console-rt.js
(function (RCSHub) {
  const BUFFER_LIMIT = 140;
  const buffer = RCSHub.consoleBuffer || [];

  if (!RCSHub.__consoleHooked) {
    const orig = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };
    function push(type, args) {
      buffer.unshift({ type, ts: Date.now(), args: Array.from(args) });
      if (buffer.length > BUFFER_LIMIT) buffer.pop();
    }
    console.log = function () {
      push("log", arguments);
      orig.log.apply(console, arguments);
    };
    console.warn = function () {
      push("warn", arguments);
      orig.warn.apply(console, arguments);
    };
    console.error = function () {
      push("error", arguments);
      orig.error.apply(console, arguments);
    };
    console.info = function () {
      push("info", arguments);
      orig.info.apply(console, arguments);
    };

    RCSHub.consoleBuffer = buffer;
    RCSHub.__consoleHooked = true;
  }

  RCSHub.injectCSS(`
    .rcs-console-line { background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.015);border-radius:6px;padding:3px 6px 4px; }
    .rcs-console-type { font-size:10px;text-transform:uppercase;margin-bottom:2px; }
    .rcs-console-msg { font-size:11px;white-space:pre-wrap;word-break:break-word; }
  `);

  RCSHub.registerCommand({
    id: "console-rt",
    name: "Console (RT)",
    render() {
      const items = RCSHub.consoleBuffer || [];
      return `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;">Console — tempo real</h3>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,.4);">Captura log / warn / error / info</p>
            </div>
            <span style="font-size:10px;color:rgba(255,255,255,0.45);">${
              items.length
            } eventos</span>
          </div>
          <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
            ${
              items.length
                ? items
                    .map((ev) => {
                      const color =
                        ev.type === "error"
                          ? "#f43f5e"
                          : ev.type === "warn"
                          ? "#f97316"
                          : ev.type === "info"
                          ? "#38bdf8"
                          : "#e2e8f0";
                      const msg = ev.args
                        .map((a) =>
                          typeof a === "object" ? JSON.stringify(a) : String(a)
                        )
                        .join(" ");
                      return `
                      <div class="rcs-console-line">
                        <div class="rcs-console-type" style="color:${color};">${
                        ev.type
                      }</div>
                        <div class="rcs-console-msg">${msg}</div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.25);">${new Date(
                          ev.ts
                        ).toLocaleTimeString()}</div>
                      </div>
                    `;
                    })
                    .join("")
                : `<div style="font-size:11px;color:rgba(255,255,255,.4);">Sem logs ainda… faça um <code>console.log('oi rcs')</code>.</div>`
            }
          </div>
        </div>
      `;
    },
    onShow(container) {
      const int = setInterval(() => {
        if (!container.isConnected) {
          clearInterval(int);
          return;
        }
        container.innerHTML = this.render();
      }, 1300);
    },
  });
})(RCSHub);
