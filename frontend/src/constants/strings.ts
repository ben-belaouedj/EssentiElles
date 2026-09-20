// Livrella — Bilingual Translation System (FR/EN)
type Lang = 'fr' | 'en';

let currentLang: Lang = 'fr';

export const setLanguage = (lang: Lang) => { currentLang = lang; };
export const getLanguage = (): Lang => currentLang;

const T = {
  // App
  appName: { fr: 'Livrella', en: 'Livrella' },
  tagline: { fr: 'Vos essentiels, livrés automatiquement', en: 'Your essentials, delivered automatically' },

  // Navigation
  home: { fr: 'Accueil', en: 'Home' },
  catalog: { fr: 'Catalogue', en: 'Catalog' },
  subscriptions: { fr: 'Abonnements', en: 'Subscriptions' },
  subscriptionTab: { fr: 'Abonnement', en: 'Plan' },
  orders: { fr: 'Commandes', en: 'Orders' },
  profile: { fr: 'Profil', en: 'Profile' },
  guides: { fr: 'Conseils', en: 'Tips' },
  favorites: { fr: 'Favoris', en: 'Favorites' },

  // Auth
  login: { fr: 'Connexion', en: 'Login' },
  register: { fr: "S'inscrire", en: 'Register' },
  logout: { fr: 'Déconnexion', en: 'Logout' },
  email: { fr: 'Email', en: 'Email' },
  password: { fr: 'Mot de passe', en: 'Password' },
  confirmPassword: { fr: 'Confirmer le mot de passe', en: 'Confirm password' },
  firstName: { fr: 'Prénom', en: 'First name' },
  lastName: { fr: 'Nom', en: 'Last name' },
  phone: { fr: 'Téléphone', en: 'Phone' },
  forgotPassword: { fr: 'Mot de passe oublié ?', en: 'Forgot password?' },
  noAccount: { fr: "Pas encore de compte ?", en: "Don't have an account?" },
  alreadyAccount: { fr: 'Déjà un compte ?', en: 'Already have an account?' },
  createAccount: { fr: 'Créer un compte', en: 'Create account' },
  welcomeBack: { fr: 'Bon retour !', en: 'Welcome back!' },
  loginSubtitle: { fr: 'Connectez-vous pour accéder à vos abonnements', en: 'Sign in to access your subscriptions' },

  // Home
  hello: { fr: 'Bonjour', en: 'Hello' },
  nextDelivery: { fr: 'Prochaine livraison', en: 'Next delivery' },
  mySubscriptions: { fr: 'Mes abonnements', en: 'My subscriptions' },
  activeSubscriptions: { fr: 'Abonnements actifs', en: 'Active subscriptions' },
  currentOffers: { fr: 'Offres du moment', en: 'Current offers' },
  seeAll: { fr: 'Voir tout', en: 'See all' },
  inDays: { fr: 'dans {n} jours', en: 'in {n} days' },
  today: { fr: "Aujourd'hui", en: 'Today' },
  tomorrow: { fr: 'Demain', en: 'Tomorrow' },
  noActiveSubscriptions: { fr: 'Aucun abonnement actif', en: 'No active subscriptions' },
  startSubscribing: { fr: 'Commencez à vous abonner', en: 'Start subscribing' },

  // Products / Catalog
  searchProducts: { fr: 'Rechercher un produit...', en: 'Search for a product...' },
  allCategories: { fr: 'Tout', en: 'All' },
  feminineHygiene: { fr: 'Hygiène Féminine', en: 'Feminine Hygiene' },
  baby: { fr: 'Bébé', en: 'Baby' },
  monthlyPacks: { fr: 'Packs Mensuels', en: 'Monthly Packs' },
  promotions: { fr: 'Promotions', en: 'Sales' },
  subscribe: { fr: "S'abonner", en: 'Subscribe' },
  addToCart: { fr: 'Ajouter au panier', en: 'Add to cart' },
  subscriptionPrice: { fr: 'Prix abonné', en: 'Subscriber price' },
  regularPrice: { fr: 'Prix normal', en: 'Regular price' },
  perMonth: { fr: '/mois', en: '/month' },
  perWeek: { fr: '/semaine', en: '/week' },
  inStock: { fr: 'En stock', en: 'In stock' },
  outOfStock: { fr: 'Rupture de stock', en: 'Out of stock' },
  reviews: { fr: 'avis', en: 'reviews' },
  noProducts: { fr: 'Aucun produit trouvé', en: 'No products found' },
  badge_new: { fr: 'Nouveau', en: 'New' },
  badge_promo: { fr: 'Promo', en: 'Sale' },
  badge_bestseller: { fr: 'Best-seller', en: 'Best-seller' },

  // Subscription
  createSubscription: { fr: 'Créer un abonnement', en: 'Create subscription' },
  frequency: { fr: 'Fréquence', en: 'Frequency' },
  weekly: { fr: 'Hebdomadaire', en: 'Weekly' },
  biweekly: { fr: 'Toutes les 2 semaines', en: 'Every 2 weeks' },
  monthly: { fr: 'Mensuel', en: 'Monthly' },
  quantity: { fr: 'Quantité', en: 'Quantity' },
  deliveryAddress: { fr: 'Adresse de livraison', en: 'Delivery address' },
  pauseSubscription: { fr: 'Mettre en pause', en: 'Pause' },
  resumeSubscription: { fr: 'Reprendre', en: 'Resume' },
  cancelSubscription: { fr: 'Annuler', en: 'Cancel' },
  modifySubscription: { fr: 'Modifier', en: 'Modify' },
  active: { fr: 'Actif', en: 'Active' },
  paused: { fr: 'En pause', en: 'Paused' },
  cancelled: { fr: 'Annulé', en: 'Cancelled' },
  nextDeliveryDate: { fr: 'Prochain envoi', en: 'Next shipment' },
  confirmCancel: { fr: 'Êtes-vous sûre de vouloir annuler cet abonnement ?', en: 'Are you sure you want to cancel this subscription?' },
  confirmPause: { fr: 'Mettre en pause cet abonnement ?', en: 'Pause this subscription?' },
  noSubscriptions: { fr: 'Aucun abonnement', en: 'No subscriptions' },

  // Orders
  myOrders: { fr: 'Mes commandes', en: 'My orders' },
  orderTracking: { fr: 'Suivi de commande', en: 'Order tracking' },
  orderNumber: { fr: 'Commande', en: 'Order' },
  orderDate: { fr: 'Date', en: 'Date' },
  orderStatus: { fr: 'Statut', en: 'Status' },
  trackingNumber: { fr: 'N° de suivi', en: 'Tracking number' },
  status_confirmed: { fr: 'Confirmée', en: 'Confirmed' },
  status_preparing: { fr: 'En préparation', en: 'Preparing' },
  status_shipped: { fr: 'Expédiée', en: 'Shipped' },
  status_delivered: { fr: 'Livrée', en: 'Delivered' },
  status_cancelled: { fr: 'Annulée', en: 'Cancelled' },
  estimatedDelivery: { fr: 'Livraison estimée', en: 'Estimated delivery' },
  noOrders: { fr: 'Aucune commande', en: 'No orders' },

  // Invoices
  invoices: { fr: 'Factures', en: 'Invoices' },
  invoiceNumber: { fr: 'Facture', en: 'Invoice' },
  download: { fr: 'Télécharger', en: 'Download' },
  noInvoices: { fr: 'Aucune facture', en: 'No invoices' },
  tax: { fr: 'TVA (10%)', en: 'VAT (10%)' },
  total: { fr: 'Total', en: 'Total' },

  // Notifications
  notifications: { fr: 'Notifications', en: 'Notifications' },
  markAllRead: { fr: 'Tout marquer comme lu', en: 'Mark all as read' },
  noNotifications: { fr: 'Aucune notification', en: 'No notifications' },

  // Cart
  cart: { fr: 'Panier', en: 'Cart' },
  emptyCart: { fr: 'Votre panier est vide', en: 'Your cart is empty' },
  checkout: { fr: 'Valider la commande', en: 'Checkout' },
  paymentDemoMode: { fr: 'Mode démo', en: 'Demo mode' },
  subtotal: { fr: 'Sous-total', en: 'Subtotal' },
  deliveryFree: { fr: 'Livraison offerte', en: 'Free delivery' },
  remove: { fr: 'Retirer', en: 'Remove' },

  // Profile
  myProfile: { fr: 'Mon profil', en: 'My profile' },
  editProfile: { fr: 'Modifier le profil', en: 'Edit profile' },
  myAddresses: { fr: 'Mes adresses', en: 'My addresses' },
  settings: { fr: 'Paramètres', en: 'Settings' },
  support: { fr: 'Support', en: 'Support' },
  offers: { fr: 'Offres', en: 'Offers' },
  memberSince: { fr: 'Membre depuis', en: 'Member since' },
  language: { fr: 'Langue', en: 'Language' },
  french: { fr: 'Français', en: 'French' },
  english: { fr: 'Anglais', en: 'English' },
  notificationsSettings: { fr: 'Notifications', en: 'Notifications' },
  privacy: { fr: 'Confidentialité', en: 'Privacy' },
  about: { fr: 'À propos', en: 'About' },
  deleteAccount: { fr: 'Supprimer le compte', en: 'Delete account' },

  // Support
  supportTitle: { fr: 'Comment pouvons-nous vous aider ?', en: 'How can we help you?' },
  faq: { fr: 'FAQ', en: 'FAQ' },
  myTickets: { fr: 'Mes demandes', en: 'My requests' },
  newTicket: { fr: 'Nouvelle demande', en: 'New request' },
  ticketSubject: { fr: 'Objet', en: 'Subject' },
  ticketCategory: { fr: 'Catégorie', en: 'Category' },
  ticketMessage: { fr: 'Message', en: 'Message' },
  sendMessage: { fr: 'Envoyer', en: 'Send' },
  closeTicket: { fr: 'Fermer le ticket', en: 'Close ticket' },
  status_open: { fr: 'Ouvert', en: 'Open' },
  status_in_progress: { fr: 'En cours', en: 'In progress' },
  status_resolved: { fr: 'Résolu', en: 'Resolved' },
  status_closed: { fr: 'Fermé', en: 'Closed' },
  noTickets: { fr: 'Aucune demande en cours', en: 'No open requests' },
  contactEmail: { fr: 'Contacter par email', en: 'Contact by email' },
  contactPhone: { fr: 'Nous appeler', en: 'Call us' },

  // Addresses
  addAddress: { fr: 'Ajouter une adresse', en: 'Add address' },
  editAddress: { fr: 'Modifier', en: 'Edit' },
  deleteAddress: { fr: 'Supprimer', en: 'Delete' },
  setDefault: { fr: 'Définir par défaut', en: 'Set as default' },
  defaultAddress: { fr: 'Par défaut', en: 'Default' },
  street: { fr: 'Rue', en: 'Street' },
  city: { fr: 'Ville', en: 'City' },
  zipCode: { fr: 'Code postal', en: 'Zip code' },
  country: { fr: 'Pays', en: 'Country' },
  addressLabel: { fr: 'Étiquette (Maison, Bureau...)', en: 'Label (Home, Office...)' },
  noAddresses: { fr: 'Aucune adresse enregistrée', en: 'No saved addresses' },

  // Actions
  save: { fr: 'Enregistrer', en: 'Save' },
  cancel: { fr: 'Annuler', en: 'Cancel' },
  confirm: { fr: 'Confirmer', en: 'Confirm' },
  delete: { fr: 'Supprimer', en: 'Delete' },
  close: { fr: 'Fermer', en: 'Close' },
  yes: { fr: 'Oui', en: 'Yes' },
  no: { fr: 'Non', en: 'No' },
  back: { fr: 'Retour', en: 'Back' },
  loading: { fr: 'Chargement...', en: 'Loading...' },
  retry: { fr: 'Réessayer', en: 'Retry' },
  discoverCatalog: { fr: 'Découvrir le catalogue', en: 'Browse catalog' },

  // Errors
  errorGeneral: { fr: 'Une erreur est survenue', en: 'An error occurred' },
  errorNetwork: { fr: 'Problème de connexion', en: 'Connection error' },
  errorRequired: { fr: 'Ce champ est requis', en: 'This field is required' },
  errorEmail: { fr: 'Email invalide', en: 'Invalid email' },
  errorPasswordMin: { fr: '6 caractères minimum', en: 'Minimum 6 characters' },
  errorPasswordMatch: { fr: 'Les mots de passe ne correspondent pas', en: 'Passwords do not match' },
};

// Translation function — reads the active language at call time so it stays
// in sync with the auth store without a manual `setLanguage()` call.
export function t(key: keyof typeof T, params?: Record<string, string | number>): string {
  const entry = T[key];
  if (!entry) return key;
  let text = entry[currentLang] || entry.fr;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export function hasTranslation(key: string): key is keyof typeof T {
  return Object.prototype.hasOwnProperty.call(T, key);
}

export type TranslationKey = keyof typeof T;

export default T;
