import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
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

router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(payload: PropertyCreate, db: AsyncSession = Depends(get_db)):
    prop = Property(**payload.model_dump())
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

    # Upsert: add to existing holding or create new
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

    total_cost = Decimal(str(prop.price_per_token)) * payload.amount
    mock_sig = f"mock_{uuid.uuid4().hex}"

    return BuyTokensResponse(
        property_id=property_id,
        wallet_address=payload.wallet_address,
        amount_purchased=payload.amount,
        total_cost=total_cost,
        mock_tx_signature=mock_sig,
    )
