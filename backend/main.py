from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, products, cart, orders, payment_settings, survey
import uvicorn
import requests
import time
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Avanimitra Organic Fruits API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="", tags=["auth"])
app.include_router(products.router, prefix="", tags=["products"])
app.include_router(cart.router, prefix="", tags=["cart"])
app.include_router(orders.router, prefix="", tags=["orders"])
app.include_router(payment_settings.router, prefix="", tags=["payment"])
app.include_router(survey.router, prefix="", tags=["survey"])


# GET route at the root URL
@app.get("/")
def read_root():
    return {"message": "Welcome to Avanimitra Organic Fruits API"}


# Function to hit the GET API every 5 minutes
def hit_api():
    while True:
        try:
            BACKEND_API = os.getenv("BACKEND_API")
            response = requests.get(BACKEND_API)
            print(f"Current Time: {datetime.datetime.now().strftime('%H:%M:%S')}")
            print(response.json())
        except requests.exceptions.RequestException as e:
            print(f"Current Time: {datetime.datetime.now().strftime('%H%M%S')}")
            print(f"Error: {e}")
        time.sleep(300)


# Start the API hitter in a separate thread
import threading

thread = threading.Thread(target=hit_api)
thread.daemon = True  # Set as daemon so it exits when main thread exits
thread.start()

# Run the FastAPI app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
