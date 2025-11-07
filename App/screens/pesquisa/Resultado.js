import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Header from '../../components/Voltar';

export default function Resultados({ route, navigation }) {
  const { termo } = route.params || { termo: '' };
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReceitas() {
      try {
        const response = await fetch(`http://localhost:3001/resultados?q=${encodeURIComponent(termo)}`);
        if (!response.ok) throw new Error('Erro ao buscar receitas');
        const data = await response.json();
        setReceitas(data.receitas || []);
      } catch (err) {
        console.error('Erro ao buscar receitas:', err);
        setReceitas([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReceitas();
  }, [termo]);

  const renderItem = ({ item }) => (
    <View style={styles.receitaItem}>
      <Text style={styles.receitaNome}>{item.nome}</Text>
      <Text style={styles.receitaDescricao}>{item.descricao}</Text>
      <TouchableOpacity
        style={styles.verReceitaBtn}
        onPress={() => navigation.navigate('ReceitaDet', { id: item.id_receitas })}
      >
        <Text style={styles.verReceitaText}>Ver receita</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF7F50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation}/>
      <Text style={styles.title}>Resultados da pesquisa: "{termo}"</Text>

      {receitas.length > 0 ? (
        <FlatList
          data={receitas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_receitas.toString()}
          contentContainerStyle={styles.listaReceitas}
        />
      ) : (
        <Text style={styles.semResultados}>
          Nenhuma receita encontrada para "{termo}".
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fdfdfd' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  listaReceitas: { paddingBottom: 20 },
  receitaItem: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.1)',
  },
  receitaNome: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  receitaDescricao: { fontSize: 14, color: '#555', marginBottom: 10 },
  verReceitaBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF7F50',
    borderRadius: 5,
  },
  verReceitaText: { color: '#fff', fontWeight: 'bold' },
  semResultados: { fontSize: 16, color: '#555', marginTop: 20, textAlign: 'center' },
});
