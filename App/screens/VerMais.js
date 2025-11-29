import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import Header from "../components/Voltar";


export default function ReceitasPorCategoria({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarCategoriasComReceitas() {
      try {
        // 1️⃣ Busca todas as categorias
        const { data: categoriasAPI } = await axios.get("http://localhost:3001/categorias");

        // 2️⃣ Para cada categoria, busca suas receitas
        const categoriasComReceitas = await Promise.all(
          categoriasAPI.map(async (cat) => {
            const { data } = await axios.get(`http://localhost:3001/categoria/${cat.nome}`);
            return { nome: cat.nome, receitas: data.receitas || [] };
          })
        );

        setCategorias(categoriasComReceitas);
      } catch (err) {
        console.error("Erro ao carregar categorias/receitas:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarCategoriasComReceitas();
  }, []);

    // 🔹 Converte minutos em formato "XhYmin"
    function formatarTempo(minutos) {
    if (!minutos || isNaN(minutos)) return "Tempo não informado";

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (horas > 0 && mins > 0) return `${horas}h${mins}min`;
    if (horas > 0) return `${horas}h`;
    return `${mins}min`;
    }


  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e68900" />
        <Text>Carregando receitas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header navigation={navigation} />

      {categorias.map((categoria, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{categoria.nome}</Text>

          {/* 🔹 Scroll horizontal para receitas */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.recipesRow}>
              {categoria.receitas.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma receita nessa categoria.</Text>
              ) : (
                categoria.receitas.map((receita) => (
                  <TouchableOpacity
                    key={receita.id_receitas}
                    style={styles.recipeCard}
                    onPress={() => navigation.navigate("ReceitaDet", { id: receita.id_receitas })}
                  >
                    <Image
                      source={{ uri: receita.imagem }}
                      style={styles.recipeImage}
                    />
                    <Text style={styles.recipeTitle}>{receita.nome}</Text>
                    <Text style={styles.recipeTime}>
                        ⏱ {formatarTempo(receita.tempo_preparo)}
                    </Text>

                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e68900",
    marginBottom: 12,
  },
  // 🔹 linha horizontal com rolagem
  recipesRow: {
    flexDirection: "row",
    gap: 12,
  },
  recipeCard: {
    width: 160,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: "100%",
    height: 100,
  },
  recipeTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginTop: 6,
    marginHorizontal: 8,
  },
  recipeTime: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 8,
    marginBottom: 8,
  },
  emptyText: {
    color: "#aaa",
    fontStyle: "italic",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
