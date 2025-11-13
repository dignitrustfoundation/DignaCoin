# Digna Hybrid Suite

Système de token hybride avec staking, vault de solidarité et collecteur de liquidités pour la blockchain Binance Smart Chain (BSC).

## Contenu

- `contracts/` : DignaHybridToken, StakingPool, SolidarityVault, LiquidityCollector

## 🏗️ Architecture

- `hardhat.config.js`, `package.json`, `.env.example`

### Contrats Intelligents

- **DignaHybridToken** : Token ERC20 avec frais de transaction dynamiques
- **StakingPool** : Pool de staking pour les récompenses
- **SolidarityVault** : Vault de solidarité pour la redistribution
- **LiquidityCollector** : Collecteur automatique de liquidités

## 🚀 Démarrage rapide

### Installation
```bash
# Digna Hybrid Token

Project purpose
---------------
Digna is a hybrid token project designed to demonstrate an on-chain token model where small transaction fees are redistributed to community-oriented uses: staking rewards, a solidarity fund, and liquidity provisioning. The goal is to make the smart contract logic transparent and auditable while never exposing sensitive data or private keys.

Key principles:
- Open, auditable Solidity source code
- Clear separation of responsibilities (staking pool, solidarity vault, liquidity collector)
- No secrets or private keys hard-coded in the repository

Fees summary
------------
The token applies small, fixed fees on transfers that are distributed as follows:

- Solidarity vault: 0.06%
- Staking pool: 0.02%
- Liquidity collector: 0.01%
- Dev / maintenance: 0.01%

Total fee per transfer: 0.10% (values are immutable in the contract). These amounts power on-chain mechanisms such as staking rewards, solidarity donations, liquidity additions, and maintenance funds. No sensitive addresses are included here.

Public repository contents
--------------------------
- `contracts/`: main Solidity contracts (DignaHybridToken, StakingPool, SolidarityVault, LiquidityCollector, interfaces)
- `hardhat.config.js`: configuration (secrets are read from `.env`)
- `package.json`: dependencies and npm scripts
- `README.md`: public documentation

Files kept locally (not pushed)
------------------------------
Some deployment and packaging files are kept only locally and are excluded from the public repository via `.gitignore`:
- `scripts/` (deployment and utility scripts)
- `flat/` (flattened Solidity files)
- `artifacts/`, `cache/`, and `node_modules/`

Quick start
-----------
1. Install dependencies:
```powershell
npm install
```
2. Create a `.env` file at the project root (see `.env.example`):
```
PRIVATE_KEY=<your private key>
BSCSCAN_API_KEY=<your BscScan API key>
```
3. Compile:
```powershell
npx hardhat compile
```

Security
--------
- Never commit your `.env` file or private keys.
- Files listed in `.gitignore` are excluded from the public repo.

License
-------
See the `LICENSE` file for usage terms.

Contact / contributions
-----------------------
Contributions via Pull Requests are welcome. For security-sensitive coordination or deployment questions, open a private issue or contact the maintainers directly.
Sécurité
--------
- Ne commitez jamais votre fichier `.env` ni vos clés privées.
- Les fichiers listés dans `.gitignore` sont exclus du dépôt public.

Licence
-------
Consultez le fichier `LICENSE` pour les conditions d'utilisation.

Contact / contributions
-----------------------
Contributions bienvenues via Pull Requests. Pour les questions de sécurité ou coordination de déploiement, ouvrez une issue privée ou contactez les mainteneurs.
