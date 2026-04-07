from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import properties, tokens
from app.solana_client import solana_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await solana_client.close()


app = FastAPI(
    title="PropChain",
    description="Fractional real estate tokenization on Solana devnet",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router)
app.include_router(tokens.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "solana_configured": solana_client.configured,
        "program_id": str(solana_client.program_id),
    }
