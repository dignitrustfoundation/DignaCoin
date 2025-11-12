// scripts/verify_and_renounce.js
// Usage :
//   npx hardhat run scripts/verify_and_renounce.js --network bsc
//   npx hardhat run scripts/verify_and_renounce.js --network bsc --renounce

const hre = require("hardhat");
const { ethers } = hre;

const ADDRS = {
  token:       "0x5AA59f0fC809fDd2813ed1Bc2EC47d8579C89F2d",
  vault:       "0xC693a927478CE1A312b7322c0442c5edEfB5c45F",
  pool:        "0xc6a238c9cab4a88eCc15dC4733b6219400D997B0",
  collector:   "0xdda713b3133ed01D8a77c7957Ab010d4eb8698EE",
  router:      "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  lpRecipient: "0x29F81FAfdD259695b3EC2A17113f3B653AcDc1ff",
};

const OWNERS = {
  tokenOwner: "0x6524DdD537B7e0e710888A1Fd8a3bCBc8B8fd9F2", // owner token = wallet main
  vaultOwner: "0x29F81FAfdD259695b3EC2A17113f3B653AcDc1ff", // owner vault = SAFE
  collOwner:  "0x29F81FAfdD259695b3EC2A17113f3B653AcDc1ff", // owner collector = SAFE
};

const ZERO = "0x0000000000000000000000000000000000000000";
const isAddr = (x) => typeof x === "string" && ethers.utils.isAddress(x);
const eq = (a,b) => (a||"").toLowerCase() === (b||"").toLowerCase();

function flattenCallResult(res) {
  // Normalise le résultat d'un call ethers v6:
  // - string unique -> [string]
  // - array -> array
  // - object/Result -> on prend les indexes 0..n-1
  if (Array.isArray(res)) return res;
  if (typeof res === "string") return [res];
  if (res && typeof res === "object") {
    const out = [];
    let i = 0;
    while (res[i] !== undefined) { out.push(res[i]); i++; }
    return out;
  }
  return [];
}

async function discoverZeroInputReturns(contract) {
  // Explore toutes les fonctions 0-input, récupère chaque sortie (même multiples)
  // et renvoie un tableau: [{name, index, value}]
  const frags = contract.interface.fragments.filter(f =>
    f.type === "function" && (f.inputs?.length ?? 0) === 0
  );
  const out = [];
  for (const f of frags) {
    try {
      const res = await contract[f.name]();
      const flat = flattenCallResult(res);
      flat.forEach((v, idx) => {
        if (isAddr(v)) out.push({ name: f.name, index: idx, value: v });
      });
    } catch (_) { /* ignore les fonctions qui revert exigent args, etc. */ }
  }
  return out; // [{name:"route", index:0, value:"0x..."}]
}

function findByValue(entries, expected) {
  return entries.find(e => eq(e.value, expected)) || null;
}

