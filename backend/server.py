from dotenv import load_dotenv

load_dotenv()

import hashlib
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from middleware import (
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from validators import (
    sanitize_string,
    validate_email,
    validate_frequency,
    validate_password,
    validate_phone,
    validate_quantity,
    validate_zip_code,
)

ROOT_DIR = Path(__file__).parent

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger(__name__)

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"
APP_START_TIME = datetime.now(timezone.utc)

# ==================== DATABASE ====================
# DB_BACKEND=mongodb (default, Motor/MongoDB) | memory (embedded, dev/tests only)
DB_BACKEND = os.environ.get("DB_BACKEND", "mongodb").lower()

if DB_BACKEND == "memory":
    from mongomock_motor import AsyncMongoMockClient

    client = AsyncMongoMockClient()
    logger.warning(
        "DB_BACKEND=memory — using embedded in-memory database (dev/tests only, data is NOT persisted)"
    )
elif DB_BACKEND == "mongodb":
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        raise RuntimeError(
            "MONGO_URL environment variable must be set (or use DB_BACKEND=memory for dev)"
        )
    client = AsyncIOMotorClient(mongo_url)
else:
    raise RuntimeError(f"Unknown DB_BACKEND: {DB_BACKEND}. Use 'mongodb' or 'memory'.")

db = client[os.environ.get("DB_NAME", "livrella")]

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    if IS_PRODUCTION:
        raise RuntimeError("JWT_SECRET environment variable must be set in production")
    JWT_SECRET = "dev_only_secret_change_me"
    logger.warning("JWT_SECRET not set — using an insecure development fallback")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = int(os.environ.get("JWT_EXPIRY_DAYS", "30"))

# CORS — comma separated list of allowed origins ("*" allowed only outside production)
CORS_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()
]
if IS_PRODUCTION and "*" in CORS_ORIGINS:
    logger.warning("CORS_ORIGINS='*' is insecure in production — set explicit origins")

RATE_LIMIT_PER_MINUTE = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "240"))

# Stripe (optional — orders fall back to demo mode without keys)
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
STRIPE_ENABLED = STRIPE_SECRET_KEY.startswith("sk_") and "your" not in STRIPE_SECRET_KEY
if STRIPE_ENABLED:
    try:
        import stripe

        stripe.api_key = STRIPE_SECRET_KEY
        logger.info("Stripe payments enabled")
    except ImportError:
        STRIPE_ENABLED = False
        logger.warning(
            "STRIPE_SECRET_KEY set but 'stripe' package not installed — demo payment mode kept"
        )

SEED_DEMO_DATA = os.environ.get(
    "SEED_DEMO_DATA", "" if IS_PRODUCTION else "true"
).lower() in ("1", "true", "yes")

app = FastAPI(title="Livrella API", version="1.1.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== HELPERS ====================


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def serialize_doc(doc) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [
                (
                    serialize_doc(i)
                    if isinstance(i, dict)
                    else (str(i) if isinstance(i, ObjectId) else i)
                )
                for i in value
            ]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


# ==================== AUTH DEPENDENCIES ====================


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        user.pop("password_hash", None)
        return serialize_doc(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide")


async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis")
    return current_user


# ==================== PYDANTIC MODELS ====================


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    phone: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


class AddressCreate(BaseModel):
    label: str
    firstName: str
    lastName: str
    street: str
    city: str
    zipCode: str
    country: str = "France"
    phone: Optional[str] = None
    isDefault: bool = False


class ProductCreate(BaseModel):
    name: str
    description: str
    shortDescription: Optional[str] = None
    categoryId: str
    brand: str
    price: float
    subscriptionPrice: float
    unit: str = "paquet"
    quantity: int = 1
    inStock: bool = True
    stockCount: int = 100
    isActive: bool = True
    isFeatured: bool = False
    isNewArrival: bool = False
    isBestSeller: bool = False
    tags: List[str] = []
    availableFrequencies: List[str] = ["weekly", "biweekly", "monthly"]
    rating: float = 4.5
    reviewCount: int = 0
    images: List[str] = []


class CategoryCreate(BaseModel):
    name: str
    nameEn: Optional[str] = None
    slug: str
    description: Optional[str] = None
    icon: str
    color: str
    isActive: bool = True
    order: int = 0


class SubscriptionCreate(BaseModel):
    productId: str
    addressId: str
    frequency: str
    quantity: int = 1


class SubscriptionUpdate(BaseModel):
    frequency: Optional[str] = None
    quantity: Optional[int] = None
    addressId: Optional[str] = None


class OrderCreateItem(BaseModel):
    # Prices are ALWAYS computed server-side from the catalog — client only
    # sends which product and how many.
    productId: str
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderCreateItem]
    addressId: str
    notes: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    newPassword: str


class DeleteAccountRequest(BaseModel):
    password: str


class TicketCreate(BaseModel):
    subject: str
    category: str
    message: str
    priority: str = "medium"


class TicketMessage(BaseModel):
    message: str


class OfferCreate(BaseModel):
    title: str
    titleEn: Optional[str] = None
    description: str
    descriptionEn: Optional[str] = None
    discount: float
    badgeText: Optional[str] = None
    color: str = "#FFCAD4"
    isActive: bool = True
    order: int = 0


# ==================== AUTH ENDPOINTS ====================


@api_router.post("/auth/register")
async def register(body: RegisterRequest):
    email = validate_email(body.email.strip())
    validate_password(body.password)
    if body.phone:
        validate_phone(body.phone)
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "firstName": body.firstName,
        "lastName": body.lastName,
        "phone": body.phone or "",
        "role": "customer",
        "isActive": True,
        "createdAt": now,
        "updatedAt": now,
        "preferences": {"notifications": True, "newsletter": True, "language": "fr"},
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id, email, "customer")
    user_doc["_id"] = result.inserted_id
    user_doc.pop("password_hash")
    await db.notifications.insert_one(
        {
            "userId": user_id,
            "type": "system",
            "title": "Bienvenue chez Livrella ! 🌸",
            "body": "Votre compte est créé. Découvrez nos produits et abonnez-vous pour ne plus jamais manquer d'essentiels.",
            "isRead": False,
            "createdAt": now,
        }
    )
    return {"token": token, "user": serialize_doc(user_doc)}


@api_router.post("/auth/login")
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not user.get("isActive", True):
        raise HTTPException(status_code=403, detail="Compte désactivé")
    token = create_token(str(user["_id"]), email, user.get("role", "customer"))
    user.pop("password_hash", None)
    return {"token": token, "user": serialize_doc(user)}


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@api_router.put("/auth/me")
async def update_me(
    body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    update_data["updatedAt"] = datetime.now(timezone.utc)
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])}, {"$set": update_data}
    )
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    user.pop("password_hash", None)
    return serialize_doc(user)


