Créer une application mobile Android moderne appelée EssentiElles.

EssentiElles est une application destinée aux femmes, femmes enceintes et jeunes mamans pour gérer automatiquement la livraison récurrente de produits essentiels liés à l’hygiène féminine, au postpartum, au bien-être et aux soins pour bébé.

L’application doit fonctionner même hors connexion grâce à une base de données locale intégrée.

OBJECTIF PRINCIPAL

Permettre à l’utilisatrice de gérer facilement un abonnement dynamique de livraison de produits essentiels.

Elle doit pouvoir :

voir sa prochaine livraison
modifier les produits inclus
changer la fréquence de livraison
ajouter ou supprimer des produits
mettre en pause son abonnement
sauter la prochaine livraison
voir le total mis à jour automatiquement

L’abonnement est la fonctionnalité principale de l’application.

FONCTIONNALITÉS DYNAMIQUES À INTÉGRER

mise à jour automatique de l’interface après modification des données
recalcul automatique du total de l’abonnement
mise à jour automatique de la date de prochaine livraison
filtrage dynamique des produits par catégorie
recherche instantanée dans le catalogue
gestion des favoris
historique des commandes local
notifications locales pour livraison
mode hors connexion
recommandations personnalisées selon l’historique utilisateur
badges dynamiques (recommandé, nouveau, bientôt en rupture)
sauvegarde locale des préférences utilisateur
mise à jour en temps réel des quantités dans abonnement

BASE DE DONNÉES LOCALE

Utiliser Room Database pour stocker :

utilisateur
adresses
produits
abonnement
articles d’abonnement
commandes
favoris
conseils sauvegardés
préférences utilisateur
langue sélectionnée

La base locale doit permettre :

fonctionnement hors ligne
chargement rapide des données
mise à jour automatique de l’interface
synchronisation interne des écrans
persistance après fermeture de l’application

ÉCRANS À CRÉER

Onboarding

présenter le concept de livraison automatique
présenter la personnalisation des routines
présenter la flexibilité de l’abonnement

Accueil

afficher message de bienvenue
afficher prochaine livraison
afficher produits inclus
bouton modifier abonnement
catégories rapides :
hygiène
bébé
postpartum
bien-être
produits recommandés
section conseils

Abonnement (écran principal)

liste produits actifs
modifier quantité
modifier fréquence
supprimer produit
mettre en pause abonnement
sauter prochaine livraison
mise à jour automatique du total

Catalogue

liste produits
recherche dynamique
filtrage par catégorie
tri par prix
affichage badge recommandé

Fiche produit

image produit
nom
description courte
bénéfices principaux
prix abonnement
prix achat unique
sélecteur fréquence
bouton ajouter à mon abonnement
bouton ajouter favoris

Panier / validation

adresse
mode paiement
récapitulatif commande
fréquence livraison
bouton confirmer

Conseils

articles sur :
hygiène féminine
postpartum
préparation maternité
soins bébé
bien-être

possibilité sauvegarder conseils localement

Profil

informations utilisateur
adresses
langue FR / EN
préférences
historique commandes
gestion abonnement
déconnexion

ARCHITECTURE TECHNIQUE

Application Android native

Kotlin
Jetpack Compose
Material 3
MVVM
Navigation Compose
Room Database
DataStore préférences
Repository Pattern
StateFlow pour mise à jour dynamique UI
WorkManager pour notifications locales

NAVIGATION PRINCIPALE

barre navigation basse avec 5 onglets

Accueil
Abonnement
Catalogue
Conseils
Profil

DESIGN UI

style moderne doux et premium adapté maternité

couleur principale :
#B5838D

fond :
#FAF7F4

surface :
#FFFFFF

accent secondaire :
#A8B8A3

texte principal :
#2B2D42

texte secondaire :
#6D6875

bordures :
#E8E1DB

cartes arrondies
coins 20 à 24dp
ombres légères
icônes outline
interface minimaliste
espaces généreux

COMPORTEMENT ATTENDU

l’application doit fonctionner hors connexion
toutes les modifications doivent être sauvegardées localement
l’interface doit se mettre à jour automatiquement
l’expérience doit être fluide et rassurante

OBJECTIF FINAL

Créer une application Android moderne, dynamique et évolutive centrée sur la gestion intelligente d’un abonnement de produits essentiels pour femmes et jeunes mamans avec stockage local complet des données utilisateur.
