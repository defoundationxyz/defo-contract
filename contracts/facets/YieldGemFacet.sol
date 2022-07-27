// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../interfaces/IYieldGem.sol";
import "../libraries/LibMintLimitManager.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";
import "../erc721-facet/ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract YieldGemFacet is ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet, IYieldGem {
    /* ======================== Events ======================= */

    event MaintenancePaid(address _user, uint256 _feeToPay);

    /* ====================== Modifiers ====================== */

    modifier mintAvailable(uint8 _gemType) {
        require(LibMintLimitManager.isMintAvailableForGem(_gemType), "Gem mint restriction");
        _;
    }

    modifier onlyRedeemContract() {
        require(s.config.wallets[uint(Wallets.RedeemContract)] == _msgSender(), "Only from Redemption contract");
        _;
    }

    modifier onlyGemHolder(uint256 _tokenId) {
        require(_ownerOf(_tokenId) == _msgSender(), "You don't own this gem");
        _;
    }


    /* ============ External and Public Functions ============ */

    /// @dev takes payment for mint and passes to the internal _mint function
    function mint(uint8 _gemType) external mintAvailable(_gemType) {
        GemTypeConfig memory gemType = s.gemTypes[_gemType];
        ProtocolConfig memory config = s.config;
        address minter = _msgSender();

        // check if there's enough DAI and DEFO
        for (uint paymentToken = 0; paymentToken < PAYMENT_TOKENS; paymentToken++) {
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

        // finally mint a yield gem
        _mint(_gemType, minter);
    }

    function mint(uint8 _gemType, address _to) public onlyRedeemContract {
        //just mint with no payment, already paid on presale
        _mint(_gemType, _to);
    }

    function maintain(uint256 _tokenId, address _user) public {
        console.log("=== maintain ===");
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];

        // time period checks - if it's not necessary or too early
        require(gem.lastMaintenanceTime < block.timestamp, "Maintenance is already paid upfront");
        uint32 feePaymentPeriod = uint32(block.timestamp) - gem.lastMaintenanceTime;
        require(feePaymentPeriod > gemType.maintenancePeriod, "Too soon, maintenance fee has not been yet accrued");

        // amount calculation
        uint256 discountedFeeDai = BoosterHelper.reduceMaintenanceFee(gem.booster, gemType.maintenanceFeeDai);
        uint256 feeAmount = PeriodicHelper.calculatePeriodic(discountedFeeDai, feePaymentPeriod, gemType.maintenancePeriod);

        // payment
        IERC20 dai = s.config.paymentTokens[uint(PaymentTokens.Dai)];
        require(dai.balanceOf(_user) > feeAmount, "Not enough funds to pay");
        dai.transferFrom(_user, s.config.wallets[uint(Wallets.Treasury)], feeAmount);

        // data update
        gem.lastMaintenanceTime = uint32(block.timestamp);
        emit MaintenancePaid(_user, feeAmount);

    }

    function maintain(uint256 _tokenId) external onlyGemHolder(_tokenId) {
        address user = _msgSender();
        maintain(_tokenId, user);
    }

    function batchMaintain(uint256[] calldata _tokenIds) external {
        address user = _msgSender();
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            require(_ownerOf(_tokenIds[index]) == user, "You don't own this gem");
            maintain(_tokenIds[index], user);
        }

    }

    function getGemData(uint256 _tokenId) external view returns (Gem memory) {
        return s.gems[_tokenId];
    }

    function getGemIds() public view returns (uint256[] memory) {
        address user = _msgSender();
        uint256 numberOfGems = _balanceOf(user);
        uint256[] memory gemIds = new uint256[](numberOfGems);
        for (uint256 i = 0; i < numberOfGems; i++) {
            uint256 gemId = _tokenOfOwnerByIndex(user, i);
            require(_exists(gemId), "A gem doesn't exists");
            gemIds[i] = gemId;
        }
        return gemIds;
    }

    function getGemsData() external view returns (uint256[] memory, Gem[] memory) {
        uint256[] memory gemIds = getGemIds();
        Gem[] memory gems = new Gem[](gemIds.length);
        for (uint256 i = 0; i < gemIds.length; i++) {
            gems[i] = s.gems[gemIds[i]];
        }
        return (gemIds, gems);
    }

    function getPendingMaintenanceFee(uint256 _tokenId) external view returns (uint256) {

    }

    function isMintAvailable(uint8 _gemType) external view returns (bool) {

    }

    function getMintWindow(uint8 _gemTypeId) external view returns (GemTypeMintWindow memory){

    }

    /* ============ Internal Functions ============ */

    /// @dev mint only, no payment, covers yield gem related mint functions, minting itself and event firing is part of super contract from erc721-facet directory
    function _mint(uint8 _gemType, address _to) private {
        // mint and update the counter
        uint256 tokenId = _safeMint(_to);
        LibMintLimitManager.updateMintCount(_gemType);

        // update user details
        if (_balanceOf(_to) == 0)
            s.users.push(_to);

        // save the gem
        Gem memory gem;
        gem.gemTypeId = _gemType;
        gem.lastMaintenanceTime = uint32(block.timestamp);
        gem.lastRewardWithdrawalTime = uint32(block.timestamp);
        gem.mintTime = uint32(block.timestamp);
        s.gems[tokenId] = gem;
    }
}
