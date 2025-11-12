// SPDX-License-Identifier: MIT
const hre = require("hardhat");

async function main() {
  const addr = process.env.CONTRACT_ADDRESS;
  if (!addr) throw new Error("CONTRACT_ADDRESS missing");

  const NAME = process.env.NAME || "Digna";
  const SYMBOL = process.env.SYMBOL || "DGN";
  const SUPPLY = Number(process.env.SUPPLY || "1000000000");
  const INIT_RECEIVER = process.env.INIT_RECEIVER;
  const INIT_OWNER    = process.env.INIT_OWNER;
  const DEV_WALLET    = process.env.DEV_WALLET || "0x6B0695d07B77E83CBDA22A8B5ec0dba1CEAf157F";

  if (!INIT_RECEIVER || !INIT_OWNER) throw new Error("INIT_RECEIVER/INIT_OWNER missing");

  const args = [NAME, SYMBOL, SUPPLY, INIT_RECEIVER, INIT_OWNER, DEV_WALLET];
  console.log("Verifying DignaHybridToken at", addr, "args:", args);

  await hre.run("verify:verify", { address: addr, constructorArguments: args });
}

main().catch(e => { console.error(e); process.exit(1); });
