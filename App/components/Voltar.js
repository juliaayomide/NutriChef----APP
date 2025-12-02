import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';

const HEADER_HEIGHT = 70; // altura fixa do header

export default function Header({ navigation }) {
  const { width } = useWindowDimensions(); 
  const showBackText = width > 500; // mostra "Voltar" apenas se a tela for larga

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerContainer}>
        {/* Botão de voltar */}
        <View style={styles.side}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            {showBackText && <Text style={styles.backText}>Voltar</Text>}
          </TouchableOpacity>
        </View>

        {/* Logo centralizada */}
        <View style={styles.logoWrapper}>
          <Logo />
        </View>

        {/* Espaço à direita igual ao esquerdo */}
        <View style={styles.side} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: HEADER_HEIGHT, // reserva espaço no topo para o header
    width: '100%',
    marginRight:50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginLeft:15,
    height: HEADER_HEIGHT,
    paddingVertical: 10,
    backgroundColor: '#fdfdfd',
    ...Platform.select({
      web: { position: 'fixed', top: 0, left: 0, zIndex: 1000 },
      default: { position: 'absolute', top: 0, left: 0, zIndex: 1000 },
    }),
  },
  side: {
    width: 80,
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6300',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    marginLeft: 5,
    fontSize: 14,
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
