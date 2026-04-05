import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Propchain } from "../target/types/propchain";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("propchain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.propchain as Program<Propchain>;
  const owner = provider.wallet as anchor.Wallet;
  const buyer = Keypair.generate();
  const mint = Keypair.generate();

  let propertyPda: PublicKey;
  let propertyBump: number;
  let propertyVault: PublicKey;

  const TITLE = "Sunset Villa";
  const ADDRESS = "123 Ocean Drive, Miami, FL";
  const TOTAL_TOKENS = new anchor.BN(1000);
  const PRICE_PER_TOKEN = new anchor.BN(LAMPORTS_PER_SOL / 100); // 0.01 SOL
  const URI = "https://arweave.net/example-metadata";

  before(async () => {
    // Airdrop SOL to buyer for testing.
    const sig = await provider.connection.requestAirdrop(
      buyer.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Derive PDA.
    [propertyPda, propertyBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("property"),
        owner.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      program.programId
    );

    propertyVault = await getAssociatedTokenAddress(
      mint.publicKey,
      propertyPda,
      true // allowOwnerOffCurve for PDA
    );
  });

  it("Initializes a property", async () => {
    await program.methods
      .initializeProperty(TITLE, ADDRESS, TOTAL_TOKENS, PRICE_PER_TOKEN, URI)
      .accounts({
        owner: owner.publicKey,
        property: propertyPda,
        mint: mint.publicKey,
        propertyVault: propertyVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    const property = await program.account.property.fetch(propertyPda);
    assert.equal(property.title, TITLE);
    assert.equal(property.address, ADDRESS);
    assert.ok(property.totalTokens.eq(TOTAL_TOKENS));
    assert.ok(property.tokensSold.eq(new anchor.BN(0)));
    assert.ok(property.pricePerToken.eq(PRICE_PER_TOKEN));
    assert.equal(property.uri, URI);

    // Check vault has all tokens.
    const vaultAccount = await getAccount(provider.connection, propertyVault);
    assert.equal(Number(vaultAccount.amount), 1000);

    console.log("Property initialized successfully!");
  });

  it("Buys tokens", async () => {
    const amount = new anchor.BN(10);
    const buyerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      buyer.publicKey
    );

    await program.methods
      .buyTokens(amount)
      .accounts({
        buyer: buyer.publicKey,
        owner: owner.publicKey,
        property: propertyPda,
        mint: mint.publicKey,
        propertyVault: propertyVault,
        buyerTokenAccount: buyerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const property = await program.account.property.fetch(propertyPda);
    assert.ok(property.tokensSold.eq(amount));

    const buyerAccount = await getAccount(provider.connection, buyerAta);
    assert.equal(Number(buyerAccount.amount), 10);

    console.log("Bought 10 tokens successfully!");
  });

  it("Deposits rent", async () => {
    const rentAmount = new anchor.BN(LAMPORTS_PER_SOL); // 1 SOL

    await program.methods
      .depositRent(rentAmount)
      .accounts({
        owner: owner.publicKey,
        property: propertyPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const property = await program.account.property.fetch(propertyPda);
    assert.ok(property.rentPool.eq(rentAmount));

    console.log("Deposited 1 SOL rent successfully!");
  });

  it("Claims rent proportionally", async () => {
    const buyerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      buyer.publicKey
    );

    const balanceBefore = await provider.connection.getBalance(buyer.publicKey);

    await program.methods
      .claimRent()
      .accounts({
        claimer: buyer.publicKey,
        property: propertyPda,
        claimerTokenAccount: buyerAta,
      })
      .signers([buyer])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(buyer.publicKey);

    // Buyer holds 10/1000 = 1% of tokens, should get ~0.01 SOL from 1 SOL pool.
    const expectedShare = LAMPORTS_PER_SOL / 100;
    const actualGain = balanceAfter - balanceBefore;

    // Account for tx fees: gain should be close to expected (within 0.001 SOL).
    assert.ok(
      actualGain > expectedShare - LAMPORTS_PER_SOL / 1000,
      `Expected ~${expectedShare} lamports gain, got ${actualGain}`
    );

    console.log(`Claimed rent: ~${actualGain} lamports`);
  });

  it("Transfers tokens between wallets", async () => {
    const recipient = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      recipient.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const buyerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      buyer.publicKey
    );
    const recipientAta = await getAssociatedTokenAddress(
      mint.publicKey,
      recipient.publicKey
    );

    // Create recipient ATA first (using a separate tx or init_if_needed isn't on transfer).
    // We use the SPL helper via anchor for simplicity in the test.
    const { createAssociatedTokenAccountInstruction } = await import(
      "@solana/spl-token"
    );
    const createAtaIx = createAssociatedTokenAccountInstruction(
      buyer.publicKey,
      recipientAta,
      recipient.publicKey,
      mint.publicKey
    );

    const transferAmount = new anchor.BN(3);

    await program.methods
      .transferTokens(transferAmount)
      .accounts({
        sender: buyer.publicKey,
        fromTokenAccount: buyerAta,
        toTokenAccount: recipientAta,
        mint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .preInstructions([createAtaIx])
      .rpc();

    const recipientAccount = await getAccount(
      provider.connection,
      recipientAta
    );
    assert.equal(Number(recipientAccount.amount), 3);

    const buyerAccount = await getAccount(provider.connection, buyerAta);
    assert.equal(Number(buyerAccount.amount), 7); // 10 - 3

    console.log("Transferred 3 tokens successfully!");
  });
});
