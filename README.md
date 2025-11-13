# Digna Hybrid Token Suite# Digna Hybrid Suite



Système de token hybride avec staking, vault de solidarité et collecteur de liquidités pour la blockchain Binance Smart Chain (BSC).## Contenu

- `contracts/` : DignaHybridToken, StakingPool, SolidarityVault, LiquidityCollector

## 🏗️ Architecture- `scripts/` : deploy_all, seed-and-add-liquidity, check-balance, verify

- `hardhat.config.js`, `package.json`, `.env.example`

### Contrats Intelligents

- **DignaHybridToken** : Token ERC20 avec frais de transaction dynamiques## Démarrage rapide

- **StakingPool** : Pool de staking pour les récompenses```bash

- **SolidarityVault** : Vault de solidarité pour la redistributioncp .env.example .env   # remplis PRIVATE_KEY

- **LiquidityCollector** : Collecteur automatique de liquiditésnpm i

- **Interfaces** : IERC20, IPancakeRouter pour l'intégration DEXnpx hardhat compile

npm run deploy:test

### Structure du Projet# note les adresses (token, coll)

```TOKEN=0x... COLLECTOR=0x... npm run lp:test

contracts/          # Contrats Solidity
├── DignaHybridToken.sol
├── StakingPool.sol
├── SolidarityVault.sol
├── LiquidityCollector.sol
└── interfaces/      # Interfaces ERC20 et Pancake Router

artifacts/          # Artefacts compilés Hardhat
├── build-info/
└── contracts/

cache/              # Cache Hardhat
hardhat.config.js   # Configuration réseau BSC
package.json        # Dépendances et scripts
```

## 🚀 Démarrage rapide

### Installation
```bash
npm install
```

### Configuration
Créez un fichier `.env` à la racine (voir `.env.example`) :
```
PRIVATE_KEY=votre_clé_privée
BSCSCAN_API_KEY=votre_clé_api_bscscan
```

### Compilation
```bash
npx hardhat compile
```

### Tests et Déploiement
```bash
# Testnet BSC
npm run deploy:test
npm run lp:test
npm run bal:main

# Mainnet BSC
npm run deploy:main
npm run lp:main
```

## 📋 Scripts Disponibles

Les scripts de déploiement et gestion sont disponibles dans le répertoire `scripts/` :
- `deploy_all.js` : Déployer tous les contrats
- `seed-and-add-liquidity.js` : Initialiser et ajouter de la liquidité
- `check-balance.js` : Vérifier les soldes
- `verify.js` : Vérifier les contrats sur BSCScan

## 🔐 Sécurité

⚠️ **N'engagez jamais vos clés privées ou fichiers `.env`**

Les fichiers sensibles suivants sont ignorés par Git :
- `.env` et variantes
- Fichiers de clés privées
- `node_modules/`
- Cache et artifacts générés

## 📜 Licence

Consultez le fichier LICENSE pour plus d'informations.
