import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { user } = useContext(UserContext); 
  const [favorites, setFavorites] = useState([]);

  const normalize = (recipe) => ({
    id_receita: recipe.id_receita ?? recipe.id_receitas ?? recipe.id,
    nome: recipe.nome ?? recipe.titulo ?? "",
    imagem: recipe.imagem ?? recipe.foto ?? "",
    tempo: recipe.tempo ?? recipe.tempo_preparo ?? "",
  });

  const loadFavoritesFromBackend = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:3001/favoritos/${userId}`, {
        credentials: "include",
      });
      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : [])
        .map(normalize)
        .filter((r) => r.id_receita !== undefined);

      const unique = [];
      const seen = new Set();
      for (const r of normalized) {
        if (!seen.has(r.id_receita)) {
          seen.add(r.id_receita);
          unique.push(r);
        }
      }

      setFavorites(unique);
    } catch (err) {
      console.error("Erro ao carregar favoritos do backend:", err);
    }
  };

  const addFavorite = async (recipe, userId) => {
    const r = normalize(recipe);
    if (!r.id_receita) return;

    if (favorites.some((f) => f.id_receita === r.id_receita)) return;

    setFavorites((prev) => [...prev, r]); 

    if (userId) {
      try {
        const res = await fetch("http://localhost:3001/favoritos/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_usuario: userId, id_receita: r.id_receita }),
        });
        if (!res.ok) setFavorites((prev) => prev.filter((f) => f.id_receita !== r.id_receita));
      } catch (err) {
        console.error("Erro ao adicionar favorito:", err);
        setFavorites((prev) => prev.filter((f) => f.id_receita !== r.id_receita));
      }
    }
  };

  const removeFavorite = async (recipeId, userId) => {
    const id = Number(recipeId);
    if (!id) return;

    setFavorites((prev) => prev.filter((f) => Number(f.id_receita) !== id));

    if (userId) {
      try {
        const res = await fetch(`http://localhost:3001/favoritos/remove/${userId}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) await loadFavoritesFromBackend(userId);
      } catch (err) {
        console.error("Erro ao remover favorito:", err);
        await loadFavoritesFromBackend(userId);
      }
    }
  };

  const toggleFavorite = (recipeOrId, userId) => {
    const recipe = typeof recipeOrId === "object" ? normalize(recipeOrId) : { id_receita: Number(recipeOrId) };
    const exists = favorites.some((f) => f.id_receita === recipe.id_receita);
    if (exists) removeFavorite(recipe.id_receita, userId);
    else addFavorite(recipe, userId);
  };

  const isFavorite = (id) => favorites.some((f) => Number(f.id_receita) === Number(id));

  useEffect(() => {
    if (!user) setFavorites([]); 
    else loadFavoritesFromBackend(user.id_usuarios);
  }, [user]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        setFavorites,
        loadFavoritesFromBackend,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
