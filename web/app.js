const state = {
  orders: JSON.parse(localStorage.getItem("erp_orders") || "[]"),
  cash: JSON.parse(localStorage.getItem("erp_cash") || "[]"),
  users: JSON.parse(localStorage.getItem("erp_users") || "[]"),
  nextOrderId: Number(localStorage.getItem("erp_next_order_id") || "1"),
  logged: sessionStorage.getItem("erp_logged") === "1",
  currentUser: sessionStorage.getItem("erp_current_user") || "",
};

const msg = document.getElementById("msg");
const setupSection = document.getElementById("setupSection");
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const ordersTable = document.getElementById("ordersTable");
const cashTable = document.getElementById("cashTable");
const usersTable = document.getElementById("usersTable");

function saveState() {
  localStorage.setItem("erp_orders", JSON.stringify(state.orders));
  localStorage.setItem("erp_cash", JSON.stringify(state.cash));
  localStorage.setItem("erp_users", JSON.stringify(state.users));
  localStorage.setItem("erp_next_order_id", String(state.nextOrderId));
}

function notify(text, ok = true) {
  msg.textContent = text;
  msg.style.color = ok ? "#86efac" : "#fca5a5";
}

function hash(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Falha ao ler PDF"));
    reader.readAsDataURL(file);
  });
}

function findUser(username) {
  return state.users.find((u) => u.user.toLowerCase() === username.toLowerCase());
}

function setLogged(logged, user = "") {
  state.logged = logged;
  state.currentUser = logged ? user : "";
  sessionStorage.setItem("erp_logged", logged ? "1" : "0");
  sessionStorage.setItem("erp_current_user", state.currentUser);

  const hasUsers = state.users.length > 0;
  setupSection.classList.toggle("hidden", hasUsers);
  loginSection.classList.toggle("hidden", !hasUsers || logged);
  appSection.classList.toggle("hidden", !logged);
}

function money(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthLabel(dateStr) {
  if (!dateStr) return "Sem data";
  const [y, m] = dateStr.split("-");
  return `${m}/${y}`;
}

function renderOrders() {
  ordersTable.innerHTML = state.orders
    .map(
      (o) => `<tr>
      <td>#${o.id}</td>
      <td>${o.data}</td>
      <td>${o.cliente}</td>
      <td>${o.tipoServico}</td>
      <td>${o.status}</td>
      <td>${money(o.valor)}</td>
      <td>${o.pdfDataUrl ? `<a class="pdf-link" href="${o.pdfDataUrl}" target="_blank" rel="noopener">Abrir PDF</a>` : "-"}</td>
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

function renderUsers() {
  usersTable.innerHTML = state.users
    .map((u) => `<tr><td>${u.user}</td><td>${u.createdAt}</td></tr>`)
    .join("");
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
  renderUsers();
  renderReports();
}

document.getElementById("setupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("setupUser").value.trim();
  const pass = document.getElementById("setupPass").value;

  if (user.length < 3) {
    notify("Usuário deve ter ao menos 3 caracteres.", false);
    return;
  }
  if (findUser(user)) {
    notify("Usuário já existe.", false);
    return;
  }

  state.users.push({ user, passHash: hash(pass), createdAt: new Date().toLocaleString("pt-BR") });
  saveState();
  e.target.reset();
  setLogged(false);
  renderUsers();
  notify("Primeiro usuário criado. Faça login.");
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const found = findUser(user);

  if (found && hash(pass) === found.passHash) {
    setLogged(true, found.user);
    notify(`Login efetuado. Bem-vindo, ${found.user}.`);
  } else {
    notify("Usuário ou senha inválidos.", false);
  }
});

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pdfFile = document.getElementById("descricaoPdf").files[0];

  try {
    const pdfDataUrl = await fileToDataUrl(pdfFile);
    const order = {
      id: state.nextOrderId++,
      cliente: document.getElementById("cliente").value.trim(),
      equipamento: document.getElementById("equipamento").value.trim(),
      impressora: document.getElementById("impressora").value,
      tipoServico: document.getElementById("tipoServico").value,
      descricao: document.getElementById("descricao").value.trim(),
      valor: document.getElementById("valor").value,
      status: document.getElementById("status").value,
      data: document.getElementById("data").value,
      pdfDataUrl,
    };

    state.orders.unshift(order);
    saveState();
    renderAll();
    e.target.reset();
    notify(`Ordem #${order.id} salva com sucesso.`);
  } catch {
    notify("Não foi possível anexar o PDF da descrição.", false);
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
  saveState();
  renderAll();
  e.target.reset();
  notify("Lançamento realizado no caixa.");
});

document.getElementById("userForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("novoUsuario").value.trim();
  const pass = document.getElementById("novaSenhaUsuario").value;

  if (findUser(user)) {
    notify("Usuário já existe.", false);
    return;
  }

  state.users.push({ user, passHash: hash(pass), createdAt: new Date().toLocaleString("pt-BR") });
  saveState();
  renderUsers();
  e.target.reset();
  notify("Novo usuário criado com sucesso.");
});

document.getElementById("passForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const atual = document.getElementById("senhaAtual").value;
  const nova = document.getElementById("senhaNova").value;

  const found = findUser(state.currentUser);
  if (!found || hash(atual) !== found.passHash) {
    notify("Senha atual incorreta.", false);
    return;
  }

  found.passHash = hash(nova);
  saveState();
  e.target.reset();
  notify("Senha alterada com sucesso.");
});

document.querySelectorAll(".tab[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab[data-tab]").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

setLogged(state.logged && state.users.some((u) => u.user === state.currentUser), state.currentUser);
renderAll();
