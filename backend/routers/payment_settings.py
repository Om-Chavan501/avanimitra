from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from models import (
    UserInDB, 
    PaymentSettingsResponse,
    PaymentSettingsUpdate
)
from database import (
    get_payment_settings,
    update_payment_settings
)
from routers.auth import get_current_user

router = APIRouter()

@router.get("/payment-settings", response_model=PaymentSettingsResponse)
async def get_settings():
    """Get payment settings - public endpoint for customers to see payment details"""
    settings = await get_payment_settings()
    return settings

@router.get("/admin/payment-settings", response_model=PaymentSettingsResponse)
async def get_admin_settings(current_user: UserInDB = Depends(get_current_user)):
    """Admin endpoint to get payment settings"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized"
        )
    
    settings = await get_payment_settings()
    return settings

@router.put("/admin/payment-settings", response_model=PaymentSettingsResponse)
async def update_settings(
    settings_data: PaymentSettingsUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update payment settings"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized"
        )
    
    updated_settings = await update_payment_settings(settings_data.dict())
    return updated_settings