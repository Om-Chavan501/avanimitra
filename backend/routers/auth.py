from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional, List
import os
from dotenv import load_dotenv
from bson import ObjectId
import csv
import io
import pandas as pd
from fastapi.responses import StreamingResponse
from tempfile import NamedTemporaryFile
from datetime import date
from database import users_collection, serialize_doc_id, serialize_list
from models import UserCreate, UserResponse, UserUpdate, LoginRequest, Token, UserInDB

load_dotenv()

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 7200


@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"phone": form_data.username})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect phone or password")

    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect phone or password")

    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/signup", response_model=UserResponse)
async def create_user(user: UserCreate):
    # Check if phone number exists
    user_exists = await users_collection.find_one({"phone": user.phone})
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # Create new user
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["is_admin"] = False

    # Insert user to database
    result = await users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)

    # Remove password field from response
    del user_dict["password"]

    return user_dict


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await users_collection.find_one({"phone": login_data.phone})

    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "is_admin": user.get("is_admin", False),
    }


@router.post("/admin-login", response_model=Token)
async def admin_login(login_data: LoginRequest):
    user = await users_collection.find_one({"phone": login_data.phone})

    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as admin",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "is_admin": True,
    }


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    user["id"] = str(user["_id"])
    del user["_id"]
    del user["password"]

    return UserInDB(**user)


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user


@router.put("/users/me", response_model=UserResponse)
async def update_user(
    user_update: UserUpdate, current_user: UserInDB = Depends(get_current_user)
):
    # Get current user data
    user_data = await users_collection.find_one({"_id": ObjectId(current_user.id)})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Prepare update data
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}

    # Hash password if it's being updated
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])

    # Update user
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)}, {"$set": update_data}
    )

    # Get updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(current_user.id)})
    updated_user = serialize_doc_id(updated_user)
    del updated_user["password"]

    return updated_user


# --- Admin user management routes ---


@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: UserInDB = Depends(get_current_user)):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    users = await users_collection.find().to_list(1000)
    users = serialize_list(users)

    # Remove passwords from response
    for user in users:
        if "password" in user:
            del user["password"]

    return users


@router.post("/admin/users", response_model=UserResponse)
async def create_user_as_admin(
    user: UserCreate,
    is_admin: bool = False,
    current_user: UserInDB = Depends(get_current_user),
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Check if phone number exists
    user_exists = await users_collection.find_one({"phone": user.phone})
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # Create new user
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["is_admin"] = is_admin

    # Insert user to database
    result = await users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)

    # Remove password field from response
    del user_dict["password"]

    return user_dict


@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user_as_admin(
    user_id: str,
    user_update: UserUpdate,
    is_admin: Optional[bool] = None,
    current_user: UserInDB = Depends(get_current_user),
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Check if user exists
    user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Prepare update data
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}

    # Set is_admin status if provided
    if is_admin is not None:
        update_data["is_admin"] = is_admin

    # Hash password if it's being updated
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])

    # Update user
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})

    # Get updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    updated_user = serialize_doc_id(updated_user)
    del updated_user["password"]

    return updated_user


@router.delete("/admin/users/{user_id}", response_model=dict)
async def delete_user_as_admin(
    user_id: str, current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Check if user exists
    user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Delete user
    await users_collection.delete_one({"_id": ObjectId(user_id)})

    return {"message": "User deleted successfully"}


# Create an admin user (for testing purposes)
@router.post("/create-admin", include_in_schema=False)
async def create_admin():
    # Check if admin exists
    admin = await users_collection.find_one({"phone": "9999999999"})
    if admin:
        return {"message": "Admin already exists"}

    admin_data = {
        "name": "Admin User",
        "phone": "9999999999",
        "address": "Admin Address",
        "password": get_password_hash("admin123"),
        "is_admin": True,
    }

    result = await users_collection.insert_one(admin_data)
    return {"message": "Admin created successfully", "id": str(result.inserted_id)}

@router.get("/admin/users/validate")
async def validate_users(current_user: UserInDB = Depends(get_current_user)):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Get all users
    users = await users_collection.find().to_list(1000)
    
    # Check for duplicate phone numbers
    phone_numbers = {}
    duplicates = []
    
    for user in users:
        phone = user.get("phone")
        if phone in phone_numbers:
            duplicates.append(phone)
        else:
            phone_numbers[phone] = 1
    
    if duplicates:
        return {
            "valid": False,
            "message": f"Found {len(duplicates)} duplicate phone numbers",
            "duplicates": duplicates
        }
    
    return {"valid": True, "message": "All users have unique phone numbers"}


@router.get("/admin/users/download")
async def download_users(
    format: str = "excel",
    current_user: UserInDB = Depends(get_current_user)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    
    # Get all users
    users = await users_collection.find().to_list(1000)
    users = serialize_list(users)
    
    # Process users data
    processed_users = []
    for i, user in enumerate(users, 1):
        # if user.get("is_admin", False):
        #     continue  # Skip admin users
            
        processed_users.append({
            "code": f"AM{i:03d}",
            "name": user.get("name", ""),
            "phone": user.get("phone", "")
        })
    
    today = date.today().strftime("%d-%b-%Y")
    
    if format.lower() == "excel":
        # Create Excel file
        df = pd.DataFrame(processed_users)
        
        with NamedTemporaryFile(delete=False, suffix=".xlsx") as temp:
            writer = pd.ExcelWriter(temp.name, engine="xlsxwriter")
            df.to_excel(writer, sheet_name="users", index=False)
            writer.close()
            
            with open(temp.name, "rb") as f:
                contents = f.read()
        
        headers = {
            "Content-Disposition": f"attachment; filename=AmBhiKhareeda_Users_{today}.xlsx"
        }
        return StreamingResponse(
            io.BytesIO(contents),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
        
    elif format.lower() == "vcf":
        # Create VCF file
        output = io.StringIO()
        
        for user in processed_users:
            output.write("BEGIN:VCARD\n")
            output.write("VERSION:3.0\n")
            output.write(f"N:{user['name']};{user['code']};;;\n")
            output.write(f"FN:{user['code']} {user['name']}\n")
            output.write(f"TEL;TYPE=CELL:{user['phone']}\n")
            output.write("END:VCARD\n")
        
        headers = {
            "Content-Disposition": f"attachment; filename=AmBhiKhareeda_Contacts_{today}.vcf"
        }
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/vcard",
            headers=headers
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format specified. Use 'excel' or 'vcf'."
        )