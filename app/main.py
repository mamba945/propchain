from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import init_db
from app.routers import properties, tokens


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PropChain",
    description="Fractional real estate tokenization on Solana devnet",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(properties.router)
app.include_router(tokens.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
