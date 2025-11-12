// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

contract SolidarityVault {
    address public immutable foundationSafe;
    address public token;
    address public owner;

    event OwnershipTransferred(address oldOwner, address newOwner);
    event TokenSet(address token);
    event DonationSent(address to, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address _foundationSafe) {
        require(_foundationSafe != address(0), "zero");
        foundationSafe = _foundationSafe;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function setTokenOnce(address _token) external onlyOwner {
        require(token == address(0), "already set");
        require(_token != address(0), "zero");
        token = _token;
        emit TokenSet(_token);
    }

    function sendAid(address to, uint256 amount) external onlyOwner {
        require(token != address(0), "token not set");
        require(to != address(0), "zero");
        IERC20(token).transfer(to, amount);
        emit DonationSent(to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero");
        owner = newOwner;
        emit OwnershipTransferred(msg.sender, newOwner);
    }

    function recover(address to, uint256 amount) external {
        require(msg.sender == foundationSafe, "not multisig");
        IERC20(token).transfer(to, amount);
    }
}