@api_router.put("/auth/me/password")
async def change_password(
    body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)
):
    validate_password(body.newPassword)
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not verify_password(body.currentPassword, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {
            "$set": {
                "password_hash": hash_password(body.newPassword),
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )
    return {"message": "Mot de passe modifié"}


class ForgotPasswordRequest(BaseModel):
    email: str


def _hash_reset_code(code: str) -> str:
    return hashlib.sha256(f"{code}{JWT_SECRET}".encode("utf-8")).hexdigest()


@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    # Always return success to avoid user enumeration
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        code = f"{secrets.randbelow(900000) + 100000}"
        now = datetime.now(timezone.utc)
        await db.password_resets.delete_many({"userId": str(user["_id"])})
        await db.password_resets.insert_one(
            {
                "userId": str(user["_id"]),
                "email": email,
                "codeHash": _hash_reset_code(code),
                "expiresAt": now + timedelta(minutes=30),
                "createdAt": now,
            }
        )
        # TODO: send the code by email when an SMTP provider is configured.
        logger.info(f"Password reset code generated for {email} (expires in 30 min)")
        if not IS_PRODUCTION:
            # Development convenience: expose the code so the flow can be tested
            return {
                "message": "Si ce compte existe, un code vous a été envoyé",
                "devCode": code,
            }
    return {"message": "Si ce compte existe, un code vous a été envoyé"}


@api_router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    email = body.email.lower().strip()
    validate_password(body.newPassword)
    now = datetime.now(timezone.utc)
    entry = await db.password_resets.find_one(
        {"email": email, "codeHash": _hash_reset_code(body.code.strip())}
    )
    expiry = entry.get("expiresAt") if entry else None
    if isinstance(expiry, datetime) and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if not entry or not expiry or expiry < now:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")
    await db.users.update_one(
        {"_id": ObjectId(entry["userId"])},
        {"$set": {"password_hash": hash_password(body.newPassword), "updatedAt": now}},
    )
    await db.password_resets.delete_many({"userId": entry["userId"]})
    return {"message": "Mot de passe réinitialisé avec succès"}


@api_router.delete("/auth/me")
async def delete_account(
    body: DeleteAccountRequest, current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")
    user_id = current_user["id"]
    # Personal data removal (GDPR). Orders & invoices are anonymized but kept
    # for accounting/legal retention requirements.
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.addresses.delete_many({"userId": user_id})
    await db.subscriptions.delete_many({"userId": user_id})
    await db.notifications.delete_many({"userId": user_id})
    await db.support_tickets.delete_many({"userId": user_id})
    await db.password_resets.delete_many({"userId": user_id})
    await db.orders.update_many(
        {"userId": user_id}, {"$set": {"userId": "deleted_user"}}
    )
    await db.invoices.update_many(
        {"userId": user_id}, {"$set": {"userId": "deleted_user"}}
    )
    return {"message": "Compte supprimé définitivement"}


# ==================== CATEGORIES ====================


@api_router.get("/categories")
async def get_categories():
    cats = await db.categories.find({"isActive": True}).sort("order", 1).to_list(100)
    return [serialize_doc(c) for c in cats]


@api_router.post("/categories")
async def create_category(body: CategoryCreate, admin=Depends(get_admin_user)):
    doc = body.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)
    result = await db.categories.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@api_router.put("/categories/{cat_id}")
async def update_category(
    cat_id: str, body: CategoryCreate, admin=Depends(get_admin_user)
):
    doc = body.model_dump()
    doc["updatedAt"] = datetime.now(timezone.utc)
    await db.categories.update_one({"_id": ObjectId(cat_id)}, {"$set": doc})
    cat = await db.categories.find_one({"_id": ObjectId(cat_id)})
    return serialize_doc(cat)


@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, admin=Depends(get_admin_user)):
    await db.categories.update_one(
        {"_id": ObjectId(cat_id)}, {"$set": {"isActive": False}}
    )
    return {"message": "Catégorie supprimée"}


# ==================== PRODUCTS ====================


@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
):
    query = {"isActive": True}
    if category:
        cat = await db.categories.find_one({"slug": category})
        if cat:
            query["categoryId"] = str(cat["_id"])
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}},
        ]
    if featured is not None:
        query["isFeatured"] = featured
    sort_option = [("createdAt", -1)]
    if sort == "price_asc":
        sort_option = [("price", 1)]
    elif sort == "price_desc":
        sort_option = [("price", -1)]
    elif sort == "rating":
        sort_option = [("rating", -1)]
    products = (
        await db.products.find(query)
        .sort(sort_option)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    total = await db.products.count_documents(query)
    return {"products": [serialize_doc(p) for p in products], "total": total}


@api_router.get("/products/featured")
async def get_featured_products():
    products = (
        await db.products.find({"isActive": True, "isFeatured": True})
        .limit(10)
        .to_list(10)
    )
    return [serialize_doc(p) for p in products]


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    try:
        product = await db.products.find_one(
            {"_id": ObjectId(product_id), "isActive": True}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return serialize_doc(product)


@api_router.post("/products")
async def create_product(body: ProductCreate, admin=Depends(get_admin_user)):
    doc = body.model_dump()
    doc["discountPercentage"] = (
        round((1 - body.subscriptionPrice / body.price) * 100) if body.price > 0 else 0
    )
    doc["createdAt"] = datetime.now(timezone.utc)
    doc["updatedAt"] = datetime.now(timezone.utc)
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@api_router.put("/products/{product_id}")
async def update_product(
    product_id: str, body: ProductCreate, admin=Depends(get_admin_user)
):
    doc = body.model_dump()
    doc["discountPercentage"] = (
        round((1 - body.subscriptionPrice / body.price) * 100) if body.price > 0 else 0
    )
    doc["updatedAt"] = datetime.now(timezone.utc)
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": doc})
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_doc(product)


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_admin_user)):
    await db.products.update_one(
        {"_id": ObjectId(product_id)}, {"$set": {"isActive": False}}
    )
    return {"message": "Produit désactivé"}


@api_router.put("/products/{product_id}/toggle")
async def toggle_product(product_id: str, admin=Depends(get_admin_user)):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    new_status = not product.get("isActive", True)
    await db.products.update_one(
        {"_id": ObjectId(product_id)}, {"$set": {"isActive": new_status}}
    )
    return {"isActive": new_status}


# ==================== ADDRESSES ====================


async def _get_owned_address(address_id: str, user_id: str) -> dict:
    try:
        address = await db.addresses.find_one(
            {"_id": ObjectId(address_id), "userId": user_id}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID d'adresse invalide")
    if not address:
        raise HTTPException(status_code=404, detail="Adresse introuvable")
    return address


@api_router.get("/addresses")
async def get_addresses(current_user: dict = Depends(get_current_user)):
    addresses = await db.addresses.find({"userId": current_user["id"]}).to_list(20)
    return [serialize_doc(a) for a in addresses]


def _validated_address_doc(body: AddressCreate, user_id: str) -> dict:
    validate_zip_code(body.zipCode, body.country)
    if body.phone:
        validate_phone(body.phone)
    doc = body.model_dump()
    doc["label"] = sanitize_string(doc["label"], 60)
    doc["firstName"] = sanitize_string(doc["firstName"], 60)
    doc["lastName"] = sanitize_string(doc["lastName"], 60)
    doc["street"] = sanitize_string(doc["street"], 200)
    doc["city"] = sanitize_string(doc["city"], 100)
    doc["userId"] = user_id
    return doc


@api_router.post("/addresses")
async def create_address(
    body: AddressCreate, current_user: dict = Depends(get_current_user)
):
    if body.isDefault:
        await db.addresses.update_many(
            {"userId": current_user["id"]}, {"$set": {"isDefault": False}}
        )
    doc = _validated_address_doc(body, current_user["id"])
    # First address automatically becomes the default one
    if await db.addresses.count_documents({"userId": current_user["id"]}) == 0:
        doc["isDefault"] = True
    doc["createdAt"] = datetime.now(timezone.utc)
    result = await db.addresses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@api_router.put("/addresses/{address_id}")
async def update_address(
    address_id: str, body: AddressCreate, current_user: dict = Depends(get_current_user)
):
    await _get_owned_address(address_id, current_user["id"])
    if body.isDefault:
        await db.addresses.update_many(
            {"userId": current_user["id"]}, {"$set": {"isDefault": False}}
        )
    doc = _validated_address_doc(body, current_user["id"])
    await db.addresses.update_one(
        {"_id": ObjectId(address_id), "userId": current_user["id"]}, {"$set": doc}
    )
    address = await db.addresses.find_one({"_id": ObjectId(address_id)})
    return serialize_doc(address)


@api_router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: str, current_user: dict = Depends(get_current_user)
):
    await db.addresses.delete_one(
        {"_id": ObjectId(address_id), "userId": current_user["id"]}
    )
    return {"message": "Adresse supprimée"}


