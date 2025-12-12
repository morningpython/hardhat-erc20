// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JajaToken is ERC20, ERC20Burnable, ERC20Capped, ERC20Pausable, Ownable {
    constructor(uint256 initialSupply, uint256 cap) ERC20("JaJa Token", "JAJA") ERC20Capped(cap) Ownable(msg.sender) {
        require(initialSupply <= cap, "Initial supply exceeds cap");
        _mint(msg.sender, initialSupply);
    }

    // Resolve multiple inheritance for _update (ERC20, ERC20Capped, ERC20Pausable)
    function _update(address from, address to, uint256 value)
        internal
        virtual
        override(ERC20, ERC20Capped, ERC20Pausable)
    {
        super._update(from, to, value);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ERC20Capped and ERC20Pausable handle cap and pause checks via _update, so no overrides are required here.
}
