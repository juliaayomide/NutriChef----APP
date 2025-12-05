import React, { useEffect, useState, createContext } from 'react';
import { StyleSheet, ImageBackground, ScrollView, View, Image, Text, TouchableOpacity, FlatList, Platform, Modal, Pressable } from 'react-native';
import Logo from '../components/Logo';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { useContext } from 'react';

import { FavoritesContext } from '../contexts/FavoritesContext';
import BottomNav from '../components/BottomNav';

export default function Home({ navigation }) {
  const [receitas, setReceitas] = useState([]);
  const [user, setUser] = useState(null);

  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const receitasPopulares = receitas.slice(0, 10);
  const receitasDiaDia = receitas.filter(r => r.tempo_preparo <= 40);
  const receitasCaféLanche = receitas.filter(r =>
    ["pão", "tapioca", "vitamina", "smoothie", "bolo", "panqueca", "torrada"].some(t =>
      r.nome?.toLowerCase().includes(t)
    )
  );

   useEffect(() => { 
    fetch('http://localhost:3001/') 
      .then(res => res.json()) 
      .then(data => setReceitas(data)) 
      .catch(err => console.error('Erro ao carregar receitas:', err));
    fetch('http://localhost:3001/perfil', { credentials: "include" }) 
      .then(res => res.json()) 
    .then(data => { 
      if (data.success) {
        if (data.usuario.status === "suspenso") {
          alert(`Sua conta foi suspensa!\nMotivo: ${data.usuario.motivo_suspensao}`);
          setUser(null); 
        } else {
          setUser(data.usuario);
        }
      } else {
        setUser(null);
      }
    }) 
    .catch(() => setUser(null)); 
    }, []);
  
  function formatarTempo(minutos) {
    if (!minutos || isNaN(minutos)) return "Tempo não informado";
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0 && mins > 0) return `${horas}h${mins}min`;
    if (horas > 0) return `${horas}h`;
    return `${mins}min`;
  }

  const renderReceita = ({ item }) => (
    <View style={styles.recipeCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ReceitaDet', { id: item.id_receitas })}
      >
        <Image source={{ uri: item.imagem }} style={styles.recipeImage} />
        <Text numberOfLines={2} style={styles.recipeTitle}>{item.nome}</Text>
        <Text style={styles.recipeTime}>⏱ {formatarTempo(item.tempo_preparo)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.heartBtn}
        onPress={() => {
          if (!user) {
            setShowLoginModal(true);
          } else {
            toggleFavorite({
              id_receita: item.id_receitas,
              nome: item.nome,
              tempo: formatarTempo(item.tempo_preparo),
              imagem: item.imagem
            }, user.id_usuarios);
          }}}
      >
        <AntDesign
          name={isFavorite(item.id_receitas) ? "heart" : "hearto"}
          size={22}
          color={isFavorite(item.id_receitas) ? "red" : "#444"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerContainer}>
          <Logo/>
           <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Pesquisa')}
      >
        <Ionicons name="search-outline" size={20} color="#000" style={styles.icon} />
        <Text style={styles.searchText}>Pesquisar receitas...</Text>
      </TouchableOpacity>
        </View>

        <View style={styles.bodyContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.title}>Categorias</Text>
            <TouchableOpacity onPress={() => navigation.navigate('allCategorias')}>
            <Text style={styles.viewAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

        <View style={styles.categories}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Categoria', { nome: 'Pratos Proteicos' })}
          >
            <ImageBackground
              source={require('../assets/proteinas.jpeg')}
              style={styles.categoryCard}
              imageStyle={{ borderRadius: 15, filter: 'blur(0.5px)',  filter: 'brightness(0.8)' }} 
            >
              <Text style={styles.cardText}>Proteicos</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Categoria', { nome: 'Massas' })}
          >
            <ImageBackground
              source={require('../assets/massas.jpeg')}
              style={styles.categoryCard}
              imageStyle={{ borderRadius: 15, filter: 'blur(0.5px)',  filter: 'brightness(0.8)'  }} 
            >
              <Text style={styles.cardText}>Massas</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Categoria', { nome: 'Saladas' })}
          >
            <ImageBackground
              source={require('../assets/saladas.jpeg')}
              style={styles.categoryCard}
              imageStyle={{ borderRadius: 15, filter: 'blur(0.5px)',  filter: 'brightness(0.8)' }} 
            >
              <Text style={styles.cardText}>Saladas</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Categoria', { nome: 'Doces' })} 
          >
            <ImageBackground
              source={require('../assets/doces.jpeg')}
              style={styles.categoryCard}
              imageStyle={{ borderRadius: 15, filter: 'blur(0.5px)',  filter: 'brightness(0.8)' }} 
            >
              <Text style={styles.cardText}>Doces</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title}>Populares da Semana</Text>
            </View>
            <FlatList
              horizontal
              data={receitasPopulares}
              keyExtractor={i => i.id_receitas.toString()}
              renderItem={renderReceita}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title}>Do Dia a Dia</Text>
            </View>
            <FlatList
              horizontal
              data={receitasDiaDia}
              keyExtractor={i => i.id_receitas.toString()}
              renderItem={renderReceita}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {receitasCaféLanche.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.title}>Café e Lanches</Text>
              </View>
              <FlatList
                horizontal
                data={receitasCaféLanche}
                keyExtractor={i => i.id_receitas.toString()}
                renderItem={renderReceita}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{
          flex:1,
          backgroundColor:'rgba(0,0,0,0.5)',
          justifyContent:'center',
          alignItems:'center',
          padding:20
        }}>
          <View style={{
            width:'100%',
            backgroundColor:'#fff',
            borderRadius:15,
            padding:20,
            alignItems:'center'
          }}>
            <Pressable
              onPress={() => setShowLoginModal(false)}
              style={{ alignSelf:'flex-end', marginBottom:10 }}
            >
              <Text style={{ fontSize:18, fontWeight:'bold' }}>×</Text>
            </Pressable>

            <Text style={{ fontSize:16, textAlign:'center', marginBottom:20 }}>
              Antes de favoritar receitas, cadastre-se
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowLoginModal(false);
                navigation.navigate('CadastroLogin');
              }}
              style={{
                backgroundColor:'#FF6300',
                paddingVertical:10,
                paddingHorizontal:25,
                borderRadius:10
              }}
            >
              <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16 }}>Cadastrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav
  navigation={navigation}
  active="Home"
  isLoggedIn={user !== null}
  usuario={user}
