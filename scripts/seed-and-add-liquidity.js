// SPDX-License-Identifier: MIT
const hre = require("hardhat");
const { ethers } = hre;

const TOKEN_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const COLLECTOR_ABI = [ "function addLiquidity() external" ];

async function main() {
  const TOKEN = process.env.TOKEN;
  const COLLECTOR = process.env.COLLECTOR;
  const DGN_FOR_LP = process.env.DGN_FOR_LP || "1000000";
  const BNB_FOR_LP = process.env.BNB_FOR_LP || "0.2";

  if (!TOKEN || !COLLECTOR) throw new Error("TOKEN et COLLECTOR doivent être définis dans .env");

  const [signer] = await ethers.getSigners();
  console.log("Network:", hre.network.name);
  console.log("Signer :", signer.address);

  const token = new ethers.Contract(TOKEN, TOKEN_ABI, signer);
  const coll  = new ethers.Contract(COLLECTOR, COLLECTOR_ABI, signer);

  const dec = await token.decimals();
  const amtDGN = ethers.parseUnits(DGN_FOR_LP, dec);

  console.log(`→ Transfer ${DGN_FOR_LP} DGN -> ${COLLECTOR}`);
  await (await token.transfer(COLLECTOR, amtDGN)).wait();

  console.log(`→ Send ${BNB_FOR_LP} ${(hre.network.name==="bsctest")?"tBNB":"BNB"} -> ${COLLECTOR}`);
  await (await signer.sendTransaction({ to: COLLECTOR, value: ethers.parseEther(BNB_FOR_LP) })).wait();

  console.log("→ collector.addLiquidity() (LP → lpRecipient)");
  const tx3 = await coll.addLiquidity();
  console.log("tx:", tx3.hash);
  await tx3.wait();

  console.log("✅ LP créée (LP envoyées à lpRecipient — lockable).");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
