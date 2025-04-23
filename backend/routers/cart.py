from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId

from models import CartItem, CartResponse, CartItemResponse, UserInDB, ProductResponse
from database import (
    get_user_cart,
    add_to_cart,
    update_cart_item,
    clear_cart,
    products_collection,
    serialize_doc_id,
)
from routers.auth import get_current_user

router = APIRouter()


@router.get("/cart", response_model=CartResponse)
async def get_cart(current_user: UserInDB = Depends(get_current_user)):
    cart = await get_user_cart(current_user.id)

    # Get product details for each item
    items = []
    total_price = 0

    if "items" in cart and cart["items"]:
        for item in cart["items"]:
            product = await products_collection.find_one(
                {"_id": ObjectId(item["product_id"])}
            )
            if product:
                product = serialize_doc_id(product)
                
                # Get price based on selected option if available
                item_price = product["price"]
                if "selected_option" in item and item["selected_option"]:
                    item_price = item["selected_option"]["price"]
                
                cart_item = CartItemResponse(
                    product_id=item["product_id"],
                    product=ProductResponse(**product),
                    quantity=item["quantity"],
                    selected_option=item.get("selected_option")
                )
                items.append(cart_item)
                total_price += item_price * item["quantity"]

    return CartResponse(items=items, total_price=total_price)


@router.post("/cart/items", response_model=CartResponse)
async def add_item_to_cart(
    item: CartItem, current_user: UserInDB = Depends(get_current_user)
):
    # Check if product exists
    product = await products_collection.find_one({"_id": ObjectId(item.product_id)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    # Prepare item data with selected option
    item_data = {
        "product_id": item.product_id,
        "quantity": item.quantity
    }
    
    # Include selected_option if provided
    if item.selected_option:
        item_data["selected_option"] = item.selected_option

    # Add to cart with selected options if any
    await add_to_cart(current_user.id, item_data)

    # Return updated cart
    return await get_cart(current_user)


@router.put("/cart/items/{product_id}", response_model=CartResponse)
async def update_item_in_cart(
    product_id: str, item: CartItem, current_user: UserInDB = Depends(get_current_user)
):
    # Check if product exists
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    # Prepare update data
    update_data = {
        "quantity": item.quantity
    }
    
    # Include selected_option if provided
    if item.selected_option:
        update_data["selected_option"] = item.selected_option

    # Update cart item
    await update_cart_item(current_user.id, product_id, update_data)

    # Return updated cart
    return await get_cart(current_user)


@router.delete("/cart/items/{product_id}", response_model=CartResponse)
async def remove_item_from_cart(
    product_id: str, current_user: UserInDB = Depends(get_current_user)
):
    # Update quantity to 0 to remove item
    await update_cart_item(current_user.id, product_id, {"quantity": 0})

    # Return updated cart
    return await get_cart(current_user)


@router.delete("/cart", response_model=CartResponse)
async def clear_user_cart(current_user: UserInDB = Depends(get_current_user)):
    # Clear cart
    await clear_cart(current_user.id)

    # Return empty cart
    return CartResponse(items=[], total_price=0)