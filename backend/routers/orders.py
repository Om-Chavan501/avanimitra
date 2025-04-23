# backend/routers/orders.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form, Response
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime, timedelta
import pandas as pd
import io
from models import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    OrderStatus,
    PaymentStatus,
    UserInDB,
    ProductResponse,
    OrderItemResponse,
    AdminOrderCreate,
    OrderItem,
    OrderExportRequest,
)
from database import (
    orders_collection,
    products_collection,
    get_user_cart,
    clear_cart,
    serialize_doc_id,
    serialize_list,
    users_collection,
)
from routers.auth import get_current_user

router = APIRouter()


@router.post("/orders", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    # Create new order
    order = {
        "user_id": current_user.id,
        "order_date": datetime.utcnow(),
        "delivery_address": order_data.delivery_address,
        "receiver_phone": order_data.receiver_phone,
        "items": [],
        "total_amount": 0,
        "order_status": OrderStatus.PENDING,
        "payment_status": PaymentStatus.PENDING,
        "payment_method": order_data.payment_method or "bank",
    }

    # Process order items
    items = []
    total_amount = 0

    for item in order_data.items:
        # Get product details
        product = await products_collection.find_one({"_id": ObjectId(item.product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found",
            )

        # Check if product is active and has sufficient stock
        if product.get("status", "active") != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product['name']}' is not available for purchase",
            )

        if item.quantity > product.get("stock_quantity", 0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product['name']}'. Available: {product.get('stock_quantity', 0)}",
            )

        # Update product stock
        await products_collection.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock_quantity": -item.quantity}},
        )

        product = serialize_doc_id(product)

        # Determine price based on selected option
        item_price = product["price"]
        selected_option = None
        
        if item.selected_option:
            # No need to call .dict() since it's already a dict
            selected_option = item.selected_option
            item_price = selected_option["price"]

        # Add item to order
        order_item = {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_purchase": item_price,
        }
        
        if selected_option:
            order_item["selected_option"] = selected_option

        items.append(order_item)
        total_amount += item_price * item.quantity

    order["items"] = items
    order["total_amount"] = total_amount

    # Save order to database
    result = await orders_collection.insert_one(order)
    order["id"] = str(result.inserted_id)

    # Clear user's cart
    await clear_cart(current_user.id)

    # Format response
    order_response = await get_order_with_products(order["id"])
    return order_response

