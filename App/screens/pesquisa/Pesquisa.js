import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import Header from '../../components/Voltar';

export default function Pesquisa({ navigation }) {
  const [search, setSearch] = useState('');
  const [selecionados, setSelecionados] = useState([]); // ingredientes escolhidos

  const handleSearch = () => {
    console.log('Buscar:', search);
    const termoFinal = search.trim() || selecionados.join(", ");
    navigation.navigate('Resultado', { termo: termoFinal });
  };

    const ingredientes = [
    'Cebola', 'Alho', 'Arroz', 'Batata', 'Cenoura', 'Tomate', 'Margarina', 'Farinha de trigo',
    'Ovo', 'Fermento', 'Açúcar', 'Sal', 'Pimenta-do-reino', 'Óleo', 'Vinagre', 'Manteiga',
    'Colorau', 'Extrato de tomate', 'Molho shoyu', 'Mostarda', 'Ketchup', 'Cheiro-verde'
  ];

  const carnes = [
    'Carne moída', 'Bife', 'Peito de frango', 'Lombo de porco', 'Linguiça', 'Costela',
    'Bacon', 'Carne seca', 'Coxa de frango', 'Peixe', 'Camarão', 'Atum enlatado'
  ];

  const verdurasFrutas = [
    'Alface', 'Couve', 'Espinafre', 'Brócolis', 'Abobrinha', 'Chuchu', 'Berinjela',
    'Pimentão', 'Milho', 'Ervilha', 'Abacaxi', 'Banana', 'Maçã', 'Laranja', 'Tomate-cereja',
    'Limão', 'Manga', 'Morango', 'Uva', 'Melancia'
  ];

  const graosLaticinios = [
    'Feijão', 'Lentilha', 'Grão-de-bico', 'Milho verde', 'Aveia', 'Leite', 'Queijo',
    'Requeijão', 'Iogurte', 'Creme de leite', 'Leite condensado'
  ];

  // 🔹 Adiciona ou remove ingrediente
  const toggleIngrediente = (item) => {
    setSelecionados((prev) => {
      if (prev.includes(item)) {
        // remove
        const atualizados = prev.filter((i) => i !== item);
        setSearch(atualizados.join(', ')); // atualiza barra
        return atualizados;
      } else {
        // adiciona
        const atualizados = [...prev, item];
        setSearch(atualizados.join(', ')); // atualiza barra
        return atualizados;
      }
    });
  };

  // 🔹 Renderiza os botões de ingredientes
  const renderButtons = (items, color) => (
    <View style={[styles.suggestionGrid, { backgroundColor: color }]}>
      {items.map((item) => {
        const ativo = selecionados.includes(item);
        return (
          <TouchableOpacity
            key={item}
            style={[
              styles.suggestionButton,
              ativo && styles.selectedButton,
            ]}
            onPress={() => toggleIngrediente(item)}
          >
            <Text style={[styles.buttonText, ativo && styles.selectedText]}>
              {ativo ? `❌ ${item}` : item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Header navigation={navigation} />

      {/* Input de pesquisa */}
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar receitas"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />

      <Text style={styles.infoText}>
        Assumimos que os ingredientes obrigatórios são: água, sal e pimenta.
      </Text>

      <Text style={styles.sectionTitle}>Sugestões de ingredientes:</Text>
      {renderButtons(ingredientes, 'rgba(249, 116, 0, 1)')}

      <Text style={styles.sectionTitle}>Sugestões de carnes:</Text>
      {renderButtons(carnes, '#ffd166')}

      <Text style={styles.sectionTitle}>Sugestões de verduras e frutas:</Text>
      {renderButtons(verdurasFrutas, '#f82c33')}

      <Text style={styles.sectionTitle}>Grãos e laticínios:</Text>
      {renderButtons(graosLaticinios, '#ffbd66ff')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchInput: {
    backgroundColor: '#f4f4f4',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 0,
    fontSize: 16,
  },
  infoText: {
    marginVertical: 10,
    fontSize: 14,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
  },
  suggestionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: '#ffffffff',
    borderWidth: 1,
    borderColor: '#cc0000',
  },
  buttonText: {
    color: '#333',
    fontFamily: 'Poppins_500Medium',
  },
  selectedText: {
    color: '#000000ff',
    fontFamily: 'Poppins_700Bold',
  },
});
