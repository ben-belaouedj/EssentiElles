#!/usr/bin/env python3
"""
Script de remplissage de la base de données avec des données de démonstration
"""

import asyncio
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017/")
db_name = os.environ.get("DB_NAME", "livrella")

print(f"📦 Connexion à MongoDB: {mongo_url}")
print(f"📊 Base de données: {db_name}\n")


def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def seed_database():
    """Seed the database with demo data"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("🗑️  Nettoyage de la base de données...")
    # Clear existing data
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.users.delete_many({"email": {"$ne": "admin@livrella.com"}})  # Keep admin
    await db.addresses.delete_many({})
    await db.subscriptions.delete_many({})
    await db.orders.delete_many({})
    await db.invoices.delete_many({})
    await db.notifications.delete_many({})
    await db.support_tickets.delete_many({})
    await db.offers.delete_many({})

    print("✅ Base de données nettoyée\n")

    now = datetime.now(timezone.utc)

    # ==================== CATEGORIES ====================
    print("📁 Création des catégories...")
    categories = [
        {
            "name": "Hygiène Féminine",
            "nameEn": "Feminine Hygiene",
            "slug": "feminine-hygiene",
            "description": "Protections, tampons, serviettes hygiéniques bio",
            "icon": "flower-outline",
            "color": "#FFCAD4",
            "isActive": True,
            "order": 1,
            "createdAt": now,
        },
        {
            "name": "Bébé",
            "nameEn": "Baby",
            "slug": "baby",
            "description": "Couches, lingettes, soins bébé premium",
            "icon": "heart-outline",
            "color": "#E8F5E9",
            "isActive": True,
            "order": 2,
            "createdAt": now,
        },
        {
            "name": "Packs Mensuels",
            "nameEn": "Monthly Packs",
            "slug": "monthly-packs",
            "description": "Packs économiques pour vos besoins mensuels",
            "icon": "gift-outline",
            "color": "#F3E5F5",
            "isActive": True,
            "order": 3,
            "createdAt": now,
        },
        {
            "name": "Promotions",
            "nameEn": "Sales",
            "slug": "promotions",
            "description": "Offres spéciales et remises exceptionnelles",
            "icon": "pricetag-outline",
            "color": "#FFF3E0",
            "isActive": True,
            "order": 4,
            "createdAt": now,
        },
    ]

    result = await db.categories.insert_many(categories)
    cat_ids = {cat["slug"]: str(id) for cat, id in zip(categories, result.inserted_ids)}
    print(f"✅ {len(categories)} catégories créées\n")

    # ==================== PRODUCTS ====================
    print("🛍️  Création des produits...")

    # Images URLs (using Unsplash & Pexels for demo)
    hygiene_img1 = (
        "https://images.unsplash.com/photo-1764312270936-adb508140a6d?w=600&q=80"
    )
    hygiene_img2 = (
        "https://images.unsplash.com/photo-1712677178403-a10c29e8797e?w=600&q=80"
    )
    hygiene_img3 = (
        "https://images.unsplash.com/photo-1616680214084-22670de1bc82?w=600&q=80"
    )

    baby_img1 = (
        "https://images.unsplash.com/photo-1714350313517-ae7dadf0dc39?w=600&q=80"
    )
    baby_img2 = (
        "https://images.pexels.com/photos/5889959/pexels-photo-5889959.jpeg?w=600"
    )
    baby_img3 = (
        "https://images.pexels.com/photos/2225617/pexels-photo-2225617.jpeg?w=600"
    )

    pack_img = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80"

    products = [
        # Hygiène féminine (6 produits)
        {
            "name": "Serviettes Ultra Night Bio",
            "brand": "Nana",
            "description": "Serviettes hygiéniques ultra-absorbantes pour la nuit. Coton bio certifié avec ailettes pour une protection maximale. Respirantes et approuvées par les gynécologues. Sans parfum, sans chlore.",
            "shortDescription": "Protection nuit ultra-absorbante 100% coton bio",
            "categoryId": cat_ids["feminine-hygiene"],
            "price": 5.99,
            "subscriptionPrice": 4.99,
            "discountPercentage": 17,
            "unit": "paquet de 14",
            "quantity": 14,
            "inStock": True,
            "stockCount": 200,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["nuit", "coton bio", "absorbant", "ailettes", "sans chlore"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.8,
            "reviewCount": 234,
            "images": [hygiene_img1, hygiene_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Protège-slips Quotidiens x50",
            "brand": "Always",
            "description": "Protège-slips ultra-fins pour une protection légère au quotidien. Respirants et confortables, ils s'adaptent parfaitement à toutes vos activités. Surface douce comme du coton.",
            "shortDescription": "Protection légère et discrète pour tous les jours",
            "categoryId": cat_ids["feminine-hygiene"],
            "price": 4.49,
            "subscriptionPrice": 3.79,
            "discountPercentage": 16,
            "unit": "boîte de 50",
            "quantity": 50,
            "inStock": True,
            "stockCount": 150,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["quotidien", "slim", "respirant", "confortable"],
            "availableFrequencies": ["biweekly", "monthly"],
            "rating": 4.5,
            "reviewCount": 189,
            "images": [hygiene_img3],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Tampons Normal x32",
            "brand": "o.b.",
            "description": "Tampons sans applicateur pour une protection discrète et efficace. Sans parfum, sans chlore, ni viscose. Testés dermatologiquement et approuvés par les gynécologues.",
            "shortDescription": "Tampons discrets certifiés sans produits chimiques",
            "categoryId": cat_ids["feminine-hygiene"],
            "price": 6.29,
            "subscriptionPrice": 5.29,
            "discountPercentage": 16,
            "unit": "boîte de 32",
            "quantity": 32,
            "inStock": True,
            "stockCount": 120,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": True,
            "isBestSeller": False,
            "tags": ["tampon", "sans applicateur", "sûr", "sans chlore"],
            "availableFrequencies": ["monthly"],
            "rating": 4.6,
            "reviewCount": 145,
            "images": [hygiene_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Serviettes Regular Day",
            "brand": "Nana",
            "description": "Serviettes hygiéniques pour utilisation de jour. Protection fiable et confort toute la journée avec surface ultra-douce. Système anti-fuites breveté.",
            "shortDescription": "Protection journée confortable avec anti-fuites",
            "categoryId": cat_ids["feminine-hygiene"],
            "price": 4.99,
            "subscriptionPrice": 4.19,
            "discountPercentage": 16,
            "unit": "paquet de 18",
            "quantity": 18,
            "inStock": True,
            "stockCount": 180,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": False,
            "tags": ["jour", "regular", "confort", "anti-fuites"],
            "availableFrequencies": ["biweekly", "monthly"],
            "rating": 4.4,
            "reviewCount": 98,
            "images": [hygiene_img1],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Cups Menstruelles Taille M",
            "brand": "Saforelle",
            "description": "Coupe menstruelle en silicone médical hypoallergénique. Réutilisable jusqu'à 10 ans. Écologique et économique. Livrée avec sa pochette de rangement.",
            "shortDescription": "Solution écologique réutilisable 10 ans",
            "categoryId": cat_ids["feminine-hygiene"],
            "price": 24.99,
            "subscriptionPrice": 24.99,
            "discountPercentage": 0,
            "unit": "unité + pochette",
            "quantity": 1,
            "inStock": True,
            "stockCount": 50,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": True,
            "isBestSeller": False,
            "tags": ["écologique", "réutilisable", "silicone médical", "économique"],
            "availableFrequencies": [],  # One-time purchase
            "rating": 4.9,
            "reviewCount": 312,
            "images": [hygiene_img3, hygiene_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Lingettes Intimes Douces",
            "brand": "Saforelle",
            "description": "Lingettes intimes douces pour l'hygiène quotidienne. pH neutre, sans savon, sans alcool. Testées gynécologiquement. Idéales pour les déplacements.",
            "shortDescription": "Lingettes pH neutre pour hygiène quotidienne",
            "categoryId": cat_ids["feminine-hygiene"],
            "price": 3.99,
            "subscriptionPrice": 3.49,
            "discountPercentage": 13,
            "unit": "paquet de 20",
            "quantity": 20,
            "inStock": True,
            "stockCount": 100,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": False,
            "tags": ["lingettes", "pH neutre", "sans alcool", "déplacement"],
            "availableFrequencies": ["monthly"],
            "rating": 4.3,
            "reviewCount": 67,
            "images": [hygiene_img1],
            "createdAt": now,
            "updatedAt": now,
        },
        # Bébé (8 produits)
        {
            "name": "Couches Taille 2 (3-6 kg)",
            "brand": "Pampers",
            "description": "Couches ultra-douces pour bébés de 3 à 6 kg. Cœur absorbant 3x plus rapide avec canaux d'air. Indicateur d'humidité intégré. Protection anti-fuites 12h garantie.",
            "shortDescription": "Couches ultra-douces avec indicateur d'humidité",
            "categoryId": cat_ids["baby"],
            "price": 21.99,
            "subscriptionPrice": 18.99,
            "discountPercentage": 14,
            "unit": "paquet de 84",
            "quantity": 84,
            "inStock": True,
            "stockCount": 100,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["couches", "nouveau-né", "doux", "3-6kg", "indicateur"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.9,
            "reviewCount": 567,
            "images": [baby_img1, baby_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Lingettes Sensitive x288",
            "brand": "Huggies",
            "description": "Lingettes ultra-douces pour peaux sensibles de bébé. 99% eau pure, sans parfum, sans alcool. Certifiées dermatologiquement testées. Texture extra-douce.",
            "shortDescription": "Lingettes 99% eau pure pour peaux sensibles",
            "categoryId": cat_ids["baby"],
            "price": 11.99,
            "subscriptionPrice": 9.99,
            "discountPercentage": 17,
            "unit": "lot de 3×96",
            "quantity": 288,
            "inStock": True,
            "stockCount": 200,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["lingettes", "sensible", "eau pure", "sans alcool"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.7,
            "reviewCount": 423,
            "images": [baby_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Couches Premium Taille 3 (4-9 kg)",
            "brand": "Pampers",
            "description": "Couches premium avec protection 360° et lotion aloe vera intégrée. Maintien sûr grâce à l'élastique tour de taille extra-souple. Absorption optimale.",
            "shortDescription": "Couches premium 360° enrichies aloe vera",
            "categoryId": cat_ids["baby"],
            "price": 24.99,
            "subscriptionPrice": 21.49,
            "discountPercentage": 14,
            "unit": "paquet de 66",
            "quantity": 66,
            "inStock": True,
            "stockCount": 80,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": False,
            "tags": ["couches", "premium", "aloe vera", "4-9kg"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.8,
            "reviewCount": 312,
            "images": [baby_img1],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Crème Change Protectrice 100ml",
            "brand": "Mustela",
            "description": "Crème protectrice enrichie en oxéoline d'avocat contre les rougeurs et irritations. Apaise et protège dès la 1ère application. Formule 97% d'origine naturelle, testée sous contrôle pédiatrique.",
            "shortDescription": "Protection naturelle 97% contre les irritations",
            "categoryId": cat_ids["baby"],
            "price": 9.99,
            "subscriptionPrice": 8.49,
            "discountPercentage": 15,
            "unit": "tube 100ml",
            "quantity": 1,
            "inStock": True,
            "stockCount": 90,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": True,
            "isBestSeller": False,
            "tags": ["crème", "protection", "naturel", "irritations", "avocat"],
            "availableFrequencies": ["monthly"],
            "rating": 4.6,
            "reviewCount": 178,
            "images": [baby_img3],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Couches Taille 4 (7-18 kg)",
            "brand": "Pampers",
            "description": "Couches pour bébés actifs de 7 à 18 kg. Triple protection pour rester au sec jusqu'à 12 heures. Ajustement parfait avec élastiques flexibles.",
            "shortDescription": "Couches bébé actif - protection 12h",
            "categoryId": cat_ids["baby"],
            "price": 27.99,
            "subscriptionPrice": 23.99,
            "discountPercentage": 14,
            "unit": "paquet de 72",
            "quantity": 72,
            "inStock": True,
            "stockCount": 85,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["couches", "actif", "7-18kg", "protection 12h"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.7,
            "reviewCount": 445,
            "images": [baby_img1, baby_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Gel Lavant Doux Corps & Cheveux",
            "brand": "Mustela",
            "description": "Gel nettoyant tout doux pour corps et cheveux de bébé. Mousse onctueuse qui nettoie en douceur. Formule sans savon, pH physiologique. 90% d'ingrédients d'origine naturelle.",
            "shortDescription": "Gel lavant 2-en-1 doux 90% naturel",
            "categoryId": cat_ids["baby"],
            "price": 7.99,
            "subscriptionPrice": 6.99,
            "discountPercentage": 13,
            "unit": "flacon 200ml",
            "quantity": 1,
            "inStock": True,
            "stockCount": 75,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": False,
            "tags": ["gel lavant", "2-en-1", "naturel", "sans savon"],
            "availableFrequencies": ["monthly"],
            "rating": 4.5,
            "reviewCount": 123,
            "images": [baby_img3],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Lait Corps Hydratant Bébé",
            "brand": "Mustela",
            "description": "Lait hydratant pour le corps de bébé. Nourrit, hydrate et apaise la peau sensible. Pénètre rapidement sans laisser de film gras. Testé sous contrôle dermatologique et pédiatrique.",
            "shortDescription": "Lait hydratant pénétration rapide sans gras",
            "categoryId": cat_ids["baby"],
            "price": 8.99,
            "subscriptionPrice": 7.99,
            "discountPercentage": 11,
            "unit": "flacon 200ml",
            "quantity": 1,
            "inStock": True,
            "stockCount": 65,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": False,
            "tags": ["lait", "hydratant", "peau sensible", "sans gras"],
            "availableFrequencies": ["monthly"],
            "rating": 4.4,
            "reviewCount": 89,
            "images": [baby_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Eau Nettoyante Sans Rinçage",
            "brand": "Mustela",
            "description": "Eau nettoyante pour le visage, corps et siège de bébé. Ne nécessite pas de rinçage. Nettoie et apaise la peau délicate. Parfaite pour les changes rapides.",
            "shortDescription": "Eau nettoyante pratique sans rinçage",
            "categoryId": cat_ids["baby"],
            "price": 6.99,
            "subscriptionPrice": 5.99,
            "discountPercentage": 14,
            "unit": "flacon 300ml",
            "quantity": 1,
            "inStock": True,
            "stockCount": 70,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": False,
            "isBestSeller": False,
            "tags": ["eau nettoyante", "sans rinçage", "pratique", "change"],
            "availableFrequencies": ["monthly"],
            "rating": 4.6,
            "reviewCount": 156,
            "images": [baby_img3],
            "createdAt": now,
            "updatedAt": now,
        },
        # Packs mensuels (3 produits)
        {
            "name": "Pack Essentiel Femme",
            "brand": "Livrella",
            "description": "Notre pack mensuel essentiel pour femmes actives. Inclut : Serviettes Ultra Night Bio (14u) + Protège-slips Quotidiens (50u). Livraison gratuite. Économisez 15% vs achat séparé.",
            "shortDescription": "2 essentiels féminins au meilleur prix mensuel",
            "categoryId": cat_ids["monthly-packs"],
            "price": 12.99,
            "subscriptionPrice": 10.99,
            "discountPercentage": 15,
            "unit": "pack mensuel",
            "quantity": 1,
            "inStock": True,
            "stockCount": 50,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["pack", "femme", "mensuel", "essentiel", "économie"],
            "availableFrequencies": ["monthly"],
            "rating": 4.8,
            "reviewCount": 89,
            "images": [pack_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Pack Bébé Complet",
            "brand": "Livrella",
            "description": "Tout ce dont votre bébé a besoin chaque mois. Inclut : Couches T2 (84u) + Lingettes Sensitive (288u) + Crème Change (100ml). Économisez 20% vs achat séparé.",
            "shortDescription": "Pack complet nouveau-né — économisez 20%",
            "categoryId": cat_ids["monthly-packs"],
            "price": 39.99,
            "subscriptionPrice": 34.99,
            "discountPercentage": 13,
            "unit": "pack mensuel",
            "quantity": 1,
            "inStock": True,
            "stockCount": 40,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": False,
            "isBestSeller": True,
            "tags": ["pack", "bébé", "mensuel", "économie", "complet"],
            "availableFrequencies": ["biweekly", "monthly"],
            "rating": 4.9,
            "reviewCount": 156,
            "images": [pack_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Pack Hygiène Complète",
            "brand": "Livrella",
            "description": "Pack complet d'hygiène féminine. Inclut : Serviettes Night (14u) + Serviettes Day (18u) + Tampons (32u) + Lingettes intimes (20u). Tout pour le mois.",
            "shortDescription": "Pack hygiène complète pour tout le mois",
            "categoryId": cat_ids["monthly-packs"],
            "price": 19.99,
            "subscriptionPrice": 16.99,
            "discountPercentage": 15,
            "unit": "pack mensuel",
            "quantity": 1,
            "inStock": True,
            "stockCount": 35,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": True,
            "isBestSeller": False,
            "tags": ["pack", "hygiène", "mensuel", "complet"],
            "availableFrequencies": ["monthly"],
            "rating": 4.7,
            "reviewCount": 67,
            "images": [pack_img],
            "createdAt": now,
            "updatedAt": now,
        },
        # Promotions (2 produits)
        {
            "name": "Lot 3 Serviettes Night PROMO",
            "brand": "Nana",
            "description": "Pack promo exceptionnel : 3 paquets de serviettes nuit ultra-absorbantes au prix de 2.5. Stock limité — offre valable jusqu'à épuisement. Coton bio certifié.",
            "shortDescription": "Promo : 3 paquets pour le prix de 2.5",
            "categoryId": cat_ids["promotions"],
            "price": 14.99,
            "subscriptionPrice": 12.49,
            "discountPercentage": 17,
            "unit": "lot 3×14",
            "quantity": 42,
            "inStock": True,
            "stockCount": 30,
            "isActive": True,
            "isFeatured": True,
            "isNewArrival": True,
            "isBestSeller": False,
            "tags": ["promo", "lot", "économie", "nuit"],
            "availableFrequencies": ["monthly"],
            "rating": 4.7,
            "reviewCount": 45,
            "images": [hygiene_img1],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Pack Découverte Bébé",
            "brand": "Livrella",
            "description": "Idéal pour découvrir nos produits bébé. Inclut un échantillon de chaque produit phare : couches + lingettes + crème. Sans engagement, essai gratuit du service.",
            "shortDescription": "Découvrez nos produits bébé à prix réduit",
            "categoryId": cat_ids["promotions"],
            "price": 19.99,
            "subscriptionPrice": 14.99,
            "discountPercentage": 25,
            "unit": "pack découverte",
            "quantity": 1,
            "inStock": True,
            "stockCount": 25,
            "isActive": True,
            "isFeatured": False,
            "isNewArrival": True,
            "isBestSeller": False,
            "tags": ["promo", "découverte", "bébé", "essai"],
            "availableFrequencies": ["monthly"],
            "rating": 4.5,
            "reviewCount": 28,
            "images": [baby_img1],
            "createdAt": now,
            "updatedAt": now,
        },
    ]

    result = await db.products.insert_many(products)
    product_ids = {p["name"]: str(id) for p, id in zip(products, result.inserted_ids)}
    print(f"✅ {len(products)} produits créés\n")

    # ==================== OFFERS ====================
    print("🎁 Création des offres promotionnelles...")
    offers = [
        {
            "title": "-20% sur votre 1ère commande",
            "titleEn": "-20% on your first order",
            "description": "Bienvenue ! Profitez de 20% de réduction sur votre première commande.",
            "descriptionEn": "Welcome! Enjoy 20% off your first order.",
            "discount": 20,
            "badgeText": "NOUVEAU",
            "color": "#FFCAD4",
            "isActive": True,
            "order": 1,
            "createdAt": now,
        },
        {
            "title": "Livraison gratuite",
            "titleEn": "Free delivery",
            "description": "Profitez de la livraison gratuite sur tous les abonnements",
            "descriptionEn": "Enjoy free delivery on all subscriptions",
            "discount": 0,
            "badgeText": "GRATUIT",
            "color": "#E8F5E9",
            "isActive": True,
            "order": 2,
            "createdAt": now,
        },
        {
            "title": "3 mois = 1 mois offert",
            "titleEn": "3 months = 1 month free",
            "description": "Souscrivez à 3 mois d'abonnement et recevez le 4ème gratuit",
            "descriptionEn": "Subscribe for 3 months and get the 4th free",
            "discount": 25,
            "badgeText": "PROMO",
            "color": "#F3E5F5",
            "isActive": True,
            "order": 3,
            "createdAt": now,
        },
    ]

    await db.offers.insert_many(offers)
    print(f"✅ {len(offers)} offres créées\n")

    # ==================== DEMO USER ====================
    print("👤 Création de l'utilisateur de démonstration...")

    # Create demo user
    demo_user = {
        "email": "sarah@example.com",
        "password_hash": hash_password("password123"),
        "firstName": "Sarah",
        "lastName": "Martin",
        "phone": "+33 6 12 34 56 78",
        "role": "customer",
        "isActive": True,
        "createdAt": now,
        "updatedAt": now,
        "preferences": {"notifications": True, "newsletter": True, "language": "fr"},
    }

    user_result = await db.users.insert_one(demo_user)
    user_id = str(user_result.inserted_id)
    print(f"✅ Utilisateur créé: sarah@example.com / password123\n")

    # Create demo address
    print("📍 Création de l'adresse de démonstration...")
    address = {
        "userId": user_id,
        "label": "Maison",
        "firstName": "Sarah",
        "lastName": "Martin",
        "street": "12 Rue des Lilas",
        "city": "Paris",
        "zipCode": "75011",
        "country": "France",
        "phone": "+33 6 12 34 56 78",
        "isDefault": True,
        "createdAt": now,
    }

    addr_result = await db.addresses.insert_one(address)
    addr_id = str(addr_result.inserted_id)
    print(f"✅ Adresse créée\n")

    # Create demo subscription
    print("📦 Création d'un abonnement de démonstration...")
    pampers_id = product_ids.get("Couches Taille 2 (3-6 kg)")
    if pampers_id:
        subscription = {
            "userId": user_id,
            "productId": pampers_id,
            "addressId": addr_id,
            "status": "active",
            "frequency": "monthly",
            "quantity": 2,
            "unitPrice": 18.99,
            "totalPrice": 37.98,
            "startDate": now - timedelta(days=90),
            "nextDeliveryDate": now + timedelta(days=5),
            "lastDeliveryDate": now - timedelta(days=25),
            "autoRenew": True,
            "deliveryCount": 3,
            "createdAt": now - timedelta(days=90),
            "updatedAt": now,
        }

        sub_result = await db.subscriptions.insert_one(subscription)
        print(f"✅ Abonnement créé\n")

        # Create demo orders
        print("📦 Création de commandes de démonstration...")
        for i in range(3):
            order_date = now - timedelta(days=30 * i)
            status = "delivered" if i > 0 else "shipped"
            tracking = f"FR{1234567890 + i}ZZ" if i <= 1 else None

            order = {
                "orderNumber": f"ESS-2026-{10001 + i}",
                "userId": user_id,
                "subscriptionId": str(sub_result.inserted_id),
                "addressId": addr_id,
                "items": [
                    {
                        "productId": pampers_id,
                        "productName": "Couches Taille 2 (3-6 kg)",
                        "quantity": 2,
                        "unitPrice": 18.99,
                        "totalPrice": 37.98,
                    }
                ],
                "subtotal": 37.98,
                "deliveryFee": 0,
                "discount": 0,
                "total": 37.98,
                "status": status,
                "trackingNumber": tracking,
                "estimatedDelivery": order_date + timedelta(days=3),
                "timeline": [
                    {
                        "status": "confirmed",
                        "date": order_date.isoformat(),
                        "description": "Commande confirmée",
                    },
                    {
                        "status": "preparing",
                        "date": (order_date + timedelta(hours=6)).isoformat(),
                        "description": "En cours de préparation",
                    },
                    {
                        "status": "shipped",
                        "date": (order_date + timedelta(days=1)).isoformat(),
                        "description": "Expédiée",
                    },
                ]
                + (
                    [
                        {
                            "status": "delivered",
                            "date": (order_date + timedelta(days=3)).isoformat(),
                            "description": "Livrée",
                        }
                    ]
                    if status == "delivered"
                    else []
                ),
                "paymentStatus": "paid",
                "createdAt": order_date,
                "updatedAt": order_date,
            }

            order_result = await db.orders.insert_one(order)

            # Create invoice
            invoice = {
                "invoiceNumber": f"INV-2026-{10001 + i}",
                "userId": user_id,
                "orderId": str(order_result.inserted_id),
                "items": order["items"],
                "subtotal": 37.98,
                "tax": 3.80,
                "total": 41.78,
                "status": "paid",
                "dueDate": order_date,
                "paidAt": order_date,
                "createdAt": order_date,
            }

            await db.invoices.insert_one(invoice)

        print(f"✅ 3 commandes et factures créées\n")

    # Create demo notification
    print("🔔 Création de notifications de démonstration...")
    notifications = [
        {
            "userId": user_id,
            "type": "delivery",
            "title": "Votre commande arrive demain ! 📦",
            "body": "Votre commande ESS-2026-10001 sera livrée demain entre 9h et 18h.",
            "isRead": False,
            "createdAt": now - timedelta(hours=12),
        },
        {
            "userId": user_id,
            "type": "subscription",
            "title": "Prochaine livraison dans 5 jours",
            "body": "Votre abonnement mensuel sera renouvelé le "
            + (now + timedelta(days=5)).strftime("%d/%m/%Y"),
            "isRead": False,
            "createdAt": now - timedelta(days=1),
        },
        {
            "userId": user_id,
            "type": "promo",
            "title": "🎁 Offre spéciale : -20%",
            "body": "Profitez de 20% de réduction sur tous les packs mensuels ce week-end !",
            "isRead": True,
            "createdAt": now - timedelta(days=3),
        },
    ]

    await db.notifications.insert_many(notifications)
    print(f"✅ {len(notifications)} notifications créées\n")

    # Create demo support ticket
    print("🎫 Création d'un ticket de support de démonstration...")
    ticket = {
        "ticketNumber": "TKT-2026-ABCD1",
        "userId": user_id,
        "subject": "Question sur la modification de mon abonnement",
        "category": "subscription",
        "priority": "medium",
        "status": "open",
        "messages": [
            {
                "sender": "customer",
                "message": "Bonjour, je souhaiterais passer mon abonnement de mensuel à bi-hebdomadaire. Comment puis-je faire ?",
                "createdAt": (now - timedelta(hours=2)).isoformat(),
            },
            {
                "sender": "support",
                "message": "Bonjour Sarah ! Vous pouvez modifier la fréquence de votre abonnement directement depuis l'application : Mes abonnements > Modifier. Nous restons à votre disposition si besoin.",
                "createdAt": (now - timedelta(hours=1)).isoformat(),
            },
        ],
        "assignedTo": None,
        "resolvedAt": None,
        "satisfactionRating": None,
        "createdAt": now - timedelta(hours=2),
        "updatedAt": now - timedelta(hours=1),
    }

    await db.support_tickets.insert_one(ticket)
    print(f"✅ Ticket de support créé\n")

    # Create indexes
    print("🔧 Création des index de base de données...")
    await db.users.create_index("email", unique=True)
    await db.products.create_index("categoryId")
    await db.products.create_index("brand")
    await db.orders.create_index("userId")
    await db.subscriptions.create_index("userId")
    await db.addresses.create_index("userId")
    print("✅ Index créés\n")

    print("=" * 60)
    print("🎉 BASE DE DONNÉES REMPLIE AVEC SUCCÈS !")
    print("=" * 60)
    print("\n📊 Résumé:")
    print(f"   • {len(categories)} catégories")
    print(f"   • {len(products)} produits")
    print(f"   • {len(offers)} offres promotionnelles")
    print(f"   • 1 utilisateur de démonstration")
    print(f"   • 1 adresse")
    print(f"   • 1 abonnement actif")
    print(f"   • 3 commandes")
    print(f"   • 3 factures")
    print(f"   • {len(notifications)} notifications")
    print(f"   • 1 ticket de support")
    print("\n🔑 Comptes de connexion:")
    print("   Admin:  admin@livrella.com / Admin2026!")
    print("   Demo:   sarah@example.com / password123")
    print("\n✅ Vous pouvez maintenant démarrer l'application!\n")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
