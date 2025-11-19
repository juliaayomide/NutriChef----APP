// =====================
// Card de Usuários (DashboardADM)
// =====================

let userSearchTimeout = null;
const usersListEl = document.getElementById('users-list');
const noUsersMsgEl = document.getElementById('no-users-msg');
const userSearchInput = document.getElementById('user-search');

async function fetchUsuarios(query = "") {
  try {
    // 🔍 Correção de digitação (remove acentos e normaliza)
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

    // Filtro extra no front eliminando erros de digitação
    if (query.trim() !== "") {
      const nq = normalize(query);

      users = users.filter(u =>
        normalize(u.nome).includes(nq) ||
        normalize(u.email).includes(nq)
      );
    }

    // Atualiza contador
    const inlineCounter = document.getElementById("users-count-inline");
    inlineCounter.textContent =
      users.length + (users.length === 1 ? " usuário" : " usuários");

    // Atualiza total no dashboard principal
    const totalUsuarios = document.getElementById("total-usuarios");
    if (totalUsuarios) totalUsuarios.textContent = users.length;

    // Se vazio
    if (!users || users.length === 0) {
      usersListEl.innerHTML = "";
      noUsersMsgEl.style.display = "block";
      return;
    } else {
      noUsersMsgEl.style.display = "none";
    }

    // Renderizar lista
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
            <button class="btn-excluir" onclick="excluirUsuario(${u.id_usuarios})">Excluir</button>
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

// Debounce da busca
userSearchInput.addEventListener('input', e => {
  const q = e.target.value.trim();
  if (userSearchTimeout) clearTimeout(userSearchTimeout);
  userSearchTimeout = setTimeout(() => fetchUsuarios(q), 250);
});

// Também atualiza ao digitar no campo global
document.getElementById('global-search').addEventListener('input', e => {
  const q = e.target.value.trim();
  fetchUsuarios(q);
});


async function excluirUsuario(id) {
  if (!confirm("Deseja realmente excluir este usuário?")) return;

  const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (data.success) {
    alert("Usuário removido!");
    fetchUsuarios(); // recarregar lista
  } else {
    alert("Erro ao excluir usuário.");
  }
}


async function abrirModalUsuario(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/usuarios/${id}`);
    if (!res.ok) {
      alert("Usuário não encontrado!");
      return;
    }

    const u = await res.json();

    alert(`
Nome: ${u.nome}
Email: ${u.email}
ID: ${u.id_usuarios}
Cadastrado em: ${u.data_cadastro}
    `);
  } catch (err) {
    console.error("Erro ao abrir modal:", err);
    alert("Erro ao buscar informações do usuário.");
  }
}

// Inicialização
fetchUsuarios();
