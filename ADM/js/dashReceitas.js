document.addEventListener('DOMContentLoaded', () => {

    window.graficoIngredientesInstancia = null;
    window.graficoReceitasInstancia = null;
    window.graficoUsuariosInstancia = null;

  const exists = v => v !== null && v !== undefined;
  const escapeHtml = s => String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const adminInfo = document.getElementById('admin-info');

  const navItems = document.querySelectorAll('.nav-item');
  const pageTitle = document.getElementById('page-title');

  const listaReceitas = document.getElementById('receitas-lista');
  const searchCadastradas = document.getElementById('search-receita');

  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const cancelDeleteBtn = document.getElementById('cancel-delete');

  const containerReceitasRecebidas = document.getElementById('receitas-recebidas-container');
  const searchRecebidas = document.getElementById('search-receita-recebida');

  const modalUnificado = document.getElementById('modal-receita'); 
  const conteudoModal = document.getElementById('conteudo-receita');
  const btnFecharModal = document.getElementById('fechar-modal');

  const searchDenuncia = document.getElementById('search-denuncia');

  let receitasRecebidas = []; 
  let paginaAtualRecebidas = 0;
  const receitasPorPagina = 5;

  let receitaIdParaExcluir = null;
  let excluirContext = null; 

  mostrarUsuarioLogado();
  fetchStats();
  fetchSites();
  fetchIngredientes();
  fetchDenuncias();

  async function mostrarUsuarioLogado() {
    if (!exists(adminInfo)) return;
    try {
      const res = await fetch('http://localhost:3000/api/usuario-logado', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const usuario = await res.json();
      adminInfo.textContent = usuario?.nome ? `${usuario.nome} • ${usuario.tipo}` : 'Não logado';
    } catch (err) {
      console.error('Erro usuario logado', err);
      adminInfo.textContent = 'Erro ao carregar usuário';
    }
  }

const screens = ['dashboard', 'receitas', 'graficos'];

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();

    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const screen = item.getAttribute('data-screen');

    pageTitle.textContent =
      screen === 'dashboard' ? 'Visão Geral' :
      screen === 'receitas' ? 'Receitas Cadastradas' :
      screen === 'denuncias' ? 'Avaliações' :
      screen === 'graficos' ? 'Gráficos Gerais' :
      '';

    screens.forEach(s => {
      const sec = document.getElementById('screen-' + s);
      if (sec) sec.style.display = (s === screen) ? 'block' : 'none';
    });

    if (screen === 'receitas') {
      fetchReceitas();
    }

    if (screen === 'denuncias') {
      fetchDenuncias();
    }

    if (screen === 'graficos') {
      setTimeout(() => {
        carregarGraficos();
      }, 50);
    }
  });
});

  async function fetchReceitas(query = '') {
    if (!exists(listaReceitas)) return;
    listaReceitas.innerHTML = '<li>Carregando...</li>';
    try {
      const url = query ? `http://localhost:3000/api/receitas?q=${encodeURIComponent(query)}` : 'http://localhost:3000/api/receitas';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const receitas = await res.json();

      listaReceitas.innerHTML = '';
      if (!receitas || receitas.length === 0) {
        listaReceitas.innerHTML = '<li>Nenhuma receita encontrada.</li>';
        return;
      }

      receitas.forEach(r => {
        const li = document.createElement('li');
        li.className = 'receita-item';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '12px';

        li.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px">
            <img src="${r.imagem || 'https://via.placeholder.com/120'}" alt="${escapeHtml(r.nome)}" style="width:100px;height:100px;object-fit:cover;border-radius:8px">
            <div>
              <strong>${escapeHtml(r.nome)}</strong><br>
              <span style="color:var(--muted)">Categoria: ${escapeHtml(r.categoria || 'Sem categoria')}</span><br>
              <span style="color:var(--muted)">Tempo: ${r.tempo_preparo || 0} min</span>
            </div>
          </div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button style="font-family: 'Poppins', sans-serif ; width:'80px';background-color:#000;border:none;border-radius:6px;width:80px;color:#fff;" class="btn-ver" data-id="${r.id}" title="Ver Mais">Ver Mais</button>
            <button class="btn-excluir" data-id="${r.id}" title="Excluir">Excluir</button>
          </div>
        `;

        li.querySelector('.btn-ver').addEventListener('click', async () => {
          try {
            const resp = await fetch(`http://localhost:3001/receitaDet/${r.id}`);
            if (resp.ok) {
              const full = await resp.json();
              abrirModalUnificado(full, 'cadastrada');
            } else {
              abrirModalUnificado(r, 'cadastrada');
            }
          } catch {
            abrirModalUnificado(r, 'cadastrada');
          }
        });

        li.querySelector('.btn-excluir').addEventListener('click', () => {
          receitaIdParaExcluir = r.id;
          excluirContext = 'cadastrada';
          if (deleteModal) deleteModal.style.display = 'flex';
        });

        listaReceitas.appendChild(li);
      });

    } catch (err) {
      console.error('Erro fetchReceitas', err);
      listaReceitas.innerHTML = '<li>Erro ao carregar receitas.</li>';
    }
  }

  if (exists(searchCadastradas)) {
    searchCadastradas.addEventListener('input', () => {
      fetchReceitas(searchCadastradas.value);
    });
  }

  if (exists(confirmDeleteBtn)) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!receitaIdParaExcluir) return;
      try {
        if (excluirContext === 'cadastrada') {
          const res = await fetch(`http://localhost:3000/api/receitas/${receitaIdParaExcluir}`, { method: 'DELETE' });
          const data = await res.json();
          showMessage(data.message || 'Receita excluída!');
          fetchReceitas(searchCadastradas?.value || '');
        } else if (excluirContext === 'recebida') {
          receitasRecebidas = receitasRecebidas.filter(r => r.id !== receitaIdParaExcluir);
          paginaAtualRecebidas = 0;
          renderReceitasRecebidasPagina();
        }
      } catch (err) {
        console.error('Erro excluir', err);
        showMessage('Erro ao excluir receita.');
      } finally {
        receitaIdParaExcluir = null;
        excluirContext = null;
        if (deleteModal) deleteModal.style.display = 'none';
      }
    });
  }
  if (exists(cancelDeleteBtn)) {
    cancelDeleteBtn.addEventListener('click', () => {
      receitaIdParaExcluir = null;
      excluirContext = null;
      if (deleteModal) deleteModal.style.display = 'none';
    });
  }

  async function carregarReceitasRecebidas() {
    if (!exists(containerReceitasRecebidas)) return;
    containerReceitasRecebidas.innerHTML = 'Carregando receitas...';
    receitasRecebidas = [];
    paginaAtualRecebidas = 0;
    try {
      const requests = Array.from({ length: 10 }, () =>
        fetch('http://localhost:3000/api/importar-receita').then(r => r.ok ? r.json() : null)
      );
      const results = await Promise.all(requests);
      receitasRecebidas = results.filter(Boolean);
      renderReceitasRecebidasPagina();
    } catch (err) {
      console.error('Erro carregarReceitasRecebidas', err);
      containerReceitasRecebidas.innerHTML = 'Erro ao carregar receitas recebidas.';
    }
  }

  function renderReceitasRecebidasPagina() {
    if (!exists(containerReceitasRecebidas)) return;
    containerReceitasRecebidas.innerHTML = '';
    const inicio = paginaAtualRecebidas * receitasPorPagina;
    const fim = inicio + receitasPorPagina;
    const page = receitasRecebidas.slice(inicio, fim);
    if (!page || page.length === 0) {
      containerReceitasRecebidas.innerHTML = '<p>Nenhuma solicitação de receita.</p>';
      return;
    }
    page.forEach(r => {
      const card = document.createElement('div');
      card.className = 'receita-card-resumo';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '12px';
      card.style.marginBottom = '12px';

      card.innerHTML = `
        <img src="${r.imagem || 'https://via.placeholder.com/120'}" style="width:96px;height:72px;object-fit:cover;border-radius:6px">
        <div style="flex:1">
          <strong>${escapeHtml(r.nome || '')}</strong><br>
          <span style="color:var(--muted)">${escapeHtml(r.categoria || '')}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-recebida-ver">Ver</button>
          <button class="btn-recebida-editar">Editar</button>
          <button class="btn-recebida-excluir">Excluir</button>
        </div>
      `;
      const btnVer = card.querySelector('.btn-recebida-ver');
      const btnEditar = card.querySelector('.btn-recebida-editar');
      const btnExcluir = card.querySelector('.btn-recebida-excluir');

      if (btnVer) btnVer.addEventListener('click', () => abrirModalUnificado(r, 'recebida'));
      if (btnEditar) btnEditar.addEventListener('click', () => abrirModalUnificado(r, 'recebida', { startEditing: true }));
      if (btnExcluir) btnExcluir.addEventListener('click', () => {
        receitaIdParaExcluir = r.id;
        excluirContext = 'recebida';
        if (deleteModal) deleteModal.style.display = 'flex';
      });

      containerReceitasRecebidas.appendChild(card);
    });

    if (fim < receitasRecebidas.length) {
      const btnMais = document.createElement('button');
      btnMais.textContent = 'Carregar Mais';
      btnMais.style.marginTop = '8px';
      btnMais.onclick = () => { paginaAtualRecebidas++; renderReceitasRecebidasPagina(); };
      containerReceitasRecebidas.appendChild(btnMais);
    }
  }

  if (exists(searchRecebidas)) {
    searchRecebidas.addEventListener('input', () => {
      const termo = searchRecebidas.value.trim().toLowerCase();
      if (!termo) { paginaAtualRecebidas = 0; renderReceitasRecebidasPagina(); return; }
      const filtradas = receitasRecebidas.filter(r => (r.nome || '').toLowerCase().includes(termo));
      containerReceitasRecebidas.innerHTML = '';
      if (!filtradas.length) { containerReceitasRecebidas.innerHTML = '<p>Nenhuma receita correspondente.</p>'; return; }
      filtradas.forEach(r => {
        const card = document.createElement('div');
        card.className = 'receita-card-resumo';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '12px';
        card.style.marginBottom = '12px';
        card.innerHTML = `
          <img src="${r.imagem || 'https://via.placeholder.com/120'}" style="width:96px;height:72px;object-fit:cover;border-radius:6px">
          <div style="flex:1">
            <strong>${escapeHtml(r.nome || '')}</strong><br>
            <span style="color:var(--muted)">${escapeHtml(r.categoria || '')}</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-recebida-ver">Ver</button>
            <button class="btn-recebida-editar">Editar</button>
            <button class="btn-recebida-excluir">Excluir</button>
          </div>
        `;
        const btnVer = card.querySelector('.btn-recebida-ver');
        const btnEditar = card.querySelector('.btn-recebida-editar');
        const btnExcluir = card.querySelector('.btn-recebida-excluir');
        if (btnVer) btnVer.addEventListener('click', () => abrirModalUnificado(r, 'recebida'));
        if (btnEditar) btnEditar.addEventListener('click', () => abrirModalUnificado(r, 'recebida', { startEditing: true }));
        if (btnExcluir) btnExcluir.addEventListener('click', () => {
          receitaIdParaExcluir = r.id;
          excluirContext = 'recebida';
          if (deleteModal) deleteModal.style.display = 'flex';
        });
        containerReceitasRecebidas.appendChild(card);
      });
    });
  }

  function abrirModalUnificado(receita = {}, source = 'cadastrada', options = {}) {
    const tabela = receita.tabelaNutricional || receita.tabela || null;

     conteudoModal.innerHTML = `
        <button id="fechar-modal-top">×</button>

        <img src="${receita.imagem || 'https://via.placeholder.com/600x300'}"
            class="modal-img">

        <h2 id="modal-nome" style="font-family: 'Poppins', sans-serif ;" class="modal-field">${escapeHtml(receita.nome || '')}</h2>
        <p id="modal-autor" class="modal-field" style="color:#666">
          Por ${escapeHtml(receita.autor || receita.usuario || 'Autor desconhecido')}
        </p>

        <p id="modal-descricao" class="modal-field">
          ${escapeHtml(receita.descricao || receita.instrucoes || '')}
        </p>

        <h3>Ingredientes:</h3>
        <div id="modal-ingredientes">
          ${(receita.ingredientes || []).map(i => `<p>🍴 ${escapeHtml(i)}</p>`).join('')}
        </div>

        <h3>Utensílios:</h3>
        <div id="modal-utensilios">
          ${(receita.utensilios || []).map(u => `<p>🥄 ${escapeHtml(u)}</p>`).join('') || '<p>Sem utensílios.</p>'}
        </div>

        <h3>Modo de preparo:</h3>
        <p><strong>⏱️ ${escapeHtml(receita.tempo_preparo || receita.tempo || 0)} min</strong></p>
        <div id="modal-passos">
          ${(receita.passos || []).map((p, idx) => `<p>${idx + 1}. ${escapeHtml(p)}</p>`).join('')}
        </div>

        <h3>Tabela nutricional:</h3>
        <div id="modal-nutri">
          ${
            tabela
              ? `
            <p><strong>Porções:</strong> ${tabela.porcoes}</p>
            <p><strong>Calorias:</strong> ${tabela.calorias} kcal</p>
            <p><strong>Proteínas:</strong> ${tabela.proteinas} g</p>
            <p><strong>Gorduras:</strong> ${tabela.gorduras} g</p>
            <p><strong>Carboidratos:</strong> ${tabela.carboidratos} g</p>
          `
              : '<p style="color:#777">Informações nutricionais não disponíveis.</p>'
          }
        </div>

        <div class="modal-btn-row">
            <button id="modal-btn-editar" class="modal-btn">Editar</button>
            <button id="modal-btn-salvar" class="modal-btn save" style="display:none">Salvar</button>

            ${
              source === "recebida"
                ? `
              <button id="modal-btn-aceitar" class="modal-btn">Aceitar</button>
              <button id="modal-btn-rejeitar" class="modal-btn danger">Rejeitar</button>`
                : ""
            }
        </div>
      `;

    if (modalUnificado) modalUnificado.style.display = 'flex';
                        modalUnificado.style.justifyContent = "center";
                        modalUnificado.style.alignItems = "flex-start";

    const fecharTop = document.getElementById('fechar-modal-top');
    if (fecharTop) fecharTop.onclick = () => { modalUnificado.style.display = 'none'; };

    const btnEditar = document.getElementById('modal-btn-editar');
    const btnSalvar = document.getElementById('modal-btn-salvar');
    const btnAceitar = document.getElementById('modal-btn-aceitar');
    const btnRejeitar = document.getElementById('modal-btn-rejeitar');

    let editing = false;

    function enableEditing() {
      if (editing) return;
      editing = true;

      const nomeEl = document.getElementById('modal-nome');
      const autorEl = document.getElementById('modal-autor');
      const descEl = document.getElementById('modal-descricao');
      const ingredientesEl = document.getElementById('modal-ingredientes');
      const utensiliosEl = document.getElementById('modal-utensilios');
      const passosEl = document.getElementById('modal-passos');

      if (nomeEl) { nomeEl.contentEditable = "true"; nomeEl.style.borderBottom = "1px dashed #ccc"; }
      if (autorEl) { autorEl.contentEditable = "true"; }
      if (descEl) { descEl.contentEditable = "true"; descEl.style.minHeight = "40px"; descEl.style.border = "1px dashed #eee"; descEl.style.padding = "6px"; }

      if (ingredientesEl) {
        const items = Array.from(ingredientesEl.querySelectorAll('p')).map(p => p.textContent.replace(/^🍴\s*/, ''));
        const ul = document.createElement('ul');
        ul.id = 'modal-edit-ingredientes';
        ul.style.paddingLeft = '20px';
        items.forEach(it => {
          const li = document.createElement('li');
          li.contentEditable = "true";
          li.innerText = it;
          ul.appendChild(li);
        });
        const liNew = document.createElement('li'); liNew.contentEditable = "true"; liNew.innerText = '';
        ul.appendChild(liNew);
        ingredientesEl.innerHTML = '<strong style="display:block;margin-bottom:6px">🍴 Ingredientes (edite):</strong>';
        ingredientesEl.appendChild(ul);
      }

      if (utensiliosEl) {
        const items = Array.from(utensiliosEl.querySelectorAll('p')).map(p => p.textContent.replace(/^🥄\s*/, ''));
        const ul = document.createElement('ul'); ul.id = 'modal-edit-utensilios'; ul.style.paddingLeft='20px';
        items.forEach(it => { const li = document.createElement('li'); li.contentEditable = "true"; li.innerText = it; ul.appendChild(li); });
        const liNew = document.createElement('li'); liNew.contentEditable = "true"; liNew.innerText = ''; ul.appendChild(liNew);
        utensiliosEl.innerHTML = '<strong style="display:block;margin-bottom:6px">🥄 Utensílios (edite):</strong>';
        utensiliosEl.appendChild(ul);
      }

      if (passosEl) {
        const items = Array.from(passosEl.querySelectorAll('p')).map(p => {
          return p.textContent.replace(/^\d+\.\s*/, '');
        });
        const ol = document.createElement('ol'); ol.id = 'modal-edit-passos'; ol.style.paddingLeft='20px';
        items.forEach(it => { const li = document.createElement('li'); li.contentEditable = "true"; li.innerText = it; ol.appendChild(li); });
        const liNew = document.createElement('li'); liNew.contentEditable = "true"; liNew.innerText = ''; ol.appendChild(liNew);
        passosEl.innerHTML = '<strong style="display:block;margin-bottom:6px">Modo de preparo (edite):</strong>';
        passosEl.appendChild(ol);
      }

      if (btnSalvar) btnSalvar.style.display = 'inline-block';
      if (btnEditar) btnEditar.style.display = 'none';
    }

    function disableEditing() {
      editing = false;

      const nomeEl = document.getElementById('modal-nome');
      const autorEl = document.getElementById('modal-autor');
      const descEl = document.getElementById('modal-descricao');

      if (nomeEl) { nomeEl.contentEditable = "false"; nomeEl.style.borderBottom = "none"; }
      if (autorEl) { autorEl.contentEditable = "false"; }
      if (descEl) { descEl.contentEditable = "false"; descEl.style.border = "none"; descEl.style.padding = "0"; }

      const ingEdit = document.getElementById('modal-edit-ingredientes');
      if (ingEdit) {
        const valores = Array.from(ingEdit.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
        const ingredientesEl = document.getElementById('modal-ingredientes');
        ingredientesEl.innerHTML = valores.map(v => `<p>🍴 ${escapeHtml(v)}</p>`).join('');
      }

      const utEdit = document.getElementById('modal-edit-utensilios');
      if (utEdit) {
        const valores = Array.from(utEdit.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
        const utensiliosEl = document.getElementById('modal-utensilios');
        utensiliosEl.innerHTML = valores.length ? valores.map(v => `<p>🥄 ${escapeHtml(v)}</p>`).join('') : '<p>Sem utensílios informados.</p>';
      }

      const passosEdit = document.getElementById('modal-edit-passos');
      if (passosEdit) {
        const valores = Array.from(passosEdit.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
        const passosEl = document.getElementById('modal-passos');
        passosEl.innerHTML = valores.map((p, idx) => `<p>${idx+1}. ${escapeHtml(p)}</p>`).join('');
      }

      if (btnSalvar) btnSalvar.style.display = 'none';
      if (btnEditar) btnEditar.style.display = 'inline-block';
    }

    if (btnEditar) btnEditar.addEventListener('click', () => enableEditing());

    if (btnSalvar) btnSalvar.addEventListener('click', async () => {
      const novoNome = document.getElementById('modal-nome')?.innerText.trim() || receita.nome;
      const novoAutor = document.getElementById('modal-autor')?.innerText.trim() || receita.autor;
      const novaDesc = document.getElementById('modal-descricao')?.innerText.trim() || receita.descricao;

      const ingEdit = document.getElementById('modal-edit-ingredientes');
      const novosIngredientes = ingEdit 
          ? Array.from(ingEdit.querySelectorAll('li'))
              .map(li => li.innerText.trim())
              .filter(Boolean)
          : receita.ingredientes;

      const utEdit = document.getElementById('modal-edit-utensilios');
      const novosUtensilios = utEdit
          ? Array.from(utEdit.querySelectorAll('li'))
              .map(li => li.innerText.trim())
              .filter(Boolean)
          : receita.utensilios;

      const passosEdit = document.getElementById('modal-edit-passos');
      const novosPassos = passosEdit
          ? Array.from(passosEdit.querySelectorAll('li'))
              .map(li => li.innerText.trim())
              .filter(Boolean)
          : receita.passos;

      const payload = {
        id_receitas: receita.id || receita.id_receitas,

        nome: novoNome || receita.nome,
        descricao: novaDesc || receita.descricao,
        instrucoes: novaDesc || receita.instrucoes,

        ingredientes: novosIngredientes?.length 
          ? novosIngredientes 
          : receita.ingredientes,

        utensilios: novosUtensilios?.length
          ? novosUtensilios
          : receita.utensilios,

        passos: novosPassos?.length
          ? novosPassos
          : receita.passos,

        tempo_preparo: receita.tempo_preparo ?? receita.tempo ?? null,
        id_categoria: receita.id_categoria ?? null,
        id_ingrediente_base: receita.id_ingrediente_base ?? null,
        idDificuldade: receita.idDificuldade ?? null,
        porcoes: receita.porcoes ?? null,
        custo_aproximado: receita.custo_aproximado ?? null
      };

      try {
        const res = await fetch('http://localhost:3000/api/atualizar-receita', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
          showMessage('Receita atualizada com sucesso!');
        } else {
          showMessage('Erro ao atualizar: ' + (data.message || ''));
        }
      } catch (err) {
        console.error('Erro salvar edição', err);
        showMessage('Erro ao salvar alterações.');
      } finally {
        receita.nome = payload.nome;
        receita.descricao = payload.descricao;
        receita.instrucoes = payload.instrucoes;
        receita.ingredientes = payload.ingredientes;
        receita.utensilios = payload.utensilios;
        receita.passos = payload.passos;

        disableEditing();
        fetchReceitas(searchCadastradas?.value || '');
      }
    });

    if (btnAceitar) btnAceitar.addEventListener('click', async () => {
      try {
        const response = await fetch('http://localhost:3001/publicar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: receita.nome || '',
            descricao: receita.instrucoes || receita.descricao || '',
            porcoes: 1,
            custo: 1,
            dificuldade: 1,
            idCategoria: receita.idCategoria || 1,
            idIngredienteBase: 1,
            tempoPreparo: receita.tempo_preparo || receita.tempo || 0,
            ingredientes: JSON.stringify(receita.ingredientes || []),
            utensilios: JSON.stringify(receita.utensilios || []),
            passos: JSON.stringify(receita.passos || []),
            info: ''
          })
        });
        const data = await response.json();
        if (data.success) {
          showMessage(`Receita "${receita.nome}" validada e salva no banco!`);
          receitasRecebidas = receitasRecebidas.filter(r => r.id !== receita.id);
          paginaAtualRecebidas = 0;
          renderReceitasRecebidasPagina();
          modalUnificado.style.display = 'none';
        } else {
          showMessage('Erro ao salvar receita: ' + (data.message || ''));
        }
      } catch (err) {
        console.error('Erro ao aceitar receita', err);
        showMessage('Erro ao salvar receita no servidor.');
      }
    });

    if (btnRejeitar) btnRejeitar.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja rejeitar esta receita?')) {
        receitasRecebidas = receitasRecebidas.filter(r => r.id !== receita.id);
        renderReceitasRecebidasPagina();
        modalUnificado.style.display = 'none';
      }
    });

    if (options.startEditing) enableEditing();
  }

  if (exists(btnFecharModal) && exists(modalUnificado)) {
    btnFecharModal.addEventListener('click', () => { modalUnificado.style.display = 'none'; });
  }

  async function fetchDenuncias(q = '') {
    try {
      const res = await fetch(`http://localhost:3000/api/denuncias?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const container = document.getElementById('denuncias-container');
      if (!container) return;
      container.innerHTML = '';
      if (!data || data.length === 0) {
        container.innerHTML = '<p style="color:var(--muted)">Nenhuma avaliação encontrada.</p>';
        return;
      }
      data.forEach(d => {
        const checked = d.status === 'Atendida' ? 'checked' : '';
        container.innerHTML += `
          <div class="denuncia-card">
            <div class="denuncia-info">
              <h4>${escapeHtml(d.usuario || '')}</h4>
              <p><strong>Receita:</strong> ${escapeHtml(d.receita || '')}</p>
              <p><strong>Comentário:</strong> ${escapeHtml(d.motivo || '')}</p>
              <p><strong>Nota:</strong> ${escapeHtml(d.nota || '')}</p>
              <p><strong>Email:</strong> ${escapeHtml(d.email || '')}</p>
              <p><strong>Data:</strong> ${escapeHtml(d.data || '')}</p>
            </div>
            <div class="denuncia-status">
              <label>
                <input type="checkbox" class="status-checkbox" data-id="${d.id}" ${checked}>
                <span>${escapeHtml(d.status || '')}</span>
              </label>
            </div>
          </div>
        `;
      });

      document.querySelectorAll('.status-checkbox').forEach(chk => {
        chk.addEventListener('change', async e => {
          const id = e.target.dataset.id;
          const novoStatus = e.target.checked ? 'Atendida' : 'Pendente';
          await fetch(`http://localhost:3000/api/denuncias/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
          });
          fetchDenuncias(document.getElementById('search-denuncia')?.value || '');
        });
      });
    } catch (err) {
      console.error('Erro fetchDenuncias', err);
    }
  }

  if (exists(searchDenuncia)) {
    searchDenuncia.addEventListener('input', e => fetchDenuncias(e.target.value));
  }

  async function fetchStats() {
    try {
      const res = await fetch('http://localhost:3000/api/stats');
      const data = await res.json();
      if (document.getElementById('total-receitas')) document.getElementById('total-receitas').textContent = data.receitas;
      if (document.getElementById('total-comentarios')) document.getElementById('total-comentarios').textContent = data.comentarios;
      if (document.getElementById('total-usuarios')) document.getElementById('total-usuarios').textContent = data.usuarios;
    } catch (err) {
      console.error('Erro fetchStats', err);
    }
  }

  async function fetchSites() {
    try {
      const res = await fetch('http://localhost:3000/api/sites');
      const data = await res.json();
      const container = document.getElementById('sites-list');
      if (!container) return;
      container.innerHTML = '';
      data.forEach(site => {
        container.innerHTML += `
          <div class="list-row">
            <div class="list-left">
              <div class="avatar-sm">${escapeHtml(site.nome[0] || '')}</div>
              <div>
                <div style="font-weight:700">${escapeHtml(site.nome || '')}</div>
                <div style="color:var(--muted);font-size:13px">${escapeHtml(String(site.produtos || 0))} produtos</div>
              </div>
            </div>
            <div>⋮</div>
          </div>
        `;
      });
    } catch (err) {
      console.error('Erro fetchSites', err);
    }
  }

 async function fetchIngredientes() {
    try {
      const res = await fetch('http://localhost:3000/api/ingredientes');
      const data = await res.json();
      const container = document.getElementById('ingredientes-list');
      if (!container) return;
      container.innerHTML = '';
      data.forEach(ing => {
        container.innerHTML += `
          <div style="display:flex;justify-content:space-between">
            <div style="display:flex;gap:8px;align-items:center">
              <span style="width:10px;height:10px;border-radius:50%;background:${escapeHtml(ing.cor || '#ccc')}"></span>
              <span>${escapeHtml(ing.nome || '')}</span>
            </div>
            <div style="color:var(--muted)">${escapeHtml(String(ing.percentual || 0))}%</div>
          </div>
        `;
      });
    } catch (err) {
      console.error("Erro fetchIngredientes", err);
    }
  }

  async function carregarGraficos() {
    await graficoIngredientes();
    await carregarGraficoIngredientes();
    await carregarGraficoReceitasPorCategoria();
    await carregarGraficoReceitasMaisAcessadas();
  }

  async function graficoIngredientes() {
    try {
        const res = await fetch("http://localhost:3000/api/graficos/ingredientes-populares");
        const dados = await res.json();

        const labels = dados.map(x => x.ingrediente);
        const valores = dados.map(x => Number(x.total));

        const ctx = document.getElementById("graficoIngredientes");

        if (!ctx) {
            console.error("❌ Canvas graficoIngredientes não encontrado!");
            return;
        }

        if (window.graficoIngredientesInstancia) {
            window.graficoIngredientesInstancia.destroy();
        }

        window.graficoIngredientesInstancia = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    label: "Uso dos ingredientes",
                    data: valores,
                    backgroundColor: [
                        "#FF6384","#36A2EB","#FFCE56",
                        "#4BC0C0","#9966FF","#FF9F40",
                        "#66FF99","#C9CBCF"
                    ]
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const total = valores.reduce((a, b) => a + b, 0);
                                const v = context.raw;
                                const p = ((v / total) * 100).toFixed(1);
                                return `${context.label}: ${v} receitas (${p}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Erro ao gerar gráfico de ingredientes:", err);
    }
  }

async function carregarGraficoIngredientes() {
  try {
    const res = await fetch("http://localhost:3000/api/graficos/ingredientes-populares");
    const dados = await res.json();

    const labels = dados.map(x => x.ingrediente);
    const valores = dados.map(x => Number(x.total));

    const ctx = document.getElementById("graficoIngredientes");

    if (!ctx) return console.error("Canvas graficoIngredientes não encontrado!");

    if (window.graficoIngredientesInstancia) {
      window.graficoIngredientesInstancia.destroy();
    }

    window.graficoIngredientesInstancia = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label: "Uso dos Ingredientes",
          data: valores,
          backgroundColor: [
            "#FF6384","#36A2EB","#FFCE56",
            "#4BC0C0","#9966FF","#FF9F40",
            "#66FF99","#C9CBCF"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });

  } catch (err) {
    console.error("Erro ao carregar ingredientes:", err);
  }
}

async function carregarGraficoReceitasPorCategoria() {
  try {
    const res = await fetch("http://localhost:3000/api/graficos/receitas-por-categoria");
    const dados = await res.json();

    const labels = dados.map(x => `${x.categoria}`);
    const valores = dados.map(x => Number(x.porcentagem));

    const ctx = document.getElementById("graficoReceitasCategoria");

    if (!ctx) return console.error("Canvas graficoReceitasCategoria não encontrado!");

    if (window.graficoReceitasCategoriaInstancia) {
      window.graficoReceitasCategoriaInstancia.destroy();
    }

    window.graficoReceitasCategoriaInstancia = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label: "Receitas por Categoria: ",
          data: valores,
          backgroundColor: [
            "#FF6384", "#36A2EB", "#FFCE56",
            "#4BC0C0", "#9966FF", "#FF9F40",
            "#66FF99", "#C9CBCF", "#B266FF",
            "#FF6666"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });

  } catch (err) {
    console.error("Erro ao carregar gráfico de receitas por categoria:", err);
  }
}

async function carregarGraficoReceitasMaisAcessadas() {
  try {
    const res = await fetch("http://localhost:3000/api/graficos/receitas-mais-acessadas");
    const dados = await res.json();

    console.log("Dados recebidos:", dados);

    const labels = dados.map(x => x.receita);
    const valores = dados.map(x => Number(x.acessos));

    const canvas = document.getElementById("graficoReceitasMaisAcessadas");
    if (!canvas) {
      console.error("❌ Canvas graficoReceitasMaisAcessadas NÃO encontrado!");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("❌ Não foi possível obter o contexto 2D do canvas!");
      return;
    }

    if (window.graficoReceitasMaisAcessadasInstancia) {
      window.graficoReceitasMaisAcessadasInstancia.destroy();
    }

    window.graficoReceitasMaisAcessadasInstancia = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Acessos",
          data: valores,
          backgroundColor: "rgba(54, 162, 235, 0.7)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2,
          barThickness: 30,
          maxBarThickness: 32  
        }]
      },
      options: {
        responsive: true,
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true },
          y: {
            ticks: {
              callback: function(_, index) {
                const label = this.chart.data.labels[index];
                return label.length > 30 ? label.substring(0, 15) + "..." : label;
              }
            }
          }
        },
        plugins: {
          legend: { display: false }
        },
        layout: {
          padding: { left: 10, right: 20 }
        }
      }
    });

  } catch (err) {
    console.error("❌ Erro ao carregar gráfico de receitas mais acessadas:", err);
  }
}

  window.abrirModalUnificado = abrirModalUnificado;
  window.fetchReceitas = fetchReceitas;
  window.carregarReceitasRecebidas = carregarReceitasRecebidas;
  window.renderReceitasRecebidasPagina = renderReceitasRecebidasPagina;
});

