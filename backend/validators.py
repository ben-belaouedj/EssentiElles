"""
Input validation utilities for enhanced security
"""

import re
from typing import Optional

from fastapi import HTTPException


def validate_email(email: str) -> str:
    """Validate email format"""
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Format d'email invalide")
    return email.lower()


def validate_password(password: str) -> str:
    """
    Validate password strength
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins 8 caractères",
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins une majuscule",
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins une minuscule",
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400, detail="Le mot de passe doit contenir au moins un chiffre"
        )

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins un caractère spécial",
        )

    return password


def validate_phone(phone: Optional[str]) -> Optional[str]:
    """Validate French phone number format"""
    if not phone:
        return None

    # Remove spaces and special characters
    clean_phone = re.sub(r"[\s\-\.\(\)]", "", phone)

    # French phone: +33 or 0 followed by 9 digits
    french_phone_regex = r"^(?:\+33|0)[1-9]\d{8}$"

    if not re.match(french_phone_regex, clean_phone):
        raise HTTPException(
            status_code=400,
            detail="Format de téléphone invalide (format attendu: 0612345678 ou +33612345678)",
        )

    return clean_phone


def validate_zip_code(zip_code: str, country: str = "France") -> str:
    """Validate postal code based on country"""
    if country == "France":
        if not re.match(r"^\d{5}$", zip_code):
            raise HTTPException(
                status_code=400, detail="Code postal invalide (5 chiffres attendus)"
            )
    return zip_code


def sanitize_string(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if len(text) > max_length:
        raise HTTPException(
            status_code=400, detail=f"Texte trop long (maximum {max_length} caractères)"
        )

    # Remove potentially dangerous characters
    dangerous_patterns = [
        r"<script[\s\S]*?>[\s\S]*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<embed",
        r"<object",
    ]

    cleaned_text = text
    for pattern in dangerous_patterns:
        cleaned_text = re.sub(pattern, "", cleaned_text, flags=re.IGNORECASE)

    return cleaned_text.strip()


def validate_price(price: float) -> float:
    """Validate price is positive and reasonable"""
    if price < 0:
        raise HTTPException(status_code=400, detail="Le prix doit être positif")

    if price > 10000:
        raise HTTPException(status_code=400, detail="Prix trop élevé (maximum 10,000€)")

    # Round to 2 decimal places
    return round(price, 2)


def validate_quantity(quantity: int) -> int:
    """Validate quantity is positive and reasonable"""
    if quantity < 1:
        raise HTTPException(status_code=400, detail="La quantité doit être au moins 1")

    if quantity > 1000:
        raise HTTPException(
            status_code=400, detail="Quantité trop élevée (maximum 1000)"
        )

    return quantity


ALLOWED_FREQUENCIES = {"weekly", "biweekly", "monthly"}


def validate_frequency(frequency: str) -> str:
    """Validate subscription delivery frequency"""
    if frequency not in ALLOWED_FREQUENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Fréquence invalide. Valeurs autorisées : {', '.join(sorted(ALLOWED_FREQUENCIES))}",
        )
    return frequency
