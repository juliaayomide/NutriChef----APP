import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Header from '../../components/Voltar';
import BottomNav from '../../components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 🔹 Gera uma cor fixa e vibrante com base no nome
function getColorFromName(name) {
  const colors = ['#f1923aff', '#de6868ff', 'rgba(141, 211, 144, 1)', 'rgba(241, 209, 93, 1)'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function AllCategorias({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get('http://localhost:3001/categorias');
        setCategorias(res.data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={{ marginTop: 10, color: '#555', fontFamily: 'Poppins_500Medium' }}>Carregando categorias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Categorias</Text>

        <View style={styles.categories}>
          {categorias.map((cat, index) => {
            const nome = cat.nome || cat.name || 'Sem Nome';
            const imagemRemota = cat.imagem_url ? { uri: cat.imagem_url } : null;

            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => navigation.navigate('Categoria', { nome })}
              >
                {imagemRemota ? (
                  <Image source={imagemRemota} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: getColorFromName(nome) }]}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={34} color="#fff" />
                    <Text style={styles.fallbackText}>{nome}</Text>
                  </View>
                )}

                <Text style={styles.cardTitle}>{nome}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} active="allCategorias" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC',},
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  title: { fontSize: 26, marginVertical: 20, fontFamily: 'Poppins_700Bold', color: '#222' },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 10,
    width: 150,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    marginTop: 5,
    textAlign: 'center',
  },
  cardTitle: {
    marginTop: 10,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
});
