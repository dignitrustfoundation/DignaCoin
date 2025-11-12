// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

contract StakingPool {
    IERC20 public immutable dgn;
    uint256 public immutable stakeLockSeconds;

    uint256 public totalStaked;
    mapping(address => uint256) public staked;
    mapping(address => uint256) public stakeTimestamp;

    uint256 public accRewardPerShare; // 1e18
    mapping(address => uint256) public rewardDebt;

    // Réserve de rewards (hors principal)
    uint256 public lastBalance;

    uint256 private locked = 1;
    modifier nonReentrant() {
        require(locked == 1, "reentrancy");
        locked = 2;
        _;
        locked = 1;
    }

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event Sync(uint256 added, uint256 accRewardPerShare);

    constructor(address _dgn, uint256 _stakeLockDays) {
        require(_dgn != address(0), "zero");
        dgn = IERC20(_dgn);
        stakeLockSeconds = _stakeLockDays * 1 days;
    }

    function _rewardReserve() internal view returns (uint256) {
        uint256 bal = dgn.balanceOf(address(this));
        if (bal >= totalStaked) return bal - totalStaked;
        return 0;
    }

    function sync() public {
        uint256 reserve = _rewardReserve();
        if (reserve > lastBalance && totalStaked > 0) {
            uint256 added = reserve - lastBalance;
            accRewardPerShare += (added * 1e18) / totalStaked;
            lastBalance = reserve;
            emit Sync(added, accRewardPerShare);
        }
    }

    function _claim(address user) internal returns (uint256 pending) {
        pending = (staked[user] * accRewardPerShare) / 1e18 - rewardDebt[user];
        if (pending > 0) {
            require(dgn.transfer(user, pending), "transfer failed");
            lastBalance -= pending;
            emit Claimed(user, pending);
        }
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "zero");
        sync();
        if (staked[msg.sender] > 0) {
            _claim(msg.sender);
        }
        require(dgn.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        staked[msg.sender] += amount;
        totalStaked += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
        rewardDebt[msg.sender] = (staked[msg.sender] * accRewardPerShare) / 1e18;
        // lastBalance ne bouge pas (on ajoute du principal)
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0 && staked[msg.sender] >= amount, "invalid");
        require(block.timestamp >= stakeTimestamp[msg.sender] + stakeLockSeconds, "locked");
        sync();
        _claim(msg.sender);
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        require(dgn.transfer(msg.sender, amount), "unstake transfer failed");
        rewardDebt[msg.sender] = (staked[msg.sender] * accRewardPerShare) / 1e18;
        emit Unstaked(msg.sender, amount);
    }

    function claim() external nonReentrant {
        sync();
        uint256 pending = (staked[msg.sender] * accRewardPerShare) / 1e18 - rewardDebt[msg.sender];
        require(pending > 0, "no pending");
        rewardDebt[msg.sender] += pending;
        require(dgn.transfer(msg.sender, pending), "transfer failed");
        lastBalance -= pending;
        emit Claimed(msg.sender, pending);
    }
}
