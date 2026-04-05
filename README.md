<img src="https://img.shields.io/badge/Solana-devnet-9945FF?style=for-the-badge&logo=solana" /> <img src="https://img.shields.io/badge/Anchor-0.30-512DA8?style=for-the-badge" /> <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" /> <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" /> <img src="https://img.shields.io/badge/PostgreSQL-asyncpg-336791?style=for-the-badge&logo=postgresql" />

---

```
██████╗ ██████╗  ██████╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗███╗  ██╗
██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██║████╗ ██║
██████╔╝██████╔╝██║   ██║██████╔╝██║     ███████║███████║██║██╔██╗██║
██╔═══╝ ██╔══██╗██║   ██║██╔═══╝ ██║     ██╔══██║██╔══██║██║██║╚████║
██║     ██║  ██║╚██████╔╝██║     ╚██████╗██║  ██║██║  ██║██║██║ ╚███║
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚══╝
```

# PropChain — Fractional Real Estate on Solana

> **Own a piece of the world's best properties with a single token.**
> PropChain brings fractional real-estate ownership fully on-chain — transparent, permissionless, and settled in seconds on Solana devnet.

---

## The Problem

Real estate is the world's largest asset class (~$330 trillion), yet it remains one of the least accessible investments:

- **High capital barriers** — buying even a small rental property demands tens or hundreds of thousands of dollars
- **Illiquidity** — once in, getting out takes months and layers of intermediaries
- **Opacity** — ownership records are siloed, outdated land registries buried in county courthouses
- **Exclusion** — rent income and appreciation flow only to those who can afford to play

---

## The Solution

PropChain tokenizes real-world properties as **SPL tokens on Solana**. Each token represents a fractional share of a physical asset. Investors can:

- Buy exposure to premium real estate for as little as the price of one token (denominated in SOL)
- Track their entire portfolio across properties through a single wallet lookup
- Receive proportional rent distributions (roadmap) programmatically via the smart contract
- Verify ownership on-chain — no lawyers, no title companies, no waiting

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                               │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │              React 19 + Vite + Tailwind CSS                  │  │
│   │                                                              │  │
│   │  ┌────────────┐  ┌──────────────────┐  ┌─────────────────┐  │  │
│   │  │  Home Page │  │ Property Detail  │  │  Portfolio      │  │  │
│   │  │  (listings)│  │ (invest panel)   │  │  (wallet lookup)│  │  │
│   │  └─────┬──────┘  └────────┬─────────┘  └────────┬────────┘  │  │
│   │        └─────────────────┬┘────────────────────-┘           │  │
│   │                    lib/api.js (fetch)                        │  │
│   └──────────────────────────┼───────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP/JSON  (Vite proxy → :8000)
┌──────────────────────────────▼──────────────────────────────────────┐
│                       FastAPI Backend  (:8000)                      │
│                                                                     │
│  ┌───────────────────────┐   ┌─────────────────────────────────┐   │
│  │   /properties router  │   │       /portfolio router         │   │
│  │                       │   │                                 │   │
│  │  POST  /properties    │   │  GET /portfolio/{wallet}        │   │
│  │  GET   /properties    │   │                                 │   │
│  │  GET   /properties/id │   └─────────────────────────────────┘   │
│  │  POST  /properties/   │                                         │
│  │        {id}/buy       │   ┌─────────────────────────────────┐   │
│  └──────────┬────────────┘   │        SolanaClient             │   │
│             │                │  • initialize_property()        │   │
│  ┌──────────▼────────────┐   │  • build_buy_tokens_tx()        │   │
│  │  SQLAlchemy (async)   │   │  • Anchor discriminators        │   │
│  │  asyncpg driver       │   │  • Borsh serialization          │   │
│  └──────────┬────────────┘   └────────────────┬────────────────┘   │
└─────────────┼───────────────────────────────-─┼────────────────────┘
              │                                  │ JSON-RPC
