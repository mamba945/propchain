"""
Solana client helper for interacting with the PropChain Anchor program.

Provides on-chain transaction building for initialize_property and buy_tokens.
Falls back gracefully when Solana RPC is unavailable or misconfigured.
"""

import base64
import hashlib
import json
import logging
import struct

from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import ID as SYSTEM_PROGRAM_ID
from solders.instruction import Instruction, AccountMeta
from solders.transaction import Transaction
from solders.message import Message
from solana.rpc.async_api import AsyncClient

from app.database import settings

logger = logging.getLogger(__name__)

TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
ASSOCIATED_TOKEN_PROGRAM_ID = Pubkey.from_string(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
)
SYSVAR_RENT_ID = Pubkey.from_string("SysvarRent111111111111111111111111111111111")


def _discriminator(instruction_name: str) -> bytes:
    """Anchor instruction discriminator: sha256('global:<name>')[:8]."""
    return hashlib.sha256(f"global:{instruction_name}".encode()).digest()[:8]


def _encode_string(s: str) -> bytes:
    """Borsh-encode a string: 4-byte LE length prefix + UTF-8 bytes."""
    encoded = s.encode("utf-8")
    return struct.pack("<I", len(encoded)) + encoded


def _get_ata(owner: Pubkey, mint: Pubkey) -> Pubkey:
    """Derive the associated token account address."""
    return Pubkey.find_program_address(
        [bytes(owner), bytes(TOKEN_PROGRAM_ID), bytes(mint)],
        ASSOCIATED_TOKEN_PROGRAM_ID,
    )[0]


class SolanaClient:
    """Async helper for PropChain on-chain interactions."""

    def __init__(self) -> None:
        self.rpc = AsyncClient(settings.SOLANA_RPC_URL)
        self.program_id = Pubkey.from_string(settings.PROGRAM_ID)
        self._server_keypair: Keypair | None = None

        if settings.SOLANA_PRIVATE_KEY:
            try:
                raw = settings.SOLANA_PRIVATE_KEY.strip()
                if raw.startswith("["):
                    # JSON byte-array format (e.g. from solana-keygen)
                    byte_list = json.loads(raw)
                    self._server_keypair = Keypair.from_bytes(bytes(byte_list))
                else:
                    # Base58-encoded secret key
                    self._server_keypair = Keypair.from_base58_string(raw)
                logger.info(
                    "Solana server wallet loaded: %s",
                    self._server_keypair.pubkey(),
                )
            except Exception as exc:
                logger.warning("Invalid SOLANA_PRIVATE_KEY – running in mock mode: %s", exc)

    @property
    def configured(self) -> bool:
        """True when a valid server keypair is available."""
        return self._server_keypair is not None

    @property
    def server_pubkey(self) -> Pubkey | None:
        return self._server_keypair.pubkey() if self._server_keypair else None

    async def close(self) -> None:
        await self.rpc.close()

    # ------------------------------------------------------------------
    # initialize_property  (server signs as owner)
    # ------------------------------------------------------------------
    async def initialize_property(
        self,
        title: str,
        address: str,
        total_tokens: int,
        price_per_token_lamports: int,
        uri: str = "",
    ) -> tuple[str, str]:
        """
        Submit an initialize_property transaction.

        Returns
        -------
        (tx_signature, mint_address)

        Raises
        ------
        RuntimeError  if the server keypair is not configured.
        Exception     on any RPC / transaction error.
        """
        if not self._server_keypair:
            raise RuntimeError("Server keypair not configured")

        owner = self._server_keypair
        mint = Keypair()
        owner_pub = owner.pubkey()
        mint_pub = mint.pubkey()

        property_pda, _ = Pubkey.find_program_address(
            [b"property", bytes(owner_pub), bytes(mint_pub)],
            self.program_id,
        )
        property_vault = _get_ata(property_pda, mint_pub)

        data = (
            _discriminator("initialize_property")
            + _encode_string(title)
            + _encode_string(address)
            + struct.pack("<Q", total_tokens)
            + struct.pack("<Q", price_per_token_lamports)
            + _encode_string(uri)
        )

        ix = Instruction(
            program_id=self.program_id,
            accounts=[
                AccountMeta(owner_pub, is_signer=True, is_writable=True),
                AccountMeta(property_pda, is_signer=False, is_writable=True),
                AccountMeta(mint_pub, is_signer=True, is_writable=True),
                AccountMeta(property_vault, is_signer=False, is_writable=True),
                AccountMeta(TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
                AccountMeta(
                    ASSOCIATED_TOKEN_PROGRAM_ID, is_signer=False, is_writable=False
                ),
                AccountMeta(SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
                AccountMeta(SYSVAR_RENT_ID, is_signer=False, is_writable=False),
            ],
            data=bytes(data),
        )

        blockhash = (await self.rpc.get_latest_blockhash()).value.blockhash
        msg = Message.new_with_blockhash([ix], owner_pub, blockhash)
        tx = Transaction.new_unsigned(msg)
        tx.sign([owner, mint], blockhash)

        resp = await self.rpc.send_transaction(tx)
        sig = str(resp.value)

        logger.info("initialize_property tx=%s mint=%s", sig, mint_pub)
        return sig, str(mint_pub)

    # ------------------------------------------------------------------
    # buy_tokens  (returns unsigned tx for frontend to sign)
    # ------------------------------------------------------------------
    async def build_buy_tokens_tx(
        self,
        buyer_pubkey_str: str,
        mint_address: str,
        amount: int,
    ) -> tuple[str, str]:
        """
        Build an unsigned buy_tokens transaction.

        Returns
        -------
        (serialized_tx_base64, message)

        The frontend must sign the transaction with the buyer's wallet
        and submit it to the Solana network.
        """
        if not self._server_keypair:
            raise RuntimeError("Server keypair not configured")

        buyer_pub = Pubkey.from_string(buyer_pubkey_str)
        mint_pub = Pubkey.from_string(mint_address)
        owner_pub = self._server_keypair.pubkey()

        property_pda, _ = Pubkey.find_program_address(
            [b"property", bytes(owner_pub), bytes(mint_pub)],
            self.program_id,
        )
        property_vault = _get_ata(property_pda, mint_pub)
        buyer_ata = _get_ata(buyer_pub, mint_pub)

        data = _discriminator("buy_tokens") + struct.pack("<Q", amount)

        ix = Instruction(
            program_id=self.program_id,
            accounts=[
                AccountMeta(buyer_pub, is_signer=True, is_writable=True),
                AccountMeta(owner_pub, is_signer=False, is_writable=True),
                AccountMeta(property_pda, is_signer=False, is_writable=True),
                AccountMeta(mint_pub, is_signer=False, is_writable=False),
                AccountMeta(property_vault, is_signer=False, is_writable=True),
                AccountMeta(buyer_ata, is_signer=False, is_writable=True),
                AccountMeta(TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
                AccountMeta(
                    ASSOCIATED_TOKEN_PROGRAM_ID, is_signer=False, is_writable=False
                ),
                AccountMeta(SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
            ],
            data=bytes(data),
        )

        blockhash = (await self.rpc.get_latest_blockhash()).value.blockhash
        msg = Message.new_with_blockhash([ix], buyer_pub, blockhash)
        tx = Transaction.new_unsigned(msg)

        serialized = base64.b64encode(bytes(tx)).decode("ascii")
        return serialized, "Sign and submit this transaction with your wallet"


# Singleton instance – import from here.
solana_client = SolanaClient()
