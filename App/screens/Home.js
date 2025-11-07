import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, Text, TouchableOpacity, FlatList, Platform } from 'react-native';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';

export default function Home({ navigation }) {
  const [receitas, setReceitas] = useState([]);
  const [user, setUser] = useState(null);

  // Filtros gerais
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

    setUser(null);
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
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('ReceitaDet', { id: item.id_receitas })}
    >
      <Image source={{ uri: item.imagem }} style={styles.recipeImage} />
      <Text numberOfLines={2} style={styles.recipeTitle}>{item.nome}</Text>
      <Text style={styles.recipeTime}>⏱ {formatarTempo(item.tempo_preparo)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <Logo />
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Pesquisa')}>
            <Text style={styles.searchText}>🔍 Pesquisar receitas...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyContainer}>
          {/* CATEGORIAS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.title}>Categorias</Text>
            <TouchableOpacity onPress={() => navigation.navigate('allCategorias')}>
              <Text style={styles.viewAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categories}>
            <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#FFB84D' }]} onPress={() => navigation.navigate('Categoria', { nome: 'Pratos Proteicos' })}>
              <Text style={styles.cardText}>🍗 Proteicos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#FFDE59' }]} onPress={() => navigation.navigate('Categoria', { nome: 'Massas' })}>
              <Text style={styles.cardText}>🍜 Massas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#82CD47' }]} onPress={() => navigation.navigate('Categoria', { nome: 'Saladas' })}>
              <Text style={styles.cardText}>🥗 Saladas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryCard, { backgroundColor: '#FF914D' }]} onPress={() => navigation.navigate('Categoria', { nome: 'Doces' })}>
              <Text style={styles.cardText}>🍰 Doces</Text>
            </TouchableOpacity>
          </View>

          {/* 🍽️ POPULARES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.subtitle}>🔥 Populares da Semana</Text>
            </View>
            <FlatList
              horizontal
              data={receitasPopulares}
              keyExtractor={i => i.id_receitas.toString()}
              renderItem={renderReceita}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* 👨‍🍳 DO DIA A DIA */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.subtitle}>👨‍🍳 Do Dia a Dia</Text>
            </View>
            <FlatList
              horizontal
              data={receitasDiaDia}
              keyExtractor={i => i.id_receitas.toString()}
              renderItem={renderReceita}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* ☕ CAFÉ E LANCHES */}
          {receitasCaféLanche.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.subtitle}>☕ Café e Lanches</Text>
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

      <BottomNav navigation={navigation} active="Home" isLoggedIn={user !== null} />
    </View>
  );
}

const shadowStyle = Platform.select({
  web: { boxShadow: '0px 3px 6px rgba(0,0,0,0.1)' },
  default: { elevation: 3 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, backgroundColor: '#fafafa' },
  headerContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 25,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...shadowStyle,
  },
  searchBar: {
    backgroundColor: '#f4f4f4',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchText: { color: '#999', fontSize: 15 },
  bodyContainer: { paddingHorizontal: 20, paddingTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#444', marginTop: 20 },
  viewAll: { color: '#FF914D', fontWeight: '500' },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: '47%',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyle,
  },
  cardText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    padding: 10,
    width: 160,
    ...shadowStyle,
  },
  recipeImage: { width: '100%', height: 110, borderRadius: 10 },
  recipeTitle: { fontWeight: '600', marginTop: 8, color: '#333' },
  recipeTime: { color: '#777', marginTop: 3 },
});
