import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Platform } from 'react-native';

export default function BottomNav({ navigation, active, isLoggedIn }) {
  const items = [
    { name: 'Início', icon: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', route: 'Home' },
    { name: 'Categorias', icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828859.png', route: 'allCategorias' },
    // { name: '', icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png', route: 'NovaReceita', plus: true }, //
    { name: 'Favoritos', icon: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', route: 'Favoritos' },
    { name: 'Perfil', icon: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png', route: isLoggedIn ? 'CadastroLogin' : 'Perfil' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.navItem, item.plus && styles.plusItem, active === item.route && styles.active]}
          onPress={() => navigation.navigate(item.route)}
        >
          <Image
            source={{ uri: item.icon }}
            style={styles.icon}
            tintColor={active === item.route ? '#FF6300' : '#555'}
          />
          <Text style={[styles.label, active === item.route && styles.labelActive]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 5,
    elevation: 10,
    position: 'relative', // não usa mais absolute para não sobrepor conteúdo
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  plusItem: {
    backgroundColor: '#FF6300',
    borderRadius: 50,
    width: 70,
    height: 70,
    marginTop: -30, // eleva o botão acima da barra
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 8,
  },
  icon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 11,
    color: '#555',
    marginTop: 3,
    textAlign: 'center',
  },
  labelActive: {
    color: '#FF6300',
    fontWeight: '600',
  },
  active: {
    opacity: 0.9,
  },
});