async function main() {
  const [signer] = await ethers.getSigners();
  const doRenounce = process.argv.some(a => a === "--renounce");

  console.log("Network :", hre.network.name);
  console.log("Signer  :", signer.address);
  console.log("Renounce:", doRenounce ? "YES (token only)" : "no");
  console.log("---------");

  const token     = await ethers.getContractAt("DignaHybridToken", ADDRS.token);
  const vault     = await ethers.getContractAt("SolidarityVault", ADDRS.vault);
  const collector = await ethers.getContractAt("LiquidityCollector", ADDRS.collector);
  const staking   = await ethers.getContractAt("StakingPool", ADDRS.pool);

  // Owners directs
  const tokenOwner = await token.owner();
  const vaultOwner = await vault.owner();
  const collOwner  = await collector.owner();

  // === Découverte auto côté Token (0-input, multi-out support) ===
  const tokenZeroOuts = await discoverZeroInputReturns(token);
  const tVault  = findByValue(tokenZeroOuts, ADDRS.vault);
  const tColl   = findByValue(tokenZeroOuts, ADDRS.collector);
  const tPool   = findByValue(tokenZeroOuts, ADDRS.pool);

  // === Côté Vault
  const vaultZeroOuts = await discoverZeroInputReturns(vault);
  const vToken = findByValue(vaultZeroOuts, ADDRS.token);
  const vColl  = findByValue(vaultZeroOuts, ADDRS.collector);

  // === Côté Collector
  const collZeroOuts = await discoverZeroInputReturns(collector);
  const cToken = findByValue(collZeroOuts, ADDRS.token);
  const cVault = findByValue(collZeroOuts, ADDRS.vault);

  // Affichage lisible
  console.log("Token.owner()                :", tokenOwner);
  console.log(
    `Token.${tVault ? `${tVault.name}[${tVault.index}]` : "(introuvable)"} :`,
    ADDRS.vault
  );
  console.log(
    `Token.${tColl ? `${tColl.name}[${tColl.index}]` : "(introuvable)"}  :`,
    ADDRS.collector
  );
  console.log(
    `Token.${tPool ? `${tPool.name}[${tPool.index}]` : "(introuvable)"}  :`,
    ADDRS.pool
  );
  console.log("---");
  console.log("Vault.owner()                :", vaultOwner);
  console.log(
    `Vault.${vToken ? `${vToken.name}[${vToken.index}]` : "(introuvable)"}  :`,
    ADDRS.token
  );
  console.log(
    `Vault.${vColl ? `${vColl.name}[${vColl.index}]` : "(introuvable)"}   :`,
    ADDRS.collector
  );
  console.log("---");
  console.log("Collector.owner()            :", collOwner);
  console.log(
    `Collector.${cToken ? `${cToken.name}[${cToken.index}]` : "(introuvable)"}:`,
    ADDRS.token
  );
  console.log(
    `Collector.${cVault ? `${cVault.name}[${cVault.index}]` : "(introuvable)"}:`,
    ADDRS.vault
  );
  console.log("---");
  console.log("Router                       :", ADDRS.router);
  console.log("LP Recipient (off-chain)     :", ADDRS.lpRecipient);
  console.log("---------");

  // Checks câblage stricts
  if (!tVault)  throw new Error("❌ Lien token→vault introuvable (pas de 0-input output qui renvoie l'adresse du Vault).");
  if (!tColl)   throw new Error("❌ Lien token→collector introuvable.");
  if (!tPool)   throw new Error("❌ Lien token→stakingPool introuvable.");

  if (!vToken)  throw new Error("❌ Lien vault→token introuvable.");
  if (!vColl)   throw new Error("❌ Lien vault→collector introuvable.");

  if (!cToken)  throw new Error("❌ Lien collector→token introuvable.");
  if (!cVault)  throw new Error("❌ Lien collector→vault introuvable.");

  console.log("✅ Câblages OK.");

  // Checks ownership (conformément à ton état actuel)
  if (!eq(tokenOwner, OWNERS.tokenOwner)) {
    console.warn(`⚠️ Token.owner inattendu.\n  Attendu : ${OWNERS.tokenOwner}\n  Reçu    : ${tokenOwner}`);
  }
  if (!eq(vaultOwner, OWNERS.vaultOwner)) {
    console.warn(`⚠️ Vault.owner inattendu.\n  Attendu : ${OWNERS.vaultOwner}\n  Reçu    : ${vaultOwner}`);
  }
  if (!eq(collOwner, OWNERS.collOwner)) {
    console.warn(`⚠️ Collector.owner inattendu.\n  Attendu : ${OWNERS.collOwner}\n  Reçu    : ${collOwner}`);
  }

  // Renonciation éventuelle du Token
  if (doRenounce) {
    console.log("→ Renonciation à l’ownership du Token…");
    const tx = await token.renounceOwnership();
    console.log("  tx:", tx.hash);
    const rcpt = await tx.wait();
    console.log("  status:", rcpt.status === 1 ? "success" : "failed");
    const ownerAfter = await token.owner();
    if (!eq(ownerAfter, ZERO)) throw new Error("❌ Renonciation non effective (owner ≠ ZERO).");
    console.log("✅ Renonciation Token effectuée.");
  } else {
    console.log("ℹ️ Mode vérification uniquement (aucune renonciation effectuée).");
  }

  // Post-check: revérifie qu’on retrouve encore les mêmes adresses
  const tokenZeroOuts2 = await discoverZeroInputReturns(token);
  const againVaultOK = !!findByValue(tokenZeroOuts2, ADDRS.vault);
  const againCollOK  = !!findByValue(tokenZeroOuts2, ADDRS.collector);
  const againPoolOK  = !!findByValue(tokenZeroOuts2, ADDRS.pool);
  if (!againVaultOK || !againCollOK || !againPoolOK) {
    throw new Error("❌ Les liaisons du Token ont changé après l’opération (anormal).");
  }
  console.log("✅ Post-checks OK. Tout est cohérent.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
