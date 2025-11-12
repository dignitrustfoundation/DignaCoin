// SPDX-License-Identifier: MIT
// scripts/renounce.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const TOKEN = "0x5AA59f0fC809fDd2813ed1Bc2EC47d8579C89F2d"; // Ton token Digna
  const [signer] = await ethers.getSigners();

  console.log("🔑 Signer :", signer.address);
  console.log("⛓️ Network :", hre.network.name);
  console.log("🚀 Transaction : renounceOwnership()");

  const token = await ethers.getContractAt("DignaHybridToken", TOKEN, signer);
  const ownerBefore = await token.owner();
  console.log("👑 Owner actuel :", ownerBefore);

  if (ownerBefore.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("❌ Ce wallet n'est pas l'owner du contrat. Change de clé privée !");
  }

  const tx = await token.renounceOwnership();
  console.log("⏳ Tx envoyée :", tx.hash);
  const rcpt = await tx.wait();

  if (rcpt.status !== 1) throw new Error("❌ Transaction échouée !");
  console.log("✅ Renonciation réussie !");

  const ownerAfter = await token.owner();
  console.log("👑 Nouveau owner :", ownerAfter);
  if (ownerAfter === ethers.ZeroAddress) {
    console.log("🎯 Ownership bien renoncée !");
  } else {
    console.log("⚠️ Ownership non changée !");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
