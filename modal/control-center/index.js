// src/modal/control-center/index.js
(function (RCSHub) {
  // estilos específicos desse modal
  RCSHub.injectCSS(`
    .rcs-cc-overlay {
      background: rgba(0,0,0,.35);
      inset: 0;
      position: fixed;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rcs-cc-shell {
      width: 880px;
      height: 520px;
      background: radial-gradient(circle at 10% 10%, rgba(23,23,24,1) 0%, rgba(11,11,11,0.8) 40%, rgba(8,8,8,0.65) 100%);
      border: 1px solid rgba(168,85,247,.25);
      border-radius: 18px;
      box-shadow: 0 24px 50px rgba(0,0,0,.45);
      display: grid;
      grid-template-columns: 190px 1fr;
      overflow: hidden;
      backdrop-filter: blur(20px);
      color: #f9fafb;
      font-family: Inter, system-ui, sans-serif;
    }
    .rcs-cc-sidebar {
      background: linear-gradient(180deg, rgba(12,12,12,.35) 0%, rgba(12,12,12,0) 35%);
      border-right: 1px solid rgba(255,255,255,0.02);
      display: flex;
      flex-direction: column;
      padding: 14px 10px 10px 12px;
      gap: 10px;
    }
    .rcs-cc-sidebar-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .02em;
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-cc-nav {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .rcs-cc-nav-btn {
      border: 0;
      background: rgba(255,255,255,0.01);
      color: rgba(249,250,250,.7);
      display: flex;
      gap: 7px;
      align-items: center;
      font-size: 11.5px;
      border-radius: 10px;
      padding: 5px 7px 5px 6px;
      cursor: pointer;
      transition: .12s ease;
    }
    .rcs-cc-nav-btn span.badge {
      font-size: 9px;
      background: rgba(168,85,247,.2);
      border: 1px solid rgba(168,85,247,.35);
      border-radius: 999px;
      padding: 1px 6px 0;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .rcs-cc-nav-btn.active,
    .rcs-cc-nav-btn:hover {
      background: rgba(168,85,247,.13);
      color: #fff;
    }
    .rcs-cc-footer {
      margin-top: auto;
      font-size: 10px;
      color: rgba(249,250,250,.32);
    }
    .rcs-cc-main {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .rcs-cc-topbar {
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px 0 14px;
      border-bottom: 1px solid rgba(255,255,255,0.02);
      backdrop-filter: blur(6px);
    }
    .rcs-cc-title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rcs-cc-title {
      font-size: 13px;
      font-weight: 600;
    }
    .rcs-cc-sub {
      font-size: 10px;
      color: rgba(249,250,250,.4);
    }
    .rcs-cc-top-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-cc-btn {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      height: 24px;
      padding: 0 8px;
      font-size: 10.5px;
      color: #fff;
      cursor: pointer;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .rcs-cc-btn.primary {
      background: radial-gradient(circle at 30% 30%, rgba(168,85,247,1) 0%, rgba(126,34,206,0.85) 55%, rgba(76,29,149,.6) 100%);
      border: 1px solid rgba(240,240,240,.15);
    }
    .rcs-cc-close {
      width: 26px; height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 9999px;
    }
    .rcs-cc-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px 14px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: radial-gradient(circle farthest-side at 100% 0%, rgba(168,85,247,.06) 0%, rgba(168,85,247,0) 50%);
    }
    .rcs-cc-section-title {
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: rgba(249,250,250,.65);
      margin-bottom: 3px;
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-cc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 9px;
    }
    .rcs-cc-card {
      background: rgba(255,255,255,0.012);
      border: 1px solid rgba(255,255,255,0.015);
      border-radius: 12px;
      padding: 8px 10px 9px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      backdrop-filter: blur(6px);
    }
    .rcs-cc-card h4 {
      margin: 0;
      font-size: 11.5px;
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-cc-card p {
      margin: 0;
      font-size: 10px;
      color: rgba(249,250,250,.35);
    }
    /* switch */
    .rcs-switch {
      position: relative;
      width: 40px;
      height: 20px;
    }
    .rcs-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .rcs-switch-track {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 999px;
      transition: .12s ease;
    }
    .rcs-switch-thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 999px;
      transition: .12s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,.35);
    }
    .rcs-switch input:checked + .rcs-switch-track {
      background: radial-gradient(circle at 10% 10%, rgba(168,85,247,1) 0%, rgba(79,70,229,.3) 65%);
      border-color: rgba(168,85,247, .55);
    }
    .rcs-switch input:checked + .rcs-switch-track .rcs-switch-thumb {
      transform: translateX(20px);
      background: #fff;
    }
    /* slider */
    .rcs-range {
      width: 100%;
      accent-color: #a855f7;
    }
    .rcs-range::-webkit-slider-thumb {
      background: #a855f7;
    }
    .rcs-cc-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .rcs-cc-value-pill {
      background: rgba(168,85,247,.1);
      border: 1px solid rgba(168,85,247,.35);
      border-radius: 999px;
      padding: 1px 10px 2px;
      font-size: 10px;
    }
    .rcs-badge-small {
      background: rgba(34,197,235,.12);
      border: 1px solid rgba(34,197,235,.4);
      border-radius: 999px;
      padding: 1px 7px 1px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .03em;
    }
  `);

  RCSHub.registerModal({
    id: "control-center",
    name: "RCS Control Center",
    desc: "Painel completo no estilo black + roxo",
    render() {
      const wrapper = document.createElement("div");
      wrapper.className = "rcs-cc-overlay";

      const shell = document.createElement("div");
      shell.className = "rcs-cc-shell";

      // sidebar
      const sidebar = document.createElement("div");
      sidebar.className = "rcs-cc-sidebar";
      sidebar.innerHTML = `
        <div class="rcs-cc-sidebar-title">
          <span style="width:20px;height:20px;border-radius:6px;background:radial-gradient(circle at 20% 20%, rgba(168,85,247,1) 0%, rgba(15,23,42,.1) 100%);display:inline-block;"></span>
          RCS HUB
        </div>
        <div class="rcs-cc-nav">
          <button class="rcs-cc-nav-btn active" data-tab="player">
            <span style="width:17px;text-align:center;">🕹</span>
            Player
            <span class="badge">live</span>
          </button>
          <button class="rcs-cc-nav-btn" data-tab="visual">
            <span style="width:17px;text-align:center;">👁</span>
            Visual
          </button>
          <button class="rcs-cc-nav-btn" data-tab="system">
            <span style="width:17px;text-align:center;">🧩</span>
            Sistema
          </button>
          <button class="rcs-cc-nav-btn" data-tab="extras">
            <span style="width:17px;text-align:center;">✨</span>
            Extras
          </button>
        </div>
        <div class="rcs-cc-footer">
          v${RCSHub.version || "0.0.0"} • rcsCrew
        </div>
      `;

      // main
      const main = document.createElement("div");
      main.className = "rcs-cc-main";
      main.innerHTML = `
        <div class="rcs-cc-topbar">
          <div class="rcs-cc-title-block">
            <div class="rcs-cc-title">Painel de Controle</div>
            <div class="rcs-cc-sub">Ajuste funções em tempo real • ${new Date().toLocaleTimeString()}</div>
          </div>
          <div class="rcs-cc-top-actions">
            <button class="rcs-cc-btn" id="rcs-cc-refresh">recarregar manifest</button>
            <button class="rcs-cc-btn primary" id="rcs-cc-apply">aplicar</button>
            <div class="rcs-cc-close" id="rcs-cc-close">×</div>
          </div>
        </div>
        <div class="rcs-cc-content" id="rcs-cc-content">
          <!-- conteúdo dinâmico -->
        </div>
      `;

      shell.appendChild(sidebar);
      shell.appendChild(main);
      wrapper.appendChild(shell);

      // monta conteúdo inicial
      function renderTab(tab) {
        const el = main.querySelector("#rcs-cc-content");
        // player tab
        if (tab === "player") {
          el.innerHTML = `
            <div>
              <div class="rcs-cc-section-title">Players • function <span class="rcs-badge-small">live</span></div>
              <div class="rcs-cc-grid">
                <div class="rcs-cc-card">
                  <h4>Speed Player</h4>
                  <p>Velocidade de deslocamento.</p>
                  <div class="rcs-cc-row">
                    <input type="range" min="1" max="50" value="16" class="rcs-range" data-setting="speed"/>
                    <span class="rcs-cc-value-pill" id="rcs-speed-val">16</span>
                  </div>
                </div>
                <div class="rcs-cc-card">
                  <h4>Jumppower</h4>
                  <p>Altura do pulo.</p>
                  <div class="rcs-cc-row">
                    <input type="range" min="10" max="200" value="50" class="rcs-range" data-setting="jump"/>
                    <span class="rcs-cc-value-pill" id="rcs-jump-val">50</span>
                  </div>
                </div>
                <div class="rcs-cc-card">
                  <h4>Gravity</h4>
                  <p>Força aplicada no chão.</p>
                  <div class="rcs-cc-row">
                    <input type="range" min="-50" max="300" value="196" class="rcs-range" data-setting="gravity"/>
                    <span class="rcs-cc-value-pill" id="rcs-grav-val">196</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div class="rcs-cc-section-title" style="margin-top:6px;">Misc • function</div>
              <div class="rcs-cc-grid">
                <div class="rcs-cc-card">
                  <h4>Freeze Speed</h4>
                  <p>Travando velocidade atual.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="freeze">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Noclip</h4>
                  <p>Passar por paredes.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="noclip">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Infinite Jump</h4>
                  <p>Pulo infinito no espaço.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="infjump" checked>
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>FlyGui</h4>
                  <p>Exibe painel de voo.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="fly">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
              </div>
            </div>
          `;
        }

        if (tab === "visual") {
          el.innerHTML = `
            <div>
              <div class="rcs-cc-section-title">Visual</div>
              <div class="rcs-cc-grid">
                <div class="rcs-cc-card">
                  <h4>Dark overlay</h4>
                  <p>Escurece o fundo do jogo.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="dark-overlay" checked>
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Bloom FX</h4>
                  <p>Brilho sutil em elementos.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="bloom">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Glass mode</h4>
                  <p>Deixa o painel translúcido.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="glass" checked>
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
              </div>
            </div>
          `;
        }

        if (tab === "system") {
          el.innerHTML = `
            <div>
              <div class="rcs-cc-section-title">Sistema</div>
              <div class="rcs-cc-grid">
                <div class="rcs-cc-card">
                  <h4>Auto-sync GitHub</h4>
                  <p>Puxar manifest a cada 3 min.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="autosync" checked>
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Debug log</h4>
                  <p>Mostrar console do hub.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="debug" ${
                      RCSHub.debug ? "checked" : ""
                    }>
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Modo compacto</h4>
                  <p>Reduz espaçamentos.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="compact">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
              </div>
            </div>
          `;
        }

        if (tab === "extras") {
          el.innerHTML = `
            <div>
              <div class="rcs-cc-section-title">Extras</div>
              <div class="rcs-cc-grid">
                <div class="rcs-cc-card">
                  <h4>InfiniteYield</h4>
                  <p>Carrega painel externo (se estiver disponível).</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="inf-yield">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
                <div class="rcs-cc-card">
                  <h4>Emote R15</h4>
                  <p>Forçar animações.</p>
                  <label class="rcs-switch">
                    <input type="checkbox" data-setting="emote-r15">
                    <span class="rcs-switch-track"><span class="rcs-switch-thumb"></span></span>
                  </label>
                </div>
              </div>
            </div>
          `;
        }

        // listeners de range pra atualizar pill
        el.querySelectorAll(".rcs-range").forEach((rng) => {
          rng.addEventListener("input", () => {
            const id = rng.getAttribute("data-setting");
            const valEl =
              id === "speed"
                ? el.querySelector("#rcs-speed-val")
                : id === "jump"
                ? el.querySelector("#rcs-jump-val")
                : id === "gravity"
                ? el.querySelector("#rcs-grav-val")
                : null;
            if (valEl) valEl.textContent = rng.value;
          });
        });
      }

      // render inicial
      renderTab("player");

      // troca de aba
      sidebar.querySelectorAll(".rcs-cc-nav-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          sidebar
            .querySelectorAll(".rcs-cc-nav-btn")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          renderTab(btn.getAttribute("data-tab"));
        });
      });

      // fechar
      main.querySelector("#rcs-cc-close").addEventListener("click", () => {
        wrapper.remove();
      });
      // recarregar manifest
      main.querySelector("#rcs-cc-refresh").addEventListener("click", () => {
        if (typeof window.RCSHub !== "undefined") {
          // só chamar o sync do core se estiver exposto
          // se não estiver, só loga
          if (typeof window.RCSHub._forceSync === "function") {
            window.RCSHub._forceSync();
          } else {
            window.RCSHub.log(
              "precisa expor _forceSync no core pra recarregar via modal."
            );
          }
        }
      });
      // aplicar
      main.querySelector("#rcs-cc-apply").addEventListener("click", () => {
        RCSHub.log("Aplicar: aqui vc executa os handlers reais.");
      });

      return wrapper.outerHTML;
    },
  });
})(RCSHub);
