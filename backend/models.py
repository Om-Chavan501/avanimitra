# backend/models.py

from pydantic import BaseModel, Field, EmailStr, validator
import re
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class PriceOption(BaseModel):
    type: str  # "box" or "quantity"
    size: str  # "small", "medium", "big"
    quantity: str  # e.g., "6.5/7 Dz", "1 Dz"
    price: float
    old_price: Optional[float] = None


class UserBase(BaseModel):
    name: str
    phone: str
    address: str

    @validator("phone")
    def validate_phone(cls, v):
        if not re.match(r"^\d{10}$", v):
            raise ValueError("Phone number must be 10 digits")
        return v


class UserCreate(UserBase):
    password: str

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    id: str
    is_admin: bool = False


class UserResponse(UserBase):
    id: str
    is_admin: bool


class LoginRequest(BaseModel):
    phone: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    is_admin: bool


class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    old_price: Optional[float] = None
    image_url: str
    category: str
    stock_quantity: int
    status: str
    is_seasonal: bool = False
    price_options: Optional[List[Dict[str, Any]]] = None
    has_price_options: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock_quantity: Optional[int] = None
    status: Optional[str] = None
    is_seasonal: Optional[bool] = None
    price_options: Optional[List[Dict[str, Any]]] = None
    has_price_options: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str


# Use Dict for the selected_option instead of a nested model to avoid serialization issues
class CartItem(BaseModel):
    product_id: str
    quantity: int
    selected_option: Optional[Dict[str, Any]] = None


class CartItemResponse(BaseModel):
    product_id: str
    product: ProductResponse
    quantity: int
    selected_option: Optional[Dict[str, Any]] = None


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_price: float


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class OrderItemBase(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float
    selected_option: Optional[Dict[str, Any]] = None


class OrderCreate(BaseModel):
    delivery_address: str
    receiver_phone: str
    items: List[CartItem]
    payment_method: Optional[str] = "bank"


class OrderItemResponse(OrderItemBase):
    product: ProductResponse


class OrderResponse(BaseModel):
    id: str
    user_id: str
    order_date: datetime
    delivery_address: str
    receiver_phone: str
    items: List[OrderItemResponse]
    total_amount: float
    order_status: OrderStatus
    payment_status: PaymentStatus


class OrderItem(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: float
    selected_option: Optional[Dict[str, Any]] = None


class OrderUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    delivery_address: Optional[str] = None
    receiver_phone: Optional[str] = None
    items: Optional[List[OrderItem]] = None


class AdminOrderCreate(BaseModel):
    user_id: str
    delivery_address: str
    receiver_phone: str
    items: List[OrderItemBase]
    order_status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    total_amount: Optional[float] = None


class PaymentSettingsBase(BaseModel):
    bank_name: str
    account_holder: str
    account_number: str
    ifsc_code: str
    upi_id: str
    gpay_number: str


class PaymentSettingsUpdate(PaymentSettingsBase):
    pass


class PaymentSettingsResponse(PaymentSettingsBase):
    id: Optional[str] = None


class OrderExportRequest(BaseModel):
    format: str = "excel"  # Default to excel
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_all_fields: bool = True
    status_filter: str = (
        "all"  # all, pending, processing, shipped, delivered, cancelled
    )


class SurveyProductOption(BaseModel):
    product_name: str
    quantity: str
    frequency: str  # weekly, monthly, etc.


class SurveyResponse(BaseModel):
    name: str
    mobile: str
    address: str
    area: str
    city: str
    product_preferences: List[SurveyProductOption]
    created_at: Optional[datetime] = None


class SurveyProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    available_quantities: Optional[List[str]] = None
    category: Optional[str] = None


class SurveyProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    available_quantities: Optional[List[str]] = None
    category: Optional[str] = None


class SurveyProductResponse(SurveyProductCreate):
    id: str