@api_router.put("/addresses/{address_id}/default")
async def set_default_address(
    address_id: str, current_user: dict = Depends(get_current_user)
):
    await db.addresses.update_many(
        {"userId": current_user["id"]}, {"$set": {"isDefault": False}}
    )
    await db.addresses.update_one(
        {"_id": ObjectId(address_id), "userId": current_user["id"]},
        {"$set": {"isDefault": True}},
    )
    return {"message": "Adresse par défaut mise à jour"}


# ==================== SUBSCRIPTIONS ====================


@api_router.get("/subscriptions")
async def get_subscriptions(current_user: dict = Depends(get_current_user)):
    subs = (
        await db.subscriptions.find({"userId": current_user["id"]})
        .sort("createdAt", -1)
        .to_list(100)
    )
    result = []
    for sub in subs:
        sub_data = serialize_doc(sub)
        if sub.get("productId"):
            try:
                product = await db.products.find_one(
                    {"_id": ObjectId(sub["productId"])}
                )
                if product:
                    sub_data["product"] = serialize_doc(product)
            except Exception:
                pass
        result.append(sub_data)
    return result


@api_router.get("/subscriptions/{sub_id}")
async def get_subscription(sub_id: str, current_user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one(
        {"_id": ObjectId(sub_id), "userId": current_user["id"]}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement introuvable")
    sub_data = serialize_doc(sub)
    if sub.get("productId"):
        product = await db.products.find_one({"_id": ObjectId(sub["productId"])})
        if product:
            sub_data["product"] = serialize_doc(product)
    return sub_data


FREQ_DAYS = {"weekly": 7, "biweekly": 14, "monthly": 30}


async def _decrement_stock(product_id: str, quantity: int) -> dict:
    """Atomically reserve stock. Returns the product or raises."""
    try:
        product = await db.products.find_one_and_update(
            {
                "_id": ObjectId(product_id),
                "isActive": True,
                "stockCount": {"$gte": quantity},
            },
            {"$inc": {"stockCount": -quantity}},
            return_document=True,
        )
    except HTTPException:
        raise
    except Exception:
        product = None
    if not product:
        existing = await db.products.find_one(
            {"_id": ObjectId(product_id), "isActive": True}
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Produit introuvable")
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuffisant pour « {existing.get('name')} » ({existing.get('stockCount', 0)} restant)",
        )
    if product.get("stockCount", 0) <= 0:
        await db.products.update_one(
            {"_id": product["_id"]}, {"$set": {"inStock": False}}
        )
    return product


async def _restore_stock(reserved: list):
    """Roll back stock reservations when an order fails."""
    for product_id, quantity in reserved:
        try:
            updated = await db.products.find_one_and_update(
                {"_id": ObjectId(product_id)},
                {"$inc": {"stockCount": quantity}},
                return_document=True,
            )
            if updated and updated.get("stockCount", 0) > 0:
                await db.products.update_one(
                    {"_id": ObjectId(product_id)}, {"$set": {"inStock": True}}
                )
        except Exception:
            logger.error(f"Failed to restore stock for product {product_id}")


@api_router.post("/subscriptions")
async def create_subscription(
    body: SubscriptionCreate, current_user: dict = Depends(get_current_user)
):
    freq_days = FREQ_DAYS
    validate_frequency(body.frequency)
    validate_quantity(body.quantity)
    await _get_owned_address(body.addressId, current_user["id"])
    product = await _decrement_stock(body.productId, body.quantity)
    now = datetime.now(timezone.utc)
    next_delivery = now + timedelta(days=freq_days[body.frequency])
    unit_price = product.get("subscriptionPrice", product.get("price", 0))
    doc = {
        "userId": current_user["id"],
        "productId": body.productId,
        "addressId": body.addressId,
        "status": "active",
        "frequency": body.frequency,
        "quantity": body.quantity,
        "unitPrice": unit_price,
        "totalPrice": unit_price * body.quantity,
        "startDate": now,
        "nextDeliveryDate": next_delivery,
        "lastDeliveryDate": None,
        "autoRenew": True,
        "deliveryCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db.subscriptions.insert_one(doc)
    # Create first order automatically
    order_num = f"ESS-{now.year}-{str(result.inserted_id)[-5:].upper()}"
    inv_num = f"INV-{now.year}-{str(result.inserted_id)[-5:].upper()}"
    total = unit_price * body.quantity
    order_doc = {
        "orderNumber": order_num,
        "userId": current_user["id"],
        "subscriptionId": str(result.inserted_id),
        "addressId": body.addressId,
        "items": [
            {
                "productId": body.productId,
                "productName": product["name"],
                "quantity": body.quantity,
                "unitPrice": unit_price,
                "totalPrice": total,
            }
        ],
        "subtotal": total,
        "deliveryFee": 0,
        "discount": 0,
        "total": total,
        "status": "confirmed",
        "trackingNumber": None,
        "estimatedDelivery": next_delivery,
        "timeline": [
            {
                "status": "confirmed",
                "date": now.isoformat(),
                "description": "Commande confirmée",
            }
        ],
        "paymentStatus": "paid",
        "createdAt": now,
        "updatedAt": now,
    }
    order_result = await db.orders.insert_one(order_doc)
    await db.invoices.insert_one(
        {
            "invoiceNumber": inv_num,
            "userId": current_user["id"],
            "orderId": str(order_result.inserted_id),
            "items": order_doc["items"],
            "subtotal": total,
            "tax": round(total * 0.1, 2),
            "total": round(total * 1.1, 2),
            "status": "paid",
            "dueDate": now,
            "paidAt": now,
            "createdAt": now,
        }
    )
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@api_router.put("/subscriptions/{sub_id}")
async def update_subscription(
    sub_id: str,
    body: SubscriptionUpdate,
    current_user: dict = Depends(get_current_user),
):
    sub_check = await db.subscriptions.find_one(
        {"_id": ObjectId(sub_id), "userId": current_user["id"]}
    )
    if not sub_check:
        raise HTTPException(status_code=404, detail="Abonnement introuvable")
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "frequency" in update:
        validate_frequency(update["frequency"])
        freq_days = FREQ_DAYS
        update["nextDeliveryDate"] = datetime.now(timezone.utc) + timedelta(
            days=freq_days[update["frequency"]]
        )
    if "quantity" in update:
        validate_quantity(update["quantity"])
        update["totalPrice"] = sub_check.get("unitPrice", 0) * update["quantity"]
    if "addressId" in update:
        await _get_owned_address(update["addressId"], current_user["id"])
    update["updatedAt"] = datetime.now(timezone.utc)
    await db.subscriptions.update_one(
        {"_id": ObjectId(sub_id), "userId": current_user["id"]}, {"$set": update}
    )
    sub = await db.subscriptions.find_one({"_id": ObjectId(sub_id)})
    return serialize_doc(sub)


@api_router.post("/subscriptions/{sub_id}/pause")
async def pause_subscription(
    sub_id: str, current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    await db.subscriptions.update_one(
        {"_id": ObjectId(sub_id), "userId": current_user["id"]},
        {"$set": {"status": "paused", "pausedAt": now, "updatedAt": now}},
    )
    sub = await db.subscriptions.find_one({"_id": ObjectId(sub_id)})
    return serialize_doc(sub)


@api_router.post("/subscriptions/{sub_id}/resume")
async def resume_subscription(
    sub_id: str, current_user: dict = Depends(get_current_user)
):
    sub = await db.subscriptions.find_one({"_id": ObjectId(sub_id)})
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement introuvable")
    freq_days = {"weekly": 7, "biweekly": 14, "monthly": 30}
    now = datetime.now(timezone.utc)
    next_delivery = now + timedelta(
        days=freq_days.get(sub.get("frequency", "monthly"), 30)
    )
    await db.subscriptions.update_one(
        {"_id": ObjectId(sub_id), "userId": current_user["id"]},
        {
            "$set": {
                "status": "active",
                "nextDeliveryDate": next_delivery,
                "pausedAt": None,
                "updatedAt": now,
            }
        },
    )
    sub = await db.subscriptions.find_one({"_id": ObjectId(sub_id)})
    return serialize_doc(sub)


@api_router.delete("/subscriptions/{sub_id}")
async def cancel_subscription(
    sub_id: str, current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    await db.subscriptions.update_one(
        {"_id": ObjectId(sub_id), "userId": current_user["id"]},
        {"$set": {"status": "cancelled", "cancelledAt": now, "updatedAt": now}},
    )
    return {"message": "Abonnement annulé"}


# ==================== ORDERS ====================


@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = (
        await db.orders.find({"userId": current_user["id"]})
        .sort("createdAt", -1)
        .to_list(100)
    )
    return [serialize_doc(o) for o in orders]


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        order = await db.orders.find_one(
            {"_id": ObjectId(order_id), "userId": current_user["id"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalide")
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return serialize_doc(order)


@api_router.post("/orders")
async def create_order(
    body: OrderCreate, current_user: dict = Depends(get_current_user)
):
    if not body.items:
        raise HTTPException(status_code=400, detail="Le panier est vide")
    await _get_owned_address(body.addressId, current_user["id"])
    # Prices are computed from the catalog — never trusted from the client.
    items = []
    reserved = []
    try:
        for req in body.items:
            validate_quantity(req.quantity)
            product = await _decrement_stock(req.productId, req.quantity)
            reserved.append((req.productId, req.quantity))
            unit_price = round(float(product.get("price", 0)), 2)
            items.append(
                {
                    "productId": str(product["_id"]),
                    "productName": product.get("name", ""),
                    "quantity": req.quantity,
                    "unitPrice": unit_price,
                    "totalPrice": round(unit_price * req.quantity, 2),
                }
            )
    except HTTPException:
        await _restore_stock(reserved)
        raise
    except Exception:
        await _restore_stock(reserved)
        raise HTTPException(status_code=400, detail="Commande invalide")
    now = datetime.now(timezone.utc)
    total = round(sum(i["totalPrice"] for i in items), 2)
    order_num = f"ESS-{now.year}-{str(uuid.uuid4())[:5].upper()}"
    doc = {
        "orderNumber": order_num,
        "userId": current_user["id"],
        "subscriptionId": None,
        "addressId": body.addressId,
        "items": items,
        "subtotal": total,
        "deliveryFee": 0,
        "discount": 0,
        "total": total,
        "status": "confirmed",
        "trackingNumber": None,
        "estimatedDelivery": now + timedelta(days=3),
        "timeline": [
            {
                "status": "confirmed",
                "date": now.isoformat(),
                "description": "Commande confirmée",
            }
        ],
        "paymentStatus": "paid" if not STRIPE_ENABLED else "pending",
        "paymentMode": "stripe" if STRIPE_ENABLED else "demo",
        "notes": sanitize_string(body.notes, 300) if body.notes else None,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db.orders.insert_one(doc)
    doc["_id"] = result.inserted_id
    await db.invoices.insert_one(
        {
            "invoiceNumber": f"INV-{now.year}-{str(result.inserted_id)[-5:].upper()}",
            "userId": current_user["id"],
            "orderId": str(result.inserted_id),
            "items": items,
            "subtotal": total,
            "tax": round(total * 0.1, 2),
            "total": round(total * 1.1, 2),
            "status": "paid",
            "dueDate": now,
            "paidAt": now,
            "createdAt": now,
        }
    )
    await db.notifications.insert_one(
        {
            "userId": current_user["id"],
            "type": "delivery",
            "title": "Commande confirmée ✓",
            "body": f"Votre commande {order_num} ({total:.2f} €) est confirmée. Livraison estimée sous 3 jours.",
            "isRead": False,
            "createdAt": now,
        }
    )
    return serialize_doc(doc)


# ==================== INVOICES ====================


@api_router.get("/invoices")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    invoices = (
        await db.invoices.find({"userId": current_user["id"]})
        .sort("createdAt", -1)
        .to_list(100)
    )
    return [serialize_doc(inv) for inv in invoices]


@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one(
        {"_id": ObjectId(invoice_id), "userId": current_user["id"]}
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return serialize_doc(inv)


# ==================== PAYMENTS ====================


@api_router.get("/payments/config")
async def payment_config():
    """Public payment capabilities — lets the app pick demo vs Stripe checkout."""
    return {
        "mode": "stripe" if STRIPE_ENABLED else "demo",
        "currency": "eur",
    }


class PaymentIntentCreate(BaseModel):
    items: List[OrderCreateItem]


@api_router.post("/payments/create-intent")
async def create_payment_intent(
    body: PaymentIntentCreate, current_user: dict = Depends(get_current_user)
):
    """Create a Stripe PaymentIntent with an amount computed server-side."""
    if not STRIPE_ENABLED:
        raise HTTPException(
            status_code=400, detail="Paiement Stripe non configuré sur le serveur"
        )
    if not body.items:
        raise HTTPException(status_code=400, detail="Le panier est vide")
    total = 0.0
    for req in body.items:
        validate_quantity(req.quantity)
        product = await db.products.find_one(
            {"_id": ObjectId(req.productId), "isActive": True}
        )
        if not product:
            raise HTTPException(status_code=404, detail="Produit introuvable")
        total += float(product.get("price", 0)) * req.quantity
    amount_cents = int(round(total * 100))
    if amount_cents < 50:
        raise HTTPException(status_code=400, detail="Montant trop faible")
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="eur",
        metadata={"userId": current_user["id"]},
        automatic_payment_methods={"enabled": True},
    )
    return {
        "clientSecret": intent["client_secret"],
        "amount": amount_cents,
        "currency": "eur",
    }


# ==================== NOTIFICATIONS ====================


@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifs = (
        await db.notifications.find({"userId": current_user["id"]})
        .sort("createdAt", -1)
        .to_list(50)
    )
    return [serialize_doc(n) for n in notifs]


@api_router.put("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"_id": ObjectId(notif_id), "userId": current_user["id"]},
        {"$set": {"isRead": True}},
    )
    return {"message": "Lu"}


@api_router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"userId": current_user["id"]}, {"$set": {"isRead": True}}
    )
    return {"message": "Tout marqué comme lu"}


# ==================== SUPPORT ====================


@api_router.get("/support/faq")
async def get_faq():
    return [
        {
            "id": "1",
            "question": "Comment modifier ma livraison ?",
            "questionEn": "How to modify my delivery?",
            "answer": "Rendez-vous dans 'Mes abonnements' et appuyez sur 'Modifier' pour changer la fréquence, quantité ou adresse.",
            "answerEn": "Go to 'My Subscriptions' and tap 'Modify' to change frequency, quantity or address.",
            "category": "delivery",
        },
        {
            "id": "2",
            "question": "Comment mettre en pause mon abonnement ?",
            "questionEn": "How to pause my subscription?",
            "answer": "Dans 'Mes abonnements', appuyez sur l'abonnement puis sur 'Mettre en pause'. Vous pouvez reprendre à tout moment.",
            "answerEn": "In 'My Subscriptions', tap the subscription then 'Pause'. You can resume at any time.",
            "category": "subscription",
        },
        {
            "id": "3",
            "question": "Puis-je annuler mon abonnement ?",
            "questionEn": "Can I cancel my subscription?",
            "answer": "Oui, annulation gratuite à tout moment depuis 'Mes abonnements'. Aucun frais d'annulation.",
            "answerEn": "Yes, free cancellation at any time from 'My Subscriptions'. No cancellation fees.",
            "category": "subscription",
        },
        {
            "id": "4",
            "question": "Ma commande n'est pas arrivée",
            "questionEn": "My order hasn't arrived",
            "answer": "Consultez d'abord le suivi de commande. Si le délai est dépassé de plus de 2 jours, créez un ticket support.",
            "answerEn": "First check order tracking. If delayed by more than 2 days, create a support ticket.",
            "category": "delivery",
        },
        {
            "id": "5",
            "question": "Comment me faire rembourser ?",
            "questionEn": "How to get a refund?",
            "answer": "Contactez notre support avec votre numéro de commande. Remboursements traités en 3-5 jours ouvrés.",
            "answerEn": "Contact support with your order number. Refunds processed in 3-5 business days.",
            "category": "payment",
        },
        {
            "id": "6",
            "question": "Livraison gratuite ?",
            "questionEn": "Free delivery?",
            "answer": "Oui ! La livraison est gratuite sur tous les abonnements. Pas de frais cachés.",
            "answerEn": "Yes! Free delivery on all subscriptions. No hidden fees.",
            "category": "delivery",
        },
    ]


@api_router.get("/support/tickets")
async def get_tickets(current_user: dict = Depends(get_current_user)):
    tickets = (
        await db.support_tickets.find({"userId": current_user["id"]})
        .sort("createdAt", -1)
        .to_list(50)
    )
    return [serialize_doc(t) for t in tickets]


@api_router.get("/support/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.support_tickets.find_one(
        {"_id": ObjectId(ticket_id), "userId": current_user["id"]}
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    return serialize_doc(ticket)


@api_router.post("/support/tickets")
async def create_ticket(
    body: TicketCreate, current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    ticket_num = f"TKT-{now.year}-{str(uuid.uuid4())[:5].upper()}"
    doc = {
        "ticketNumber": ticket_num,
        "userId": current_user["id"],
        "subject": body.subject,
        "category": body.category,
        "priority": body.priority,
        "status": "open",
        "messages": [
            {
                "sender": "customer",
                "message": body.message,
                "createdAt": now.isoformat(),
            }
        ],
        "assignedTo": None,
        "resolvedAt": None,
        "satisfactionRating": None,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db.support_tickets.insert_one(doc)
    await db.notifications.insert_one(
        {
            "userId": current_user["id"],
            "type": "support",
            "title": "Ticket créé ✓",
            "body": f"Votre demande #{ticket_num} a été enregistrée. Notre équipe vous répond sous 24h.",
            "isRead": False,
            "createdAt": now,
        }
    )
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@api_router.post("/support/tickets/{ticket_id}/messages")
async def add_message(
    ticket_id: str, body: TicketMessage, current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    msg = {"sender": "customer", "message": body.message, "createdAt": now.isoformat()}
    await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id), "userId": current_user["id"]},
        {"$push": {"messages": msg}, "$set": {"updatedAt": now, "status": "open"}},
    )
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
    return serialize_doc(ticket)


@api_router.put("/support/tickets/{ticket_id}/close")
async def close_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id), "userId": current_user["id"]},
        {"$set": {"status": "closed", "resolvedAt": now.isoformat(), "updatedAt": now}},
    )
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
    return serialize_doc(ticket)


@api_router.put("/support/tickets/{ticket_id}/rate")
async def rate_ticket(
    ticket_id: str,
    rating: int = Query(..., ge=1, le=5),
    current_user: dict = Depends(get_current_user),
):
    await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id), "userId": current_user["id"]},
        {"$set": {"satisfactionRating": rating}},
    )
    return {"message": "Merci pour votre retour !"}


# ==================== OFFERS ====================


@api_router.get("/offers")
async def get_offers():
    offers = await db.offers.find({"isActive": True}).sort("order", 1).to_list(20)
    return [serialize_doc(o) for o in offers]


# ==================== ADMIN ====================


@api_router.get("/admin/dashboard")
async def admin_dashboard(admin=Depends(get_admin_user)):
    users_count = await db.users.count_documents({"role": "customer"})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    orders_count = await db.orders.count_documents({})
    open_tickets = await db.support_tickets.count_documents(
        {"status": {"$in": ["open", "in_progress"]}}
    )
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    revenue = rev[0]["total"] if rev else 0
    return {
        "usersCount": users_count,
        "activeSubscriptions": active_subs,
        "ordersCount": orders_count,
        "openTickets": open_tickets,
        "totalRevenue": revenue,
    }


@api_router.get("/admin/products")
async def admin_get_products(admin=Depends(get_admin_user)):
    """All products including inactive ones, for admin management."""
    products = await db.products.find({}).sort("createdAt", -1).to_list(500)
    return {"products": [serialize_doc(p) for p in products], "total": len(products)}


@api_router.get("/admin/users")
async def admin_get_users(admin=Depends(get_admin_user)):
    users = await db.users.find({}).sort("createdAt", -1).to_list(500)
    for u in users:
        u.pop("password_hash", None)
    return [serialize_doc(u) for u in users]


@api_router.put("/admin/users/{user_id}/toggle")
async def admin_toggle_user(user_id: str, admin=Depends(get_admin_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    new_status = not user.get("isActive", True)
    await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"isActive": new_status}}
    )
    return {"isActive": new_status}


@api_router.get("/admin/orders")
async def admin_get_orders(admin=Depends(get_admin_user)):
    orders = await db.orders.find({}).sort("createdAt", -1).to_list(500)
    return [serialize_doc(o) for o in orders]


class OrderStatusUpdate(BaseModel):
    status: str


@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str, body: OrderStatusUpdate, admin=Depends(get_admin_user)
):
    allowed_statuses = {"confirmed", "preparing", "shipped", "delivered", "cancelled"}
    if body.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Statut invalide")
    status = body.status
    now = datetime.now(timezone.utc)
    status_labels = {
        "confirmed": "Commande confirmée",
        "preparing": "En cours de préparation",
        "shipped": "Expédiée",
        "delivered": "Livrée",
        "cancelled": "Annulée",
    }
    entry = {
        "status": status,
        "date": now.isoformat(),
        "description": status_labels.get(status, status),
    }
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    update_fields = {"status": status, "updatedAt": now}
    if status == "delivered":
        update_fields["deliveredAt"] = now
    if status == "shipped" and not order.get("trackingNumber"):
        update_fields["trackingNumber"] = f"FR{secrets.randbelow(10**10):010d}"
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_fields, "$push": {"timeline": entry}},
    )
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if order and order.get("userId") and order["userId"] != "deleted_user":
        await db.notifications.insert_one(
            {
                "userId": order["userId"],
                "type": "delivery",
                "title": f"Commande {order.get('orderNumber', '')} : {status_labels.get(status, status)}",
                "body": f"Le statut de votre commande est passé à « {status_labels.get(status, status)} ».",
                "isRead": False,
                "createdAt": now,
            }
        )
    return serialize_doc(order)


