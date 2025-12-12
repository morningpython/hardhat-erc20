// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Simple linear vesting contract that accepts ERC20 tokens and releases them
 * linearly from a `start` time over `duration` seconds with an optional cliff.
 * The beneficiary can call `release()` to claim the vested tokens.
 */
contract TokenVesting is Context, Ownable {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public immutable cliff;
    uint256 public immutable duration;

    uint256 public released;
    bool public revocable;
    bool public revoked;
    uint256 public revokedAt;

    event TokensReleased(uint256 amount);
    event Revoked(uint256 amount);

    constructor(
        address tokenAddress,
        address beneficiaryAddress,
        uint256 startTimestamp,
        uint256 cliffDuration,
        uint256 vestingDuration
        , bool _revocable
    ) Ownable(msg.sender) {
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

        // compute amounts
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

    /**
     * @dev Returns the amount that has already vested but hasn't been released yet.
     */
    function releasableAmount() external view returns (uint256) {
        return _releasableAmount();
    }

    // Calculate the amount vested based on the contract's token balance plus already released amounts.
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
            // vested amount = totalAllocation * elapsed / duration
            return (totalAllocation * elapsed) / duration;
        }
    }

    /**
     * @dev Returns the amount vested up to the current timestamp.
     */
    function vestedAmount() external view returns (uint256) {
        return _vestedAmount();
    }
}
