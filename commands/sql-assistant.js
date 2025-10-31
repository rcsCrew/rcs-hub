// src/commands/sql-assistant.js
(function (RCSHub) {
  // =================== ESTILOS ===================
  RCSHub.injectCSS(`
    .rcs-sql-wrap {
      display: grid;
      grid-template-columns: 180px 1.5fr 1fr;
      gap: 10px;
      height: 100%;
      min-height: 420px;
      font-family: Inter, system-ui, sans-serif;
    }
    .rcs-sql-panel {
      background: rgba(15,15,15,.22);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 12px;
      padding: 8px 9px 9px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      backdrop-filter: blur(12px);
    }
    .rcs-sql-title {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: .02em;
      color: rgba(249,250,250,.9);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .rcs-sql-sub {
      font-size: 10px;
      color: rgba(249,250,250,.3);
    }
    .rcs-sql-tablelist {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .rcs-sql-tablebtn {
      background: rgba(255,255,255,0.01);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 8px;
      padding: 4px 5px 4px;
      font-size: 10.5px;
      display: flex;
      justify-content: space-between;
      gap: 6px;
      cursor: pointer;
      transition: .12s ease;
      color: rgba(249,250,250,.7);
    }
    .rcs-sql-tablebtn.active,
    .rcs-sql-tablebtn:hover {
      background: rgba(168,85,247,.16);
      border-color: rgba(168,85,247,.32);
      color: #fff;
    }
    .rcs-sql-btn-sm {
      background: rgba(255,255,255,0.01);
      border: 1px solid rgba(255,255,255,0.03);
      border-radius: 9999px;
      font-size: 10px;
      height: 22px;
      padding: 0 8px 1px;
      cursor: pointer;
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .rcs-sql-formrow {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-sql-label {
      font-size: 10px;
      color: rgba(249,250,250,.38);
      min-width: 62px;
    }
    .rcs-sql-input,
    .rcs-sql-select {
      background: rgba(0,0,0,.15);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 7px;
      font-size: 10px;
      color: #fff;
      padding: 3px 6px 3px;
      outline: none;
      width: 100%;
    }
    .rcs-sql-input:focus,
    .rcs-sql-select:focus,
    .rcs-sql-textarea:focus {
      border-color: rgba(168,85,247,.55);
      background: rgba(0,0,0,.25);
    }
    .rcs-sql-textarea {
      background: rgba(0,0,0,.15);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 7px;
      font-size: 10px;
      color: #fff;
      padding: 5px 6px 5px;
      outline: none;
      width: 100%;
      resize: vertical;
      min-height: 52px;
    }
    .rcs-sql-columns {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 230px;
      overflow-y: auto;
    }
    .rcs-sql-colitem {
      display: grid;
      grid-template-columns: 1fr 80px 25px;
      gap: 4px;
      align-items: center;
    }
    .rcs-sql-colitem input {
      width: 100%;
    }
    .rcs-sql-colname {
      background: rgba(0,0,0,.15);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 6px;
      font-size: 10px;
      color: #fff;
      padding: 2px 5px 2px;
      outline: none;
    }
    .rcs-sql-colitem small {
      font-size: 9px;
      color: rgba(249,250,250,.3);
    }
    .rcs-sql-check {
      width: 22px;
      height: 22px;
    }
    .rcs-sql-preview {
      flex: 1;
      background: rgba(3,3,3,0.12);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, SF, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 10.5px;
      color: #e2e8f0;
      padding: 6px 6px 6px;
      white-space: pre;
      overflow: auto;
      min-height: 140px;
    }
    .rcs-sql-optrow {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: rgba(249,250,250,.7);
    }
    .rcs-sql-checkbox {
      width: 13px;
      height: 13px;
    }
    .rcs-sql-pill {
      background: rgba(34,197,235,.14);
      border: 1px solid rgba(34,197,235,.28);
      border-radius: 9999px;
      font-size: 9px;
      padding: 1px 7px 1px;
      text-transform: uppercase;
      letter-spacing: .02em;
    }
  `);

  // ============ ESTADO GLOBAL (pra não perder ao trocar de view) ============
  const defaultState = {
    tables: [
      {
        id: "t1",
        name: "manu.maquinas",
        alias: "m",
        description: "tabela principal de máquinas",
        isBase: true,
        joinType: "LEFT",
        joinOn: "",
        columns: [
          {
            name: "id_maquina",
            alias: "id",
            description: "PK",
            selected: true,
            isPk: true,
          },
          {
            name: "descricao",
            alias: "descricao",
            description: "nome/descrição",
            selected: true,
          },
          {
            name: "id_empresa",
            alias: "empresa_id",
            description: "empresa dona",
            selected: false,
          },
        ],
      },
      {
        id: "t2",
        name: "auth.usuarios",
        alias: "u",
        description: "usuário que atualizou",
        isBase: false,
        joinType: "LEFT",
        joinOn: "u.id = m.atualizado_por",
        columns: [
          {
            name: "id",
            alias: "user_id",
            description: "id do usuário",
            selected: false,
            isPk: true,
          },
          {
            name: "nome",
            alias: "atualizado_por_nome",
            description: "nome do usuário",
            selected: true,
          },
        ],
      },
    ],
    selectedTableId: "t1",
    options: {
      withComments: true,
      addOrderByPk: true,
      limit: 200,
      driver: "postgres",
    },
  };

  const state = (RCSHub.__sqlAssistantState =
    RCSHub.__sqlAssistantState || defaultState);

  // ============ HELPERS ============

  function uid() {
    return "t" + Math.random().toString(16).slice(2, 7);
  }

  function suggestAlias(tableName) {
    if (!tableName) return "t";
    const parts = tableName.split(".");
    const last = parts[parts.length - 1];
    return last.slice(0, 1).toLowerCase();
  }

  function buildSQL(st) {
    const tables = st.tables;
    if (!tables.length) return "-- informe ao menos 1 tabela";

    const base = tables.find((t) => t.isBase) || tables[0];
    const others = tables.filter((t) => t !== base);

    const out = [];

    if (st.options.withComments) {
      out.push("-- consulta gerada pelo RCS HUB — assistente SQL");
      out.push(`-- host: ${location.hostname}`);
      out.push("");
    }

    // SELECT
    out.push("SELECT");

    const selectLines = [];
    tables.forEach((t) => {
      (t.columns || [])
        .filter((c) => c.selected)
        .forEach((c) => {
          const baseCol = `${t.alias}.${c.name}`;
          const alias = c.alias ? ` AS ${c.alias}` : "";
          if (st.options.withComments && c.description) {
            selectLines.push(`    ${baseCol}${alias} -- ${c.description}`);
          } else {
            selectLines.push(`    ${baseCol}${alias}`);
          }
        });
    });

    // fallback se nada selecionado
    if (!selectLines.length) {
      const fallback = [];
      tables.forEach((t) => {
        const pk =
          (t.columns || []).find((c) => c.isPk) || (t.columns || [])[0];
        if (pk) {
          fallback.push(`    ${t.alias}.${pk.name} AS ${t.alias}_${pk.name}`);
        }
      });
      out.push(fallback.join(",\n"));
    } else {
      out.push(selectLines.join(",\n"));
    }

    // FROM
    out.push("FROM");
    out.push(`    ${base.name} ${base.alias}`);

    // JOINS
    others.forEach((t) => {
      if (t.joinOn && t.joinOn.trim().length) {
        const jt = t.joinType || "LEFT";
        out.push(`    ${jt} JOIN ${t.name} ${t.alias} ON ${t.joinOn}`);
      } else {
        out.push(
          `    -- pendente JOIN de ${t.name} ${t.alias} (informe condição)`
        );
      }
    });

    // WHERE
    out.push("");
    out.push("WHERE 1=1");
    if (st.options.withComments) {
      out.push("    -- AND m.ativo = true");
      out.push("    -- AND m.id_empresa = 1");
    }

    // ORDER BY
    if (st.options.addOrderByPk) {
      const pk =
        (base.columns || []).find((c) => c.isPk)?.name ||
        (base.columns || [])[0]?.name;
      if (pk) {
        out.push("");
        out.push(`ORDER BY ${base.alias}.${pk} DESC`);
      }
    }

    // LIMIT
    if (st.options.limit && Number(st.options.limit) > 0) {
      out.push(`LIMIT ${Number(st.options.limit)}`);
    }

    return out.join("\n");
  }

  function renderTablesList(root, st) {
    const list = root.querySelector(".rcs-sql-tablelist");
    list.innerHTML = "";
    st.tables.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "rcs-sql-tablebtn" + (t.id === st.selectedTableId ? " active" : "");
      btn.dataset.id = t.id;
      btn.innerHTML = `
        <span>${t.alias} • ${t.name}</span>
        ${t.isBase ? '<span class="rcs-sql-pill">base</span>' : ""}
      `;
      btn.addEventListener("click", () => {
        st.selectedTableId = t.id;
        renderTablesList(root, st);
        renderTableForm(root, st);
      });
      list.appendChild(btn);
    });
  }

  function renderTableForm(root, st) {
    const table = st.tables.find((t) => t.id === st.selectedTableId);
    const formBox = root.querySelector("#rcs-sql-form");
    if (!table) {
      formBox.innerHTML =
        '<div style="font-size:11px;color:rgba(255,255,255,.35);">Selecione uma tabela.</div>';
      return;
    }

    formBox.innerHTML = `
      <div class="rcs-sql-formrow">
        <span class="rcs-sql-label">Tabela</span>
        <input class="rcs-sql-input" id="rcs-sql-name" value="${table.name}">
      </div>
      <div class="rcs-sql-formrow">
        <span class="rcs-sql-label">Alias</span>
        <input class="rcs-sql-input" id="rcs-sql-alias" style="max-width:80px" value="${
          table.alias
        }">
        <label style="font-size:9px;color:rgba(255,255,255,.35);display:flex;gap:4px;align-items:center;">
          <input type="checkbox" id="rcs-sql-isbase" ${
            table.isBase ? "checked" : ""
          }>
          base
        </label>
      </div>
      <div class="rcs-sql-formrow">
        <span class="rcs-sql-label">Descrição</span>
        <input class="rcs-sql-input" id="rcs-sql-desc" value="${
          table.description || ""
        }">
      </div>
      <div class="rcs-sql-formrow">
        <span class="rcs-sql-label">Join</span>
        <select class="rcs-sql-select" id="rcs-sql-jointype" style="max-width:90px">
          <option value="LEFT" ${
            table.joinType === "LEFT" ? "selected" : ""
          }>LEFT</option>
          <option value="INNER" ${
            table.joinType === "INNER" ? "selected" : ""
          }>INNER</option>
          <option value="RIGHT" ${
            table.joinType === "RIGHT" ? "selected" : ""
          }>RIGHT</option>
        </select>
        <input class="rcs-sql-input" id="rcs-sql-joinon" placeholder="m.campo = u.campo" value="${
          table.joinOn || ""
        }">
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <div class="rcs-sql-label" style="min-width:0;">Colunas</div>
          <button type="button" class="rcs-sql-btn-sm" id="rcs-sql-addcol">+ coluna</button>
        </div>
        <div class="rcs-sql-columns" id="rcs-sql-columns"></div>
      </div>
    `;

    // monta colunas
    const colsBox = formBox.querySelector("#rcs-sql-columns");
    (table.columns || []).forEach((c, idx) => {
      const row = document.createElement("div");
      row.className = "rcs-sql-colitem";
      row.innerHTML = `
        <div>
          <input class="rcs-sql-colname" data-k="name" value="${c.name}">
          <input class="rcs-sql-colname" data-k="desc" value="${
            c.description || ""
          }" placeholder="descrição" style="margin-top:2px;font-size:9px;">
        </div>
        <input class="rcs-sql-colname" data-k="alias" value="${
          c.alias || ""
        }" placeholder="alias">
        <div style="display:flex;gap:3px;align-items:center;">
          <input type="checkbox" data-k="sel" ${
            c.selected ? "checked" : ""
          } class="rcs-sql-check" title="incluir no SELECT">
          <input type="checkbox" data-k="pk" ${
            c.isPk ? "checked" : ""
          } class="rcs-sql-check" title="PK">
          <button type="button" data-k="del" style="background:transparent;border:0;color:rgba(248,113,113,.7);font-size:12px;cursor:pointer;">×</button>
        </div>
      `;
      // listeners
      row.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("input", () => {
          const k = inp.dataset.k;
          if (k === "name") c.name = inp.value;
          if (k === "desc") c.description = inp.value;
          if (k === "alias") c.alias = inp.value;
          if (k === "sel") c.selected = inp.checked;
          if (k === "pk") c.isPk = inp.checked;
          updatePreview(root, st);
        });
      });
      row.querySelector('[data-k="del"]').addEventListener("click", () => {
        table.columns.splice(idx, 1);
        renderTableForm(root, st);
        updatePreview(root, st);
      });
      colsBox.appendChild(row);
    });

    // listeners dos campos da tabela
    formBox.querySelector("#rcs-sql-name").addEventListener("input", (e) => {
      table.name = e.target.value;
      updatePreview(root, st);
      renderTablesList(root, st);
    });
    formBox.querySelector("#rcs-sql-alias").addEventListener("input", (e) => {
      table.alias = e.target.value;
      updatePreview(root, st);
      renderTablesList(root, st);
    });
    formBox.querySelector("#rcs-sql-desc").addEventListener("input", (e) => {
      table.description = e.target.value;
      updatePreview(root, st);
    });
    formBox
      .querySelector("#rcs-sql-jointype")
      .addEventListener("change", (e) => {
        table.joinType = e.target.value;
        updatePreview(root, st);
      });
    formBox.querySelector("#rcs-sql-joinon").addEventListener("input", (e) => {
      table.joinOn = e.target.value;
      updatePreview(root, st);
    });
    formBox.querySelector("#rcs-sql-isbase").addEventListener("change", (e) => {
      if (e.target.checked) {
        st.tables.forEach((tt) => (tt.isBase = false));
        table.isBase = true;
        renderTablesList(root, st);
      } else {
        // se desmarcar tudo, mantém ele base
        table.isBase = true;
        e.target.checked = true;
      }
      updatePreview(root, st);
    });

    // add coluna
    formBox.querySelector("#rcs-sql-addcol").addEventListener("click", () => {
      table.columns = table.columns || [];
      table.columns.push({
        name: "nova_coluna",
        alias: "",
        description: "",
        selected: true,
      });
      renderTableForm(root, st);
      updatePreview(root, st);
    });
  }

  function renderOptions(root, st) {
    const box = root.querySelector("#rcs-sql-options");
    box.innerHTML = `
      <div class="rcs-sql-optrow">
        <label><input type="checkbox" class="rcs-sql-checkbox" id="rcs-sql-withcomments" ${
          st.options.withComments ? "checked" : ""
        }> comentários</label>
        <span style="font-size:9px;color:rgba(255,255,255,.3);">explica cada campo</span>
      </div>
      <div class="rcs-sql-optrow">
        <label><input type="checkbox" class="rcs-sql-checkbox" id="rcs-sql-orderpk" ${
          st.options.addOrderByPk ? "checked" : ""
        }> ORDER BY PK</label>
      </div>
      <div class="rcs-sql-optrow">
        <label>LIMIT</label>
        <input type="number" id="rcs-sql-limit" class="rcs-sql-input" style="max-width:80px" value="${
          st.options.limit || ""
        }" min="0">
      </div>
      <div class="rcs-sql-optrow">
        <label>Driver</label>
        <select id="rcs-sql-driver" class="rcs-sql-select" style="max-width:100px">
          <option value="postgres" ${
            st.options.driver === "postgres" ? "selected" : ""
          }>Postgres</option>
          <option value="mysql" ${
            st.options.driver === "mysql" ? "selected" : ""
          }>MySQL</option>
        </select>
      </div>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button type="button" class="rcs-sql-btn-sm" id="rcs-sql-copy">copiar SQL</button>
        <button type="button" class="rcs-sql-btn-sm" id="rcs-sql-reset">resetar</button>
      </div>
    `;

    box
      .querySelector("#rcs-sql-withcomments")
      .addEventListener("change", (e) => {
        st.options.withComments = e.target.checked;
        updatePreview(root, st);
      });
    box.querySelector("#rcs-sql-orderpk").addEventListener("change", (e) => {
      st.options.addOrderByPk = e.target.checked;
      updatePreview(root, st);
    });
    box.querySelector("#rcs-sql-limit").addEventListener("input", (e) => {
      const v = Number(e.target.value);
      st.options.limit = isNaN(v) ? null : v;
      updatePreview(root, st);
    });
    box.querySelector("#rcs-sql-driver").addEventListener("change", (e) => {
      st.options.driver = e.target.value;
      updatePreview(root, st);
    });
    box.querySelector("#rcs-sql-copy").addEventListener("click", () => {
      const sql = buildSQL(st);
      navigator.clipboard && navigator.clipboard.writeText(sql);
      if (window.RCSHub && RCSHub.consoleBuffer) {
        RCSHub.consoleBuffer.unshift({
          __id: Date.now(),
          type: "info",
          ts: Date.now(),
          args: ["SQL copiado para a área de transferência."],
          indent: 0,
        });
      }
    });
    box.querySelector("#rcs-sql-reset").addEventListener("click", () => {
      RCSHub.__sqlAssistantState = JSON.parse(JSON.stringify(defaultState));
      const newSt = RCSHub.__sqlAssistantState;
      renderAll(root, newSt);
    });
  }

  function updatePreview(root, st) {
    const prev = root.querySelector("#rcs-sql-preview");
    prev.textContent = buildSQL(st);
  }

  function renderAll(root, st) {
    root.innerHTML = `
      <div class="rcs-sql-panel">
        <div class="rcs-sql-title">
          Tabelas
          <button type="button" class="rcs-sql-btn-sm" id="rcs-sql-addtable">+ tabela</button>
        </div>
        <div class="rcs-sql-sub">informe o esquema e dê um alias curto</div>
        <div class="rcs-sql-tablelist"></div>
      </div>
      <div class="rcs-sql-panel">
        <div class="rcs-sql-title">
          Detalhes da tabela
          <span style="font-size:9px;color:rgba(255,255,255,.25);">joins, colunas, pk</span>
        </div>
        <div id="rcs-sql-form"></div>
      </div>
      <div class="rcs-sql-panel">
        <div class="rcs-sql-title">
          SQL gerado
          <span class="rcs-sql-pill">otimizado</span>
        </div>
        <div id="rcs-sql-options"></div>
        <div class="rcs-sql-preview" id="rcs-sql-preview"></div>
      </div>
    `;

    // render
    renderTablesList(root, st);
    renderTableForm(root, st);
    renderOptions(root, st);
    updatePreview(root, st);

    // add tabela
    root.querySelector("#rcs-sql-addtable").addEventListener("click", () => {
      const id = uid();
      const newTable = {
        id,
        name: "public.tabela",
        alias: "t" + (st.tables.length + 1),
        description: "",
        isBase: false,
        joinType: "LEFT",
        joinOn: "",
        columns: [
          {
            name: "id",
            alias: "",
            description: "PK",
            selected: true,
            isPk: true,
          },
        ],
      };
      st.tables.push(newTable);
      st.selectedTableId = id;
      renderAll(root, st);
    });
  }

  // ================== REGISTRO DO COMANDO ==================
  RCSHub.registerCommand({
    id: "sql-assistant",
    name: "SQL Assistant",
    render() {
      return `<div class="rcs-sql-wrap" id="rcs-sql-wrap"></div>`;
    },
    onShow(container) {
      const root = container.querySelector("#rcs-sql-wrap");
      // usa o estado global preservado
      renderAll(root, RCSHub.__sqlAssistantState);
    },
  });
})(RCSHub);
