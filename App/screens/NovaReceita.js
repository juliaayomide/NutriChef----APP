import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import axios from "axios";

import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

export default function NovaReceita() {
  const navigation = useNavigation();

  const [categorias, setCategorias] = useState([]);
  const [ingredientesBase, setIngredientesBase] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState(null); // Local selecionado
  const [imagemURL, setImagemURL] = useState(null); // URL do servidor
  const [tempoHoras, setTempoHoras] = useState("0");
  const [tempoMin, setTempoMin] = useState("0");
  const [porcoes, setPorcoes] = useState("1");
  const [dificuldade, setDificuldade] = useState(1);
  const [custo, setCusto] = useState(1);
  const [ingredientes, setIngredientes] = useState([""]);
  const [utensilios, setUtensilios] = useState("");
  const [passos, setPassos] = useState([""]);
  const [idCategoria, setIdCategoria] = useState(null);
  const [idIngredienteBase, setIdIngredienteBase] = useState(null);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  const baseURL = Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

  useEffect(() => {
    async function carregarListas() {
      try {
        const catRes = await axios.get(`${baseURL}/categorias`);
        setCategorias(catRes.data);

        const ingRes = await axios.get(`${baseURL}/ingredientes`);
        setIngredientesBase(ingRes.data);
      } catch (err) {
        console.error(err);
        Alert.alert("Erro", "Falha ao carregar categorias ou ingredientes");
      }
    }
    carregarListas();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setImagem(result.assets[0]);
  };

  const enviarImagem = async (uri) => {
    if (!uri) return null;

    let arquivo;
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      let tipo = blob.type;
      if (tipo === "image/jpg") tipo = "image/jpeg";
      arquivo = new File([blob], uri.split("/").pop(), { type: tipo });
    } else {
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
      arquivo = { uri, name: filename, type };
    }

    const formData = new FormData();
    formData.append("imagem", arquivo);
    return formData;
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !descricao.trim()) {
      setMensagem("Nome e descrição são obrigatórios");
      setTipoMensagem("erro");
      return;
    }
    if (!idCategoria) {
      setMensagem("Selecione uma categoria");
      setTipoMensagem("erro");
      return;
    }

    setLoading(true);
    try {
      const tempoPreparo = parseInt(tempoHoras || "0") * 60 + parseInt(tempoMin || "0");
      const formData = new FormData();

      formData.append("nome", nome);
      formData.append("descricao", descricao);
      formData.append("tempoPreparo", tempoPreparo);
      formData.append("porcoes", porcoes);
      formData.append("dificuldade", dificuldade);
      formData.append("custo", custo);
      formData.append("idCategoria", idCategoria);
      formData.append("idIngredienteBase", idIngredienteBase || "");
      formData.append("ingredientes", JSON.stringify(ingredientes.filter(i => i.trim())));
      formData.append("utensilios", JSON.stringify(utensilios.split(",").map(u => u.trim()).filter(u => u)));
      formData.append("passos", JSON.stringify(passos.filter(p => p.trim())));
      formData.append("info", info);

      if (imagem) {
        const imgData = await enviarImagem(imagem.uri);
        for (let [key, value] of imgData.entries()) {
          formData.append(key, value);
        }
      }

      const res = await axios.post(`${baseURL}/publicar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setMensagem(res.data.message || "Receita cadastrada com sucesso!");
        setTipoMensagem("sucesso");

        // **Seta a URL do servidor para preview**
        setImagemURL(res.data.resultado.imagem);

        setTimeout(() => {
          setMensagem("");
          navigation.navigate("Home");
        }, 1500);
      } else {
        setMensagem(res.data.message || "Falha ao cadastrar receita");
        setTipoMensagem("erro");
      }
    } catch (err) {
      console.error(err);
      setMensagem("Erro de conexão. Tente novamente.");
      setTipoMensagem("erro");
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (value, setValue, max, descriptions) => (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {Array.from({ length: max }).map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setValue(idx + 1)}
            style={[styles.circle, { backgroundColor: idx < value ? "#ffa94d" : "#eee" }]}
          />
        ))}
      </View>
      <Text style={{ marginTop: 4, fontStyle: "italic", color: "#555" }}>
        {descriptions[value - 1] || ""}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.title}>Publicar Nova Receita</Text>

      <Text>Nome *</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text>Descrição *</Text>
      <TextInput style={styles.textarea} value={descricao} onChangeText={setDescricao} multiline />

      <Text>Imagem *</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={{ color: "#fff" }}>{imagem ? "Alterar imagem" : "Escolher imagem"}</Text>
      </TouchableOpacity>

      {/* Preview: usa local antes do submit ou URL do backend depois */}
      {imagem && !imagemURL && <Image source={{ uri: imagem.uri }} style={styles.imagePreview} />}
      {imagemURL && <Image source={{ uri: `${baseURL}${imagemURL}` }} style={styles.imagePreview} />}

      <Text>Tempo de preparo *</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <TextInput
          style={styles.inputSmall}
          value={tempoHoras}
          onChangeText={text => setTempoHoras(text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
          placeholder="Horas"
        />
        <TextInput
          style={styles.inputSmall}
          value={tempoMin}
          onChangeText={text => {
            let val = text.replace(/[^0-9]/g, "");
            if (+val > 59) val = "59";
            setTempoMin(val);
          }}
          keyboardType="numeric"
          placeholder="Minutos"
        />
      </View>

      <Text>Porções *</Text>
      <TextInput
        style={styles.input}
        value={porcoes}
        onChangeText={text => setPorcoes(text.replace(/[^0-9]/g, "") || "1")}
        keyboardType="numeric"
      />

      <Text>Dificuldade *</Text>
      {renderRating(dificuldade, setDificuldade, 5, ["Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"])}

      <Text>Custo *</Text>
      {renderRating(custo, setCusto, 4, ["Baixo", "Médio", "Alto", "Elevado"])}

      <Text>Ingredientes *</Text>
      {ingredientes.map((i, idx) => (
        <TextInput
          key={idx}
          style={styles.input}
          value={i}
          onChangeText={val => setIngredientes(ingredientes.map((v, id) => (id === idx ? val : v)))}
        />
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => setIngredientes([...ingredientes, ""])}>
        <Text style={{ color: "#fff" }}>+ Adicionar ingrediente</Text>
      </TouchableOpacity>

      <Text>Utensílios</Text>
      <TextInput
        style={styles.input}
        value={utensilios}
        onChangeText={setUtensilios}
        placeholder="Ex: panela, colher..."
      />

      <Text>Passos *</Text>
      {passos.map((p, idx) => (
        <TextInput
          key={idx}
          style={styles.textarea}
          value={p}
          onChangeText={val => setPassos(passos.map((v, id) => (id === idx ? val : v)))}
          multiline
        />
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => setPassos([...passos, ""])}>
        <Text style={{ color: "#fff" }}>+ Adicionar passo</Text>
      </TouchableOpacity>

      <Text>Categoria</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {categorias.map(c => (
          <TouchableOpacity
            key={c.id_categorias}
            onPress={() => setIdCategoria(c.id_categorias)}
            style={[styles.tag, { backgroundColor: idCategoria === c.id_categorias ? "#ffa94d" : "#eee" }]}
          >
            <Text>{c.nome}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text>Ingrediente Base</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {ingredientesBase.map(i => (
          <TouchableOpacity
            key={i.id_ingrediente}
            onPress={() => setIdIngredienteBase(i.id_ingrediente)}
            style={[styles.tag, { backgroundColor: idIngredienteBase === i.id_ingrediente ? "#ffa94d" : "#eee" }]}
          >
            <Text>{i.nome}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text>Informações adicionais</Text>
      <TextInput style={styles.textarea} value={info} onChangeText={setInfo} multiline />

      <TouchableOpacity
        style={[styles.submitButton, { opacity: loading ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", textAlign: "center" }}>Enviar Receita</Text>
        )}
      </TouchableOpacity>

      {mensagem ? (
        <Text style={{ textAlign: "center", color: tipoMensagem === "erro" ? "red" : "green", marginTop: 10 }}>
          {mensagem}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, textAlign: "center", color: "#e68900" },
  input: { borderWidth: 1, borderColor: "#ffa94d", borderRadius: 8, padding: 8, marginBottom: 10 },
  inputSmall: { borderWidth: 1, borderColor: "#ffa94d", borderRadius: 8, padding: 8, width: 80 },
  textarea: { borderWidth: 1, borderColor: "#FF6300", borderRadius: 8, padding: 8, minHeight: 60, marginBottom: 10 },
  imagePicker: { backgroundColor: "#ff6b00", padding: 10, borderRadius: 8, marginTop: 5, alignItems: "center" },
  imagePreview: { width: 150, height: 150, marginTop: 10, borderRadius: 8, alignSelf: "center" },
  addButton: { backgroundColor: "#FF6300", padding: 8, borderRadius: 6, alignItems: "center", marginBottom: 10 },
  tag: { padding: 6, borderRadius: 6 },
  submitButton: { backgroundColor: "#ff6b00", padding: 12, borderRadius: 8, marginTop: 10, justifyContent: "center" },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#ffa94d", justifyContent: "center", alignItems: "center" },
});
