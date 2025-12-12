// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * Upgradeable TokenVesting for ERC20 tokens (linear vesting with optional cliff and revocable feature)
 */
contract TokenVestingUpgradeable is Initializable, OwnableUpgradeable {
    IERC20 public token;
    address public beneficiary;
    uint256 public start;
    uint256 public cliff;
    uint256 public duration;

    uint256 public released;
    bool public revocable;
    bool public revoked;
    uint256 public revokedAt;

    event TokensReleased(uint256 amount);
    event Revoked(uint256 amount);

    function initialize(
        address tokenAddress,
        address beneficiaryAddress,
        uint256 startTimestamp,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool _revocable
    ) public initializer {
        __Ownable_init(_msgSender());
        require(beneficiaryAddress != address(0), "Vesting: beneficiary is zero address");
        require(vestingDuration > 0, "Vesting: duration is 0");
        require(cliffDuration <= vestingDuration, "Vesting: cliff > duration");

        token = IERC20(tokenAddress);
        beneficiary = beneficiaryAddress;
        start = startTimestamp;
        cliff = startTimestamp + cliffDuration;
        duration = vestingDuration;
        revocable = _revocable;
    }

    function release() public {
        require(msg.sender == beneficiary, "Vesting: only beneficiary");
        uint256 releasable = _releasableAmount();
        require(releasable > 0, "Vesting: no tokens to release");

        released += releasable;
        require(token.transfer(beneficiary, releasable), "Vesting: transfer failed");

        emit TokensReleased(releasable);
    }

    function revoke() external onlyOwner {
        require(revocable, "Vesting: not revocable");
        require(!revoked, "Vesting: already revoked");

        uint256 totalAllocation = token.balanceOf(address(this)) + released;
        uint256 vested = _vestedAmount();
        uint256 unvested = 0;
        if (totalAllocation > vested) {
            unvested = totalAllocation - vested;
        }

        revoked = true;
        revokedAt = block.timestamp;

        if (unvested > 0) {
            require(token.transfer(owner(), unvested), "Vesting: revoke transfer failed");
        }

        emit Revoked(unvested);
    }

    function _releasableAmount() internal view returns (uint256) {
        uint256 vested = _vestedAmount();
        if (vested <= released) return 0;
        return vested - released;
    }

    function releasableAmount() external view returns (uint256) {
        return _releasableAmount();
    }

    function _vestedAmount() internal view returns (uint256) {
        uint256 totalAllocation = token.balanceOf(address(this)) + released;
        uint256 currentTime = block.timestamp;
        if (revoked && revokedAt > 0) {
            currentTime = revokedAt;
        }

        if (currentTime < cliff) {
            return 0;
        } else if (currentTime >= start + duration) {
            return totalAllocation;
        } else {
            uint256 elapsed = currentTime - start;
            return (totalAllocation * elapsed) / duration;
        }
    }

    function vestedAmount() external view returns (uint256) {
        return _vestedAmount();
    }
}
