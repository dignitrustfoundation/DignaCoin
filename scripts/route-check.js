// SPDX-License-Identifier: MIT
const hre = require("hardhat");
const { ethers } = hre;

const ABI = [
  "function stakingPool() view returns (address)",
  "function vault() view returns (address)",
  "function liquidityCollector() view returns (address)",
  "function devWallet() view returns (address)"
];

async function main() {
  const TOKEN = process.env.TOKEN;
  const SAFE = process.env.SAFE;
  if (!TOKEN || !SAFE) throw new Error("export TOKEN=0x... SAFE=0x...");

  const t = new ethers.Contract(TOKEN, ABI, ethers.provider);
  const [pool, vault, coll, dev] = await Promise.all([
    t.stakingPool(), t.vault(), t.liquidityCollector(), t.devWallet()
  ]);

  console.log("TOKEN:", TOKEN);
  console.log("SAFE :", SAFE);
  console.log("vault              =", vault);
  console.log("stakingPool        =", pool);
  console.log("liquidityCollector =", coll);
  console.log("devWallet          =", dev);

  console.log((vault.toLowerCase() === SAFE.toLowerCase()) ? "✅ 0.06% → SAFE" : "❌ vault != SAFE");
  console.log((dev.toLowerCase()   === SAFE.toLowerCase()) ? "✅ 0.01% → SAFE" : "❌ devWallet != SAFE");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
