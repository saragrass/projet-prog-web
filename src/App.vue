<template>
  <div id="app" :class="{ 'blurred': selectedArtwork }">
    <header>
      <h1>{{ $t('header') }}</h1>
      
      <!-- Sélecteur de langue -->
      <div class="language-selector">
        <select id="lang" v-model="selectedLanguage" @change="changeLanguage">
          <option value="en">🇺🇸</option>
          <option value="fr">🇫🇷</option>
        </select>
      </div>
    </header>

    <main>
      <div class="filters-and-sort">
        <!-- Filtres pour les œuvres d'art -->
        <div class="filters">
          <div>
            <select id="typeFilter" v-model="selectedType" @change="filterArtworks">
              <option value="">{{ $t('all_types') }}</option>
              <option v-for="type in uniqueTypes" :value="type">{{ type }}</option>
            </select>
            <select id="artistFilter" v-model="selectedArtist" @change="filterArtworks">
              <option value="">{{ $t('all_artists') }}</option>
              <option v-for="artist in uniqueArtists" :value="artist">{{ artist }}</option>
            </select>
            <select id="dateFilter" v-model="selectedDate" @change="filterArtworks">
              <option value="">{{ $t('all_dates') }}</option>
              <option v-for="date in uniqueDates" :value="date">{{ date }}</option>
            </select>
            <select id="countryFilter" v-model="selectedCountry" @change="filterArtworks">
              <option value="">{{ $t('all_countries') }}</option>
              <option v-for="country in uniqueCountries" :value="country">{{ country }}</option>
            </select>
          </div>
        </div>

        <!-- Options de tri -->
        <div class="sort-options">
          <img src="./assets/tri-asc-clair.png" alt="Ascending" class="sort-image" v-if="sortOrder === 'asc'" @click="toggleSortOrder">
          <img src="./assets/tri-desc-clair.png" alt="Descending" class="sort-image" v-else @click="toggleSortOrder">
        </div>
      </div>

      <div v-if="artworks.length > 0" class="artworks-grid">
        <div v-for="artwork in visibleArtworks" :key="artwork.id" class="artwork-item" @click="showArtworkDetails(artwork)">
          <div class="artwork-image-container">
            <img :src="getArtworkImageOrDefault(artwork)" alt="Artwork">
            <div class="artwork-image-overlay"></div>
            <h1 class="artwork-title-overlay">{{ artwork.title }}</h1>
          </div>
        </div>
      </div>
      <div v-else>
        <p>{{ $t('loading') }}</p>
      </div>
    </main>

    <footer>
      <p>&copy; 2024 {{ $t('header') }}</p>
    </footer>

  </div>
  <!-- Fenêtre contextuelle pour les détails de l'œuvre -->
  <div class="artwork-details-popup" v-if="selectedArtwork" @click="hideArtworkDetails">
    <div class="popup-content">
      <p class="close-button" @click="hideArtworkDetails">x</p>
      <div class="image-container">
        <img :src="getArtworkImageOrDefault(selectedArtwork)" alt="Artwork">
      </div>
      <div class="text-container">
        <h2>{{ selectedArtwork.title }}</h2>
        <p v-if="selectedArtwork.artist_display"><b>{{ $t('artist') }}:</b> {{ selectedArtwork.artist_display }}</p>
        <p v-if="selectedArtwork.dimensions"><b>{{ $t('dimensions') }}:</b> {{ selectedArtwork.dimensions }}</p>
        <p v-if="selectedArtwork.medium_display"><b>{{ $t('medium') }}:</b> {{ selectedArtwork.medium_display }}</p>
        <p v-if="selectedArtwork.inscriptions"><b>{{ $t('inscriptions') }}:</b> {{ selectedArtwork.inscriptions }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      artworks: [],
      selectedArtist: '',
      selectedDate: '',
      selectedCountry: '',
      selectedType: '',
      visibleArtworks: [],
      pageSize: 30, // Nombre d'œuvres par page
      sortOrder: 'unset', // Ordre de tri par défaut
      selectedArtwork: null, // Nouvelle propriété pour stocker les détails de l'œuvre sélectionnée
      selectedLanguage: 'en', // Langue par défaut
    };
  },
  computed: {
    uniqueArtists() {
      return [...new Set(this.artworks.map(artwork => artwork.artist_display))];
    },
    uniqueDates() {
      return [...new Set(this.artworks.map(artwork => artwork.date_display))];
    },
    uniqueCountries() {
      return [...new Set(this.artworks.map(artwork => artwork.place_of_origin))];
    },
    uniqueTypes() {
      return [...new Set(this.artworks.map(artwork => artwork.artwork_type_title))];
    },
    totalPages() {
      return Math.ceil(this.artworks.length / this.pageSize);
    },
  },
  mounted() {
    this.fetchAllArtworks(); // Appel de la méthode pour récupérer toutes les œuvres
    window.addEventListener('scroll', this.loadMoreArtworks);
    window.addEventListener('keydown', this.escapeKey);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.loadMoreArtworks);
    window.removeEventListener('keydown', this.escapeKey);
  },
  methods: {
    changeLanguage() {
      this.$i18n.locale = this.selectedLanguage; // Change la langue en fonction de la sélection de l'utilisateur
    },
    async fetchAllArtworks() {
      try {
        const storedArtworks = localStorage.getItem('artworks');
        if (storedArtworks) {
          this.artworks = JSON.parse(storedArtworks);
          this.updateVisibleArtworks();
        } else {
          const response = await fetch('https://api.artic.edu/api/v1/artworks?limit=100');
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
          }
          const data = await response.json();
          this.artworks = data.data;
          this.saveArtworksToLocalStorage();
          this.updateVisibleArtworks();
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des œuvres d\'art :', error);
      }
    },
    saveArtworksToLocalStorage() {
      localStorage.setItem('artworks', JSON.stringify(this.artworks));
    },
    updateVisibleArtworks() {
      const startIndex = this.visibleArtworks.length;
      const endIndex = Math.min(startIndex + this.pageSize, this.artworks.length);
      this.visibleArtworks = this.artworks.slice(0, endIndex);
    },
    loadMoreArtworks() {
      const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight - 100;
      if (bottomOfWindow && this.visibleArtworks.length < this.artworks.length) {
        this.updateVisibleArtworks();
      }
    },
    getArtworkImageOrDefault(artwork) {
      if (artwork.image_id) {
        return `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`;
      } else if (artwork.alt_image_ids && artwork.alt_image_ids.length > 0) {
        return `https://www.artic.edu/iiif/2/${artwork.alt_image_ids[0]}/full/843,/0/default.jpg`;
      } else {
        return "src/assets/image-not-available.jpg";
      }
    },
    filterArtworks() {
      this.updateVisibleArtworks();
    },
    // Méthode pour afficher les détails de l'œuvre dans la fenêtre contextuelle
    showArtworkDetails(artwork) {
      this.selectedArtwork = artwork;
    },
    // Méthode pour masquer la fenêtre contextuelle des détails de l'œuvre
    hideArtworkDetails() {
      this.selectedArtwork = null;
    },
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.sortArtworks();
    },
    sortArtworks() {
      if (this.sortOrder !== 'unset') {
        this.artworks.sort((a, b) => {
          if (this.sortOrder === 'asc') {
            return a.title.localeCompare(b.title);
          } else {
            return b.title.localeCompare(a.title);
          }
        });
        this.updateVisibleArtworks();
      }
    },
    escapeKey(event) {
      if (event.key === 'Escape') {
        this.hideArtworkDetails();
      }
    },
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

