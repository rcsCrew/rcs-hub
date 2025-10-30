// src/commands/overview.js
(function (RCSHub) {
  RCSHub.registerCommand({
    id: "overview",
    name: "Overview",
    render() {
      return `
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <h3 style="margin:0 0 2px 0;">RCS HUB — Overview</h3>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,.45);">
              Host: ${location.hostname} • ${new Date().toLocaleString()}
            </p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;">
            <div style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.03);border-radius:10px;padding:6px 8px;">
              <div style="font-size:10px;color:rgba(255,255,255,0.45);">Comandos</div>
              <div style="font-size:16px;font-weight:600;">${
                RCSHub.commands.size
              }</div>
            </div>
            <div style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.03);border-radius:10px;padding:6px 8px;">
              <div style="font-size:10px;color:rgba(255,255,255,0.45);">Modais</div>
              <div style="font-size:16px;font-weight:600;">${
                RCSHub.modals.size
              }</div>
            </div>
            <div style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.03);border-radius:10px;padding:6px 8px;">
              <div style="font-size:10px;color:rgba(255,255,255,0.45);">Network log</div>
              <div style="font-size:16px;font-weight:600;">${
                (RCSHub.networkLog || []).length
              }</div>
            </div>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.65);">
            Quer nova função? Cria em <code>src/commands/</code> e coloca no <code>manifest.json</code>.
          </div>
        </div>
      `;
    },
  });
})(RCSHub);
