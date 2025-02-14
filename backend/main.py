from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router

app = FastAPI(title="Omni Multi Agent API")

# Add CORS middleware to allow requests from the React frontend running on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/api/data")
async def get_data():
    return {"message": "Hello from FastAPI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

