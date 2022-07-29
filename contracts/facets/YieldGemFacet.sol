// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../interfaces/IYieldGem.sol";
import "../erc721-facet/ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet.sol";
import "../libraries/LibMintLimitManager.sol";
import "../libraries/PercentHelper.sol";

/** @title  YieldGemFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Basic Node DEFO-specific functionality on top of the ERC721 standard,- minting and getters
*/
contract YieldGemFacet is ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet, IYieldGem {

    /* ====================== Modifiers ====================== */

    modifier onlyRedeemContract() {
        require(s.config.wallets[uint(Wallets.RedeemContract)] == _msgSender(), "Only from Redemption contract");
        _;
    }

    /* ============ External and Public Functions ============ */

    /// @dev takes payment for mint and passes to the internal _mint function
    function mint(uint8 _gemTypeId) external {
        require(LibMintLimitManager.isMintAvailableForGem(_gemTypeId), "Gem mint restriction");
        address minter = _msgSender();

        // check if there's enough DAI and DEFO
        for (uint paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
            require(
                s.config.paymentTokens[paymentToken].balanceOf(minter) > s.gemTypes[_gemTypeId].price[paymentToken],
                "Insufficient balance"
            );
        }
        // distribute payment according to the distribution setup
        for (uint receiver = 0; receiver < PAYMENT_RECEIVERS; receiver++) {
            for (uint paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
                s.config.paymentTokens[paymentToken].transferFrom(
                    minter,
                    s.config.wallets[receiver],
                    PercentHelper.rate(s.gemTypes[_gemTypeId].price[paymentToken], s.config.incomeDistributionOnMint[receiver][paymentToken])
                );
            }
        }

        // finally mint a yield gem
        _mint(_gemTypeId, minter);
    }

    function mintTo(uint8 _gemType, address _to) public onlyRedeemContract {
        //just mint with no payment, already paid on presale
        _mint(_gemType, _to);
    }

    function getGemInfo(uint256 _tokenId) external view returns (Gem memory) {
        return s.gems[_tokenId];
    }

    function getGemIds() public view returns (uint256[] memory) {
        address user = _msgSender();
        return _getGemIds(user);
    }

    function getGemsInfo() external view returns (uint256[] memory, Gem[] memory) {
        uint256[] memory gemIds = getGemIds();
        Gem[] memory gems = new Gem[](gemIds.length);
        for (uint256 i = 0; i < gemIds.length; i++) {
            gems[i] = s.gems[gemIds[i]];
        }
        return (gemIds, gems);
    }

    function isMintAvailable(uint8 _gemType) external view returns (bool) {
        return LibMintLimitManager.isMintAvailableForGem(_gemType);
    }

    function getMintWindow(uint8 _gemTypeId) external view returns (GemTypeMintWindow memory){
        return s.gemTypesMintWindows[_gemTypeId];
    }

    function getTotalDonated() external view returns (uint256) {
        return s.usersFi[_msgSender()].donated;
    }

    function getTotalDonatedAllUsers() external view returns (uint256) {
        return s.total.donated;
    }

    /* ============ Internal Functions ============ */

    /// @dev mint only, no payment, covers yield gem related mint functions, minting itself and event firing is part of super contract from erc721-facet directory
    function _mint(uint8 _gemType, address _to) private {
        // mint and update the counter
        uint256 tokenId = _safeMint(_to);
        LibMintLimitManager.updateMintCount(_gemType);
        // save the gem
        Gem memory gem;
        gem.gemTypeId = _gemType;
        gem.lastMaintenanceTime = uint32(block.timestamp);
        gem.lastRewardWithdrawalTime = uint32(block.timestamp);
        gem.mintTime = uint32(block.timestamp);
        s.gems[tokenId] = gem;
    }
    ///todo test transfer
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet) whenNotPaused() {
        super._beforeTokenTransfer(from, to, tokenId);
        s.usersFi[to] = s.usersFi[from];
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet) {
        super._afterTokenTransfer(from, to, tokenId);
        delete s.usersFi[from];
    }
}