┌─────────────▼──────────────┐   ┌──────────────▼────────────────────┐
│       PostgreSQL            │   │        Solana Devnet RPC           │
│                             │   │                                    │
│  ┌────────────────────────┐ │   │  ┌──────────────────────────────┐ │
│  │ properties             │ │   │  │  PropChain Anchor Program    │ │
│  │  id, title, address    │ │   │  │                              │ │
│  │  total_tokens          │ │   │  │  initialize_property ix      │ │
│  │  price_per_token (SOL) │ │   │  │  ├─ creates SPL Mint         │ │
│  │  mint_address          │ │   │  │  ├─ creates Property PDA     │ │
│  └────────────────────────┘ │   │  │  └─ mints tokens to vault    │ │
│  ┌────────────────────────┐ │   │  │                              │ │
│  │ token_holders          │ │   │  │  buy_tokens ix               │ │
│  │  wallet_address        │ │   │  │  ├─ transfers SPL from vault  │ │
│  │  property_id (FK)      │ │   │  │  └─ to buyer ATA             │ │
│  │  token_amount          │ │   │  │                              │ │
│  └────────────────────────┘ │   │  │  Program ID:                 │ │
│                             │   │  │  73x5L22cQX2i8tTs9pv1pVpC3  │ │
└─────────────────────────────┘   │  │  oGWxaAvBAbC9VFJyGKz        │ │
                                  │  └──────────────────────────────┘ │
                                  └────────────────────────────────────┘
```

### Data Flow: Buying Tokens

```
Browser                  FastAPI               Solana Devnet
   │                        │                        │
   │  POST /properties/1/   │                        │
   │  buy {wallet, amount}  │                        │
   │ ─────────────────────► │                        │
   │                        │  build_buy_tokens_tx() │
   │                        │ ──────────────────────►│
   │                        │  unsigned tx (base64)  │
   │                        │ ◄──────────────────────│
   │                        │  upsert token_holder   │
   │                        │  in PostgreSQL         │
   │  {serialized_tx,       │                        │
   │   tx_signature (mock)} │                        │
   │ ◄───────────────────── │                        │
   │                        │                        │
   │  [wallet signs &       │                        │
   │   submits tx] ─────────────────────────────────►│
   │                        │                        │
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Smart Contract** | Rust + Anchor 0.30 | On-chain property PDAs, SPL token minting, atomic token transfers |
| **Blockchain** | Solana Devnet | ~400ms finality, sub-cent fees, SPL token standard |
| **Backend** | FastAPI 0.115 + Python 3.12 | REST API, Solana transaction building, Borsh serialization |
| **ORM** | SQLAlchemy 2.0 async + asyncpg | Non-blocking PostgreSQL queries |
| **Database** | PostgreSQL | Property registry, token holder ledger |
| **Solana SDK** | solana-py 0.35 + solders 0.21 | RPC client, keypair management, instruction building |
| **Frontend** | React 19 + Vite 8 | SPA, React Router v7, component-based UI |
| **Styling** | Tailwind CSS 4 | Utility-first dark-mode UI with custom teal/navy theme |
| **Migrations** | Alembic | Schema versioning |

---

## Smart Contract

**Program ID:** `73x5L22cQX2i8tTs9pv1pVpC3oGWxaAvBAbC9VFJyGKz`
**Network:** Solana Devnet
**Framework:** Anchor

### Instructions

#### `initialize_property`
Registers a new real-estate asset on-chain.

- Creates a new SPL **Mint** (one per property)
- Derives a **Property PDA** from seeds `["property", owner, mint]`
- Creates a **Property Vault** ATA and mints the full token supply into it
- Stores title, address, price-per-token (in lamports), and metadata URI

```
Accounts:
  owner          (signer, writable)   — server authority
  property_pda   (writable)           — PDA: ["property", owner, mint]
  mint           (signer, writable)   — fresh SPL mint keypair
  property_vault (writable)           — ATA(property_pda, mint)
  token_program
  associated_token_program
  system_program
  sysvar_rent
```

#### `buy_tokens`
Transfers fractional tokens from the property vault to a buyer's wallet.

- Moves `amount` tokens from **property vault** → **buyer ATA**
- Buyer pays in SOL; price validated against the Property PDA state
- Transaction is built server-side (unsigned) and returned to the frontend for wallet-signing

```
Accounts:
  buyer          (signer, writable)   — investor wallet
  owner          (writable)           — receives SOL payment
  property_pda   (writable)           — validates price & supply
  mint           (readonly)
  property_vault (writable)           — source of tokens
  buyer_ata      (writable)           — destination ATA
  token_program
  associated_token_program
  system_program
```

### Account Derivation

```
Property PDA:
  seeds = [b"property", owner_pubkey, mint_pubkey]
  program = 73x5L22cQX2i8tTs9pv1pVpC3oGWxaAvBAbC9VFJyGKz

Property Vault:
  ATA(owner=property_pda, mint=mint_pubkey)

Buyer ATA:
  ATA(owner=buyer_pubkey, mint=mint_pubkey)
```

---

## Features

### Fractional Ownership
Each property is divided into a configurable number of SPL tokens. An investor buys as few as 1 token, receiving a proportional on-chain claim to the asset — no minimum investment beyond the token price.

