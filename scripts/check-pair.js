// SPDX-License-Identifier: MIT
// scripts/check-pair.js
const hre = require("hardhat");
const { ethers } = hre;

// Pancake V2 factory (BSC TESTNET)
const FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17";
// Wrapped testnet WBNB (retourné aussi par le router mais on l’a en dur)
const WBNB_T = "0xae13d989dac2f0debff460ac112a837c89baa7cd";

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
];

async function main() {
  const TOKEN = process.env.TOKEN; // ex: export TOKEN=0x...
  if (!TOKEN) throw new Error("TOKEN manquant (export TOKEN=0x...)");

  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, ethers.provider);
  const pairAddr = await factory.getPair(TOKEN, WBNB_T);
  if (pairAddr === ethers.ZeroAddress) {
    console.log("❌ Pas de pair trouvé (TOKEN/WBNB). Attends la finalisation du tx ou vérifie la LP.");
    return;
    }
  console.log("Pair:", pairAddr);

  const pair = new ethers.Contract(pairAddr, PAIR_ABI, ethers.provider);
  const [t0, t1] = await Promise.all([pair.token0(), pair.token1()]);
  const [r0, r1] = await pair.getReserves();
  console.log("token0:", t0);
  console.log("token1:", t1);
  console.log("reserves:", r0.toString(), r1.toString());
}

main().catch((e)=>{ console.error(e); process.exit(1); });
