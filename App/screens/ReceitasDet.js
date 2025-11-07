import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  FlatList, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import Logo from '../components/Logo';

export default function ReceitaDet({ route, navigation }) {
  const { id } = route.params || { id: 1 };
  const [receita, setReceita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceita = async () => {
      try {
        const response = await fetch(`http://localhost:3001/receitaDet/${id}`);
        const data = await response.json();
        setReceita(data);
      } catch (error) {
        console.error("Erro ao buscar receita:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceita();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#FF7F50" />
      </View>
    );
  }

  if (!receita) {
    return (
      <View style={styles.containerCenter}>
        <Text>Receita não encontrada.</Text>
      </View>
    );
  }

  const tabela = receita.tabelaNutricional;
  
  return (
    <ScrollView style={styles.container}>
      <Logo/>

      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      <Image source={{ uri: receita.imagem }} style={styles.recipeImage} />

      <Text style={styles.title}>{receita.nome}</Text>
      <Text style={styles.author}>Por {receita.autor}</Text>
      <Text style={styles.description}>{receita.descricao}</Text>

      <Text style={styles.sectionTitle}>Ingredientes:</Text>
      {receita.ingredientes?.map((item, index) => (
        <Text key={index} style={styles.listItem}>🍴 {item}</Text>
      ))}

      <Text style={styles.sectionTitle}>Utensílios:</Text>
      {receita.utensilios?.map((item, index) => (
        <Text key={index} style={styles.listItem}>🥄 {item}</Text>
      ))}

      <Text style={styles.sectionTitle}>Modo de preparo:</Text>
      <Text style={styles.time}>⏱️ {receita.tempo_preparo} min</Text>
      {receita.passos?.map((passo, index) => (
        <Text key={index} style={styles.step}>{index + 1}. {passo}</Text>
      ))}

        {/* 🍎 TABELA NUTRICIONAL */}
        {tabela ? (
          <View style={styles.nutriContainer}>
            <Text style={styles.nutriTitle}>Tabela Nutricional (por porção)</Text>
            <View style={styles.nutriTable}>
              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Porções:</Text>
                <Text style={styles.nutriValue}>{tabela.porcoes}</Text>
              </View>
              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Calorias:</Text>
                <Text style={styles.nutriValue}>{tabela.calorias} kcal</Text>
              </View>
              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Proteínas:</Text>
                <Text style={styles.nutriValue}>{tabela.proteinas} g</Text>
              </View>
              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Gorduras:</Text>
                <Text style={styles.nutriValue}>{tabela.gorduras} g</Text>
              </View>
              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Carboidratos:</Text>
                <Text style={styles.nutriValue}>{tabela.carboidratos} g</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>Informações nutricionais não disponíveis.</Text>
        )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fdfdfd',
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF7F50',
  },
  recipeImage: {
    width: '60%',
    height: undefined,      // permite ajustar altura proporcional
    aspectRatio: 1.5,       // controla a proporção da imagem (1.5 = mais larga, 1 = quadrada, 0.75 = mais alta)
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'cover',    // corta suavemente mantendo proporção
    alignSelf: 'center',    // centraliza a própria imagem
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  author: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 3,
  },
  time: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  step: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    marginLeft: 10,
  },
  // 🍎 Estilos da tabela nutricional
  nutriContainer: {
    marginTop: 25,
    backgroundColor: '#FFF7EC',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  nutriTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF7F50',
    marginBottom: 10,
    textAlign: 'center',
  },
  nutriTable: {
    borderTopWidth: 1,
    borderColor: '#FF7F50',
  },
  nutriRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderColor: '#FFD3B6',
  },
  nutriLabel: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  nutriValue: {
    fontSize: 14,
    color: '#333',
  },
  noData: {
    marginTop: 10,
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
