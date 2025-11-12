# Digna Hybrid Suite

## Contenu
- `contracts/` : DignaHybridToken, StakingPool, SolidarityVault, LiquidityCollector
- `scripts/` : deploy_all, seed-and-add-liquidity, check-balance, verify
- `hardhat.config.js`, `package.json`, `.env.example`

## Démarrage rapide
```bash
cp .env.example .env   # remplis PRIVATE_KEY
npm i
npx hardhat compile
npm run deploy:test
# note les adresses (token, coll)
TOKEN=0x... COLLECTOR=0x... npm run lp:test
