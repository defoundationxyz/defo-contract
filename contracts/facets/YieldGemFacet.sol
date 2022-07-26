// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../interfaces/IYieldGem.sol";
import "../interfaces/IConfig.sol";
import "../libraries/LibMintLimitManager.sol";
import "../libraries/PercentHelper.sol";
import "../erc721-facet/ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract YieldGemFacet is ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet, IYieldGem {

    /* ============ Modifiers ============ */

    modifier mintAvailable(uint8 _gemType) {
        require(LibMintLimitManager.isMintAvailableForGem(_gemType), "Gem mint restriction");
        _;
    }

    modifier onlyRedeemContract() {
        require(s.config.wallets[Wallets.RedeemContract] == _msgSender(), "Only from Redemption contract");
        _;
    }
    /* ============ External and Public Functions ============ */

    function mint(uint8 _gemType) external mintAvailable(_gemType) {
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
        _mint(_gemType, minter);
    }

    function mint(uint8 _gemType, address _to) public onlyRedeemContract {
        //no payment, already paid on presale
        _mint(_gemType, _to);
    }

    function maintain(uint256 _tokenId) external {

    }

    function batchMaintain(uint256[] calldata _tokenIds) external;

    function gem(uint256 _tokenId) external view returns (Gem memory);

    function gemIds() external view returns (uint256[] memory);

    function gems() external view returns (uint256[] memory, Gem[] memory);

    function pendingMaintenance(uint256 _tokenId) external view returns (uint256);

    function isMintAvailable(uint8 _gemType) external view returns (bool);

    function mintWindow(uint8 _gemType) external view returns (GemTypeMintWindow memory);

    /* ============ Internal Functions ============ */

    function _mint(uint8 _gemType, address _to) private {
        // mint and update the counter
        uint256 tokenId = _safeMint(_to);
        LibMintLimitManager.updateMintCount(_gemType);

        // update user details
        if (balanceOf(_to) == 0)
            s.participants.push(_to);

        // save the gem
        Gem memory gem;
        gem.gemType = _gemType;
        gem.lastMaintenanceTime = block.timestamp;
        gem.lastRewardWithdrawalTime = block.timestamp;
        gem.mintTime = block.timestamp;
        s.gems[tokenId] = gem;
    }
}
