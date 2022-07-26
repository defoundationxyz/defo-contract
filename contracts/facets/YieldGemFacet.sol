// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../interfaces/IYieldGem.sol";
import "../interfaces/IConfig.sol";
import "../libraries/LibMintLimitManager.sol";
import "../libraries/PercentHelper.sol";
import "../erc721-facet/ERC721MinterLimiterBurnableEnumerablePausableFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract YieldGemFacet is ERC721MinterLimiterBurnableEnumerablePausableFacet, IYieldGem {

    /* ============ Modifiers ============ */

    modifier mintAvailable(uint8 _gemType) {
        require(LibMintLimitManager._isMintAvailableForGem(_gemType), "Gem mint restriction");
        _;
    }

    /* ============ External and Public Functions ============ */

    function mintGem(uint8 _gemType) external mintAvailable(_type) {
        GemTypeConfig memory gemType = s.gemTypesConfig[_gemType];
        ProtocolConfig memory config = s.config;
        address minter = _msgSender();
        // check if there's enough DAI and DEFO
        for (uint8 paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
            require(
                config.paymentTokens[paymentToken].balanceOf(minter) > gemType.price[paymentToken],
                "Insufficient balance"
            );
        }

        // distribute payment according to the distribution setup
        for (uint receiver = 0; receiver < PAYMENT_RECEIVERS; receiver++) {
            for (uint paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
                config.paymentTokens[paymentToken].transferFrom(
                    minter,
                    config.wallets[receiver],
                    PercentHelper.rate(gemType.price[paymentToken], config.incomeDistributionOnMint[receiver][paymentToken])
                );
            }
        }

        //mint and update the counter
        _mintGem(_type, minter());


    }

    function maintain(uint256 _tokenId) external;

    function batchMaintain(uint256[] calldata _tokenIds) external;

    function getGemDetails(uint256 _tokenId) external view returns (Gem memory);

    function getPendingMaintenance(uint256 _tokenId) external view returns (uint256);

    /* ============ Internal Functions ============ */

}