@api_router.get("/admin/subscriptions")
async def admin_get_subscriptions(admin=Depends(get_admin_user)):
    subs = await db.subscriptions.find({}).sort("createdAt", -1).to_list(500)
    return [serialize_doc(s) for s in subs]


@api_router.get("/admin/tickets")
async def admin_get_tickets(admin=Depends(get_admin_user)):
    tickets = await db.support_tickets.find({}).sort("createdAt", -1).to_list(500)
    return [serialize_doc(t) for t in tickets]


@api_router.post("/admin/tickets/{ticket_id}/reply")
async def admin_reply_ticket(
    ticket_id: str, body: TicketMessage, admin=Depends(get_admin_user)
):
    now = datetime.now(timezone.utc)
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    msg = {"sender": "support", "message": body.message, "createdAt": now.isoformat()}
    await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$push": {"messages": msg},
            "$set": {"updatedAt": now, "status": "in_progress"},
        },
    )
    await db.notifications.insert_one(
        {
            "userId": ticket["userId"],
            "type": "support",
            "title": "Réponse de notre équipe",
            "body": f"Nous avons répondu à votre ticket #{ticket.get('ticketNumber', '')}",
            "isRead": False,
            "createdAt": now,
        }
    )
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id)})
    return serialize_doc(ticket)


