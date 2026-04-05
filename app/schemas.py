from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


# Property schemas

class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    address: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(None, max_length=2000)
    total_tokens: int = Field(..., gt=0)
    price_per_token: Decimal = Field(..., gt=0, decimal_places=6)
    mint_address: str | None = Field(None, min_length=32, max_length=44)


class PropertyResponse(BaseModel):
    id: int
    title: str
    address: str
    description: str | None
    total_tokens: int
    price_per_token: Decimal
    mint_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyDetail(PropertyResponse):
    tokens_sold: int
    tokens_available: int


# Token / buy schemas

class BuyTokensRequest(BaseModel):
    wallet_address: str = Field(..., min_length=32, max_length=44)
    amount: int = Field(..., gt=0)


class BuyTokensResponse(BaseModel):
    property_id: int
    wallet_address: str
    amount_purchased: int
    total_cost: Decimal
    tx_signature: str | None = None
    serialized_tx: str | None = None
    mock: bool = False


# Portfolio schemas

class HoldingResponse(BaseModel):
    property_id: int
    property_title: str
    property_address: str
    token_amount: int
    price_per_token: Decimal
    holding_value: Decimal

    model_config = {"from_attributes": True}


class PortfolioResponse(BaseModel):
    wallet_address: str
    holdings: list[HoldingResponse]
    total_value: Decimal
