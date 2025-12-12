// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./JajaTokenUpgradeable.sol";

contract JajaTokenV2Upgradeable is JajaTokenUpgradeable {
    // Example upgrade: add a convenience function returns the token version
    function getVersion() public pure returns (string memory) {
        return "v2";
    }
}
