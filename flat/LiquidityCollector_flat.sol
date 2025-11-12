// Sources flattened with hardhat v2.27.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/interfaces/IERC20.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


// File contracts/interfaces/IPancakeRouter.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;

interface IPancakeRouter {
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}


// File contracts/LiquidityCollector.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.19;


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
}

contract LiquidityCollector is Ownable {
    address public token;
    address public router;
    address public lpRecipient;

    bool public tokenSet;
    bool public routerSet;
    bool public lpRecipientSet;

    event TokenSet(address token);
    event RouterSet(address router);
    event LpRecipientSet(address lpRecipient);
    event LiquidityAdded(uint256 amountToken, uint256 amountBNB, uint256 lpMinted, address to);

    constructor(address _token, address _router, address _lpRecipient) Ownable(msg.sender) {
        require(_token != address(0) && _router != address(0), "zero");
        token = _token;
        router = _router;
        lpRecipient = (_lpRecipient != address(0)) ? _lpRecipient : msg.sender;
        tokenSet = true;
        routerSet = true;
        lpRecipientSet = true;
        emit TokenSet(token);
        emit RouterSet(router);
        emit LpRecipientSet(lpRecipient);
    }

    // One-shot setters (sécurise la config si tu veux déployer en 2 temps)
    function setTokenOnce(address _token) external onlyOwner {
        require(!tokenSet, "already set");
        require(_token != address(0), "zero");
        token = _token;
        tokenSet = true;
        emit TokenSet(_token);
    }

    function setRouterOnce(address _router) external onlyOwner {
        require(!routerSet, "already set");
        require(_router != address(0), "zero");
        router = _router;
        routerSet = true;
        emit RouterSet(_router);
    }

    function setLpRecipientOnce(address _to) external onlyOwner {
        require(!lpRecipientSet, "already set");
        require(_to != address(0), "zero");
        lpRecipient = _to;
        lpRecipientSet = true;
        emit LpRecipientSet(_to);
    }

    receive() external payable {}

    function addLiquidity() external onlyOwner {
        require(tokenSet && routerSet && lpRecipientSet, "not configured");
        uint256 balToken = IERC20(token).balanceOf(address(this));
        uint256 balBNB = address(this).balance;
        require(balToken > 0 && balBNB > 0, "no balance");

        // Approve compatible avec ERC20 stricts
        IERC20(token).approve(router, 0);
        IERC20(token).approve(router, balToken);

        (uint amountToken, uint amountETH, uint liquidity) =
            IPancakeRouter(router).addLiquidityETH{value: balBNB}(
                token,
                balToken,
                0,
                0,
                lpRecipient,           // <<<<<< LP vers destinataire contrôlé
                block.timestamp
            );

        emit LiquidityAdded(amountToken, amountETH, liquidity, lpRecipient);
    }

    // Secours admin (au cas où tu veux “repackager” les 0.01% avant d’ajouter la LP)
    function rescueToken(address erc20, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero");
        IERC20(erc20).transfer(to, amount);
    }

    function rescueBNB(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "bn failed");
    }
}