### SPL Token Standard
Property tokens are standard Solana SPL tokens, meaning they are compatible with every Solana wallet (Phantom, Backpack, Solflare) and any DEX or marketplace that supports the SPL standard. Future liquidity is built-in from day one.

### On-Chain Property Registry
Property metadata (title, address, supply, price) lives in a Solana PDA — not a centralized database. The backend PostgreSQL instance is a **read-cache** and holder ledger; the source of truth is the blockchain.

### Unsigned Transaction Flow
The backend builds buy transactions and returns them serialized in base64 — the frontend signs with the user's wallet and submits directly to the RPC. The server never holds user private keys.

### Rent Distribution (Roadmap)
The Property PDA design includes an `owner` authority that can sweep SOL from a rent-collection vault and distribute it pro-rata to token holders. The PDA structure already supports this instruction in the next milestone.

### Portfolio Tracker
Investors look up any wallet address to see a breakdown of all property tokens held, the price-per-token at time of purchase, and total portfolio value in SOL.

### Mock Mode
When `SOLANA_PRIVATE_KEY` is not set, the backend operates in **mock mode** — all token purchases are recorded in PostgreSQL and return a mock transaction signature, allowing full end-to-end testing without a funded devnet wallet.

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service status + Solana configuration |
| `POST` | `/properties` | Register a new tokenized property |
| `GET` | `/properties` | List all properties (newest first) |
| `GET` | `/properties/{id}` | Property detail + token availability |
| `POST` | `/properties/{id}/buy` | Purchase tokens (returns unsigned Solana tx) |
| `GET` | `/portfolio/{wallet}` | Token holdings + total value for a wallet |

Full interactive docs available at `http://localhost:8000/docs` (Swagger UI) when running locally.

---

## Running Locally

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 15+
- Solana CLI (optional — for live devnet transactions)

### 1. Clone & configure

```bash
git clone <repo-url>
cd propchain
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/propchain

# Optional — leave blank to run in mock mode
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=           # base58 or JSON byte-array from solana-keygen
PROGRAM_ID=73x5L22cQX2i8tTs9pv1pVpC3oGWxaAvBAbC9VFJyGKz
```

### 2. Backend

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# (Optional) seed sample properties
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API is now live at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App is now live at `http://localhost:5173`

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`.

### 4. Smart Contract (Anchor)

> Required only to re-deploy the program. The devnet deployment at `73x5L22cQX2i8tTs9pv1pVpC3oGWxaAvBAbC9VFJyGKz` is already live.

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.0 && avm use 0.30.0

cd anchor

# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

---

## Project Structure

```
propchain/
├── anchor/                     # Anchor (Rust) smart contract
│   ├── programs/
│   │   └── propchain/
│   │       └── lib.rs          # initialize_property + buy_tokens
│   ├── tests/                  # TypeScript integration tests
│   └── Anchor.toml             # Program ID + cluster config
│
├── app/                        # FastAPI backend
│   ├── main.py                 # App factory + lifespan
│   ├── models.py               # SQLAlchemy ORM (Property, TokenHolder)
│   ├── schemas.py              # Pydantic request/response models
│   ├── database.py             # Async engine + session factory
│   ├── solana_client.py        # Anchor instruction builder
│   └── routers/
│       ├── properties.py       # CRUD + buy endpoint
│       └── tokens.py           # Portfolio endpoint
│
├── frontend/                   # React SPA
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx        # Property listings + animated hero
│       │   ├── PropertyDetail.jsx  # Detail view + invest panel
│       │   └── Portfolio.jsx   # Wallet portfolio tracker
│       ├── components/
│       │   ├── Navbar.jsx      # Glass navbar with scroll-aware blur
│       │   ├── PropertyCard.jsx    # Card with hover glow + scale
│       │   └── BuyTokensModal.jsx  # Animated modal + form
│       ├── lib/api.js          # Fetch wrapper for backend
│       ├── App.jsx             # Route config + page transitions
│       └── index.css           # Tailwind + custom animations
│
├── seed.py                     # Seeds sample properties
├── requirements.txt
└── README.md
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL async connection string |
| `SOLANA_RPC_URL` | No | `https://api.devnet.solana.com` | Solana JSON-RPC endpoint |
| `SOLANA_PRIVATE_KEY` | No | — | Server keypair (base58 or JSON byte-array) |
| `PROGRAM_ID` | No | `73x5L22...` | Deployed Anchor program ID |

---

## Team

Built at **Decenthraton** hackathon.

| Name | Role |
|---|---|
| **Yee** | Full-stack — Solana contract, FastAPI backend, React frontend |

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <sub>Built with Solana · Anchor · FastAPI · React · PostgreSQL</sub>
</div>
