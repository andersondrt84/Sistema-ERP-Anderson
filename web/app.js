const ADMIN_USER = "anderson";
const MASTER_USER = "administrador";
const MASTER_PASS = "12345678";

const state = {
  orders: JSON.parse(localStorage.getItem("erp_orders") || "[]"),
  cash: JSON.parse(localStorage.getItem("erp_cash") || "[]"),
  nextOrderId: Number(localStorage.getItem("erp_next_order_id") || "1"),
  logged: sessionStorage.getItem("erp_logged") === "1",
  currentUser: sessionStorage.getItem("erp_current_user") || "",
  token: sessionStorage.getItem("erp_token") || "",
};

const msg = document.getElementById("msg");
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const ordersTable = document.getElementById("ordersTable");
const cashTable = document.getElementById("cashTable");

function saveLocalData() {
  localStorage.setItem("erp_orders", JSON.stringify(state.orders));
  localStorage.setItem("erp_cash", JSON.stringify(state.cash));
  localStorage.setItem("erp_next_order_id", String(state.nextOrderId));
}

function notify(text, ok = true) {
  msg.textContent = text;
  msg.style.color = ok ? "#86efac" : "#fca5a5";
}

function isAdminUser() {
  const u = (state.currentUser || "").toLowerCase();
  return u.startsWith(ADMIN_USER) || u === MASTER_USER;
}

function applyAdminVisibility() {
  const adminTab = document.querySelector('.tab[data-tab="seguranca"]');
  const adminPanel = document.getElementById("tab-seguranca");
  const visible = isAdminUser();
  if (adminTab) adminTab.classList.toggle("hidden", !visible);
  if (adminPanel) {
    adminPanel.classList.toggle("hidden", !visible);
    if (!visible && adminPanel.classList.contains("active")) {
      adminPanel.classList.remove("active");
      const defaultTab = document.querySelector('.tab[data-tab="ordens"]');
      const defaultPanel = document.getElementById("tab-ordens");
      document.querySelectorAll('.tab[data-tab]').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      if (defaultTab) defaultTab.classList.add('active');
      if (defaultPanel) defaultPanel.classList.add('active');
    }
  }
}

function setLogged(logged, user = "", token = "") {
  state.logged = logged;
  state.currentUser = logged ? user : "";
  state.token = logged ? token : "";
  sessionStorage.setItem("erp_logged", logged ? "1" : "0");
  sessionStorage.setItem("erp_current_user", state.currentUser);
  sessionStorage.setItem("erp_token", state.token);
  loginSection.classList.toggle("hidden", logged);
  appSection.classList.toggle("hidden", !logged);
  applyAdminVisibility();
}


function logout() {
  setLogged(false, "", "");
  sessionStorage.removeItem("erp_logged");
  sessionStorage.removeItem("erp_current_user");
  sessionStorage.removeItem("erp_token");
  notify("Sessão encerrada com sucesso.");
}

