// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVestingUpgradeable.sol";

contract TokenVestingV2Upgradeable is TokenVestingUpgradeable {
    // Minor addition: allows querying a version
    function getVersion() public pure returns (string memory) {
        return "v2";
    }
}
