# Create new file: backend/routers/survey.py

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime

from models import (
    SurveyProductCreate, 
    SurveyProductUpdate, 
    SurveyProductResponse,
    SurveyResponse, 
    UserInDB
)
from routers.auth import get_current_user
from database import (
    get_survey_products, 
    get_survey_product,
    create_survey_product, 
    update_survey_product, 
    delete_survey_product,
    get_survey_responses,
    create_survey_response,
    get_user_survey_response,
    survey_responses_collection
)

router = APIRouter()

# Public endpoints
@router.get("/survey/products", response_model=List[SurveyProductResponse])
async def list_survey_products():
    return await get_survey_products()

@router.post("/survey/submit")
async def submit_survey(survey_data: SurveyResponse, current_user: UserInDB = None):
    # Check if user has already submitted a survey
    existing_response = await get_user_survey_response(survey_data.mobile)
    if existing_response:
        # Update existing response
        await survey_responses_collection.update_one(
            {"mobile": survey_data.mobile},
            {"$set": {**survey_data.dict(), "created_at": datetime.utcnow()}}
        )
        return {"message": "Survey response updated successfully"}
    
    # Create new response
    result = await create_survey_response(survey_data.dict())
    return {"message": "Survey submitted successfully", "id": str(result["_id"])}

@router.get("/survey/check/{mobile}")
async def check_survey_submission(mobile: str):
    response = await get_user_survey_response(mobile)
    return {"submitted": response is not None}

# Admin endpoints
@router.get("/admin/survey/responses", response_model=List[SurveyResponse])
async def get_all_survey_responses(current_user: UserInDB = Depends(get_current_user)):
    print(current_user)
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return await get_survey_responses()

@router.post("/admin/survey/products", response_model=SurveyProductResponse)
async def add_survey_product(
    product: SurveyProductCreate, 
    current_user: UserInDB = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return await create_survey_product(product.dict())

@router.put("/admin/survey/products/{product_id}", response_model=SurveyProductResponse)
async def modify_survey_product(
    product_id: str,
    product: SurveyProductUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Check if product exists
    existing_product = await get_survey_product(product_id)
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    
    # Update product
    update_data = {k: v for k, v in product.dict().items() if v is not None}
    return await update_survey_product(product_id, update_data)

@router.delete("/admin/survey/products/{product_id}")
async def remove_survey_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Check if product exists
    existing_product = await get_survey_product(product_id)
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    
    # Delete product
    await delete_survey_product(product_id)
    return {"message": "Product deleted successfully"}