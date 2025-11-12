// SPDX-License-Identifier: MIT
const hre = require("hardhat");
const { ethers } = hre;

// Router V2 expose WETH() et factory()
const ROUTER = process.env.ROUTER || "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
const TOKEN  = process.env.TOKEN; // ex: export TOKEN=0x...

const ROUTER_ABI = [
  "function WETH() external pure returns (address)",
  "function factory() external view returns (address)"
];
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];
const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112,uint112,uint32)"
];

async function main() {
  if (!TOKEN) throw new Error("export TOKEN=0x... d'abord");
  const [signer] = await ethers.getSigners();

  const router  = new ethers.Contract(ROUTER, ROUTER_ABI, signer);
  const WBNB    = await router.WETH();
  const factory = new ethers.Contract(await router.factory(), FACTORY_ABI, signer);

  const pairAddr = await factory.getPair(TOKEN, WBNB);
  console.log("WBNB:", WBNB);
  console.log("Factory:", await router.factory());
  console.log("Pair:", pairAddr);

  if (pairAddr === ethers.ZeroAddress) {
    console.log("❌ Aucune pair trouvée (TOKEN/WBNB). Vérifie le tx d'addLiquidity.");
    return;
  }

  const pair = new ethers.Contract(pairAddr, PAIR_ABI, signer);
  const [t0, t1] = await Promise.all([pair.token0(), pair.token1()]);
  const [r0, r1] = await pair.getReserves();
  console.log("token0:", t0);
  console.log("token1:", t1);
  console.log("reserves:", r0.toString(), r1.toString());
}

main().catch((e)=>{ console.error(e); process.exit(1); });
