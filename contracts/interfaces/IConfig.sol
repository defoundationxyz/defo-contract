// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

uint256 constant PAYMENT_TOKENS = 2;
uint256 constant WALLETS = 6;
uint256 constant TAX_TIERS = 4;

/// @dev token enum to index rates and addreses arrays
    enum PaymentTokens {
        Defo,
        Dai
    }

/// @dev protocol wallets for easy enumeration, the order is extremely important for deployed environment
    enum Wallets {
        Treasury,
        RewardPool,
        LiquidityPair,
        Charity,
        Team,
        RedeemContract
    }


/// @dev these tiers correspond to the configurable percentage from the diamond storage
    enum TaxTier {
        TIER0_NO_PAYMENT,
        TIER1_HUGE_TAX,
        TIER2_MEDIUM_TAX,
        TIER3_SMALL_TAX,
        NO_TAX
    }


    struct Addresses {
        IERC20[PAYMENT_TOKENS] paymentTokens;
        address payable[WALLETS] wallets;
    }

    /**
     * @notice A struct containing IncomeDistribution details on yield gem mint
     * @param onMint distribution of the payment among tokens in percent rates, all values use percentage multiplier (see percent helper), here addresses are from the Addresses
     */
    struct IncomeDistribution {
        uint256[WALLETS][PAYMENT_TOKENS] onMint;
    }

    /**
     * @notice A struct containing time periods-related configuration
     * @param maintenancePeriod a period in seconds for maintenance fee accrual, initially one month
     * @param rewardPeriod a period in seconds for generating yield gem rewards, initially one week
     * @param mintCountResetPeriod a period in seconds to wait until last mint to reset mint count for a gem type, initially 12 hrs.
     * @param taxScaleSinceLastClaimPeriod a period in seconds for a tax scale to work out, initially one week
     */
    struct TimePeriods {
        // @dev All periods are in seconds
        uint32 maintenancePeriod;
        uint32 rewardPeriod;
        uint32 mintCountResetPeriod;
        uint32 taxScaleSinceLastClaimPeriod;
    }

    /**
     * @notice A struct containing taxes and contributions
     * @param taxRates tax rates in percent (with percent multiplier, see percent helper contract), initially 30%, 30%, 15%, 0
     * @param charityContributionRate charity rate (w multiplier as all percent values in the project), initially 5%
     * @param taperRate taper rate, initially 20%
     */
    struct TaxesAndContributions {
        uint256[TAX_TIERS] taxRates;
        uint256 charityContributionRate;
        uint256 taperRate;
    }

    /**
     * @notice Locks for Yield Gem
     * @param mintLock no mint for all gems, no minting if set
     * @param transferLock no transfer if set
     */
    struct Locks {
        bool mintLock;
        bool transferLock;
    }

    /**
     * @notice Main Protocol Configuration structure
     */

    struct ProtocolConfig {
        Addresses addresses;
        IncomeDistribution incomeDistribution;
        TimePeriods timePeriods;
        TaxesAndContributions taxesAndContributions;
        Locks locks;
    }

/** @title  IConfig EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Configuration, setters and getters
*/
interface IConfig {

    function setConfig(ProtocolConfig calldata _config) external;

    function getConfig() external pure returns (ProtocolConfig memory);

}
