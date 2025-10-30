// src/commands/network-rt.js
(function (RCSHub) {
  RCSHub.injectCSS(`
    .rcs-net-item { background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.015);border-radius:6px;padding:4px 6px; }
  `);

  RCSHub.registerCommand({
    id: "network-rt",
    name: "Network (RT)",
    render() {
      const logs = RCSHub.networkLog || [];
      return `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;">Network — tempo real</h3>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,.4);">XHR interceptado do site atual</p>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:10px;color:rgba(255,255,255,0.45);">${
                logs.length
              } reqs</span>
              ${
                RCSHub.modals && RCSHub.modals.has("network-modal")
                  ? `<button style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:7px;padding:2px 6px;font-size:10px;cursor:pointer;"
                      onclick="(function(){const m=RCSHub.modals.get('network-modal');if(m&&m.render){const p=document.createElement('div');p.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);';const inner=document.createElement('div');inner.innerHTML=m.render();p.appendChild(inner);p.onclick=(e)=>{if(e.target===p)p.remove();};document.body.appendChild(p);}})()">detalhar</button>`
                  : ""
              }
            </div>
          </div>
          <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
            ${
              logs.length
                ? logs
                    .slice(0, 80)
                    .map((r) => {
                      const okColor = r.ok
                        ? "rgba(16,185,129,0.85)"
                        : "rgba(248,113,113,0.9)";
                      return `
                      <div class="rcs-net-item">
                        <div style="display:flex;justify-content:space-between;gap:6px;">
                          <div style="font-size:11px;color:${okColor};font-weight:500;">${
                        r.method
                      }</div>
                          <div style="font-size:10px;color:rgba(255,255,255,0.35);">${
                            r.status
                          } • ${r.duration}ms</div>
                        </div>
                        <div style="font-size:10.5px;color:rgba(255,255,255,0.85);word-break:break-all;">${
                          r.url
                        }</div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.25);">${new Date(
                          r.ts || r.time || Date.now()
                        ).toLocaleTimeString()}</div>
                      </div>
                    `;
                    })
                    .join("")
                : `<div style="font-size:11px;color:rgba(255,255,255,.4);">Ainda não capturei requisições…</div>`
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
      }, 1800);
    },
  });
})(RCSHub);
