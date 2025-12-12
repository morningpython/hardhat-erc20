// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract JajaTokenUpgradeable is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, ERC20CappedUpgradeable, ERC20PausableUpgradeable, AccessControlUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function initialize(uint256 initialSupply, uint256 cap) public initializer {
        __ERC20_init("JaJa Token", "JAJA");
        __ERC20Capped_init(cap);
        __Pausable_init();
        __Ownable_init(_msgSender());
        __AccessControl_init();
        __UUPSUpgradeable_init();

        require(initialSupply <= cap, "Initial supply exceeds cap");
        _mint(_msgSender(), initialSupply);

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MINTER_ROLE, _msgSender());
        _grantRole(PAUSER_ROLE, _msgSender());
    }

    function mint(address to, uint256 amount) external {
        require(hasRole(MINTER_ROLE, _msgSender()), "JajaToken: must have MINTER_ROLE to mint");
        _mint(to, amount);
    }

    function pause() external {
        require(hasRole(PAUSER_ROLE, _msgSender()), "JajaToken: must have PAUSER_ROLE to pause");
        _pause();
    }

    function unpause() external {
        require(hasRole(PAUSER_ROLE, _msgSender()), "JajaToken: must have PAUSER_ROLE to unpause");
        _unpause();
    }

    // ERC20Capped and ERC20PausableUpgradeable handle supply cap and paused checks via _update, so no overrides required.

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // Resolve multiple inheritance for _update (ERC20Upgradeable, ERC20CappedUpgradeable, ERC20PausableUpgradeable)
    function _update(address from, address to, uint256 value)
        internal
        virtual
        override(ERC20Upgradeable, ERC20CappedUpgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }
}
