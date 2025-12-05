import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  useWindowDimensions, 
  StyleSheet 
} from 'react-native';
import Header from '../components/Voltar';
import BottomNav from '../components/BottomNav';
import { FavoritesContext } from '../contexts/FavoritesContext';

export default function Favoritos({ navigation }) {
  const [user, setUser] = useState(null);
  const { favorites, setFavorites, toggleFavorite } = useContext(FavoritesContext);
  const { width } = useWindowDimensions();

  const numColumns = width > 400 ? 2 : 1;
  const cardWidth = (width - 30 - (numColumns - 1) * 15) / numColumns;

  useEffect(() => {
    fetch('http://localhost:3001/perfil', { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.usuario);
          if (data.usuario.favoritas) setFavorites(data.usuario.favoritas);
        } else {
          navigation.replace("CadastroLogin");
        }
      })
      .catch(() => navigation.replace("CadastroLogin"));
  }, []);

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa',}}>
      <Header navigation={navigation} />

      <FlatList
        key={numColumns}
        contentContainerStyle={styles.content}
        data={favorites}
        numColumns={numColumns}
        keyExtractor={item => item.id_receita.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.recipeCard, { width: cardWidth }]}
            onPress={() => navigation.navigate('ReceitaDet', { id: item.id_receita })}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.imagem }}
              style={styles.recipeImage}
              resizeMode="cover"
            />

            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{item.nome}</Text>
              <Text style={styles.recipeTime}>⏱ {item.tempo }</Text>
            </View>

            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => toggleFavorite(item, user.id_usuarios)}
            >
              <Text style={styles.heartText}>❤️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma receita favorita ainda.</Text>}
      />

      <BottomNav navigation={navigation} active="Favoritos" usuario={user} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 10, backgroundColor: '#fafafa', },
   screen: { backgroundColor: '#fafafa',},
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  recipeCard: {
    backgroundColor: '#ffffffff',
    borderRadius: 15,
    overflow: 'hidden',
    margin: 5,
    elevation: 3,
    
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  recipeInfo: { padding: 10, fontFamily: 'Poppins_600SemiBold' },
  recipeName: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#444', fontFamily: 'Poppins_600SemiBold' },
  recipeTime: { fontSize: 12, color: '#888', marginTop: 3, fontFamily: 'Poppins_600SemiBold' },
  heartBtn: { position: 'absolute', top: 10, right: 10 },
  heartText: { fontSize: 22 },
});
