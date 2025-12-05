import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import Header from '../../components/Voltar';
import BottomNav from '../../components/BottomNav';

export default function Categoria({ route, navigation }) {
  const { nome } = route.params || { nome: '' };
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceitas = async () => {
      try {
        const response = await fetch(`http://localhost:3001/categoria/${nome}`);
        const data = await response.json();
        setReceitas(data.receitas);
      } catch (error) {
        console.error("Erro ao buscar receitas:", error);
        setReceitas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceitas();
  }, [nome]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard} 
      onPress={() => navigation.navigate('ReceitaDet', { id: item.id_receitas })}
    >
      <Image source={{ uri: item.imagem }} style={styles.recipeImage} />
      <Text style={styles.recipeName}>{item.nome}</Text>
      <Text style={styles.recipeTime}>⏱ {item.tempo_preparo} min</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#FF7F50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header navigation={navigation} />

        <Text style={styles.title}>{nome}</Text>

        <Text style={styles.description}>
       Explore diferentes categorias e encontre pratos que combinam com o seu gosto, com o seu tempo e com a sua ocasião.
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Receitas Recomendadas</Text>
        </View>

        {receitas && receitas.length > 0 ? (
          <FlatList
            data={receitas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id_receitas.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesList}
          />
        ) : (
          <Text style={styles.semResultados}>Nenhuma receita encontrada nesta categoria.</Text>
        )}
      </ScrollView>

    
      <BottomNav navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100, 
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    fontFamily: 'Poppins_400Regular',
  },
  link: {
    color: 'red',
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  recipesList: {
    paddingVertical: 10,
  },
  recipeCard: {
    width: 160,
    height: 195,
    marginRight: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  recipeImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },
  recipeName: {
    marginTop: 5,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#272727ff',
  },
  recipeTime: {
    fontSize: 12,
    color: '#555',
  },
  semResultados: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },
});
