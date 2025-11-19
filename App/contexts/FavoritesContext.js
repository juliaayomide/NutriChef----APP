import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadFavorites();
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const saved = await AsyncStorage.getItem("usuario");
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.log("Erro ao carregar usuário:", e);
    }
  }

  async function loadFavorites() {
    try {
      const saved = await AsyncStorage.getItem("favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {
      console.log("Erro ao carregar favoritos:", e);
    }
  }

  // ============================
  // ❤️ TOGGLE FAVORITE
  // ============================
  async function toggleFavorite(receita) {

    const receitaId = receita.id_receitas ?? receita.id;

    // usuário NÃO logado
    if (!user) {
      let updated;

      if (favorites.some(f => (f.id_receitas ?? f.id) === receitaId)) {
        updated = favorites.filter(f => (f.id_receitas ?? f.id) !== receitaId);
      } else {
        updated = [...favorites, receita];
      }

      setFavorites(updated);
      await AsyncStorage.setItem("favorites", JSON.stringify(updated));
      return;
    }

    // usuário logado → MySQL
    const id_usuario = user.id_usuarios;
    const id_receita = receitaId;

    if (favorites.some(f => (f.id_receitas ?? f.id) === id_receita)) {
      await fetch(`http://localhost:3001/favoritos/remove/${id_usuario}/${id_receita}`, {
        method: "DELETE",
      });

      const updated = favorites.filter(f => (f.id_receitas ?? f.id) !== id_receita);
      setFavorites(updated);
      return;
    }

    await fetch("http://localhost:3001/favoritos/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_usuario, id_receita })
    });

    setFavorites([...favorites, receita]);
  }

  function isFavorite(id) {
    return favorites.some(f => (f.id_receitas ?? f.id) === id);
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}
