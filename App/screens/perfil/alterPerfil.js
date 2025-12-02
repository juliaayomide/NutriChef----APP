import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import Header from "../../components/Voltar";

export default function AlterPerfil() {
  const navigation = useNavigation();
  const [usuario, setUsuario] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [fotoUri, setFotoUri] = useState(null);

  const baseURL = "http://localhost:3001"; // substitua pelo IP da sua máquina

  // ==================== CARREGAR PERFIL ====================
  useEffect(() => {
    fetch(`${baseURL}/perfil`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.usuario) {
          setUsuario(data.usuario);
          setNome(data.usuario.nome);
          setEmail(data.usuario.email);
          setSenha(data.usuario.senha || "");
          setFotoUri(
            data.usuario.foto
              ? `${baseURL}${data.usuario.foto}?t=${new Date().getTime()}`
              : null
          );
        } else {
          navigation.replace("CadastroLogin");
        }
      })
      .catch((err) => {
        console.error(err);
        navigation.replace("CadastroLogin");
      });
  }, []);

  // ==================== ESCOLHER FOTO ====================
  const mudarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de acesso às fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setFotoUri(result.assets[0].uri);
    }
  };

  // ==================== ENVIAR FOTO PARA API ====================
  const enviarFoto = async (uri) => {
    if (!uri || uri.startsWith(baseURL)) return uri;

    let arquivo;
    if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();

        // Forçar tipo compatível com Multer
        let tipo = blob.type;
        if (tipo === "image/jpg") tipo = "image/jpeg";
        arquivo = new File([blob], uri.split("/").pop(), { type: tipo });
        } else {
        arquivo = { uri, name: uri.split("/").pop(), type: "image/jpeg" };
    }


    const formData = new FormData();
    formData.append("foto", arquivo);

    const resFoto = await fetch(`${baseURL}/perfil/foto`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!resFoto.ok) {
      const erroData = await resFoto.json().catch(() => ({}));
      throw new Error(erroData.message || "Erro ao enviar foto");
    }

    const dataFoto = await resFoto.json();
    if (!dataFoto.success) throw new Error(dataFoto.message);

    return `${baseURL}${dataFoto.foto}?t=${new Date().getTime()}`;
  };

  // ==================== SALVAR PERFIL ====================
  const handleSalvar = async () => {
    try {
      const resPerfil = await fetch(`${baseURL}/perfil`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      const dataPerfil = await resPerfil.json();
      if (!dataPerfil.success) throw new Error(dataPerfil.message);

      let novaFoto = fotoUri;
      if (fotoUri && !fotoUri.startsWith(baseURL)) {
        novaFoto = await enviarFoto(fotoUri);
        setFotoUri(novaFoto);
      }

      const usuarioAtualizado = { ...dataPerfil.usuario, foto: novaFoto };
      setUsuario(usuarioAtualizado);

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      navigation.navigate("Perfil", { usuarioAtualizado });
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", err.message || "Não foi possível atualizar o perfil");
    }
  };

  if (!usuario) {
    return (
      <View style={[styles.container, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header navigation={navigation} />
      <Text style={styles.title}>Editar perfil</Text>

      <View style={styles.fotoContainer}>
        <Image
          source={{
            uri: fotoUri ? fotoUri : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.fotoPerfil}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.btnMudarFoto} onPress={mudarFoto}>
          <Text style={styles.btnMudarFotoText}>Mudar foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} value={senha} onChangeText={setSenha} secureTextEntry />

        <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvar}>
          <Text style={styles.btnSalvarText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff",},
  title: { fontSize: 20, fontFamily: "Poppins_600SemiBold", textAlign: "center", marginBottom: 20 },
  fotoContainer: { alignItems: "center", marginBottom: 30 },
  fotoPerfil: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: "#000", backgroundColor: "#f0f0f0", marginBottom: 10 },
  btnMudarFoto: { backgroundColor: "#d10000", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  btnMudarFotoText: { color: "#fff", fontFamily: "Poppins_700Bold" },
  form: { width: "100%", maxWidth: 400 },
  label: { fontFamily: "Poppins_600SemiBold", marginBottom: 5, marginTop: 10 },
  input: { padding: 10, borderWidth: 1.5, borderColor: "#ccc", borderRadius: 10, fontSize: 15 },
  btnSalvar: { backgroundColor: "red", paddingVertical: 14, borderRadius: 12, marginTop: 20, alignItems: "center" },
  btnSalvarText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16 },
});