@router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(current_user: UserInDB = Depends(get_current_user)):
    orders = (
        await orders_collection.find({"user_id": current_user.id})
        .sort("order_date", -1)
        .to_list(1000)
    )
    orders = serialize_list(orders)

    # Format response with product details
    order_responses = []
    for order in orders:
        order_with_products = await format_order_response(order)
        order_responses.append(order_with_products)

    return order_responses


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Get order
    order = await orders_collection.find_one(
        {"_id": ObjectId(order_id), "user_id": current_user.id}
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    # Format response with product details
    order_response = await format_order_response(serialize_doc_id(order))

    return order_response


@router.post("/orders/{order_id}/repeat", response_model=OrderResponse)
async def repeat_order(
    order_id: str, current_user: UserInDB = Depends(get_current_user)
):
    # Get original order
    original_order = await orders_collection.find_one(
        {"_id": ObjectId(order_id), "user_id": current_user.id}
    )

    if not original_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    # Create new order based on the original
    new_order = {
        "user_id": current_user.id,
        "order_date": datetime.utcnow(),
        "delivery_address": original_order["delivery_address"],
        "receiver_phone": original_order["receiver_phone"],
        "items": original_order["items"],  # This will include selected_option if present
        "total_amount": original_order["total_amount"],
        "order_status": OrderStatus.PENDING,
        "payment_status": PaymentStatus.PENDING,
    }

    # Save new order to database
    result = await orders_collection.insert_one(new_order)
    new_order["id"] = str(result.inserted_id)

    # Format response
    order_response = await format_order_response(new_order)

    return order_response


# Admin routes


@router.get("/admin/orders", response_model=List[OrderResponse])
async def get_all_orders(
    status: Optional[str] = None, current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Filter by status if provided
    filter_query = {}
    if status:
        if status == "active":
            filter_query["order_status"] = {
                "$in": [
                    OrderStatus.PENDING,
                    OrderStatus.PROCESSING,
                    OrderStatus.SHIPPED,
                ]
            }
        elif status == "past":
            filter_query["order_status"] = {
                "$in": [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
            }

    orders = (
        await orders_collection.find(filter_query).sort("order_date", -1).to_list(1000)
    )
    orders = serialize_list(orders)

    # Format response with product details
    order_responses = []
    for order in orders:
        order_with_products = await format_order_response(order)
        order_responses.append(order_with_products)

    return order_responses


@router.put("/admin/orders/bulk-update")
async def bulk_update_orders(
    update_data: dict,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Bulk update multiple orders at once
    Body should contain:
    - order_ids: list of order IDs to update
    - order_status: optional new order status
    - payment_status: optional new payment status
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Validate input
    order_ids = update_data.get("order_ids", [])
    if not order_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No order IDs provided"
        )
    
    # Prepare update data
    update_fields = {}
    if "order_status" in update_data and update_data["order_status"]:
        update_fields["order_status"] = update_data["order_status"]
        
    if "payment_status" in update_data and update_data["payment_status"]:
        update_fields["payment_status"] = update_data["payment_status"]
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update fields provided"
        )
    
    # Convert string IDs to ObjectId
    object_ids = [ObjectId(id) for id in order_ids]
    
    # Update all matching orders
    result = await orders_collection.update_many(
        {"_id": {"$in": object_ids}},
        {"$set": update_fields}
    )
    
    return {
        "message": f"Updated {result.modified_count} orders",
        "modified_count": result.modified_count
    }


@router.put("/admin/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_update: OrderUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Get order
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    # Prepare update data
    update_data = {}
    if order_update.order_status is not None:
        update_data["order_status"] = order_update.order_status

    if order_update.payment_status is not None:
        update_data["payment_status"] = order_update.payment_status

    if order_update.delivery_address is not None:
        update_data["delivery_address"] = order_update.delivery_address

    if order_update.receiver_phone is not None:
        update_data["receiver_phone"] = order_update.receiver_phone

    # Handle items update if provided
    if order_update.items is not None:
        items_data = []
        total_amount = 0

        # Process each item
        for item in order_update.items:
            # Verify the product exists
            product = await products_collection.find_one(
                {"_id": ObjectId(item.product_id)}
            )
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with id {item.product_id} not found",
                )

            # Add item to order
            order_item = {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_purchase": item.price_at_purchase,
            }
            
            # Include selected option if provided
            if item.selected_option:
                order_item["selected_option"] = item.selected_option

            items_data.append(order_item)
            total_amount += item.price_at_purchase * item.quantity

        update_data["items"] = items_data
        update_data["total_amount"] = total_amount

    if update_data:
        await orders_collection.update_one(
            {"_id": ObjectId(order_id)}, {"$set": update_data}
        )

    # Get updated order
    updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})

    # Format response
    order_response = await format_order_response(serialize_doc_id(updated_order))

    return order_response


