const state = {
  orders: JSON.parse(localStorage.getItem("erp_orders") || "[]"),
  cash: JSON.parse(localStorage.getItem("erp_cash") || "[]"),
  creds: JSON.parse(localStorage.getItem("erp_creds") || "null"),
  logged: sessionStorage.getItem("erp_logged") === "1",
};

const msg = document.getElementById("msg");
const setupSection = document.getElementById("setupSection");
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const ordersTable = document.getElementById("ordersTable");
const cashTable = document.getElementById("cashTable");

function saveState() {
  localStorage.setItem("erp_orders", JSON.stringify(state.orders));
  localStorage.setItem("erp_cash", JSON.stringify(state.cash));
  localStorage.setItem("erp_creds", JSON.stringify(state.creds));
}

function notify(text, ok = true) {
  msg.textContent = text;
  msg.style.color = ok ? "#86efac" : "#fca5a5";
}

function hash(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function setLogged(logged) {
  state.logged = logged;
  sessionStorage.setItem("erp_logged", logged ? "1" : "0");
  setupSection.classList.toggle("hidden", !!state.creds);
  loginSection.classList.toggle("hidden", !state.creds || logged);
  appSection.classList.toggle("hidden", !logged);
}

function money(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderOrders() {
  ordersTable.innerHTML = state.orders
    .map(
      (o) => `<tr>
      <td>${o.data}</td>
      <td>${o.cliente}</td>
      <td>${o.equipamento}</td>
      <td>${o.descricao}</td>
      <td>${o.status}</td>
      <td>${money(o.valor)}</td>
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
  const concluidas = state.orders.filter((o) => o.status === "concluida").length;
  const totalCaixa = state.cash.reduce((sum, c) => sum + Number(c.valor), 0);

  document.getElementById("rTotalOrdens").textContent = String(totalOrdens);
  document.getElementById("rTotalValor").textContent = money(totalOrdemValor);
  document.getElementById("rConcluidas").textContent = String(concluidas);
  document.getElementById("rTotalCaixa").textContent = money(totalCaixa);
}

function renderAll() {
  renderOrders();
  renderCash();
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

  state.creds = { user, passHash: hash(pass) };
  saveState();
  e.target.reset();
  setLogged(false);
  notify("Acesso configurado. Faça login.");
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;

  if (state.creds && user === state.creds.user && hash(pass) === state.creds.passHash) {
    setLogged(true);
    notify("Login efetuado com sucesso.");
  } else {
    notify("Usuário ou senha inválidos.", false);
  }
});

document.getElementById("orderForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const order = {
    cliente: document.getElementById("cliente").value.trim(),
    equipamento: document.getElementById("equipamento").value.trim(),
    impressora: document.getElementById("impressora").value,
    descricao: document.getElementById("descricao").value.trim(),
    valor: document.getElementById("valor").value,
    status: document.getElementById("status").value,
    data: document.getElementById("data").value,
  };

  state.orders.unshift(order);
  saveState();
  renderAll();
  e.target.reset();
  notify("Ordem salva com sucesso.");
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

document.getElementById("passForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const atual = document.getElementById("senhaAtual").value;
  const nova = document.getElementById("senhaNova").value;

  if (!state.creds || hash(atual) !== state.creds.passHash) {
    notify("Senha atual incorreta.", false);
    return;
  }

  state.creds.passHash = hash(nova);
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

setLogged(state.logged && !!state.creds);
renderAll();
