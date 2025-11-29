// =====================
// Card de Usuários (DashboardADM)
// =====================

let userSearchTimeout = null;
const usersListEl = document.getElementById('users-list');
const noUsersMsgEl = document.getElementById('no-users-msg');
const userSearchInput = document.getElementById('user-search');

async function fetchUsuarios(query = "") {
  try {
    function normalize(str) {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    }

    const url = query
      ? `http://localhost:3000/api/usuarios?q=${encodeURIComponent(query)}`
      : "http://localhost:3000/api/usuarios";

    const res = await fetch(url);
    if (!res.ok) {
      console.error("Erro ao buscar usuários", res.status);
      return;
    }

    let users = await res.json();

    // 🔍 Filtro extra no front
    if (query.trim() !== "") {
      const nq = normalize(query);

      users = users.filter(u =>
        normalize(u.nome).includes(nq) ||
        normalize(u.email).includes(nq)
      );
    }

    // Atualiza contadores
    document.getElementById("users-count-inline").textContent =
      users.length + (users.length === 1 ? " usuário" : " usuários");

    const totalUsuarios = document.getElementById("total-usuarios");
    if (totalUsuarios) totalUsuarios.textContent = users.length;

    // Lista vazia
    if (!users || users.length === 0) {
      usersListEl.innerHTML = "";
      noUsersMsgEl.style.display = "block";
      return;
    } else {
      noUsersMsgEl.style.display = "none";
    }

    // Renderização
    usersListEl.innerHTML = "";

    users.forEach(u => {
      const avatar =
        u.foto && typeof u.foto === "string" && u.foto.trim() !== ""
          ? `<img src="${u.foto}" alt="${u.nome}" style="width:36px;height:36px;border-radius:8px;object-fit:cover" />`
          : `<div class="avatar-sm">${(u.nome || "?")[0]}</div>`;

      usersListEl.innerHTML += `
        <div class="user-row">

          <div class="user-left">
            ${avatar}
            <div>
              <div style="font-weight:700">${u.nome}</div>
              <div class="meta-muted">${u.email}</div>
            </div>
          </div>

          <div class="user-actions">
            <button class="btn-vermais" onclick="abrirModalUsuario(${u.id_usuarios})">Ver Mais</button>

            ${
              u.status === "suspenso"
                ? `<button class="btn-ativar" onclick="abrirModalMotivoAtivar(${u.id_usuarios})">Ativar</button>`
                : `<button class="btn-suspender" onclick="abrirModalMotivoSuspender(${u.id_usuarios})">Suspender</button>`
            }
          </div>

        </div>
      `;
    });

  } catch (err) {
    console.error("Erro fetchUsuarios", err);
    usersListEl.innerHTML = "";
    noUsersMsgEl.style.display = "block";
    noUsersMsgEl.textContent = "Erro ao buscar usuários.";
  }
}

function abrirModalMotivoSuspender(id) {
  usuarioAtual = { id_usuarios: id };
  abrirModalMotivo("suspender");
}

function abrirModalMotivoAtivar(id) {
  usuarioAtual = { id_usuarios: id };
  abrirModalMotivo("ativar");
}

// =====================
// Busca
// =====================

userSearchInput.addEventListener('input', e => {
  const q = e.target.value.trim();
  if (userSearchTimeout) clearTimeout(userSearchTimeout);
  userSearchTimeout = setTimeout(() => fetchUsuarios(q), 250);
});

document.getElementById('global-search').addEventListener('input', e => {
  const q = e.target.value.trim();
  fetchUsuarios(q);
});

// =====================
// Modal de Usuário
// =====================

let usuarioAtual = null;
let acaoAtual = null;

async function abrirModalUsuario(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/usuarios/${id}`);
    if (!res.ok) return alert("Usuário não encontrado!");

    const u = await res.json();
    usuarioAtual = u;

    document.getElementById("modal-nome").textContent = u.nome;
    document.getElementById("modal-email").textContent = u.email;
    document.getElementById("modal-id").textContent = u.id_usuarios;
    document.getElementById("modal-data").textContent = u.data_cadastro;

    document.getElementById("modal-usuario").classList.remove("hidden");

  } catch (err) {
    console.error(err);
    alert("Erro ao buscar usuário.");
  }
}

// Fechar modal
document.getElementById("fechar-modal-usuario").addEventListener("click", () => {
  document.getElementById("modal-usuario").classList.add("hidden");
});

document.getElementById("modal-usuario").addEventListener("click", e => {
  if (e.target.id === "modal-usuario") {
    document.getElementById("modal-usuario").classList.add("hidden");
  }
});

// =====================
// MODAL MOTIVO
// =====================

function abrirModalMotivo(acao) {
  acaoAtual = acao;
  document.getElementById("motivo-texto").value = "";
  document.getElementById("modal-motivo").classList.remove("hidden");
}

document.getElementById("fechar-modal-motivo").addEventListener("click", () => {
  document.getElementById("modal-motivo").classList.add("hidden");
});


document.getElementById("confirmar-motivo").addEventListener("click", async () => {
  const motivo = document.getElementById("motivo-texto").value.trim();
  if (motivo.length < 3) return alert("Digite um motivo válido.");

  const endpoint =
    acaoAtual === "suspender"
      ? "http://localhost:3000/api/usuarios/suspender"
      : "http://localhost:3000/api/usuarios/ativar";

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: usuarioAtual.id_usuarios, motivo })
  });

  const data = await res.json();
  if (!data.success) return alert("Erro ao aplicar ação.");

  alert("Ação realizada com sucesso!");

  document.getElementById("modal-motivo").classList.add("hidden");
  document.getElementById("modal-usuario").classList.add("hidden");

  fetchUsuarios();
});

// =====================
// Inicialização
// =====================

fetchUsuarios();
