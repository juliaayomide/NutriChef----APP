import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
} from "react-native";
import Header from "../components/Voltar";


export default function CadastroLogin({ navigation }) {
  const [tela, setTela] = useState("welcome");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState(""); // sucesso | erro

  const irPara = (novaTela) => {
    setMensagem("");
    setTipoMensagem("");
    setTela(novaTela);
  };

  // --- CADASTRO ---
  const handleCadastro = async () => {
    const { nome, email, senha, confirmarSenha } = form;

    if (!nome || !email || !senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos!");
      setTipoMensagem("erro");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não coincidem!");
      setTipoMensagem("erro");
      return;
    }

    try {
      const imagemPadrao = "https://www.example.com/imagem-padrao.png";
      const response = await fetch(
        "http://localhost:3001/nutrichef/1.0.0/usuario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, senha, foto: imagemPadrao }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMensagem("Usuário cadastrado com sucesso!");
        setTipoMensagem("sucesso");
        setForm({ nome: "", email: "", senha: "", confirmarSenha: "" });
        setTimeout(() => {
          setMensagem("");
          irPara("login");
        }, 2000);
      } else {
        setMensagem(data.message || "Erro ao cadastrar usuário");
        setTipoMensagem("erro");
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setMensagem("Erro de conexão. Tente novamente.");
      setTipoMensagem("erro");
    }
  };

  // --- LOGIN ---
  const handleLogin = async () => {
    const { email, senha } = form;

    if (!email || !senha) {
      setMensagem("Preencha todos os campos!");
      setTipoMensagem("erro");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3001/nutrichef/1.0.0/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setMensagem("Login realizado com sucesso!");
        setTipoMensagem("sucesso");
        setTimeout(() => {
          setMensagem("");
          navigation.navigate("Perfil");
        }, 1500);
      } else {
        setMensagem(data.message || "Email ou senha incorretos");
        setTipoMensagem("erro");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setMensagem("Erro de conexão. Tente novamente.");
      setTipoMensagem("erro");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <Header navigation={navigation}/>
      {/* --- TELA BEM-VINDO --- */}
      {tela === "welcome" && (
        <View style={styles.screen}>
          <Image
            source={require("../assets/img/telaCL.png")}
            style={{ width: "60%", height: 180, marginBottom: 15 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>Seja bem-vindo!</Text>
          <Text style={styles.text}>
            Faça seu cadastro para desbloquear funções dentro do NutriChef.
          </Text>

          <TouchableOpacity
            style={styles.buttonLogin}
            onPress={() => irPara("login")}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonCadastro}
            onPress={() => irPara("cadastro")}
          >
            <Text style={styles.buttonText}>Cadastrar-se</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- TELA CADASTRO --- */}
      {tela === "cadastro" && (
        <View style={styles.screen}>

          <Text style={styles.title}>Cadastre-se</Text>
          <Text style={styles.text}>
            Crie sua conta para desbloquear funções dentro do NutriChef.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={form.nome}
            onChangeText={(text) => setForm({ ...form, nome: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={form.senha}
            onChangeText={(text) => setForm({ ...form, senha: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Repita sua senha"
            secureTextEntry
            value={form.confirmarSenha}
            onChangeText={(text) =>
              setForm({ ...form, confirmarSenha: text })
            }
          />

          <TouchableOpacity
            style={styles.buttonCadastro}
            onPress={handleCadastro}
          >
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          {/* MENSAGEM DE STATUS */}
          {mensagem ? (
            <Text
              style={[
                styles.mensagem,
                tipoMensagem === "sucesso" ? styles.sucesso : styles.erro,
              ]}
            >
              {mensagem}
            </Text>
          ) : null}

          <TouchableOpacity onPress={() => irPara("login")}>
            <Text style={styles.link2}>Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- TELA LOGIN --- */}
      {tela === "login" && (
        <View style={styles.screen}>

          <Text style={[styles.title, { color: "#FF6300" }]}>Entrar</Text>
          <Text style={styles.text}>
            Bem-vindo de volta, sentimos sua falta!
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={form.senha}
            onChangeText={(text) => setForm({ ...form, senha: text })}
          />

          

          <TouchableOpacity style={styles.buttonLogin} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          {/* MENSAGEM DE STATUS */}
          {mensagem ? (
            <Text
              style={[
                styles.mensagem,
                tipoMensagem === "sucesso" ? styles.sucesso : styles.erro,
              ]}
            >
              {mensagem}
            </Text>
          ) : null}

          <TouchableOpacity onPress={() => alert("Recuperar senha em breve!")}>
            <Text style={styles.link}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => irPara("cadastro")}>
            <Text style={styles.link}>Criar uma nova conta</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", },
  screen: { width: "85%", alignItems: "center" },
  logo: { fontSize: 30, fontFamily: "Poppins_700Bold", color: "#FF6300", marginBottom: 10 },
  title: { fontSize: 24, fontFamily: "Poppins_700Bold", marginBottom: 5 },
  text: { textAlign: "center", color: "#000000ff", marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  buttonLogin: {
    backgroundColor: '#FF6300',
   marginBottom:5,
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonCadastro: {
    backgroundColor: "#000000ff",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 5,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: { color: "#fff", fontFamily: "Poppins_700Bold" },
  link: { color: "#333", marginTop: 10 },
  mensagem: { marginTop: 10, fontSize: 15, textAlign: "center" },
  sucesso: { color: "green" },
  erro: { color: "red" },
  link: { marginBottom: 10,  marginTop: 5 },
  link2: { color: "#333", marginTop: 15 },
});
