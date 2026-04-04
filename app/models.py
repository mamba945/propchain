from datetime import datetime, timezone
from sqlalchemy import String, Integer, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=True)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_token: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    mint_address: Mapped[str] = mapped_column(String(44), nullable=True)  # Solana pubkey
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    holders: Mapped[list["TokenHolder"]] = relationship("TokenHolder", back_populates="property")


class TokenHolder(Base):
    __tablename__ = "token_holders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    property_id: Mapped[int] = mapped_column(Integer, ForeignKey("properties.id"), nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(44), nullable=False, index=True)
    token_amount: Mapped[int] = mapped_column(Integer, nullable=False)

    property: Mapped["Property"] = relationship("Property", back_populates="holders")
