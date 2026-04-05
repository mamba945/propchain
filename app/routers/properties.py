import logging
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Property, TokenHolder
from app.schemas import (
    PropertyCreate,
    PropertyResponse,
    PropertyDetail,
    BuyTokensRequest,
    BuyTokensResponse,
)
from app.solana_client import solana_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/properties", tags=["properties"])

# Lamports-per-SOL constant used to convert Decimal price to on-chain u64.
LAMPORTS_PER_SOL = 1_000_000_000


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(payload: PropertyCreate, db: AsyncSession = Depends(get_db)):
    prop = Property(**payload.model_dump())

    # Attempt on-chain tokenization when Solana is configured and no mint
    # was supplied by the caller.
    if solana_client.configured and not prop.mint_address:
        try:
            price_lamports = int(
                Decimal(str(prop.price_per_token)) * LAMPORTS_PER_SOL
            )
            tx_sig, mint_address = await solana_client.initialize_property(
                title=prop.title,
                address=prop.address,
                total_tokens=prop.total_tokens,
                price_per_token_lamports=price_lamports,
                uri="",
            )
            prop.mint_address = mint_address
            logger.info(
                "Property tokenized on-chain: mint=%s tx=%s", mint_address, tx_sig
            )
        except Exception as exc:
            logger.warning("On-chain tokenization failed, continuing without: %s", exc)

    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.get("", response_model=list[PropertyResponse])
async def list_properties(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Property).order_by(Property.created_at.desc()))
    return result.scalars().all()


@router.get("/{property_id}", response_model=PropertyDetail)
async def get_property(property_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.holders))
        .where(Property.id == property_id)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    tokens_sold = sum(h.token_amount for h in prop.holders)
    return PropertyDetail(
        **PropertyResponse.model_validate(prop).model_dump(),
        tokens_sold=tokens_sold,
        tokens_available=prop.total_tokens - tokens_sold,
    )


@router.post("/{property_id}/buy", response_model=BuyTokensResponse)
async def buy_tokens(
    property_id: int,
    payload: BuyTokensRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.holders))
        .where(Property.id == property_id)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    tokens_sold = sum(h.token_amount for h in prop.holders)
    available = prop.total_tokens - tokens_sold
    if payload.amount > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} tokens available",
        )

    total_cost = Decimal(str(prop.price_per_token)) * payload.amount

    # -- Attempt to build a real Solana transaction -------------------------
    serialized_tx: str | None = None
    tx_signature: str | None = None
    is_mock = True

    if solana_client.configured and prop.mint_address:
        try:
            serialized_tx, _msg = await solana_client.build_buy_tokens_tx(
                buyer_pubkey_str=payload.wallet_address,
                mint_address=prop.mint_address,
                amount=payload.amount,
            )
            is_mock = False
            logger.info(
                "Built buy_tokens tx for buyer=%s property=%d amount=%d",
                payload.wallet_address,
                property_id,
                payload.amount,
            )
        except Exception as exc:
            logger.warning("Solana tx build failed, falling back to mock: %s", exc)

    # Mock fallback
    if is_mock:
        tx_signature = f"mock_{uuid.uuid4().hex}"

    # -- Upsert holder in local DB ------------------------------------------
    existing = next(
        (h for h in prop.holders if h.wallet_address == payload.wallet_address), None
    )
    if existing:
        existing.token_amount += payload.amount
    else:
        db.add(
            TokenHolder(
                property_id=property_id,
                wallet_address=payload.wallet_address,
                token_amount=payload.amount,
            )
        )

    await db.commit()

    return BuyTokensResponse(
        property_id=property_id,
        wallet_address=payload.wallet_address,
        amount_purchased=payload.amount,
        total_cost=total_cost,
        tx_signature=tx_signature,
        serialized_tx=serialized_tx,
        mock=is_mock,
    )