/>

    </View>
  );
}

const shadowStyle = Platform.select({
  web: { boxShadow: '0px 3px 6px rgba(0,0,0,0.1)' },
  default: { elevation: 3 },
});

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#fafafa',
  },

  scroll: { 
    flex: 1, 
    backgroundColor: '#fafafa' 
  },

  headerContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 25,
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...shadowStyle,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },

  searchBar: {
    marginTop: -25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 30,
    paddingHorizontal: 10,
    height: 40,
    width: '90%',
  },

  searchText: { 
    color: '#555',
    fontSize: 16, 
    fontFamily: 'Poppins_400Regular'
  },

  icon: {
    marginRight: 8,
  },

  bodyContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },

  title: { 
    fontSize: 19, 
    fontFamily: "Poppins_700Bold", 
    color: '#333', 
    marginTop: 15, 
    marginBottom: 8, 
    marginLeft: 5 
  },

  subtitle: { 
    fontSize: 18, 
    fontFamily: "Poppins_600SemiBold", 
    color: '#444', 
    marginTop: 20 
  },

  viewAll: { 
    color: '#FF6300', 
    fontFamily: 'Poppins_500Medium' 
  },

  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  categoryCard: {
    width: 150,
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 15,
    ...shadowStyle,
  },

  cardText: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  ImageBackground: {
    filter: 'blur(10px)',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },

  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
      },
      android: {
        elevation: 4,
      }
    })
  },

  heartIcon: {
    transitionDuration: '150ms',
  },

  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    padding: 10,
    width: 160,
    ...shadowStyle
  },

  recipeImage: { 
    width: '100%', 
    height: 110, 
    borderRadius: 10 
  },

  recipeTitle: { 
    fontFamily: 'Poppins_600SemiBold', 
    marginTop: 8, 
    color: '#333' 
  },

  recipeTime: { 
    color: '#777', 
    marginTop: 3,
    fontFamily: 'Poppins_500Medium'
  },

});

