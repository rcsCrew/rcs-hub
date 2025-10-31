// src/commands/network-rt.js
(function (RCSHub) {
  RCSHub.injectCSS(`
    .rcs-net-wrap { display:flex;flex-direction:column;gap:6px;height:100%; }
    .rcs-net-list { flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px; }
    .rcs-net-item { background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.015);border-radius:6px;padding:4px 6px; }
  `);

  RCSHub.registerCommand({
    id: "network-rt",
    name: "Network (RT)",
    render: function () {
      return (
        '<div class="rcs-net-wrap">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div><h3 style="margin:0;">Network — tempo real</h3>' +
        '<p style="margin:0;font-size:10px;color:rgba(255,255,255,.4);">append-only • XHR interceptado</p></div>' +
        '<span id="rcs-net-count" style="font-size:10px;color:rgba(255,255,255,.45);">0 reqs</span>' +
        "</div>" +
        '<div class="rcs-net-list" id="rcs-net-list"></div>' +
        "</div>"
      );
    },
    onShow: function (container) {
      const list = container.querySelector("#rcs-net-list");
      const countEl = container.querySelector("#rcs-net-count");
      if (!list) return;

      let lastId = 0;

      function renderNew() {
        const logs = RCSHub.networkLog || [];
        const newOnes = [];
        for (let i = logs.length - 1; i >= 0; i--) {
          const r = logs[i];
          if (!r) continue;
          const id = r.__id || 0;
          if (id > lastId) newOnes.push(r);
        }
        newOnes
          .sort(function (a, b) {
            return (a.__id || 0) - (b.__id || 0);
          })
          .forEach(function (r) {
            const okColor = r.ok
              ? "rgba(16,185,129,0.85)"
              : "rgba(248,113,113,0.9)";
            const el = document.createElement("div");
            el.className = "rcs-net-item";
            el.innerHTML =
              '<div style="display:flex;justify-content:space-between;gap:6px;">' +
              '<div style="font-size:11px;color:' +
              okColor +
              ';font-weight:500;">' +
              r.method +
              "</div>" +
              '<div style="font-size:10px;color:rgba(255,255,255,0.35);">' +
              r.status +
              " • " +
              r.duration +
              "ms</div>" +
              "</div>" +
              '<div style="font-size:10.5px;color:rgba(255,255,255,0.85);word-break:break-all;">' +
              r.url +
              "</div>" +
              '<div style="font-size:9px;color:rgba(255,255,255,0.25);">' +
              new Date(r.ts || r.time || Date.now()).toLocaleTimeString() +
              "</div>";
            list.appendChild(el);
            lastId = r.__id || lastId;
          });

        if (countEl) countEl.textContent = (logs || []).length + " reqs";
      }

      renderNew();

      const int = setInterval(function () {
        if (!container.isConnected) return clearInterval(int);
        renderNew();
      }, 800);
    },
  });
})(RCSHub);
