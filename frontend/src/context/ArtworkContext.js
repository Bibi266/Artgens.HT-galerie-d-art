import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import { useArtwork, API_URL } from "../context/ArtworkContext";

const ArtworkContext = createContext();

// 🌍 URL dynamique : utilise Render en ligne, sinon localhost
const API_URL =
  process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : window.location.hostname.includes("localhost")
    ? "http://127.0.0.1:5555/api"
    : "https://artgens-ht-2.onrender.com/api";

console.log("🔗 API_URL utilisée :", API_URL);

const initialState = {
  artworks: [],
  user: null,
  cart: [],
  loading: false,
  token: localStorage.getItem("token"),
};

// 🎯 Reducer global
function artworkReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ARTWORKS":
      return { ...state, artworks: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
      };
    case "LOGOUT":
      localStorage.removeItem("token");
      return { ...state, user: null, token: null, cart: [] };
    case "SET_CART":
      return { ...state, cart: action.payload };
    default:
      return state;
  }
}

export function ArtworkProvider({ children }) {
  const [state, dispatch] = useReducer(artworkReducer, initialState);

  // ⚙️ Configuration du token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [state.token]);

  // 🔁 Charger les œuvres
  const fetchArtworks = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await axios.get(`${API_URL}/artworks`);
      dispatch({ type: "SET_ARTWORKS", payload: response.data || [] });
    } catch (error) {
      console.error("Erreur chargement œuvres:", error);
      dispatch({ type: "SET_ARTWORKS", payload: [] });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // 🔐 Connexion
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;
      return { success: true };
    } catch (error) {
      console.error("Erreur connexion:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Erreur de connexion",
      };
    }
  };

  // 📝 Inscription
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;
      return { success: true };
    } catch (error) {
      console.error("Erreur inscription:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Erreur d'inscription",
      };
    }
  };

  // 🚪 Déconnexion
  const logout = () => {
    dispatch({ type: "LOGOUT" });
    delete axios.defaults.headers.common["Authorization"];
  };

  // ➕ Ajouter une œuvre
  const addArtwork = async (artworkData) => {
    try {
      const response = await axios.post(`${API_URL}/artworks`, artworkData);
      await fetchArtworks();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erreur ajout œuvre:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Erreur lors de l'ajout",
      };
    }
  };

  // ❤️ Like
  const likeArtwork = async (artworkId) => {
    try {
      const response = await axios.post(`${API_URL}/artworks/${artworkId}/like`);
      await fetchArtworks();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erreur like:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Erreur lors du like",
      };
    }
  };

  // 💬 Commentaire
  const addComment = async (artworkId, content) => {
    try {
      const response = await axios.post(
        `${API_URL}/artworks/${artworkId}/comments`,
        { content }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erreur ajout commentaire:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Erreur lors de l'ajout du commentaire",
      };
    }
  };

  // 🛒 Panier
  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/cart`);
      dispatch({ type: "SET_CART", payload: response.data });
    } catch (error) {
      console.error("Erreur panier:", error);
    }
  };

  const addToCart = async (artworkId) => {
    try {
      const response = await axios.post(`${API_URL}/cart`, {
        artwork_id: artworkId,
      });
      await fetchCart();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erreur ajout panier",
      };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API_URL}/cart/${itemId}`);
      await fetchCart();
    } catch (error) {
      console.error("Erreur suppression panier:", error);
    }
  };

  const checkoutCart = async () => {
    try {
      const response = await axios.post(`${API_URL}/cart/checkout`);
      dispatch({ type: "SET_CART", payload: [] });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erreur paiement",
      };
    }
  };

  return (
    <ArtworkContext.Provider
      value={{
        ...state,
        dispatch,
        fetchArtworks,
        login,
        register,
        logout,
        addArtwork,
        likeArtwork,
        addComment,
        fetchCart,
        addToCart,
        removeFromCart,
        checkoutCart,
      }}
    >
      {children}
    </ArtworkContext.Provider>
  );
}

export const useArtwork = () => {
  const context = useContext(ArtworkContext);
  if (!context) {
    throw new Error("useArtwork must be used within an ArtworkProvider");
  }
  return context;
};
