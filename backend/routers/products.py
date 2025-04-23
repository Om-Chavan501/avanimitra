from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from models import ProductCreate, ProductResponse, ProductUpdate, UserInDB
from database import products_collection, serialize_doc_id, serialize_list
from routers.auth import get_current_user

router = APIRouter()


@router.get("/products", response_model=List[ProductResponse])
async def get_all_products(
    category: Optional[str] = None, status: Optional[str] = None, seasonal: Optional[bool] = None
):
    # Filter products by category, status and seasonal flag if provided
    filter_query = {}
    if category:
        filter_query["category"] = category
    if status:
        filter_query["status"] = status
    else:
        # By default, only show active products
        filter_query["status"] = "active"
        
    # Filter by seasonal flag if provided
    if seasonal is not None:
        filter_query["is_seasonal"] = seasonal

    products = await products_collection.find(filter_query).to_list(1000)
    return serialize_list(products)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return serialize_doc_id(product)


@router.get("/admin/products", response_model=List[ProductResponse])
async def get_admin_products(current_user: UserInDB = Depends(get_current_user)):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    # Retrieve all products, regardless of status
    cursor = products_collection.find({})
    products = await cursor.to_list(length=100)
    # Serialize the MongoDB documents
    serialized_products = [serialize_doc_id(product) for product in products]
    return serialized_products


