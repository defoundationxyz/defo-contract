// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/ITransferLimiter.sol";
import "../base-facet/BaseFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract TransferLimitFacet is BaseFacet, ITransferLimiter {
    /* ============ External and Public Functions ============ */
    ///todo refactor transfer limiting operations to this facet
    function yieldGemTransferLimit(
        address from,
        address to,
        uint256 tokenId
    ) public {
    }

    function DEFOTokenTransferLimit(
        address from,
        address to,
        uint256 amount
    ) public {
        require(to != s.config.wallets[uint(Wallets.Vault)], "DEFO Token: not possible to send directly to vault");
        if (to == s.config.wallets[uint(Wallets.LiquidityPair)]) {
            uint256 endOfLimitWindow = s.defoTokenLimitWindow.timeOfLastSale[from] + s.config.defoTokenLimitConfig.saleLimitPeriod;
            require(
                (s.defoTokenLimitWindow.tokensSold[from] + amount <= s.config.defoTokenLimitConfig.saleLimitAmount) || (block.timestamp > endOfLimitWindow),
                "DEFOToken:transfer-limit"
            );
            if (block.timestamp > endOfLimitWindow)
                s.defoTokenLimitWindow.tokensSold[from] = amount;
            else
                s.defoTokenLimitWindow.tokensSold[from] += amount;
            s.defoTokenLimitWindow.timeOfLastSale[from] = block.timestamp;

            if (s.config.defoTokenLimitConfig.limitByReward) {
                uint256[] memory gemIds = _getGemIds(from);
                require(gemIds.length > 0, "DEFOTransferLimit:no-gems-owned");
                uint256 allowedSellAmount = 0;
                for (uint256 i = 0; i < gemIds.length; i++) {
                    uint8 gemTypeId = s.gems[gemIds[i]].gemTypeId;
                    allowedSellAmount += s.gemTypes[gemTypeId].rewardAmountDefo;
                }
                if (s.defoTokenLimitPerRewards.timeOfWindowStart[from] == 0 || s.defoTokenLimitPerRewards.timeOfWindowStart[from] + s.config.rewardPeriod < block.timestamp) {
                    s.defoTokenLimitPerRewards.tokensSold[from] = amount;
                    s.defoTokenLimitPerRewards.timeOfWindowStart[from] = block.timestamp;
                }
                else {
                    s.defoTokenLimitPerRewards.tokensSold[from] += amount;
                }
                require(s.defoTokenLimitPerRewards.tokensSold[from] <= allowedSellAmount, "DEFOTransferLimit:total-rewards-per-week");
            }

        }
    }

}
