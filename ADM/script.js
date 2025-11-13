document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome = document.getElementById("login-nome").value.trim();
  const senha = document.getElementById("login-password").value.trim();
  const msg = document.getElementById("login-msg");

  msg.textContent = "";

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, senha })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      msg.style.color = "green";
      msg.textContent = data.message;

      setTimeout(() => {
        window.location.href = "DashboardADM.html";
      }, 1500);
    } else {
      msg.style.color = "red";
      msg.textContent = data.error || "Falha no login.";
    }
  } catch (error) {
    console.error("Erro:", error);
    msg.style.color = "red";
    msg.textContent = "Erro ao conectar com o servidor.";
  }
});