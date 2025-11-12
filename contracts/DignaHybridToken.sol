// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

/*
 DignaHybridToken (Final version)
 - ERC20 clean, sans mint / proxy / blacklist / antiwhale modifiable.
 - Frais immuables répartis vers :
     * solidarityVault (0.06%)
     * stakingPool (0.02%)
     * liquidityCollector (0.01%)
     * devWallet (0.01%)
   => Total = 0.10%
 - Seules les adresses système (owner + pool + vault + collector + dev) sont exemptées de frais.
 - Aucune fonction admin cachée.
 - Compatible Hardhat / BNB Chain.
*/

abstract contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    constructor(address initialOwner) { owner = initialOwner; emit OwnershipTransferred(address(0), initialOwner); }
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero");
        owner = newOwner;
        emit OwnershipTransferred(msg.sender, newOwner);
    }
    function renounceOwnership() external onlyOwner {
        owner = address(0);
        emit OwnershipTransferred(msg.sender, address(0));
    }
}

contract DignaHybridToken is IERC20, Ownable {
    string public name;
    string public symbol;
    uint8 public immutable decimals = 18;
    uint256 private _totalSupply;

    // --- Frais (basis points / 10000) ---
    uint256 public immutable stakeFeeBP; // 2  = 0.02%
    uint256 public immutable vaultFeeBP; // 6  = 0.06%
    uint256 public immutable liqFeeBP;   // 1  = 0.01%
    uint256 public immutable devFeeBP;   // 1  = 0.01%
    uint256 public immutable totalFeeBP; // 10 = 0.10%

    // --- Destinataires ---
    address public stakingPool;
    address public vault;
    address public liquidityCollector;
    address public immutable devWallet;

    // --- Données ---
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) private _isFeeExempt;

    // --- Events ---
    event StakingPoolSet(address indexed pool);
    event VaultSet(address indexed vaultAddr);
    event LiquidityCollectorSet(address indexed collector);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 initialSupplyWhole,
        address initialReceiver,
        address initialOwner,
        address _devWallet
    ) Ownable(initialOwner) {
        require(initialReceiver != address(0) && _devWallet != address(0), "zero addr");

        name = _name;
        symbol = _symbol;

        // Répartition fixe : Vault 6, Stake 2, Liq 1, Dev 1 (Total 10)
        vaultFeeBP = 6;
        stakeFeeBP = 2;
        liqFeeBP   = 1;
        devFeeBP   = 1;
        totalFeeBP = 10;

        devWallet = _devWallet;

        _totalSupply = initialSupplyWhole * 1e18;
        _balances[initialReceiver] = _totalSupply;
        emit Transfer(address(0), initialReceiver, _totalSupply);

        _isFeeExempt[initialOwner]    = true;
        _isFeeExempt[initialReceiver] = true;
        _isFeeExempt[address(this)]   = true;
        _isFeeExempt[devWallet]       = true;
    }

    // --- One-shot setters ---
    function setStakingPoolOnce(address p) external onlyOwner {
        require(stakingPool == address(0), "already set");
        require(p != address(0), "zero");
        stakingPool = p;
        _isFeeExempt[p] = true;
        emit StakingPoolSet(p);
    }

    function setVaultOnce(address v) external onlyOwner {
        require(vault == address(0), "already set");
        require(v != address(0), "zero");
        vault = v;
        _isFeeExempt[v] = true;
        emit VaultSet(v);
    }

    function setLiquidityCollectorOnce(address c) external onlyOwner {
        require(liquidityCollector == address(0), "already set");
        require(c != address(0), "zero");
        liquidityCollector = c;
        _isFeeExempt[c] = true;
        emit LiquidityCollectorSet(c);
    }

    // --- ERC20 ---
    function totalSupply() external view returns (uint256) { return _totalSupply; }
    function balanceOf(address a) external view returns (uint256) { return _balances[a]; }
    function allowance(address owner_, address spender) external view returns (uint256) { return _allowances[owner_][spender]; }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "allowance");
        _allowances[from][msg.sender] = allowed - amount;
        emit Approval(from, msg.sender, _allowances[from][msg.sender]);
        _transfer(from, to, amount);
        return true;
    }

    // --- Logique de transfert ---
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0) && to != address(0), "zero addr");
        require(amount > 0, "zero amt");
        require(_balances[from] >= amount, "insufficient");

        uint256 feeAmount = 0;
        uint256 stakePart = 0;
        uint256 vaultPart = 0;
        uint256 liqPart = 0;
        uint256 devPart = 0;

        if (!_isFeeExempt[from] && !_isFeeExempt[to] && totalFeeBP > 0) {
            feeAmount = (amount * totalFeeBP) / 10000;
            stakePart = (amount * stakeFeeBP) / 10000;
            vaultPart = (amount * vaultFeeBP) / 10000;
            liqPart   = (amount * liqFeeBP)   / 10000;
            devPart   = (amount * devFeeBP)   / 10000;
        }

        _balances[from] -= amount;

        if (stakePart > 0 && stakingPool != address(0)) {
            _balances[stakingPool] += stakePart; emit Transfer(from, stakingPool, stakePart);
        }
        if (vaultPart > 0 && vault != address(0)) {
            _balances[vault] += vaultPart; emit Transfer(from, vault, vaultPart);
        }
        if (liqPart > 0 && liquidityCollector != address(0)) {
            _balances[liquidityCollector] += liqPart; emit Transfer(from, liquidityCollector, liqPart);
        }
        if (devPart > 0) {
            _balances[devWallet] += devPart; emit Transfer(from, devWallet, devPart);
        }

        uint256 sendAmt = amount - feeAmount;
        _balances[to] += sendAmt;
        emit Transfer(from, to, sendAmt);
    }

    // --- Vue utilitaire ---
    function isFeeExempt(address addr) external view returns (bool) { return _isFeeExempt[addr]; }
}
