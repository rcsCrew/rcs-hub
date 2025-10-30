// src/modal/network/index.js
(function (RCSHub) {
  RCSHub.registerModal({
    id: "network-modal",
    name: "Network — detalhe",
    desc: "Mostra últimas 20 requisições interceptadas.",
    render() {
      const logs = (RCSHub.networkLog || []).slice(0, 20);
      return `
        <div style="background:rgba(15,15,15,.95);border:1px solid rgba(255,255,255,0.05);border-radius:16px;min-width:420px;max-width:640px;max-height:80vh;overflow:auto;padding:14px 14px 12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h3 style="margin:0;">Network — detalhe</h3>
            <button style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:9999px;padding:2px 10px;font-size:11px;cursor:pointer;" onclick="this.closest('div[style]').parentElement.parentElement.remove()">fechar</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${
              logs.length
                ? logs
                    .map(
                      (r) => `
                    <div style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.015);border-radius:6px;padding:4px 6px;">
                      <div style="display:flex;justify-content:space-between;gap:6px;">
                        <span style="font-size:11px;color:${
                          r.ok ? "#22c55e" : "#f43f5e"
                        };">${r.method}</span>
                        <span style="font-size:10px;color:rgba(255,255,255,0.35);">${
                          r.status
                        } • ${r.duration}ms</span>
                      </div>
                      <div style="font-size:10.5px;color:rgba(255,255,255,0.85);word-break:break-all;">${
                        r.url
                      }</div>
                    </div>
                  `
                    )
                    .join("")
                : '<div style="font-size:11px;color:rgba(255,255,255,0.45);">Sem dados ainda…</div>'
            }
          </div>
        </div>
      `;
    },
  });
})(RCSHub);
