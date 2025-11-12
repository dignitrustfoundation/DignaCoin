const { ethers } = require("hardhat");

async function main() {
  console.log("=== 🔍 Vérification du setup Digna ===");

  // --- Adresses officielles (mainnet) ---
  const TOKEN_ADDRESS = "0x5AA59f0fC809fDd2813ed1Bc2EC47d8579C89F2d";
  const VAULT_ADDRESS = "0xC693a927478CE1A312b7322c0442c5edEfB5c45F";
  const STAKING_ADDRESS = "0xc6a238c9cab4a88eCc15dC4733b6219400D997B0";
  const COLLECTOR_ADDRESS = "0xdda713b3133ed01D8a77c7957Ab010d4eb8698EE";
  const SAFE_ADDRESS = "0x29F81FAfdD259695b3EC2A17113f3B653AcDc1ff";

  // --- Connexion aux contrats ---
  const token = await ethers.getContractAt("DignaHybridToken", TOKEN_ADDRESS);
  const vault = await ethers.getContractAt("SolidarityVault", VAULT_ADDRESS);
  const collector = await ethers.getContractAt("LiquidityCollector", COLLECTOR_ADDRESS);
  const staking = await ethers.getContractAt("StakingPool", STAKING_ADDRESS);

  // --- Lecture des owners (selon type de contrat) ---
  const tokenOwner = await token.owner();
  const vaultOwner = await vault.owner();
  const collectorOwner = await collector.owner();

  // Le StakingPool n’a pas de fonction owner()
  const stakingToken = await staking.dgn();
  const stakingLockDays = await staking.stakeLockSeconds();

  console.log("\n=== 👑 OWNERS ACTUELS ===");
  console.log("Token owner     :", tokenOwner);
  console.log("Vault owner     :", vaultOwner);
  console.log("Collector owner :", collectorOwner);
  console.log("StakingPool     : (non-ownable)");
  console.log("   ↳ Token lié  :", stakingToken);
  console.log("   ↳ Lock (sec) :", stakingLockDays.toString());

  // --- Liens internes du token ---
  const linkedVault = await token.vault();
  const linkedStaking = await token.stakingPool();
  const linkedCollector = await token.liquidityCollector();
  const devWallet = await token.devWallet();

  console.log("\n=== 🔗 LIENS INTERNES DU TOKEN ===");
  console.log("Vault lié au token      :", linkedVault);
  console.log("StakingPool lié au token:", linkedStaking);
  console.log("LiquidityCollector lié  :", linkedCollector);
  console.log("Dev wallet              :", devWallet);

  // --- Vérification SAFE ---
  console.log("\n=== 🧠 VALIDATION SAFE MULTISIG ===");
  let ok = true;
  if (vaultOwner.toLowerCase() !== SAFE_ADDRESS.toLowerCase()) {
    console.log("⚠️ Vault non transféré au SAFE !");
    ok = false;
  }
  if (collectorOwner.toLowerCase() !== SAFE_ADDRESS.toLowerCase()) {
    console.log("⚠️ Collector non transféré au SAFE !");
    ok = false;
  }
  if (ok) {
    console.log("✅ Vault et Collector sont bien possédés par le SAFE multisig.");
  }

  console.log("\n✅ Vérification terminée.");
}

main().catch((error) => {
  console.error("❌ Erreur :", error);
  process.exit(1);
});
