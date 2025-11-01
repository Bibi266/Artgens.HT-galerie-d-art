import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtwork } from '../context/ArtworkContext';
import axios from 'axios';
import Payment from '../components/Payment';

// 🌍 Détection automatique Render / Localhost
const isLocalhost = window.location.hostname === "localhost";
const API_URL = isLocalhost
  ? "http://127.0.0.1:5555/api"
  : "https://artgens-ht-2.onrender.com/api";

function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, likeArtwork } = useArtwork();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchArtwork();
  }, [id]);

  const fetchArtwork = async () => {
    try {
      const response = await axios.get(`${API_URL}/artworks/${id}`);
      setArtwork(response.data);

      // Vérifie si l'utilisateur a déjà liké
      if (user) {
        setIsLiked(response.data.is_liked || false);
      }
    } catch (error) {
      console.error('Erreur chargement œuvre:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour aimer cette œuvre');
      return;
    }

    const result = await likeArtwork(id);
    if (result.success) {
      setIsLiked(result.data.liked);
      await fetchArtwork(); // Recharger pour mettre à jour les likes
    }
  };

  const handleBuy = () => {
    if (!user) {
      alert('Veuillez vous connecter pour acheter cette œuvre');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    alert('Félicitations ! Vous avez acheté cette œuvre !');
    setShowPayment(false);
    navigate('/');
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
        <button onClick={() => navigate('/')} style={buttonStyle}>
          Retour à la galerie
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className="container">
        <div style={contentStyle}>
          <div style={imageSectionStyle}>
            <img 
              src={artwork.image_url || '/placeholder-image.jpg'} 
              alt={artwork.title}
              style={imageStyle}
            />
          </div>
          
          <div style={detailsSectionStyle}>
            <h1 style={titleStyle}>{artwork.title}</h1>
            
            <div style={artistInfoStyle}>
              <h3 style={artistTitleStyle}>Artiste</h3>
              <p style={artistNameStyle}>{artwork.artist_name}</p>
              {artwork.artist_bio && (
                <p style={artistBioStyle}>{artwork.artist_bio}</p>
              )}
            </div>
            
            <div style={priceSectionStyle}>
              <h2 style={priceStyle}>${artwork.price}</h2>
              <p style={repartitionStyle}>
                Répartition : 75% artiste, 10% plateforme, 15% ELJ
              </p>
            </div>
            
            <div style={descriptionStyle}>
              <h3>Description</h3>
              <p>{artwork.description || 'Aucune description disponible.'}</p>
            </div>
            
            <div style={categoriesStyle}>
              <h3>Catégories</h3>
              <div style={tagsStyle}>
                {(artwork.categories || []).map(cat => (
                  <span key={cat.id || cat} style={tagStyle}>
                    {cat.name || cat}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={statsStyle}>
              <span style={statStyle}>
                ❤️ {artwork.likes_count || 0} likes
              </span>
              <span style={statStyle}>
                📅 Ajoutée le {new Date(artwork.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div style={actionsStyle}>
              <button 
                onClick={handleLike}
                style={isLiked ? likedButtonStyle : likeButtonStyle}
              >
                {isLiked ? '❤️ Liké' : '🤍 Like'} ({artwork.likes_count || 0})
              </button>
              
              {!artwork.is_sold ? (
                <button 
                  onClick={handleBuy}
                  style={buyButtonStyle}
                >
                  🛒 Acheter maintenant
                </button>
              ) : (
                <button disabled style={soldButtonStyle}>
                  💔 Vendu
                </button>
              )}
            </div>
            
            {showPayment && !artwork.is_sold && (
              <div style={paymentSectionStyle}>
                <h3>Paiement sécurisé</h3>
                <Payment 
                  artwork={artwork} 
                  onSuccess={handlePaymentSuccess}
                />
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
