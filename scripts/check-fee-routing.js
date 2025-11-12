// SPDX-License-Identifier: MIT
// scripts/check-fee-routing.js
const hre = require("hardhat");
const { ethers } = hre;

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function stakingPool() view returns (address)",
  "function vault() view returns (address)",
  "function liquidityCollector() view returns (address)",
  "function isFeeExempt(address) view returns (bool)"
];

async function main() {
  const TOKEN = process.env.TOKEN;           // adresse token
  const RECEIVER = process.env.RECEIVER;     // p.ex un second wallet de test
  const AMOUNT_DGN = process.env.AMOUNT_DGN || "100000"; // montant lisible (en unités DGN)

  if (!TOKEN || !RECEIVER) {
    throw new Error("Env manquantes. export TOKEN=0x... RECEIVER=0x... [AMOUNT_DGN=...]");
  }

  const [signer] = await ethers.getSigners();
  const token = new ethers.Contract(TOKEN, TOKEN_ABI, signer);

  const dec = await token.decimals();
  const amt = ethers.parseUnits(AMOUNT_DGN, dec);

  const [pool, vault, coll] = await Promise.all([
    token.stakingPool(),
    token.vault(),
    token.liquidityCollector()
  ]);

  // (Dev wallet) — on prend celui de ton déploiement (dans ton code, c’est arg du constructor)
  // Ici on ne le lit pas on-chain, donc passe-le en ENV si tu veux suivre aussi son solde :
  const DEV = process.env.DEV_WALLET || "0x6B0695d07B77E83CBDA22A8B5ec0dba1CEAf157F";

  function fmt(x) { return ethers.formatUnits(x, dec); }

  async function bal(addr, label) {
    const b = await token.balanceOf(addr);
    console.log(label, addr, "=>", fmt(b), "DGN");
    return b;
  }

  console.log("=== Soldes AVANT ===");
  const bPool0 = await bal(pool,  "pool ");
  const bVault0 = await bal(vault,"vault");
  const bColl0 = await bal(coll,  "coll ");
  const bDev0  = await bal(DEV,   "dev  ");

  console.log(`\n→ Transfer ${AMOUNT_DGN} DGN au receiver ${RECEIVER}`);
  const tx = await token.transfer(RECEIVER, amt);
  console.log("tx:", tx.hash);
  await tx.wait();

  console.log("\n=== Soldes APRÈS ===");
  const bPool1 = await bal(pool,  "pool ");
  const bVault1 = await bal(vault,"vault");
  const bColl1 = await bal(coll,  "coll ");
  const bDev1  = await bal(DEV,   "dev  ");

  const dPool = bPool1 - bPool0;
  const dVault = bVault1 - bVault0;
  const dColl = bColl1 - bColl0;
  const dDev = bDev1 - bDev0;

  console.log("\n=== Deltas (réception des frais) ===");
  console.log("pool +", fmt(dPool));
  console.log("vault +", fmt(dVault));
  console.log("coll  +", fmt(dColl));
  console.log("dev   +", fmt(dDev));
  console.log("\nAttendu (sur 0.10%) — stake 0.02%, vault 0.06%, liq 0.01%, dev 0.01%.");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