class BroadcastRequest(BaseModel):
    title: str
    body: str


@api_router.post("/admin/notifications/broadcast")
async def admin_broadcast(req: BroadcastRequest, admin=Depends(get_admin_user)):
    users = await db.users.find({"role": "customer", "isActive": True}).to_list(1000)
    now = datetime.now(timezone.utc)
    notifs = [
        {
            "userId": str(u["_id"]),
            "type": "system",
            "title": req.title,
            "body": req.body,
            "isRead": False,
            "createdAt": now,
        }
        for u in users
    ]
    if notifs:
        await db.notifications.insert_many(notifs)
    return {"sent": len(notifs)}


@api_router.post("/admin/offers")
async def admin_create_offer(body: OfferCreate, admin=Depends(get_admin_user)):
    doc = body.model_dump()
    doc["createdAt"] = datetime.now(timezone.utc)
    result = await db.offers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@api_router.put("/admin/offers/{offer_id}")
async def admin_update_offer(
    offer_id: str, body: OfferCreate, admin=Depends(get_admin_user)
):
    doc = body.model_dump()
    doc["updatedAt"] = datetime.now(timezone.utc)
    await db.offers.update_one({"_id": ObjectId(offer_id)}, {"$set": doc})
    offer = await db.offers.find_one({"_id": ObjectId(offer_id)})
    return serialize_doc(offer)


