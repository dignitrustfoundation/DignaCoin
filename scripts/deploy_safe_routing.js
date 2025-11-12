// SPDX-License-Identifier: MIT
const hre = require("hardhat");
const { ethers } = hre;

/*
 Objectif :
  - OWNER = 0x...157F (PRIVATE_KEY)
  - SAFE  = 0x...11F  (reçoit 0.06% vault + 0.01% dev)
  - stakingPool (contrat) reçoit 0.02%
  - liquidityCollector (contrat) reçoit 0.01%

 Détail technique :
  - constructor(..., devWallet=SAFE)
  - setVaultOnce(SAFE)
  - setStakingPoolOnce(poolAddr)
  - setLiquidityCollectorOnce(collAddr)
*/

async function main() {
  const [deployer] = await ethers.getSigners();
  const SAFE = process.env.SAFE;
  const ROUTER = process.env.ROUTER_TESTNET || process.env.ROUTER_MAINNET;
  if (!SAFE) throw new Error("SAFE manquant dans .env");
  if (!ROUTER) throw new Error("ROUTER_TESTNET/MAINNET manquant dans .env");

  console.log("Deployer (OWNER):", deployer.address);
  console.log("SAFE            :", SAFE);
  console.log("Network         :", hre.network.name);

  const NAME = "Digna";
  const SYMBOL = "DGN";
  const SUPPLY = 1_000_000_000;

  // 1) Token (devWallet = SAFE)
  const Token = await ethers.getContractFactory("DignaHybridToken");
  const token = await Token.deploy(NAME, SYMBOL, SUPPLY, deployer.address, deployer.address, SAFE);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("Token:", tokenAddr);

  // 2) StakingPool (0.02%)
  const Pool = await ethers.getContractFactory("StakingPool");
  const pool = await Pool.deploy(tokenAddr, 7);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("Pool :", poolAddr);

  // 3) LiquidityCollector (0.01%)
  const Collector = await ethers.getContractFactory("LiquidityCollector");
  const collector = await Collector.deploy(tokenAddr, ROUTER);
  await collector.waitForDeployment();
  const collAddr = await collector.getAddress();
  console.log("Coll :", collAddr);

  // 4) Câblage des destinataires (une seule fois)
  console.log("→ Câblage token.set*Once()");
  await (await token.setVaultOnce(SAFE)).wait();                 // 0.06% → SAFE
  await (await token.setStakingPoolOnce(poolAddr)).wait();       // 0.02% → Pool
  await (await token.setLiquidityCollectorOnce(collAddr)).wait();// 0.01% → Collector

  console.log("✅ Routing OK.");
  console.log({ tokenAddr, poolAddr, collAddr, safe: SAFE, router: ROUTER });
  console.log("ℹ️  Ensuite, seed la LP avec seed-and-add-liquidity.js (TOKEN & COLLECTOR).");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
