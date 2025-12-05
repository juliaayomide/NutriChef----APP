import React, { useEffect, useState } from "react";
import { 
  View, Text, Image, TouchableOpacity, Alert, ScrollView, StyleSheet, Platform 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "../../components/Voltar";

export default function ConfigPerfil() {
  const navigation = useNavigation();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/perfil", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.usuario) {
          setUsuario(data.usuario);
        } else {
          navigation.replace("CadastroLogin"); 
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar usuário:", err);
        navigation.replace("CadastroLogin");
      });
  }, []);

  const handleLogout = () => {
    const logoutFetch = () => {
      fetch("http://localhost:3001/nutrichef/1.0.0/logout", {
        method: "POST",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) navigation.replace("CadastroLogin");
          else alert(data.message || "Erro ao deslogar");
        })
        .catch((err) => console.error("Erro no logout:", err));
    };

    if (Platform.OS === "web") {
      if (window.confirm("Tem certeza que deseja sair?")) logoutFetch();
    } else {
      Alert.alert(
        "Sair",
        "Tem certeza que deseja sair?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sair", style: "destructive", onPress: logoutFetch },
        ],
        { cancelable: true }
      );
    }
  };

  if (!usuario) {
    return (
      <View style={[styles.container, { justifyContent: "center", flex: 1 }]}>
        <Text>Carregando usuário...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header navigation={navigation} />

      <View style={styles.configUser}>
        <Image
          source={{
            uri: usuario.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.fotoPerfil}
        />
        <Text style={styles.usuarioNome}>{usuario.nome}</Text>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => navigation.navigate("AlterPerfil")}
        >
          <Text style={styles.btnEditarText}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.configOpcoes}>
        <Text style={styles.opcoesTitle}>Configurações</Text>
        <TouchableOpacity style={styles.opcaoItem}>
          <Text style={styles.opcaoTexto}>Idioma</Text>
          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.opcaoItem}>
          <Text style={styles.opcaoTexto}>Tamanho da fonte</Text>
          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.opcaoItem}>
          <Text style={styles.opcaoTexto}>Dúvidas frequentes</Text>
          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", },

  configUser: { alignItems: "center", marginBottom: 30 },
  fotoPerfil: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#ff6a00",
    backgroundColor: "#f0f0f0",
    marginBottom: 12,
  },
  usuarioNome: { fontSize: 20, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },
  btnEditar: {
    backgroundColor: "#ff6a00",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  btnEditarText: { color: "#fff", fontFamily: "Poppins_500Medium", fontSize: 14 },

  configOpcoes: { marginBottom: 30 },
  opcoesTitle: { fontSize: 16, fontFamily: "Poppins_600SemiBold", marginBottom: 10 },
  opcaoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  opcaoTexto: { fontSize: 15, color: "#111" },
  seta: { fontSize: 18, color: "#999" },

  btnLogout: {
    backgroundColor: "#ff4b5c",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnLogoutText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 16 },
});
