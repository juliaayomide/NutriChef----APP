// contexts/FavoritesContext.js
import React, { createContext, useState, useEffect } from "react";

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  // favorites: array of recipe objects coming from backend, each MUST have numeric id_receita
  const [favorites, setFavorites] = useState([]);

  // helper: normalize a recipe object (ensure id_receita is number and fields present)
  const normalize = (r) => ({
    id_receita: r.id_receita !== undefined ? Number(r.id_receita)
                : (r.id_receitas !== undefined ? Number(r.id_receitas)
                : (r.id !== undefined ? Number(r.id) : undefined)),
    nome: r.nome ?? r.titulo ?? "",
    imagem: r.imagem ?? r.foto ?? "",
    tempo: r.tempo ?? r.tempo_preparo ?? ""
  });

  // load favorites from backend for a user (call when user logs in or Perfil mounts)
  const loadFavoritesFromBackend = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:3001/favoritos/${userId}`, {
        credentials: "include",
      });
      const data = await res.json();
      // backend returns an array of recipe rows — normalize + dedupe by id_receita
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalize)
        .filter(r => r.id_receita !== undefined);

      // dedupe by id
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

  // add favorite (client state + backend)
  const addFavorite = async (recipe, userId) => {
    const r = normalize(recipe);
    if (!r.id_receita) return;

    // prevent duplicates in state
    if (favorites.some(f => Number(f.id_receita) === r.id_receita)) return;

    // optimistic update
    setFavorites(prev => [...prev, r]);

    if (userId) {
      try {
        const res = await fetch("http://localhost:3001/favoritos/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_usuario: userId, id_receita: r.id_receita }),
        });
        const j = await res.json();
        // optional: if backend fails, rollback
        if (!res.ok) {
          console.error("Erro ao adicionar favorito no backend:", j);
          setFavorites(prev => prev.filter(f => Number(f.id_receita) !== r.id_receita));
        }
      } catch (err) {
        console.error("Erro ao adicionar favorito:", err);
        setFavorites(prev => prev.filter(f => Number(f.id_receita) !== r.id_receita));
      }
    }
  };

  // remove favorite (client state + backend)
  const removeFavorite = async (recipeId, userId) => {
    const id = Number(recipeId);
    if (!id) return;

    // optimistic remove
    setFavorites(prev => prev.filter(f => Number(f.id_receita) !== id));

    if (userId) {
      try {
        const res = await fetch(`http://localhost:3001/favoritos/remove/${userId}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          console.error("Erro ao remover favorito no backend");
          // optional: reload from backend to recover consistency
          await loadFavoritesFromBackend(userId);
        }
      } catch (err) {
        console.error("Erro ao remover favorito:", err);
        await loadFavoritesFromBackend(userId);
      }
    }
  };

  // toggle (accepts recipe object or an id)
  const toggleFavorite = (recipeOrId, userId) => {
    const recipe = typeof recipeOrId === "object" ? normalize(recipeOrId) : { id_receita: Number(recipeOrId) };
    if (!recipe.id_receita) return;

    const exists = favorites.some(f => Number(f.id_receita) === recipe.id_receita);
    if (exists) removeFavorite(recipe.id_receita, userId);
    else addFavorite(recipe, userId);
  };

  const isFavorite = (id) => {
    const nid = Number(id);
    return favorites.some(f => Number(f.id_receita) === nid);
  };

  // expose functions
  return (
    <FavoritesContext.Provider value={{
      favorites,
      setFavorites,
      loadFavoritesFromBackend,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};