#app {
  color: #FFFFEE;
  background-color: #624338;
}

header {
  padding: 20px;
  text-align: center;
}

footer {
  padding: 10px;
  text-align: center;
}

h1, h2 {
  text-transform: uppercase;
  font-family: Georgia, serif;
}

select {
  appearance: none;
  padding: 5px 10px;
  font-size: 16px;
  border: 2px solid #624338;
  border-radius: 5px;
  background-color: #FFFFEE;
  color: #624338;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

select:hover {
  border-color: #FFFFEE;
  background-color: #FFFFFF;
}

select:focus {
  outline: none;
  border-color: #624338;
}

select option {
  background-color: #FFFFEE;
  color: #624338;
}

.language-selector {
  margin-top: 10px;
}

.language-selector select {
  appearance: none;
  padding: 5px 10px;
  font-size: 16px;
  border: 2px solid #FFFFEE;
  border-radius: 5px;
  background-color: #624338;
  color: #FFFFEE;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 12.5px;
  cursor: pointer;
}

.language-selector select:hover {
  background-color: #675045;
}

.language-selector select:focus {
  outline: none;
  border-color: #FFFFEE;
}

.language-selector select option {
  background-color: #624338;
  color: #FFFFEE;
}

.artworks-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 0;
  cursor: pointer;
}

.artwork-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  margin: 0;
  padding: 0;
  border: none;
}

.artwork-item {
  position: relative;
  width: 33.33%;
  height: 250px;
  overflow: hidden;
}

.artwork-image-container {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.sort-image {
  width: 20px;
  cursor: pointer;
}

.pagination-buttons {
  text-align: center;
}

.filters-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filters {
  gap: 10px;
  margin: 0 auto;
}

.filters select {
  width: 200px;
}

.filters-and-sort {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px;
}

.sort-options {
  margin-bottom: -10px;
}

.artwork-details-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: popup-appear 0.3s ease;
}

.popup-content {
  background-color: #FFFFEE;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  position: relative;

}

.popup-content h2 {
  color: #624338;
  margin-bottom: 10px;
}

.popup-content p {
  color: #624338;
  margin-bottom: 20px;
}

.popup-content button {
  color: #624338;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.popup-content img {
  max-width: 100%;
  max-height: 300px;
  margin-right: 20px;
}

.blurred {
  filter: blur(5px);
}

.artwork-title-overlay {
  position: absolute;
  bottom: 0;
  left: 5px;
  width: 100%;
  padding: 5px;
  box-sizing: border-box;
  font-size: 35px;
  text-align:left;
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.artwork-image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0);
  transition: background-color 0.3s ease;
}

.artwork-item:hover .artwork-image-overlay {
  background-color: rgba(255, 255, 255, 0.5);
}

.artwork-item:hover .artwork-title-overlay {
  color: #624338;
}

@keyframes popup-appear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media screen and (max-width: 768px) {
  .artwork-item {
    width: calc(50%);
  }
}

@media screen and (max-width: 500px) {
  .artwork-item {
    width: calc(100%);
  }
}
</style>
