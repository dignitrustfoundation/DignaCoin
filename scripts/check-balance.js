// SPDX-License-Identifier: MIT
// scripts/check-wallets-balance.js
const hre = require("hardhat");
const { ethers } = hre;

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

async function main() {
  const TOKEN = process.env.TOKEN;
  if (!TOKEN) throw new Error("⚠️  export TOKEN=0x... d'abord");

  // adresses du projet (vault, pool, collector, dev, etc.)
  const VAULT = process.env.VAULT || "0x1a4e8D937dF2964F7951Bcc67115dAC0E9B7A599";
  const POOL  = process.env.POOL  || "0xF2bf15FcfFADF1B676B3ba0f3bAE694f25aB4EDb";
  const COLL  = process.env.COLL  || "0x0c6Df689D8E02aEf87067109c994954C0aAc6eF0";
  const DEV   = process.env.DEV   || "0x6B0695d07B77E83CBDA22A8B5ec0dba1CEAf157F";
  const SAFE  = process.env.SAFE  || "0x29F81FAfdD259695b3EC2A17113f3B653AcDc1ff";

  const token = new ethers.Contract(TOKEN, TOKEN_ABI, ethers.provider);
  const [name, symbol, dec] = await Promise.all([
    token.name(), token.symbol(), token.decimals()
  ]);

  console.log(`=== Solde ${name} (${symbol}) ===`);
  async function print(addr, label) {
    const b = await token.balanceOf(addr);
    console.log(`${label.padEnd(10)}: ${ethers.formatUnits(b, dec)} ${symbol}`);
  }

  await print(VAULT, "Vault");
  await print(POOL,  "Pool");
  await print(COLL,  "Collector");
  await print(DEV,   "Dev wallet");
  await print(SAFE,  "Safe multisig");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