@api_router.delete("/admin/offers/{offer_id}")
async def admin_delete_offer(offer_id: str, admin=Depends(get_admin_user)):
    await db.offers.update_one(
        {"_id": ObjectId(offer_id)}, {"$set": {"isActive": False}}
    )
    return {"message": "Offre supprimée"}


# ==================== STARTUP / SEED ====================


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    logger.info("Database indexes created")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@livrella.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin2026!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one(
            {
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "firstName": "Admin",
                "lastName": "Livrella",
                "phone": "+33 1 00 00 00 00",
                "role": "admin",
                "isActive": True,
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
                "preferences": {
                    "notifications": True,
                    "newsletter": False,
                    "language": "fr",
                },
            }
        )
        logger.info(f"Admin created: {admin_email}")

    if await db.categories.count_documents({}) == 0:
        await seed_categories()
    if await db.products.count_documents({}) == 0:
        await seed_products()
    if not await db.users.find_one({"email": "sarah@example.com"}):
        await seed_demo_user()
    if await db.offers.count_documents({}) == 0:
        await seed_offers()
    logger.info("Livrella API started successfully!")


async def seed_categories():
    now = datetime.now(timezone.utc)
    await db.categories.insert_many(
        [
            {
                "name": "Hygiène Féminine",
                "nameEn": "Feminine Hygiene",
                "slug": "feminine-hygiene",
                "description": "Protections, tampons, serviettes",
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
                "description": "Couches, lingettes, soins bébé",
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
                "description": "Packs curated pour vos besoins",
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
                "description": "Offres spéciales et remises",
                "icon": "pricetag-outline",
                "color": "#FFF3E0",
                "isActive": True,
                "order": 4,
                "createdAt": now,
            },
        ]
    )


