// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoeERC20.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoePair.sol";
import "../interfaces/IYieldGem.sol";
import "../interfaces/IGetter.sol";
import "../interfaces/ITransferLimiter.sol";
import "../erc721-facet/ERC721AutoIdMinterLimiterBurnableEnumerableFacet.sol";
import "../libraries/LibMintLimiter.sol";
import "../libraries/PercentHelper.sol";

/** @title  YieldGemFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Basic DEFO-specific mint functionality on top of the ERC721 standard
*/
contract YieldGemFacet is ERC721AutoIdMinterLimiterBurnableEnumerableFacet, IYieldGem {

    /* ====================== Modifiers ====================== */

    modifier onlyRedeemContract() {
        require(s.config.wallets[uint(Wallets.RedeemContract)] == _msgSender(), "Unauthorized");
        _;
    }

    modifier onlyMintAvailable(uint8 _gemTypeId) {
        require(LibMintLimiter.isMintAvailableForGem(_gemTypeId), "Gem mint restriction");
        _;
    }

    /* ============ External and Public Functions ============ */

    /// @dev takes payment for mint and passes to the internal _mint function
    function mint(uint8 _gemTypeId) external onlyMintAvailable(_gemTypeId) {
        address minter = _msgSender();
        // check if there's enough DAI and DEFO
        for (uint i = 0; i < PAYMENT_TOKENS; i++) {
            require(
                s.config.paymentTokens[i].balanceOf(minter) > s.gemTypes[_gemTypeId].price[i],
                "Insufficient balance"
            );
        }
        // distribute payment according to the distribution setup
        for (uint receiver = 0; receiver < PAYMENT_RECEIVERS; receiver++) {
            for (uint paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
                uint256 amountToTransfer = PercentHelper.rate(s.gemTypes[_gemTypeId].price[paymentToken], s.config.incomeDistributionOnMint[paymentToken][receiver]);
                if (amountToTransfer != 0) {
                    require(s.config.wallets[receiver] != address(0), "YieldGem: configuration error, zero address");
                    s.config.paymentTokens[paymentToken].transferFrom(minter, s.config.wallets[receiver], amountToTransfer);
                }
            }
        }
        //mint to team to update pair reserves
        uint TEAM_WALLET_INDEX = 3;
        uint DEX_LP_WALLET_INDEX = 2;
        uint256 liquidity = IJoePair(s.config.wallets[DEX_LP_WALLET_INDEX]).mint(s.config.wallets[TEAM_WALLET_INDEX]);
        //check if there's a booster left for the user and use it
        Booster boost = Booster.None;
        for (uint256 booster = 1; booster <= 2; booster++) {
            if (s.usersNextGemBooster[minter][_gemTypeId][Booster(booster)] > 0) {
                boost = Booster(booster);
                s.usersNextGemBooster[minter][_gemTypeId][Booster(booster)]--;
                break;
            }
        }
        // finally mint a yield gem
        _mint(_gemTypeId, minter, boost);
    }

    function mintTo(uint8 _gemType, address _to, Booster _booster) public onlyRedeemContract {
        //just mint with no payment, already paid on presale
        uint256 tokenId = _mint(_gemType, _to, _booster);
        s.gems[tokenId].presold = true;
        if (uint(_booster) > 0)
            s.usersNextGemBooster[_to][_gemType][_booster]++;
    }

    /* ============ Internal Functions ============ */

    /// @dev mint only, no payment, covers yield gem related mint functions, minting itself and event firing is part of super contract from erc721-facet directory
    function _mint(uint8 _gemType, address _to, Booster _booster) private returns (uint256) {
        // mint and update the counter
        uint256 tokenId = _safeMint(_to);
        LibMintLimiter.updateMintCount(_gemType);
        // save the gem
        Gem memory gem;
        gem.gemTypeId = _gemType;
        gem.lastMaintenanceTime = uint32(block.timestamp);
        gem.lastRewardWithdrawalTime = uint32(block.timestamp);
        gem.mintTime = uint32(block.timestamp);
        gem.booster = _booster;
        s.gems[tokenId] = gem;
        return tokenId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721AutoIdMinterLimiterBurnableEnumerableFacet) {
        require(!s.config.transferLock, "Pausable: paused, transfer is locked");
        ITransferLimiter(address(this)).yieldGemTransferLimit(from, to, tokenId);
        super._beforeTokenTransfer(from, to, tokenId);
        if (from != address(0) && to != address(0)) {
            s.usersFi[to] = s.usersFi[from];
            for (uint8 i = 0; i < s.gemTypes.length; i++) {
                s.usersNextGemBooster[to][i][Booster.Omega] = s.usersNextGemBooster[from][i][Booster.Omega];
                s.usersNextGemBooster[to][i][Booster.Delta] = s.usersNextGemBooster[to][i][Booster.Delta];
            }
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721AutoIdMinterLimiterBurnableEnumerableFacet) {
        super._afterTokenTransfer(from, to, tokenId);
        if (from != address(0)) {
            delete s.usersFi[from];
            for (uint8 i = 0; i < s.gemTypes.length; i++) {
                delete s.usersNextGemBooster[from][i][Booster.Omega];
                delete s.usersNextGemBooster[from][i][Booster.Delta];
            }
        }
    }
}