@router.delete("/admin/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str, current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Check if order exists
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    # Delete order
    await orders_collection.delete_one({"_id": ObjectId(order_id)})


@router.post("/admin/custom-orders", response_model=OrderResponse)
async def create_custom_order(
    order_data: AdminOrderCreate, current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Check if user exists
    user = await users_collection.find_one({"_id": ObjectId(order_data.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Apply discount if specified
    items = [item.dict() for item in order_data.items]
    base_total = sum(item["price_at_purchase"] * item["quantity"] for item in items)
    total_amount = base_total
    
    # Handle discounts
    if hasattr(order_data, 'discount_type') and hasattr(order_data, 'discount_value'):
        if order_data.discount_type == 'percentage':
            discount_amount = base_total * (order_data.discount_value / 100)
            total_amount = base_total - discount_amount
        elif order_data.discount_type == 'fixed':
            total_amount = max(0, base_total - order_data.discount_value)

    # Use provided total amount if specified (for custom prices)
    if hasattr(order_data, 'total_amount') and order_data.total_amount is not None:
        total_amount = order_data.total_amount

    # Create new order
    order = {
        "user_id": order_data.user_id,
        "order_date": datetime.utcnow(),
        "delivery_address": order_data.delivery_address,
        "receiver_phone": order_data.receiver_phone,
        "items": items,
        "total_amount": total_amount,
        "order_status": order_data.order_status,
        "payment_status": order_data.payment_status,
        "payment_method": "admin_custom_order",
    }

    # Save discount info if applicable
    if hasattr(order_data, 'discount_type') and hasattr(order_data, 'discount_value'):
        order["discount"] = {
            "type": order_data.discount_type,
            "value": order_data.discount_value,
            "original_total": base_total,
        }

    # Save order to database
    result = await orders_collection.insert_one(order)
    order["id"] = str(result.inserted_id)

    # Format response
    order_response = await format_order_response(order)

    return order_response


@router.post("/admin/export-orders")
async def export_orders(
    export_data: OrderExportRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Validate and prepare filter
    filter_query = {}
    if export_data.status_filter and export_data.status_filter != "all":
        filter_query["order_status"] = export_data.status_filter
    
    # Date range filter
    if export_data.start_date:
        if not "order_date" in filter_query:
            filter_query["order_date"] = {}
        filter_query["order_date"]["$gte"] = export_data.start_date
    
    if export_data.end_date:
        if not "order_date" in filter_query:
            filter_query["order_date"] = {}
        # Add 1 day to include the end date fully
        end_date = export_data.end_date + timedelta(days=1)
        filter_query["order_date"]["$lt"] = end_date
    
    # Process the export immediately instead of in background
    excel_data = await process_export_orders(filter_query)
    
    # Return the Excel file for download
    filename = f"orders_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )


async def process_export_orders(filter_query: Dict[str, Any]):
    """Process orders and return the Excel file data with conditional formatting"""
    try:
        # Create a BytesIO object to store the Excel file
        output = io.BytesIO()
        
        # Create Excel writer
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # PART 1: Create "orders" sheet with the specified format (now first)
            orders = await orders_collection.find(filter_query).sort("order_date", 1).to_list(1000)
            orders = serialize_list(orders)
            
            # Process orders to include product details
            processed_orders = []
            order_number = 1
            
            for order in orders:
                if order is None:
                    continue
                
                # Get user info
                user_id = order.get("user_id")
                if user_id is None:
                    user = {"name": "Unknown", "phone": "", "address": ""}
                else:
                    user = await users_collection.find_one({"_id": ObjectId(user_id)})
                    if user is None:
                        user = {"name": "Unknown", "phone": "", "address": ""}
                    user = serialize_doc_id(user)
                
                # Process each item in the order
                items = order.get("items", [])
                for item in items:
                    if item is None:
                        continue
                    
                    product_id = item.get("product_id")
                    if product_id is None:
                        continue
                    
                    product = await products_collection.find_one({"_id": ObjectId(product_id)})
                    if product is None:
                        continue
                    
                    product = serialize_doc_id(product)
                    
                    # Get option details if present
                    size = ""
                    option_type = ""
                    total_dozens = 0
                    
                    selected_option = item.get("selected_option")
                    if selected_option is not None:
                        size = selected_option.get("size", "")
                        option_type = selected_option.get("type", "")
                        
                        # Calculate total dozens
                        if option_type == "quantity":
                            total_dozens = 1 * item.get("quantity", 0)
                        elif option_type == "box":
                            if size == "big":
                                total_dozens = 5.5 * item.get("quantity", 0)
                            elif size == "medium":
                                total_dozens = 6 * item.get("quantity", 0)
                            elif size == "small":
                                total_dozens = 6.5 * item.get("quantity", 0)
                    
                    # Calculate if receiver_phone should be shown
                    receiver_phone = ""
                    if order.get("receiver_phone") != user.get("phone"):
                        receiver_phone = order.get("receiver_phone", "")
                    
                    # Calculate if delivery_address should be shown
                    delivery_address = ""
                    if order.get("delivery_address") != user.get("address"):
                        delivery_address = order.get("delivery_address", "")
                    
                    # Create row for the order item
                    order_row = {
                        "round_number": "",
                        "website_order_number": order_number,
                        "type": "website",
                        "customer_name": user.get("name", ""),
                        "phone": user.get("phone", ""),
                        "receiver_phone": receiver_phone,
                        "address": user.get("address", ""),
                        "delivery_address": delivery_address,
                        "product_name": product.get("name", ""),
                        "size": size,
                        "type": option_type,
                        "product_quantity": item.get("quantity", 0),
                        "total_dozens": total_dozens,
                        "total_price": item.get("price_at_purchase", 0) * item.get("quantity", 0),
                        "CP": "",
                        "SP": "",
                        "payment_status_website": order.get("payment_status", ""),
                        "delivery_status_website": order.get("order_status", ""),
                        "payment_validation": "",
                        "delivery_validation": "",
                    }
                    
                    processed_orders.append(order_row)
                
                # Increment the order number after processing all items in the current order
                order_number += 1
            
            # Create orders DataFrame and write to sheet
            if processed_orders:
                orders_df = pd.DataFrame(processed_orders)
                orders_df.to_excel(writer, sheet_name="orders", index=False)
                
                # Get the xlsxwriter workbook and worksheet objects
                workbook = writer.book
                worksheet = writer.sheets['orders']
                
                # Define formats for conditional formatting
                duplicate_order_format = workbook.add_format({'bg_color': '#FFFF99'})  # Light yellow
                same_customer_format = workbook.add_format({'bg_color': '#00e8ff'})  # Light Blue
                paid_delivered_format = workbook.add_format({'bg_color': '#90EE90'})  # Light green
                missing_size_format = workbook.add_format({'bg_color': '#FFCCCB'})  # Light red
                
                # Get number of rows and columns in the dataframe
                max_row = len(orders_df) + 1
                
                # 1. Highlight duplicate order numbers
                worksheet.conditional_format(f'B2:B{max_row}', {
                    'type': 'duplicate',
                    'format': duplicate_order_format
                })
                
                # 2. Highlight cells where payment_status_website is "paid"
                worksheet.conditional_format(f'P2:P{max_row}', {
                    'type': 'text',
                    'criteria': 'containing',
                    'value': 'paid',
                    'format': paid_delivered_format
                })
                
                # 3. Highlight cells where delivery_status_website is "delivered"
                worksheet.conditional_format(f'Q2:Q{max_row}', {
                    'type': 'text',
                    'criteria': 'containing',
                    'value': 'delivered',
                    'format': paid_delivered_format
                })
                
                # 4. Highlight empty size cells
                worksheet.conditional_format(f'J2:J{max_row}', {
                    'type': 'blanks',
                    'format': missing_size_format
                })
                
                # 5. Custom formula to highlight rows with the same customer details
                # Get columns for customer details
                
                # Formula to check if a row has the same customer details as the previous row
                # Using formula for each row to check if all customer info fields match the previous row
                for row in range(3, max_row + 1):  # Start from row 3 to compare with previous row
                    worksheet.conditional_format(f'D{row}', {
                        'type': 'formula',
                        'criteria': f'=AND(D{row}=D{row-1}, D{row}=D{row-1}, E{row}=E{row-1}, F{row}=F{row-1}, G{row}=G{row-1})',
                        'format': same_customer_format
                    })
            
            # PART 2: Create "users" sheet (now second)
            users = await users_collection.find().to_list(1000)
            users = serialize_list(users)
            
            # Process users data
            processed_users = []
            for i, user in enumerate(users, 1):
                processed_users.append({
                    "code": f"AM{i:03d}",
                    "name": user.get("name", ""),
                    "phone": user.get("phone", "")
                })
                
            # Create users DataFrame and write to sheet
            users_df = pd.DataFrame(processed_users)
            users_df.to_excel(writer, sheet_name="users", index=False)
        
        # Return the Excel file data
        output.seek(0)
        return output.getvalue()
        
    except Exception as e:
        print(f"Error processing orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing orders: {str(e)}"
        )

# Helper functions


async def get_order_with_products(order_id):
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        return None

    return await format_order_response(serialize_doc_id(order))


async def format_order_response(order):
    # Get product details for each item
    items_with_products = []

    for item in order["items"]:
        product = await products_collection.find_one(
            {"_id": ObjectId(item["product_id"])}
        )
        if product:
            product = serialize_doc_id(product)
            item_response = {
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "price_at_purchase": item["price_at_purchase"],
                "product": ProductResponse(**product),
            }
            
            # Include selected option if present
            if "selected_option" in item:
                item_response["selected_option"] = item["selected_option"]
                
            items_with_products.append(OrderItemResponse(**item_response))

    # Create order response
    order_response = OrderResponse(
        id=order["id"],
        user_id=order["user_id"],
        order_date=order["order_date"],
        delivery_address=order["delivery_address"],
        receiver_phone=order["receiver_phone"],
        items=items_with_products,
        total_amount=order["total_amount"],
        order_status=order["order_status"],
        payment_status=order["payment_status"],
    )

    return order_response