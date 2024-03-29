// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoeERC20.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoePair.sol";
import "../interfaces/IYieldGem.sol";
import "../interfaces/IPresaleNode.sol";
import "../interfaces/ITransferLimiter.sol";
import "../erc721-facet/ERC721AutoIdMinterLimiterBurnableEnumerableFacet.sol";
import "../libraries/LibMintLimiter.sol";
import "../libraries/PercentHelper.sol";
import "../data-types/IDataTypes.sol";
import "../libraries/FiHelper.sol";

/** @title  YieldGemFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Basic DEFO-specific mint functionality on top of the ERC721 standard
*/
contract YieldGemFacet is ERC721AutoIdMinterLimiterBurnableEnumerableFacet, IYieldGem {
    using FiHelper for Fi;

    /* ====================== Modifiers ====================== */

    modifier onlyRedeemContract() {
        require(
            s.config.wallets[uint(Wallets.Stabilizer)] == _msgSender() ||
            s.config.wallets[uint(Wallets.RedeemContract)] == _msgSender(), "Unauthorized");
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
                s.config.paymentTokens[i].balanceOf(minter) >= s.gemTypes2[_gemTypeId].price[i],
                "Insufficient balance"
            );
        }
        // distribute payment according to the distribution setup
        for (uint receiver = 0; receiver < PAYMENT_RECEIVERS; receiver++) {
            for (uint paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
                uint256 amountToTransfer = PercentHelper.rate(s.gemTypes2[_gemTypeId].price[paymentToken], s.config.incomeDistributionOnMint[paymentToken][receiver]);
                if (amountToTransfer != 0) {
                    require(s.config.wallets[receiver] != address(0), "YieldGem: configuration error, zero address");
                    s.config.paymentTokens[paymentToken].transferFrom(minter, s.config.wallets[receiver], amountToTransfer);
                }
            }
        }
        //mint to stabilizer to update pair reserves
        uint STABILIZER_WALLET_INDEX = 3;
        uint DEX_LP_WALLET_INDEX = 2;
        IJoePair(s.config.wallets[DEX_LP_WALLET_INDEX]).mint(s.config.wallets[STABILIZER_WALLET_INDEX]);
        //check if there's a booster left for the user and use it
        Booster boost = Booster.None;
        for (uint256 booster = 2; booster >= 1; booster--) {
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

    function mintToFew(uint8 _gemType, address _to, Booster _booster, uint8 _number) public onlyRedeemContract {
        //just mint with no payment, already paid on presale
        for (uint8 i = 0; i < _number; i++) {
            uint256 tokenId = _mint(_gemType, _to, _booster);
            s.gems[tokenId].presold = true;
            if (uint(_booster) > 0)
                s.usersNextGemBooster[_to][_gemType][_booster]++;
        }
    }

    function mintToBulk(uint8[] calldata _gemType, address[] calldata _to, Booster[] calldata _booster, uint8[] calldata _number) public onlyRedeemContract {
        for (uint j = 0; j < _to.length; j++) {
            for (uint8 i = 0; i < _number[j]; i++) {
                uint256 tokenId = _mint(_gemType[j], _to[j], _booster[j]);
                s.gems[tokenId].presold = true;
                if (uint(_booster[j]) > 0)
                    s.usersNextGemBooster[_to[j]][_gemType[j]][_booster[j]]++;
            }
        }
    }

    function createBooster(address _to, uint8 _gemType, Booster _booster) public onlyRedeemContract {
        s.usersNextGemBooster[_to][_gemType][_booster]++;
    }

    function removeBooster(address _to, uint8 _gemType, Booster _booster) public onlyRedeemContract {
        s.usersNextGemBooster[_to][_gemType][_booster]--;
    }

    function moveBoosters(address _from, address _to) public onlyRedeemContract {
        for (uint8 gemType = 0; gemType < s.gemTypes2.length; gemType++) {
            for (uint256 booster = 2; booster >= 1; booster--) {
                s.usersNextGemBooster[_to][gemType][Booster(booster)] += s.usersNextGemBooster[_from][gemType][Booster(booster)];
                s.usersNextGemBooster[_from][gemType][Booster(booster)] = 0;
            }
        }
    }

    function setLaunchTime() public onlyRedeemContract {
        for (uint index = 0; index < s.nft.allTokens.length; index++) {
            uint tokenId = s.nft.allTokens[index];
            if (s.gems[tokenId].presold) {
                s.gems[tokenId].lastMaintenanceTime = 1664643600;
                s.gems[tokenId].lastRewardWithdrawalTime = 1664643600;
                s.gems[tokenId].mintTime = 1664643600;
            }
        }
    }

    function transferToStabilizer(uint256 _tokenId) public onlyGemHolder(_tokenId) {
        address user = _msgSender();
        _transfer(user, s.config.wallets[uint(Wallets.Stabilizer)], _tokenId);
    }

    function batchtransferToStabilizer(uint256[] calldata _tokenids) external {
        for (uint256 index = 0; index < _tokenids.length; index++) {
            transferToStabilizer(_tokenids[index]);
        }
    }

    function setBooster(uint256 _tokenId, Booster _booster) public onlyRedeemContract {
        s.gems[_tokenId].booster = _booster;
    }

    function expire(uint256 _tokenId) public {
        address _from = s.nft.owners[_tokenId];
        address _to = s.config.wallets[uint(Wallets.Stabilizer)];
        if ((uint32(block.timestamp) - s.gems[_tokenId].lastMaintenanceTime > s.config.maintenancePeriod * 2) &&
            _from != _to) {
            _beforeTokenTransfer(_from, _to, _tokenId);

            // Clear approvals from the previous owner
            _approve(address(0), _tokenId);

            s.nft.balances[_from]--;
            s.nft.balances[_to]++;
            s.nft.owners[_tokenId] = _to;

            emit ERC721Facet.Transfer(_from, _to, _tokenId);

            _afterTokenTransfer(address(0), _to, _tokenId);
        }
    }

    function batchExpire(uint256[] calldata _tokenIds) external {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            expire(_tokenIds[index]);
        }
    }


    function unExpire(uint256 _tokenId, address _to) public onlyRedeemContract {
        address _from = s.config.wallets[uint(Wallets.Stabilizer)];
        require(_from != _to, "Can't unexpire to the same address");
        require(s.nft.owners[_tokenId] == _from, "The token is not owned by stabilizer");
        _beforeTokenTransfer(_from, _to, _tokenId);

        // Clear approvals from the previous owner
        _approve(address(0), _tokenId);

        s.nft.balances[_from]--;
        s.nft.balances[_to]++;
        s.nft.owners[_tokenId] = _to;

        emit ERC721Facet.Transfer(_from, _to, _tokenId);

        _afterTokenTransfer(address(0), _to, _tokenId);
    }

    function transferCompromised(uint256 _tokenId, address _from, address _to) public onlyRedeemContract {
        require(_from != _to, "Can't unexpire to the same address");
        require(s.nft.owners[_tokenId] == _from, "The token is not owned by the from address");
        ERC721EnumerableFacet._beforeTokenTransfer(_from, _to, _tokenId);
        // Clear approvals from the previous owner
        _approve(address(0), _tokenId);

        s.nft.balances[_from]--;
        s.nft.balances[_to]++;
        s.nft.owners[_tokenId] = _to;

        emit ERC721Facet.Transfer(_from, _to, _tokenId);

        _afterTokenTransfer(address(0), _to, _tokenId);
    }

    function getBooster(address _to, uint8 _gemType, Booster _booster) public view returns (uint256) {
        return s.usersNextGemBooster[_to][_gemType][_booster];
    }

    function getGemInfo(uint256 _tokenId) external view returns (Gem memory) {
        return s.gems[_tokenId];
    }

    function getGemIds() public view returns (uint256[] memory) {
        address user = _msgSender();
        return _getGemIds(user);
    }

    function getGemIdsOf(address _user) public view returns (uint256[] memory) {
        return _getGemIds(_user);
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
        return LibMintLimiter.isMintAvailableForGem(_gemType);
    }

    function getMintWindow(uint8 _gemTypeId) external view returns (GemTypeMintWindow memory){
        return LibMintLimiter.getCurrentMintWindow(_gemTypeId);
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
            Fi memory gemFi = s.gems[tokenId].fi;
            s.usersFi[to].fiAdd(gemFi);
            for (uint8 i = 0; i < s.gemTypes2.length; i++) {
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
            Fi memory gemFi = s.gems[tokenId].fi;
            s.usersFi[from].fiSubtract(gemFi);
            for (uint8 i = 0; i < s.gemTypes2.length; i++) {
                delete s.usersNextGemBooster[from][i][Booster.Omega];
                delete s.usersNextGemBooster[from][i][Booster.Delta];
            }
        }
    }
}
