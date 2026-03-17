from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from routes import auth, score, family


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(score.router)
app.include_router(family.router)

