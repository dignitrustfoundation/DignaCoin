// SPDX-License-Identifier: MIT
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network :", hre.network.name);

  // === ROUTER (mainnet / testnet) ===
  const ROUTER = (hre.network.name === "bsctest")
    ? process.env.ROUTER_TESTNET
    : process.env.ROUTER_MAINNET;
  if (!ROUTER) throw new Error("ROUTER env manquant pour ce réseau");

  // === PARAMÈTRES GLOBAUX ===
  const NAME = "Digna";
  const SYMBOL = "DGN";
  const SUPPLY = 1_000_000_000;

  const DEV_WALLET    = process.env.DEV_WALLET;
  const SAFE_MULTISIG = process.env.SAFE_MULTISIG;     // destinataire LP
  const OWNER         = process.env.OWNER_WALLET;      // nouveau propriétaire du token

  if (!DEV_WALLET || !SAFE_MULTISIG || !OWNER)
    throw new Error("DEV_WALLET / SAFE_MULTISIG / OWNER_WALLET manquants");

  console.log("\n=== CONFIG ===");
  console.log("OWNER_WALLET  :", OWNER);
  console.log("DEV_WALLET    :", DEV_WALLET);
  console.log("SAFE_MULTISIG :", SAFE_MULTISIG);
  console.log("ROUTER        :", ROUTER);
  console.log("================\n");

  // === 1) TOKEN ===
  const Token = await ethers.getContractFactory("DignaHybridToken");
  const token = await Token.deploy(NAME, SYMBOL, SUPPLY, OWNER, OWNER, DEV_WALLET);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("Token:", tokenAddr);

  console.log("→ Déploiement des composants (Vault, Pool, Collector) avant tout transfert...");

  // === 2) VAULT ===
  const Vault = await ethers.getContractFactory("SolidarityVault");
  const vault = await Vault.deploy(SAFE_MULTISIG);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("Vault :", vaultAddr);
  await (await vault.setTokenOnce(tokenAddr)).wait();

  // === 3) STAKING POOL ===
  const Pool = await ethers.getContractFactory("StakingPool");
  const pool = await Pool.deploy(tokenAddr, 7);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("Pool  :", poolAddr);

  // === 4) LIQUIDITY COLLECTOR ===
  const Collector = await ethers.getContractFactory("LiquidityCollector");
  const collector = await Collector.deploy(tokenAddr, ROUTER, SAFE_MULTISIG);
  await collector.waitForDeployment();
  const collAddr = await collector.getAddress();
  console.log("Coll  :", collAddr);

  // === 5) CÂBLAGE DU TOKEN ===
  console.log("→ Câblage token.set*Once()");
  await (await token.setVaultOnce(vaultAddr)).wait();
  await (await token.setStakingPoolOnce(poolAddr)).wait();
  await (await token.setLiquidityCollectorOnce(collAddr)).wait();

  // === 6) VÉRIF D'OWNER ===
  const owner = await token.owner();
  console.log("\nOwner du token :", owner);
  console.log(owner.toLowerCase() === OWNER.toLowerCase()
    ? "✅ Owner correct"
    : "❌ Attention: owner != OWNER_WALLET");

  console.log("\n✅ Deployment completed.");
  console.log({
    tokenAddr,
    vaultAddr,
    poolAddr,
    collAddr,
    router: ROUTER,
    lpRecipient: SAFE_MULTISIG
  });
  console.log("ℹ️  Ensuite: seed LP avec scripts/seed-and-add-liquidity.js (les LP iront à lpRecipient).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
