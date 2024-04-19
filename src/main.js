import { createApp } from 'vue';
import App from './App.vue';
import { createI18n } from 'vue-i18n';

// Création d'une instance VueI18n avec les messages pour les langues anglaise et française
const i18n = createI18n({
  locale: 'en', // Langue par défaut
  messages: {
    en: {
      header: 'Art Institute of Chicago',
      all_types: 'All artwork types',
      all_artists: 'All artists',
      all_dates: 'All dates/epochs',
      all_countries: 'All countries',
      loading: 'Loading...',
      artist: 'Artist',
      dimensions: 'Dimensions',
      medium: 'Medium',
      inscriptions: 'Inscriptions',
    },
    fr: {
      header: 'Institut d\'Art de Chicago',
      all_types: 'Tous les types d\'œuvres',
      all_artists: 'Tous les artistes',
      all_dates: 'Toutes les dates/époques',
      all_countries: 'Tous les pays',
      loading: 'Chargement...',
      artist: 'Artiste ',
      dimensions: 'Dimensions ',
      medium: 'Médium ',
      inscriptions: 'Inscriptions ',
    }
  }
});

// Création de l'application Vue en utilisant App.vue comme composant racine et en ajoutant VueI18n
const app = createApp(App);
app.use(i18n); // Ajout de VueI18n à l'application
app.mount('#app');
