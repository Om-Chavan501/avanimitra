import motor.motor_asyncio
from os import environ
import os
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
database = client.ecommerce

users_collection = database.users
products_collection = database.products
carts_collection = database.carts
orders_collection = database.orders
payment_settings_collection = database.payment_settings
survey_products_collection = database.survey_products
survey_responses_collection = database.survey_responses


# Helper functions to convert between MongoDB ObjectId and string
def get_object_id(id_str):
    if isinstance(id_str, str):
        return ObjectId(id_str)
    return id_str


def serialize_doc_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


def serialize_list(docs):
    return [serialize_doc_id(doc) for doc in docs]


# Cart operations
async def get_user_cart(user_id):
    cart = await carts_collection.find_one({"user_id": user_id})
    if not cart:
        # Create empty cart if it doesn't exist
        cart = {"user_id": user_id, "items": []}
        await carts_collection.insert_one(cart)
    return serialize_doc_id(cart)


async def add_to_cart(user_id, item_data):
    cart = await get_user_cart(user_id)
    product_id = item_data["product_id"]

    # Check if item already exists in cart
    found = False
    if "items" in cart:
        for idx, item in enumerate(cart["items"]):
            if item["product_id"] == product_id:
                # Check if the selected_option is the same
                same_option = True
                if "selected_option" in item_data:
                    if (
                        "selected_option" not in item
                        or item["selected_option"] != item_data["selected_option"]
                    ):
                        same_option = False
                elif "selected_option" in item:
                    same_option = False

                if same_option:
                    # Update quantity if same product and option
                    cart["items"][idx]["quantity"] += item_data["quantity"]
                    found = True
                    break

    # Add new item if not found
    if not found:
        if "items" not in cart:
            cart["items"] = []
        cart["items"].append(item_data)

    # Update cart in database
    await carts_collection.update_one(
        {"user_id": user_id}, {"$set": {"items": cart["items"]}}
    )

    return cart


async def update_cart_item(user_id, product_id, update_data):
    quantity = update_data.get("quantity", 0)

    # Find the cart and item
    cart = await get_user_cart(user_id)
    items = cart.get("items", [])

    if quantity <= 0:
        # Remove item if quantity is 0 or negative
        await carts_collection.update_one(
            {"user_id": user_id}, {"$pull": {"items": {"product_id": product_id}}}
        )
    else:
        # Check if we're updating an option
        if "selected_option" in update_data:
            for idx, item in enumerate(items):
                if item["product_id"] == product_id:
                    # Update both quantity and selected_option
                    items[idx]["quantity"] = quantity
                    items[idx]["selected_option"] = update_data["selected_option"]
                    break

            # Update the entire items array
            await carts_collection.update_one(
                {"user_id": user_id}, {"$set": {"items": items}}
            )
        else:
            # Just update quantity
            await carts_collection.update_one(
                {"user_id": user_id, "items.product_id": product_id},
                {"$set": {"items.$.quantity": quantity}},
            )

    return await get_user_cart(user_id)


async def clear_cart(user_id):
    await carts_collection.update_one({"user_id": user_id}, {"$set": {"items": []}})


# Payment settings operations
async def get_payment_settings():
    settings = await payment_settings_collection.find_one({})
    if not settings:
        # Create default settings if not exist
        default_settings = {
            "bank_name": "IDBI Bank Limited",
            "account_holder": "Atharva Datar",
            "account_number": "0490104000173407",
            "ifsc_code": "IBKL0000490",
            "upi_id": "acdatar-3@okhdfcbank",
            "gpay_number": "9764814452",
        }
        await payment_settings_collection.insert_one(default_settings)
        return default_settings
    return serialize_doc_id(settings)


async def update_payment_settings(settings_data):
    settings = await payment_settings_collection.find_one({})
    if settings:
        await payment_settings_collection.update_one({}, {"$set": settings_data})
    else:
        await payment_settings_collection.insert_one(settings_data)
    return await get_payment_settings()


# Survey product operations
async def get_survey_products():
    products = await survey_products_collection.find().to_list(1000)
    return serialize_list(products)


async def get_survey_product(product_id):
    product = await survey_products_collection.find_one(
        {"_id": get_object_id(product_id)}
    )
    return serialize_doc_id(product)


async def create_survey_product(product_data):
    result = await survey_products_collection.insert_one(product_data)
    return await get_survey_product(result.inserted_id)


async def update_survey_product(product_id, product_data):
    await survey_products_collection.update_one(
        {"_id": get_object_id(product_id)}, {"$set": product_data}
    )
    return await get_survey_product(product_id)


async def delete_survey_product(product_id):
    await survey_products_collection.delete_one({"_id": get_object_id(product_id)})


# Survey response operations
async def get_survey_responses():
    responses = await survey_responses_collection.find().to_list(1000)
    return serialize_list(responses)


async def create_survey_response(response_data):
    response_data["created_at"] = datetime.utcnow()
    result = await survey_responses_collection.insert_one(response_data)
    return await survey_responses_collection.find_one({"_id": result.inserted_id})


async def get_user_survey_response(mobile):
    response = await survey_responses_collection.find_one({"mobile": mobile})
    return serialize_doc_id(response)
