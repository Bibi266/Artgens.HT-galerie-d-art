import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useArtwork, API_URL } from "../context/ArtworkContext";
import axios from "axios";
import Payment from "../components/Payment";

function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, likeArtwork, addToCart, addComment } = useArtwork();

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 🔁 Charger l’œuvre et ses commentaires
  useEffect(() => {
    fetchArtwork();
    fetchComments();
  }, [id]);

  // Charger les détails de l’œuvre
  const fetchArtwork = async () => {
    try {
      const response = await axios.get(`${API_URL}/artworks`);
      const found = response.data.find((a) => a.id === parseInt(id));
      setArtwork(found || null);
    } catch (error) {
      console.error("Erreur chargement œuvre:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Charger les commentaires
  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/artworks/${id}/comments`);
      setComments(response.data || []);
    } catch (error) {
      console.error("Erreur chargement commentaires:", error);
      setComments([]);
    }
  };

  // ❤️ Gérer le like
  const handleLike = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour aimer cette œuvre.");
      return;
    }

    const result = await likeArtwork(id);
    if (result.success) {
      alert(result.data.message);
      fetchArtwork();
    }
  };

  // 💬 Ajouter un commentaire
  const handleAddComment = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour commenter.");
      return;
    }
    if (!newComment.trim()) return;

    const result = await addComment(id, newComment);
    if (result.success) {
      setNewComment("");
      fetchComments();
    } else {
      alert(result.error);
    }
  };

  // 🛒 Ajouter au panier
  const handleAddToCart = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour acheter cette œuvre.");
      return;
    }
    const result = await addToCart(id);
    if (result.success) {
      alert("Œuvre ajoutée au panier !");
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div style={errorStyle}>
        <h2>Œuvre non trouvée</h2>
        <button onClick={() => navigate("/")} style={buttonStyle}>
          Retour à la galerie
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className="container">
        <div style={contentStyle}>
          {/* 🖼️ Image */}
          <div style={imageSectionStyle}>
            <img
              src={artwork.image_url || "/placeholder-image.jpg"}
              alt={artwork.title}
              style={imageStyle}
            />
          </div>

          {/* 📄 Détails */}
          <div style={detailsSectionStyle}>
            <h1 style={titleStyle}>{artwork.title}</h1>

            <h3 style={artistNameStyle}>Artiste : {artwork.artist_name}</h3>

            <div style={priceSectionStyle}>
              <h2 style={priceStyle}>${artwork.price}</h2>
              <p style={repartitionStyle}>
                Répartition : 75% artiste, 10% plateforme, 15% ELJ
              </p>
            </div>

            <div style={descriptionStyle}>
              <h3>Description</h3>
              <p>{artwork.description || "Aucune description disponible."}</p>
            </div>

            {/* ❤️ Likes */}
            <div style={statsStyle}>
              <span style={statStyle}>❤️ {artwork.likes_count || 0} likes</span>
              <span style={statStyle}>
                📅 Ajoutée le{" "}
                {new Date(artwork.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {/* 🎯 Boutons */}
            <div style={actionsStyle}>
              <button onClick={handleLike} style={likeButtonStyle}>
                ❤️ Aimer
              </button>
              {!artwork.is_sold ? (
                <button onClick={handleAddToCart} style={buyButtonStyle}>
                  🛒 Ajouter au panier
                </button>
              ) : (
                <button disabled style={soldButtonStyle}>
                  💔 Vendu
                </button>
              )}
            </div>

            {/* 💬 Commentaires */}
            <div style={commentSectionStyle}>
              <h3>Commentaires</h3>

              {comments.length === 0 && (
                <p>Aucun commentaire pour le moment.</p>
              )}

              {comments.map((c) => (
                <div key={c.id} style={commentItemStyle}>
                  <p>
                    <strong>{c.author}</strong> : {c.content}
                  </p>
                  <small>{c.created_at}</small>
                </div>
              ))}

              {user && (
                <div style={commentFormStyle}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Écrire un commentaire..."
                    style={textAreaStyle}
                  />
                  <button onClick={handleAddComment} style={submitCommentStyle}>
                    Envoyer
                  </button>
                </div>
              )}
            </div>

            {/* 💳 Paiement (optionnel) */}
            {showPayment && (
              <div style={paymentSectionStyle}>
                <h3>Paiement sécurisé</h3>
                <Payment artwork={artwork} onSuccess={() => setShowPayment(false)} />
                <button
                  onClick={() => setShowPayment(false)}
                  style={cancelButtonStyle}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== STYLES ===================== */

const containerStyle = { padding: "2rem 0", minHeight: "calc(100vh - 70px)" };
const contentStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "3rem",
  alignItems: "start",
};
const imageSectionStyle = { position: "sticky", top: "90px" };
const imageStyle = {
  width: "100%",
  borderRadius: "10px",
  boxShadow: "0 5px 20px rgba(0, 0, 0, 0.1)",
};
const detailsSectionStyle = { padding: "0 1rem" };
const titleStyle = { fontSize: "2.5rem", color: "#00209f", marginBottom: "1rem" };
const artistNameStyle = { fontSize: "1.3rem", fontWeight: "bold", color: "#333" };
const priceSectionStyle = {
  margin: "1rem 0",
  backgroundColor: "#e7f3ff",
  border: "2px solid #00209f",
  padding: "1rem",
  borderRadius: "10px",
};
const priceStyle = { fontSize: "2rem", color: "#00209f" };
const repartitionStyle = { color: "#666", fontSize: "0.9rem" };
const descrip
