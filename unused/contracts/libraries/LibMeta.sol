// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IERC20.sol";

library LibMeta {
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256(bytes("EIP712Domain(string name,string version,uint256 salt,address verifyingContract)"));

    function domainSeparator(string memory name, string memory version)
        internal
        view
        returns (bytes32 domainSeparator_)
    {
        domainSeparator_ = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                getChainID(),
                address(this)
            )
        );
    }

    function getChainID() internal view returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }

    function msgSender() internal view returns (address sender_) {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender_ := and(mload(add(array, index)), 0xffffffffffffffffffffffffffffffffffffffff)
            }
        } else {
            sender_ = msg.sender;
        }
    }

    struct DiamondStorage {
        /// TODO: reorganize variable order => this will reflect on the DAPP
        uint256 MaintenancePeriod;
        uint256 TreasuryDefoRate;
        uint256 TreasuryDaiRate;
        uint256 CharityRate;
        uint256 RewardPoolDefoRate;
        uint256 TeamDaiRate;
        uint256 LiquidityDefoRate;
        uint256 LiquidityDaiRate;
        Counters.Counter _tokenIdCounter;
        IERC20Joe PaymentToken;
        IERC20Joe DefoToken;
        uint256[] RewardTaxTable;
        uint256 MinReward;  //minimum reward amount that's possible to withdraw
        uint256 RewardTime; //reward accrual periodicity - initially it's equal to one week in seconds
        uint256 MintLimitPeriod;
        /// @dev probably will be changed to treasury or distrubitor contract
        address Treasury;
        address RewardPool;
        address LimiterAddr;
        address Team;
        address Donation;
        address Vault;
        address Liquidity;
        /// @dev if it's 0 users can create unlimited nodes
        uint256 MaxGems;
        /// @dev sale lock
        bool Lock;
        bool transferLock;
        uint256 TotalCharity;
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibMeta");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
