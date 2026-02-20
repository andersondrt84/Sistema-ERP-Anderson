const DEFAULT_USER = "anderson";
const DEFAULT_PASS = "12345678";

const state = {
  orders: JSON.parse(localStorage.getItem("erp_orders") || "[]"),
  user: localStorage.getItem("erp_user") || DEFAULT_USER,
  pass: localStorage.getItem("erp_pass") || DEFAULT_PASS,
  logged: sessionStorage.getItem("erp_logged") === "1",
};

const msg = document.getElementById("msg");
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const ordersTable = document.getElementById("ordersTable");

function saveState() {
  localStorage.setItem("erp_orders", JSON.stringify(state.orders));
  localStorage.setItem("erp_user", state.user);
  localStorage.setItem("erp_pass", state.pass);
}

function notify(text, ok = true) {
  msg.textContent = text;
  msg.style.color = ok ? "#86efac" : "#fca5a5";
}

function setLogged(logged) {
  state.logged = logged;
  sessionStorage.setItem("erp_logged", logged ? "1" : "0");
  loginSection.classList.toggle("hidden", logged);
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

  document.getElementById("rTotalOrdens").textContent = String(state.orders.length);
  document.getElementById("rTotalValor").textContent = money(
    state.orders.reduce((sum, o) => sum + Number(o.valor), 0)
  );
  document.getElementById("rConcluidas").textContent = String(
    state.orders.filter((o) => o.status === "concluida").length
  );
}

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value;
  if (u === state.user && p === state.pass) {
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
  renderOrders();
  e.target.reset();
  notify("Ordem salva com sucesso.");
});

document.getElementById("passForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const atual = document.getElementById("senhaAtual").value;
  const nova = document.getElementById("senhaNova").value;

  if (atual !== state.pass) {
    notify("Senha atual incorreta.", false);
    return;
  }
  if (nova.length < 8) {
    notify("A nova senha deve ter no mínimo 8 caracteres.", false);
    return;
  }
  state.pass = nova;
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

setLogged(state.logged);
renderOrders();