async def seed_products():
    cats = await db.categories.find({}).to_list(10)
    cat_map = {c["slug"]: str(c["_id"]) for c in cats}
    now = datetime.now(timezone.utc)
    h_img = "https://images.unsplash.com/photo-1764312270936-adb508140a6d?w=400&q=80"
    h_img2 = "https://images.unsplash.com/photo-1712677178403-a10c29e8797e?w=400&q=80"
    b_img = "https://images.unsplash.com/photo-1714350313517-ae7dadf0dc39?w=400&q=80"
    b_img2 = "https://images.pexels.com/photos/5889959/pexels-photo-5889959.jpeg?w=400"
    pack_img = "https://static.prod-images.emergentagent.com/jobs/e6ee2148-1543-4c43-8db7-2adb7bb65eeb/images/f55d1e4ebfc00998a13400e3c4ea1b3fb088993bc07beb0d0ba1134a88f3fd07.png"

    products = [
        # Hygiène féminine
        {
            "name": "Serviettes Ultra Night",
            "brand": "Nana",
            "description": "Serviettes hygiéniques ultra-absorbantes pour la nuit. Coton bio certifié, avec ailettes pour une protection maximale. Approuvées par les gynécologues.",
            "shortDescription": "Protection nuit ultra-absorbante au coton bio",
            "categoryId": cat_map.get("feminine-hygiene", ""),
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
            "tags": ["nuit", "coton bio", "absorbant", "ailettes"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.8,
            "reviewCount": 234,
            "images": [h_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Protège-slips Quotidiens x50",
            "brand": "Always",
            "description": "Protège-slips ultra-fins pour une protection au quotidien. Respirants, confortables, ils s'adaptent à toutes vos activités.",
            "shortDescription": "Protection légère et discrète au quotidien",
            "categoryId": cat_map.get("feminine-hygiene", ""),
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
            "tags": ["quotidien", "slim", "respirant"],
            "availableFrequencies": ["biweekly", "monthly"],
            "rating": 4.5,
            "reviewCount": 189,
            "images": [h_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Tampons Normal x32",
            "brand": "o.b.",
            "description": "Tampons sans applicateur pour une protection discrète. Sans parfum, sans chlore, ni viscose. Approuvés par les gynécologues.",
            "shortDescription": "Tampons discrètes certifiés sans produits chimiques",
            "categoryId": cat_map.get("feminine-hygiene", ""),
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
            "tags": ["tampon", "sans applicateur", "sûr"],
            "availableFrequencies": ["monthly"],
            "rating": 4.6,
            "reviewCount": 145,
            "images": [h_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Serviettes Regular Day",
            "brand": "Nana",
            "description": "Serviettes hygiéniques pour utilisation de jour. Protection fiable et confort toute la journée avec surface douce.",
            "shortDescription": "Protection journée confortable toute la journée",
            "categoryId": cat_map.get("feminine-hygiene", ""),
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
            "tags": ["jour", "regular", "confort"],
            "availableFrequencies": ["biweekly", "monthly"],
            "rating": 4.4,
            "reviewCount": 98,
            "images": [h_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        # Bébé
        {
            "name": "Couches Taille 2 (3-6 kg)",
            "brand": "Pampers",
            "description": "Couches ultra-douces pour bébés de 3 à 6 kg. Cœur absorbant 3x plus rapide. Indicateur d'humidité inclus. Protection anti-fuites 12h.",
            "shortDescription": "Couches douces avec indicateur d'humidité",
            "categoryId": cat_map.get("baby", ""),
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
            "tags": ["couches", "nouveau-né", "doux", "3-6kg"],
            "availableFrequencies": ["weekly", "biweekly", "monthly"],
            "rating": 4.9,
            "reviewCount": 567,
            "images": [b_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Lingettes Sensitive x288",
            "brand": "Huggies",
            "description": "Lingettes ultra-douces pour peaux sensibles de bébé. 99% eau pure, sans parfum, sans alcool. Certifiées dermatologiquement testées.",
            "shortDescription": "Lingettes 99% eau pure pour peaux sensibles",
            "categoryId": cat_map.get("baby", ""),
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
            "images": [b_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Couches Premium Taille 3 (4-9 kg)",
            "brand": "Pampers",
            "description": "Couches premium avec protection 360° et lotion aloe vera. Maintien sûr grâce à l'élastique tour de taille souple.",
            "shortDescription": "Couches premium 360° avec aloe vera",
            "categoryId": cat_map.get("baby", ""),
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
            "images": [b_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Crème Change Protectrice 100ml",
            "brand": "Mustela",
            "description": "Crème protectrice à la vaseline contre les irritations. Apaise et protège dès la 1ère utilisation. Formule 97% naturelle, testée sous contrôle pédiatrique.",
            "shortDescription": "Protection naturelle 97% contre les irritations",
            "categoryId": cat_map.get("baby", ""),
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
            "tags": ["crème", "protection", "naturel", "irritations"],
            "availableFrequencies": ["monthly"],
            "rating": 4.6,
            "reviewCount": 178,
            "images": [b_img2],
            "createdAt": now,
            "updatedAt": now,
        },
        # Packs mensuels
        {
            "name": "Pack Essentiel Femme",
            "brand": "Livrella",
            "description": "Notre pack mensuel essentiel pour femmes actives. Inclut : Serviettes Ultra Night (14u) + Protège-slips Quotidiens (50u). Livraison gratuite.",
            "shortDescription": "2 essentiels féminins au meilleur prix mensuel",
            "categoryId": cat_map.get("monthly-packs", ""),
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
            "tags": ["pack", "femme", "mensuel", "essentiel"],
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
            "categoryId": cat_map.get("monthly-packs", ""),
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
        # Promotions
        {
            "name": "Lot 3 Serviettes Night PROMO",
            "brand": "Nana",
            "description": "Pack promo exceptionnel : 3 paquets de serviettes nuit au prix de 2.5 paquets. Stock limité — offre valable jusqu'à épuisement.",
            "shortDescription": "Promo : 3 paquets pour le prix de 2.5",
            "categoryId": cat_map.get("promotions", ""),
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
            "images": [h_img],
            "createdAt": now,
            "updatedAt": now,
        },
        {
            "name": "Pack Découverte Bébé",
            "brand": "Livrella",
            "description": "Idéal pour découvrir nos produits bébé. Inclut un echantillon de chaque produit phare. Sans engagement, essai gratuit du service.",
            "shortDescription": "Découvrez nos produits bébé à prix réduit",
            "categoryId": cat_map.get("promotions", ""),
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
            "images": [pack_img],
            "createdAt": now,
            "updatedAt": now,
        },
    ]
    await db.products.insert_many(products)
    logger.info(f"Seeded {len(products)} products")


async def seed_demo_user():
    now = datetime.now(timezone.utc)
    result = await db.users.insert_one(
        {
            "email": "sarah@example.com",
            "password_hash": hash_password("password123"),
            "firstName": "Sarah",
            "lastName": "Martin",
            "phone": "+33 6 12 34 56 78",
            "role": "customer",
            "isActive": True,
            "createdAt": now,
            "updatedAt": now,
            "preferences": {
                "notifications": True,
                "newsletter": True,
                "language": "fr",
            },
        }
    )
    user_id = str(result.inserted_id)
    addr_result = await db.addresses.insert_one(
        {
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
    )
    addr_id = str(addr_result.inserted_id)
    product = await db.products.find_one({"brand": "Pampers"})
    if product:
        prod_id = str(product["_id"])
        unit_price = product.get("subscriptionPrice", 18.99)
        sub_result = await db.subscriptions.insert_one(
            {
                "userId": user_id,
                "productId": prod_id,
                "addressId": addr_id,
                "status": "active",
                "frequency": "monthly",
                "quantity": 2,
                "unitPrice": unit_price,
                "totalPrice": unit_price * 2,
                "startDate": now,
                "nextDeliveryDate": now + timedelta(days=5),
                "lastDeliveryDate": now - timedelta(days=25),
                "autoRenew": True,
                "deliveryCount": 3,
                "createdAt": now,
                "updatedAt": now,
            }
        )
        for i in range(3):
            od = now - timedelta(days=30 * i)
            st = "delivered" if i > 0 else "shipped"
            total = unit_price * 2
            or_result = await db.orders.insert_one(
                {
                    "orderNumber": f"ESS-2026-{10001 + i}",
                    "userId": user_id,
                    "subscriptionId": str(sub_result.inserted_id),
                    "addressId": addr_id,
                    "items": [
                        {
                            "productId": prod_id,
                            "productName": product["name"],
                            "quantity": 2,
                            "unitPrice": unit_price,
                            "totalPrice": total,
                        }
                    ],
                    "subtotal": total,
                    "deliveryFee": 0,
                    "discount": 0,
                    "total": total,
                    "status": st,
                    "trackingNumber": f"FR12345{67890 + i}",
                    "estimatedDelivery": od + timedelta(days=3),
                    "deliveredAt": (
                        od + timedelta(days=3) if st == "delivered" else None
                    ),
                    "timeline": [
                        {
                            "status": "confirmed",
                            "date": od.isoformat(),
                            "description": "Commande confirmée",
                        },
                        {
                            "status": "preparing",
                            "date": (od + timedelta(hours=3)).isoformat(),
                            "description": "En préparation",
                        },
                        {
                            "status": "shipped",
                            "date": (od + timedelta(days=1)).isoformat(),
                            "description": "Expédiée",
                        },
                    ],
                    "paymentStatus": "paid",
                    "createdAt": od,
                    "updatedAt": od,
                }
            )
            await db.invoices.insert_one(
                {
                    "invoiceNumber": f"INV-2026-{10001 + i}",
                    "userId": user_id,
                    "orderId": str(or_result.inserted_id),
                    "items": [
                        {
                            "productId": prod_id,
                            "productName": product["name"],
                            "quantity": 2,
                            "unitPrice": unit_price,
                            "totalPrice": total,
                        }
                    ],
                    "subtotal": total,
                    "tax": round(total * 0.1, 2),
                    "total": round(total * 1.1, 2),
                    "status": "paid",
                    "dueDate": od,
                    "paidAt": od,
                    "createdAt": od,
                }
            )
    await db.notifications.insert_many(
        [
            {
                "userId": user_id,
                "type": "delivery",
                "title": "Livraison dans 5 jours ! 📦",
                "body": "Votre commande de Pampers Taille 2 sera livrée dans 5 jours.",
                "isRead": False,
                "createdAt": now,
            },
            {
                "userId": user_id,
                "type": "promo",
                "title": "Offre spéciale -20% 🎁",
                "body": "Profitez de -20% sur votre prochain renouvellement ce week-end !",
                "isRead": False,
                "createdAt": now - timedelta(days=1),
            },
            {
                "userId": user_id,
                "type": "subscription",
                "title": "Abonnement renouvelé ✓",
                "body": "Votre abonnement mensuel a été renouvelé avec succès.",
                "isRead": True,
                "createdAt": now - timedelta(days=5),
            },
            {
                "userId": user_id,
                "type": "system",
                "title": "Bienvenue chez Livrella ! 🌸",
                "body": "Votre compte est créé. Découvrez nos produits et abonnez-vous pour ne plus jamais manquer d'essentiels.",
                "isRead": True,
                "createdAt": now - timedelta(days=30),
            },
        ]
    )
    await db.support_tickets.insert_one(
        {
            "ticketNumber": "TKT-2026-DEMO1",
            "userId": user_id,
            "subject": "Question sur ma livraison",
            "category": "delivery",
            "priority": "medium",
            "status": "resolved",
            "messages": [
                {
                    "sender": "customer",
                    "message": "Bonjour, quand sera livrée ma commande ESS-2026-10001 ?",
                    "createdAt": (now - timedelta(days=10)).isoformat(),
                },
                {
                    "sender": "support",
                    "message": "Bonjour Sarah ! Votre commande sera livrée dans 2-3 jours ouvrés. Numéro de suivi : FR1234567890.",
                    "createdAt": (now - timedelta(days=9)).isoformat(),
                },
                {
                    "sender": "customer",
                    "message": "Merci pour la réponse rapide ! 😊",
                    "createdAt": (now - timedelta(days=9, hours=-2)).isoformat(),
                },
            ],
            "assignedTo": "Équipe Support Livrella",
            "resolvedAt": (now - timedelta(days=8)).isoformat(),
            "satisfactionRating": 5,
            "createdAt": now - timedelta(days=10),
            "updatedAt": now - timedelta(days=8),
        }
    )
    logger.info("Demo user seeded: sarah@example.com")


async def seed_offers():
    now = datetime.now(timezone.utc)
    await db.offers.insert_many(
        [
            {
                "title": "Pack Nouveau-né -25%",
                "titleEn": "Newborn Pack -25%",
                "description": "Couches + Lingettes + Crème change au meilleur prix mensuel",
                "descriptionEn": "Diapers + Wipes + Cream at best monthly price",
                "discount": 25,
                "badgeText": "Offre limitée",
                "badgeTextEn": "Limited offer",
                "color": "#FFCAD4",
                "isActive": True,
                "order": 1,
                "image": "https://images.unsplash.com/photo-1714350313517-ae7dadf0dc39?w=400&q=80",
                "createdAt": now,
            },
            {
                "title": "3 mois d'abonnement offerts",
                "titleEn": "3 months subscription free",
                "description": "Souscrivez pour 9 mois et payez seulement 6 mois !",
                "descriptionEn": "Subscribe for 9 months, pay for only 6!",
                "discount": 33,
                "badgeText": "Populaire",
                "badgeTextEn": "Popular",
                "color": "#E8F5E9",
                "isActive": True,
                "order": 2,
                "image": "https://static.prod-images.emergentagent.com/jobs/e6ee2148-1543-4c43-8db7-2adb7bb65eeb/images/f55d1e4ebfc00998a13400e3c4ea1b3fb088993bc07beb0d0ba1134a88f3fd07.png",
                "createdAt": now,
            },
            {
                "title": "Hygiène Féminine -15%",
                "titleEn": "Feminine Hygiene -15%",
                "description": "Sur toute la gamme de protections féminines ce mois-ci",
                "descriptionEn": "On all feminine hygiene products this month",
                "discount": 15,
                "badgeText": "Nouveau",
                "badgeTextEn": "New",
                "color": "#F3E5F5",
                "isActive": True,
                "order": 3,
                "image": "https://images.unsplash.com/photo-1764312270936-adb508140a6d?w=400&q=80",
                "createdAt": now,
            },
        ]
    )


# ==================== HEALTH / MONITORING ====================


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "EssentiElles API",
        "version": app.version,
    }


@app.get("/health/detailed")
async def detailed_health_check():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "EssentiElles API",
        "version": app.version,
        "checks": {
            "database": {"backend": DB_BACKEND, "status": "healthy"},
            "environment": {
                "status": "healthy",
                "message": "All required environment variables are set",
            },
        },
    }
    try:
        (
            await db.users.estimated_document_count()
            if DB_BACKEND != "memory"
            else db.command("ping")
        )
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "backend": DB_BACKEND,
            "status": "unhealthy",
            "message": str(e),
        }
    return health_status


@app.get("/metrics")
async def get_metrics():
    uptime_seconds = int((datetime.now(timezone.utc) - APP_START_TIME).total_seconds())
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "db_backend": DB_BACKEND,
        "environment": ENVIRONMENT,
    }


# ==================== APP ASSEMBLY ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
if RATE_LIMIT_PER_MINUTE > 0:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=RATE_LIMIT_PER_MINUTE)

# Serve the static Expo web build when available (single-origin deployment /
# live preview). API routes keep precedence because /api is registered above.
WEB_DIST_DIR = os.environ.get("WEB_DIST_DIR", "").strip()
if WEB_DIST_DIR and os.path.isdir(WEB_DIST_DIR):
    from starlette.exceptions import HTTPException as StarletteHTTPException
    from starlette.responses import FileResponse
    from starlette.staticfiles import StaticFiles

    class ExpoRouterStaticFiles(StaticFiles):
        """Static hosting for `expo export -p web`:
        /route → /route.html when the plain file does not exist (deep links)."""

        async def get_response(self, path: str, scope):
            try:
                return await super().get_response(path, scope)
            except StarletteHTTPException as e:
                if e.status_code != 404:
                    raise
                candidate = f"{path}.html"
                try:
                    return await super().get_response(candidate, scope)
                except StarletteHTTPException:
                    index_path = os.path.join(self.directory, "index.html")  # type: ignore[arg-type]
                    if os.path.isfile(index_path):
                        return FileResponse(index_path)
                    raise

    app.mount("/", ExpoRouterStaticFiles(directory=WEB_DIST_DIR, html=True), name="web")
    logger.info(f"Serving web build from {WEB_DIST_DIR}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
