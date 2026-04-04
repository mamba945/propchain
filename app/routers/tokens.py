from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import TokenHolder, Property
from app.schemas import HoldingResponse, PortfolioResponse

router = APIRouter(tags=["portfolio"])


@router.get("/portfolio/{wallet_address}", response_model=PortfolioResponse)
async def get_portfolio(wallet_address: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TokenHolder)
        .options(selectinload(TokenHolder.property))
        .where(TokenHolder.wallet_address == wallet_address)
    )
    holdings = result.scalars().all()

    holding_responses = [
        HoldingResponse(
            property_id=h.property_id,
            property_title=h.property.title,
            property_address=h.property.address,
            token_amount=h.token_amount,
            price_per_token=Decimal(str(h.property.price_per_token)),
            holding_value=Decimal(str(h.property.price_per_token)) * h.token_amount,
        )
        for h in holdings
    ]

    total_value = sum(h.holding_value for h in holding_responses) or Decimal("0")

    return PortfolioResponse(
        wallet_address=wallet_address,
        holdings=holding_responses,
        total_value=total_value,
    )
