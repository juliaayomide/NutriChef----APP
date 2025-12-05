const welcomeScreen = document.getElementById("welcome-screen");
const loginScreen = document.getElementById("login-screen");
const registerScreen = document.getElementById("register-screen");

document.getElementById("welcome-login-button").onclick = () => {
  welcomeScreen.classList.remove("active");
  loginScreen.classList.add("active");
};

document.getElementById("welcome-register-button").onclick = () => {
  welcomeScreen.classList.remove("active");
  registerScreen.classList.add("active");
};

document.getElementById("register-login-button").onclick = (e) => {
  e.preventDefault();
  registerScreen.classList.remove("active");
  loginScreen.classList.add("active");
};

document.getElementById("login-register-button").onclick = (e) => {
  e.preventDefault();
  loginScreen.classList.remove("active");
  registerScreen.classList.add("active");
};

function voltarParaWelcome() {
  loginScreen.classList.remove("active");
  registerScreen.classList.remove("active");
  welcomeScreen.classList.add("active");
}

document.querySelectorAll('.toggle-password').forEach(icon => {
  const input = document.querySelector(icon.getAttribute('toggle'));
  icon.addEventListener('click', () => {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
});

function showScreen(screenToShow) {
    welcomeScreen.classList.remove('active');
    registerScreen.classList.remove('active');
    loginScreen.classList.remove('active');
    
    screenToShow.classList.add('active');
    
    registerMsg.className = 'msg';
    registerMsg.textContent = '';
    loginMsg.className = 'msg';
    loginMsg.textContent = '';
}

const registerForm = document.getElementById('register-form');
const registerMsg = document.getElementById('register-msg');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const senha = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-password-confirm').value;

  document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
  registerMsg.textContent = '';
  registerMsg.className = 'msg';

  let isValid = true;

  if (nome.length < 3) {
    document.getElementById('name-error').textContent = 'Nome deve ter pelo menos 3 caracteres';
    document.getElementById('name-error').style.display = 'block';
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById('register-email-error').textContent = 'Por favor, insira um email válido';
    document.getElementById('register-email-error').style.display = 'block';
    isValid = false;
  }

  if (senha.length < 6) {
    document.getElementById('register-password-error').textContent = 'Senha deve ter pelo menos 6 caracteres';
    document.getElementById('register-password-error').style.display = 'block';
    isValid = false;
  }

  if (senha !== confirmPassword) {
    document.getElementById('register-password-confirm-error').textContent = 'As senhas não coincidem';
    document.getElementById('register-password-confirm-error').style.display = 'block';
    isValid = false;
  }

  if (!isValid) return;

  try {
  const imagemPadrao = 'https://www.example.com/imagem-padrao.png';

  const response = await fetch('http://localhost:5000/nutrichef/1.0.0/usuario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, foto: imagemPadrao })
  });

  const data = await response.json();

  if (data.success) {
    registerMsg.textContent = 'Usuário cadastrado com sucesso!';
    registerMsg.className = 'msg success';
    registerForm.reset();
    setTimeout(() => showScreen(loginScreen), 2000);
  } else {
    registerMsg.textContent = data.message;
    registerMsg.className = 'msg error';
  }

  } catch (error) {
    registerMsg.textContent = 'Erro de conexão. Tente novamente.';
    registerMsg.className = 'msg error';
    console.error('Registration error:', error);
  }
});

const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;

  document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
  loginMsg.textContent = '';
  loginMsg.className = 'msg';

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (!data.success) {
      loginMsg.textContent = data.message;
      loginMsg.className = 'msg error';
      return;
    }

    loginMsg.textContent = 'Login realizado com sucesso!';
    loginMsg.className = 'msg success';
    loginForm.reset();

    setTimeout(() => window.location.href = '/perfil', 1000);

  } catch (error) {
    loginMsg.textContent = 'Erro de conexão. Tente novamente.';
    loginMsg.className = 'msg error';
    console.error('Login error:', error);
  }
});
