import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  useWindowDimensions 
} from 'react-native';
import Header from '../components/Voltar';
import BottomNav from '../components/BottomNav';
import { FavoritesContext } from '../contexts/FavoritesContext';

export default function Favoritos({ navigation, usuario }) {
  const { favorites, toggleFavorite } = useContext(FavoritesContext);
  const { width } = useWindowDimensions();

  const numColumns = width > 400 ? 2 : 1;
  const cardWidth = (width - 30 - (numColumns - 1) * 15) / numColumns;

  const renderItem = ({ item }) => (
    <View style={[styles.recipeCard, { width: cardWidth }]}>
      <Image
        source={{ uri: item.imagem }}
        style={[styles.recipeImage, { height: 120 }]}
        resizeMode="cover"
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{item.nome}</Text>
        <Text style={styles.recipeTime}>⏱ {item.tempo}</Text>
      </View>

      {/* ❤️ Botão para remover */}
      <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavorite(item)}>
        <Text style={styles.heartText}>❤️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <FlatList
        key={numColumns}
        contentContainerStyle={styles.content}
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between', marginBottom: 15 } : null}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma receita favorita ainda.</Text>}
      />

      <BottomNav navigation={navigation} active="Favoritos" isLoggedIn={usuario != null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 15 },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  recipeInfo: { padding: 10 },
  recipeName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#444',
  },
  recipeTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  heartText: {
    fontSize: 22,
  },
});