@router.post("/admin/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate, current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    product_dict = product.dict()
    result = await products_collection.insert_one(product_dict)
    new_product = await products_collection.find_one({"_id": result.inserted_id})
    return serialize_doc_id(new_product)


@router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    # Check if product exists
    existing_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    # Update product
    update_data = {k: v for k, v in product.dict().items() if v is not None}
    # Handle case when old_price is explicitly set to None to remove it
    if 'old_price' in update_data and update_data['old_price'] is None:
        await products_collection.update_one(
            {"_id": ObjectId(product_id)}, {"$unset": {"old_price": ""}}
        )
        del update_data['old_price']
        
    if update_data:
        await products_collection.update_one(
            {"_id": ObjectId(product_id)}, {"$set": update_data}
        )
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return serialize_doc_id(updated_product)


@router.delete("/admin/products/{product_id}", response_model=dict)
async def delete_product(
    product_id: str, current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    # Check if product exists
    existing_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    # Delete product
    await products_collection.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted successfully"}


# Update the products to new format (migration helper)
@router.post("/admin/update-mango-products", include_in_schema=False)
async def update_mango_products(current_user: UserInDB = Depends(get_current_user)):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Find mango products
    mango_products = await products_collection.find({
        "category": "mangoes"
    }).to_list(100)
    
    updated_count = 0
    
    for product in mango_products:
        product_id = product["_id"]
        name = product["name"]
        
        # Extract size from name
        size = None
        if "Small" in name:
            size = "small"
        elif "Medium" in name:
            size = "medium"
        elif "Big" in name:
            size = "big"
        
        # Skip if size not found
        if not size:
            continue
            
        # Create price options based on size
        price_options = []
        
        # Box option
        if size == "small":
            price_options.append({
                "type": "box",
                "size": size,
                "quantity": "6.5/7 Dz",
                "price": 5300
            })
            # Dozen option
            price_options.append({
                "type": "quantity",
                "size": size,
                "quantity": "1 Dz",
                "price": 850
            })
        elif size == "medium":
            price_options.append({
                "type": "box",
                "size": size,
                "quantity": "5.5/6 Dz",
                "price": 6300
            })
            # Dozen option
            price_options.append({
                "type": "quantity",
                "size": size,
                "quantity": "1 Dz",
                "price": 1200
            })
        elif size == "big":
            price_options.append({
                "type": "box",
                "size": size,
                "quantity": "5/5.25 Dz",
                "price": 7400
            })
            # Dozen option
            price_options.append({
                "type": "quantity",
                "size": size,
                "quantity": "1 Dz",
                "price": 1550
            })
        
        # Update product with new fields
        simplified_name = f"Devgad Hapus Mangoes ({size})"
        
        await products_collection.update_one(
            {"_id": product_id},
            {
                "$set": {
                    "name": simplified_name,
                    "is_seasonal": True,
                    "has_price_options": True,
                    "price_options": price_options
                }
            }
        )
        
        updated_count += 1
    
    # Set all other products as not seasonal
    await products_collection.update_many(
        {"category": {"$ne": "mangoes"}},
        {"$set": {"is_seasonal": False}}
    )
    
    return {"message": f"Updated {updated_count} mango products"}


# Seed some products (for testing)
@router.post("/seed-products", include_in_schema=True)
async def seed_products():
    # Check if products already exist
    count = await products_collection.count_documents({})
    if count > 0:
        return {"message": f"{count} products already exist"}
    products = [
        {
            "name": "Organic Apples",
            "description": "Fresh, juicy organic apples sourced directly from our farms",
            "price": 150.0,  # ₹150 per kg
            "old_price": 180.0,  # Added old_price for demonstration
            "image_url": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb",
            "category": "apples",
            "stock_quantity": 100,
            "status": "active",
            "is_seasonal": False
        },
        {
            "name": "Organic Bananas",
            "description": "Sweet and nutritious organic bananas",
            "price": 80.0,  # ₹80 per dozen
            "image_url": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e",
            "category": "bananas",
            "stock_quantity": 150,
            "status": "active",
            "is_seasonal": False
        },
        {
            "name": "Organic Oranges",
            "description": "Citrusy and refreshing organic oranges",
            "price": 120.0,  # ₹120 per kg
            "old_price": 150.0,  # Added old_price for demonstration
            "image_url": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b",
            "category": "citrus",
            "stock_quantity": 80,
            "status": "active",
            "is_seasonal": False
        },
        {
            "name": "Devgad Hapus Mangoes (small)",
            "description": "Original Devgad Hapus Mangoes. \nOrganically ripened.\nExpected date of Arrival - 04/04/2025",
            "price": 5300.0,  # Default price for box
            "image_url": "https://nutrigainorganics.com/wp-content/uploads/2024/04/4.png",
            "category": "mangoes",
            "stock_quantity": 50,
            "status": "active",
            "is_seasonal": True,
            "has_price_options": True,
            "price_options": [
                {
                    "type": "box",
                    "size": "small",
                    "quantity": "6.5/7 Dz",
                    "price": 5300,
                    "old_price": 5800
                },
                {
                    "type": "quantity",
                    "size": "small",
                    "quantity": "1 Dz",
                    "price": 850
                }
            ]
        },
        {
            "name": "Devgad Hapus Mangoes (medium)",
            "description": "Original Devgad Hapus Mangoes. \nOrganically ripened.\nExpected date of Arrival - 04/04/2025",
            "price": 6300.0,  # Default price for box
            "image_url": "https://nutrigainorganics.com/wp-content/uploads/2024/04/4.png",
            "category": "mangoes",
            "stock_quantity": 50,
            "status": "active",
            "is_seasonal": True,
            "has_price_options": True,
            "price_options": [
                {
                    "type": "box",
                    "size": "medium",
                    "quantity": "5.5/6 Dz",
                    "price": 6300
                },
                {
                    "type": "quantity",
                    "size": "medium",
                    "quantity": "1 Dz",
                    "price": 1200,
                    "old_price": 1400
                }
            ]
        },
        {
            "name": "Devgad Hapus Mangoes (big)",
            "description": "Original Devgad Hapus Mangoes. \nOrganically ripened.\nExpected date of Arrival - 04/04/2025",
            "price": 7400.0,  # Default price for box
            "image_url": "https://nutrigainorganics.com/wp-content/uploads/2024/04/4.png",
            "category": "mangoes",
            "stock_quantity": 50,
            "status": "active",
            "is_seasonal": True,
            "has_price_options": True,
            "price_options": [
                {
                    "type": "box",
                    "size": "big",
                    "quantity": "5/5.25 Dz",
                    "price": 7400,
                    "old_price": 7900
                },
                {
                    "type": "quantity",
                    "size": "big",
                    "quantity": "1 Dz",
                    "price": 1550,
                    "old_price": 1700
                }
            ]
        },
    ]
    result = await products_collection.insert_many(products)
    return {"message": f"{len(result.inserted_ids)} products created successfully"}

# Update the products to new format (migration helper)
@router.post("/admin/update-mango-products", include_in_schema=True)
async def update_mango_products(current_user: UserInDB = Depends(get_current_user)):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Find mango products
    mango_products = await products_collection.find({
        "category": "mangoes"
    }).to_list(100)
    
    updated_count = 0
    
    for product in mango_products:
        product_id = product["_id"]
        name = product["name"]
        
        # Extract size from name
        size = None
        if "Small" in name:
            size = "small"
        elif "Medium" in name:
            size = "medium"
        elif "Big" in name:
            size = "big"
        
        # Skip if size not found
        if not size:
            continue
            
        # Create price options based on size
        price_options = []
        
        # Box option
        if size == "small":
            price_options.append({
                "type": "box",
                "size": size,
                "quantity": "6.5/7 Dz",
                "price": 5300
            })
            # Dozen option
            price_options.append({
                "type": "quantity",
                "size": size,
                "quantity": "1 Dz",
                "price": 850
            })
        elif size == "medium":
            price_options.append({
                "type": "box",
                "size": size,
                "quantity": "5.5/6 Dz",
                "price": 6300
            })
            # Dozen option
            price_options.append({
                "type": "quantity",
                "size": size,
                "quantity": "1 Dz",
                "price": 1200
            })
        elif size == "big":
            price_options.append({
                "type": "box",
                "size": size,
                "quantity": "5/5.25 Dz",
                "price": 7400
            })
            # Dozen option
            price_options.append({
                "type": "quantity",
                "size": size,
                "quantity": "1 Dz",
                "price": 1550
            })
        
        # Update product with new fields
        simplified_name = f"Devgad Hapus Mangoes ({size})"
        
        await products_collection.update_one(
            {"_id": product_id},
            {
                "$set": {
                    "name": simplified_name,
                    "is_seasonal": True,
                    "has_price_options": True,
                    "price_options": price_options
                }
            }
        )
        
        updated_count += 1
    
    # Set all other products as not seasonal
    await products_collection.update_many(
        {"category": {"$ne": "mangoes"}},
        {"$set": {"is_seasonal": False}}
    )
    
    return {"message": f"Updated {updated_count} mango products"}