function money(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthLabel(dateStr) {
  if (!dateStr) return "Sem data";
  const [y, m] = dateStr.split("-");
  return `${m}/${y}`;
}

function textSafe(v) {
  return String(v || "").replace(/[()\\]/g, " ").replace(/[^\x20-\x7E]/g, " ");
}

function makePdfBlob(order) {
  const lines = [
    `ORDEM DE SERVICO #${order.id}`,
    `Data: ${order.data}`,
    `Cliente: ${order.cliente}`,
    `Equipamento: ${order.equipamento}`,
    `Tipo de servico: ${order.tipoServico}`,
    `Impressora: ${order.impressora}`,
    `Status: ${order.status}`,
    `Linguagem: ${order.linguagemImpressao || "-"}`,
    `Valor: ${money(order.valor)}`,
    `Descricao: ${order.descricao}`,
  ].map(textSafe);

  const content = [
    "BT /F1 12 Tf 50 780 Td",
    ...lines.map((l, i) => (i === 0 ? `(${l}) Tj` : `0 -18 Td (${l}) Tj`)),
    "ET",
  ].join("\n");

  const objects = [];
  const pushObj = (txt) => {
    objects.push(txt);
    return objects.length;
  };

  const obj1 = pushObj("<< /Type /Catalog /Pages 2 0 R >>");
  const obj2 = pushObj("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  const obj3 = pushObj("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>");
  const obj4 = pushObj(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const obj5 = pushObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  [obj1, obj2, obj3, obj4, obj5].forEach((id, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${objects[idx]}\nendobj\n`;
  });

  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao converter PDF"));
    reader.readAsDataURL(blob);
  });
}

function printPdfDataUrl(pdfDataUrl) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = pdfDataUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
}

function renderOrders() {
  ordersTable.innerHTML = state.orders
    .map(
      (o) => `<tr>
      <td>#${o.id}</td>
      <td>${o.data}</td>
      <td>${o.cliente}</td>
      <td>${o.tipoServico}</td>
      <td>${o.linguagemImpressao || "-"}</td>
      <td>${o.status}</td>
      <td>${money(o.valor)}</td>
      <td>
        ${o.pdfDataUrl ? `<a class="pdf-link" href="${o.pdfDataUrl}" download="OS-${o.id}.pdf">Salvar PDF</a> <button class="mini-btn" data-print-id="${o.id}">Imprimir</button> <button class="mini-btn" data-preview-id="${o.id}">Pré-visualizar</button>` : "-"}
      </td>
    </tr>`
    )
    .join("");
}

function renderCash() {
  cashTable.innerHTML = state.cash
    .map(
      (c) => `<tr>
      <td>${c.data}</td>
      <td>${c.ref}</td>
      <td>${money(c.valor)}</td>
    </tr>`
    )
    .join("");

  const totalCaixa = state.cash.reduce((sum, c) => sum + Number(c.valor), 0);
  document.getElementById("cashTotal").textContent = money(totalCaixa);
}

function renderReports() {
  const totalOrdens = state.orders.length;
  const totalOrdemValor = state.orders.reduce((sum, o) => sum + Number(o.valor), 0);
  const concluidas = state.orders.filter((o) => ["concluido", "concluida"].includes(o.status)).length;
  const totalCaixa = state.cash.reduce((sum, c) => sum + Number(c.valor), 0);
  const clientesAtendidos = new Set(state.orders.map((o) => o.cliente.trim().toLowerCase())).size;

  document.getElementById("rTotalOrdens").textContent = String(totalOrdens);
  document.getElementById("rTotalClientes").textContent = String(clientesAtendidos);
  document.getElementById("rTotalValor").textContent = money(totalOrdemValor);
  document.getElementById("rConcluidas").textContent = String(concluidas);
  document.getElementById("rTotalCaixa").textContent = money(totalCaixa);

  const monthMap = new Map();
  for (const o of state.orders) {
    const key = monthLabel(o.data);
    const prev = monthMap.get(key) || { count: 0, total: 0 };
    prev.count += 1;
    prev.total += Number(o.valor || 0);
    monthMap.set(key, prev);
  }

  const monthRows = [...monthMap.entries()]
    .sort((a, b) => {
      const [ma, ya] = a[0].split("/").map(Number);
      const [mb, yb] = b[0].split("/").map(Number);
      return yb - ya || mb - ma;
    })
    .map(([month, data]) => `<tr><td>${month}</td><td>${data.count}</td><td>${money(data.total)}</td></tr>`)
    .join("");
  document.getElementById("reportByMonth").innerHTML = monthRows || '<tr><td colspan="3">Sem dados</td></tr>';

  const typeMap = new Map();
  for (const o of state.orders) {
    const key = o.tipoServico || "Não informado";
    const prev = typeMap.get(key) || { count: 0, total: 0 };
    prev.count += 1;
    prev.total += Number(o.valor || 0);
    typeMap.set(key, prev);
  }

  const typeRows = [...typeMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([type, data]) => `<tr><td>${type}</td><td>${data.count}</td><td>${money(data.total)}</td></tr>`)
    .join("");
  document.getElementById("reportByType").innerHTML = typeRows || '<tr><td colspan="3">Sem dados</td></tr>';
}

function renderAll() {
  renderOrders();
  renderCash();
  renderReports();
  applyAdminVisibility();
}

async function loginViaApi(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const resp = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  if (!resp.ok) throw new Error("Credenciais inválidas");
  return resp.json();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;

  // usuário master local
  if (user.trim().toLowerCase() === MASTER_USER && pass.trim() === MASTER_PASS) {
    setLogged(true, MASTER_USER, "master-local-session");
    notify("Login efetuado com sucesso.");
    return;
  }

  try {
    const result = await loginViaApi(user, pass);
    setLogged(true, user, result.access_token || "");
    notify(`Login efetuado com sucesso para ${user}.`);
  } catch {
    notify("Senha incorreta. Tente novamente.", false);
  }
});

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const order = {
      id: state.nextOrderId++,
      cliente: document.getElementById("cliente").value.trim(),
      equipamento: document.getElementById("equipamento").value.trim(),
      impressora: document.getElementById("impressora").value,
      linguagemImpressao: document.getElementById("linguagemImpressao").value,
      tipoServico: document.getElementById("tipoServico").value,
      descricao: document.getElementById("descricao").value.trim(),
      valor: document.getElementById("valor").value,
      status: document.getElementById("status").value,
      data: document.getElementById("data").value,
      pdfDataUrl: null,
    };

    const pdfBlob = makePdfBlob(order);
    order.pdfDataUrl = await blobToDataUrl(pdfBlob);

    state.orders.unshift(order);
    saveLocalData();
    renderAll();
    e.target.reset();
    notify(`Ordem #${order.id} salva e documento PDF gerado.`);
    openPrintPreview(order);
  } catch {
    notify("Não foi possível gerar o PDF da ordem de serviço.", false);
  }
});

ordersTable.addEventListener("click", (e) => {
  const printBtn = e.target.closest("button[data-print-id]");
  if (printBtn) {
    const id = Number(printBtn.dataset.printId);
    const order = state.orders.find((o) => o.id === id);
    if (!order || !order.pdfDataUrl) return;
    printPdfDataUrl(order.pdfDataUrl);
    return;
  }

  const previewBtn = e.target.closest("button[data-preview-id]");
  if (previewBtn) {
    const id = Number(previewBtn.dataset.previewId);
    const order = state.orders.find((o) => o.id === id);
    if (!order || !order.pdfDataUrl) return;
    openPrintPreview(order);
  }
});

document.getElementById("cashForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const cash = {
    data: document.getElementById("cashData").value,
    ref: document.getElementById("cashRef").value.trim(),
    valor: document.getElementById("cashValor").value,
  };

  state.cash.unshift(cash);
  saveLocalData();
  renderAll();
  e.target.reset();
  notify("Lançamento realizado no caixa.");
});

document.getElementById("passForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!isAdminUser()) {
    notify("Somente o usuário anderson pode fazer ajustes do sistema.", false);
    return;
  }
  notify("Ajuste permitido para anderson. (Fluxo de senha deve ser feito pela API).", true);
});


const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => logout());
}

document.querySelectorAll(".tab[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab[data-tab]").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

setLogged(state.logged && !!state.currentUser, state.currentUser, state.token);
renderAll();
