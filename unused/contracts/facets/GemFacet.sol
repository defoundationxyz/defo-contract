// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../libraries/LibERC721.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibUser.sol";
import "../libraries/LibERC721Enumerable.sol";
import "hardhat/console.sol";
import "../libraries/helpers/TaxHelper.sol";
import "../libraries/helpers/BoosterHelper.sol";
import "../libraries/helpers/PercentHelper.sol";
import "../token/DEFOToken.sol";

/// @title Defo Yield Gems
/// @author jvoljvolizka, crypt0grapher
/// @notice Main yield gem functionality facet
contract GemFacet {
    using Counters for Counters.Counter;
    using BoosterHelper for LibGem.Booster;
    using TaxHelper for TaxHelper.TaxTier;
    using TaxHelper for uint256;
    using PercentHelper for uint256;
    using RewardHelper for uint256;

    event DonationEvent(address indexed user, uint256 indexed charityAmount);
    event WithdrawEvent(address indexed user, uint256 indexed treasuryWithdrawAmount);

    modifier SaleLock() {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        require(!metads.Lock, "Sale is Locked");
        _;
    }

    modifier onlyMinter() {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        require(ds.MinterAddr == LibMeta.msgSender(), "Only from Redemption contract");
        _;
    }
    modifier onlyGemOwner(uint256 _tokenId) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        require(LibERC721._ownerOf(_tokenId) == LibMeta.msgSender(), "You don't own this gem");
        _;
    }

    modifier onlyActive(uint256 _tokenId) {
        require(LibGem._isActive(_tokenId), "Gem is deactivated");
        _;
    }


    modifier onlyClaimable(uint256 _tokenId) {
        require(LibGem._isClaimable(_tokenId), "Gem is not claimable");
        _;
    }


    modifier mintLimit(uint8 _gemType) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        require(
            (block.timestamp - gemType.LastMint >= metads.MintLimitPeriod) ||
            (gemType.MintCount + 1 <= gemType.DailyLimit),
            "Gem mint restriction"
        );
        _;
    }

    /* ============ Public and External Functions ============ */
    /// FIXME add modifiers to check if tokenId exists (otherwise returns tier 0x03 for unexisting ids)
    /// @notice gets tax tier for a given gemId
    /// @param _tokenId unique NFT gem id
    /// @return current tax tier of the gem, might be configurable, now it's a number in the range from 0 to 4 inclusive.
    //4 is no tax
    //3 is 10%
    //2 is 20%
    //1 is  30%
    //0 means nothing is payed out - for the first week of rewards accrua
    function getTaxTier(uint256 _tokenId) external view returns (uint256) {
        return uint256(LibGem._getTaxTier(_tokenId));
    }

    /// @notice gets when next tax tier executes for a given gemId
    function wenNextTaxTier(uint256 timeFromLastRewardWithdrawal) external view returns (uint256) {
        return TaxHelper.wenNextTaxTier(timeFromLastRewardWithdrawal);
    }

    // Public Functions
    //TODO : add random claim

    function RedeemMint(uint8 _type, address _to) public onlyMinter {
        _mintGem(_type, _to);
    }

    // TODO : check claims
    function RedeemMintBooster(
        uint8 _type,
        LibGem.Booster _booster,
        address _to
    ) public onlyMinter {
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibUser.UserData storage userData = userds.GetUserData[_to];
        _mintGem(_type, _to);
        if (_booster == LibGem.Booster.Omega) {
            userData.OmegaClaims[_type] = userData.OmegaClaims[_type] + 2;
        } else if (_booster == LibGem.Booster.Delta) {
            userData.DeltaClaims[_type] = userData.DeltaClaims[_type] + 2;
        }
    }

    function BoostGem(LibGem.Booster _booster, uint256 _tokenId) public onlyGemOwner(_tokenId) onlyActive(_tokenId) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenId];
        require(gem.booster == LibGem.Booster.None, "Gem is already boosted");
        LibUser.UserData storage userData = userds.GetUserData[msg.sender];
        require(
            (userData.OmegaClaims[gem.GemType] > 0) || (userData.DeltaClaims[gem.GemType] > 0),
            "Not enough boost claims"
        );
        if (_booster == LibGem.Booster.Omega) {
            require(userData.OmegaClaims[gem.GemType] > 0, "Not enough boost claims");
            gem.booster = LibGem.Booster.Omega;
            userData.OmegaClaims[gem.GemType] = userData.OmegaClaims[gem.GemType] - 1;
        } else {
            require(userData.DeltaClaims[gem.GemType] > 0, "Not enough boost claims");
            gem.booster = LibGem.Booster.Delta;
            userData.DeltaClaims[gem.GemType] = userData.DeltaClaims[gem.GemType] - 1;
        }
    }

    function getBoosters(uint256 gemType) external view returns (uint256 omega, uint256 delta) {
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibUser.UserData storage userData = userds.GetUserData[msg.sender];
        return (userData.OmegaClaims[gemType], userData.DeltaClaims[gemType]);
    }

    /// @notice mint a new gem
    function MintGem(uint8 _type) external SaleLock mintLimit(_type) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        if (metads.MaxGems != 0) {
            require(metads._tokenIdCounter.current() < metads.MaxGems, "Sold Out");
        }
        LibGem.GemTypeMetadata storage gemType = ds.GetGemTypeMetadata[_type];
        require(metads.DefoToken.balanceOf(msg.sender) > gemType.DefoPrice, "Insufficient DEFO");
        require(metads.PaymentToken.balanceOf(msg.sender) > gemType.StablePrice, "Insufficient DAI");
        metads.DefoToken.transferFrom(msg.sender, address(this), gemType.DefoPrice);
        metads.PaymentToken.transferFrom(msg.sender, address(this), gemType.StablePrice);
        _distributePayment(gemType.DefoPrice, true);
        _distributePayment(gemType.StablePrice, false);
        _mintGem(_type, msg.sender);

        if (block.timestamp - gemType.LastMint >= metads.MintLimitPeriod) {
            gemType.LastMint = block.timestamp;
            gemType.MintCount = 1;
        } else {
            gemType.MintCount = gemType.MintCount + 1;
        }
    }

    /**
    @notice Claims rewards for a gem to the owner's wallet. A gem should be active,
    @param _tokenId gem id
    */
    function ClaimRewards(uint256 _tokenId) external onlyGemOwner(_tokenId) onlyClaimable(_tokenId) returns (uint256) {
        return _sendRewardTokens(_tokenId, 0);
    }

    /*
    // TODO: add a similar function for vault
    function ClaimRewardsAll() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any gems");
        address account = msg.sender;
        uint256[] memory gemsOwned = getGemIdsOf(account);
        for (uint256 index = 0; index < gemsOwned.length; index++) {
            uint256 _tokenid = gemsOwned[index];
            Gem memory gem = GemOf[_tokenid];
            uint256 rewardPoints = block.timestamp - gem.LastReward;
            require(rewardPoints > RewardTime, "Too soon");
            require(isActive(_tokenid), "Gem is deactivated");
            _sendRewardTokens(_tokenid, 0);
        }
    }
*/
    function Maintenance(uint256 _tokenid, uint256 _time) external onlyGemOwner(_tokenid) {
        _maintenance(_tokenid, _time);
    }

    function BatchMaintenance(uint256[] calldata _tokenids) external {
        require(LibERC721._balanceOf(msg.sender) > 0, "User doesn't have any gems");
        for (uint256 index = 0; index < _tokenids.length; index++) {
            require(LibERC721._ownerOf(_tokenids[index]) == LibMeta.msgSender(), "You don't own this gem");
            _maintenance(_tokenids[index], 0);
        }
    }

    function BatchClaimRewards(uint256[] calldata _tokenids) external {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        require(LibERC721._balanceOf(msg.sender) > 0, "User doesn't have any gems");
        for (uint256 index = 0; index < _tokenids.length; index++) {
            require(LibERC721._ownerOf(_tokenids[index]) == LibMeta.msgSender(), "You don't own this gem");
            LibGem.Gem memory gem = ds.GemOf[_tokenids[index]];
            uint256 rewardPoints = block.timestamp - gem.LastReward;
            require(rewardPoints > metads.RewardTime, "Too soon");

            _sendRewardTokens(_tokenids[index], 0);
        }
    }

    /*
    function MaintenanceAll(uint256 _days) external {
        require(
            LibERC721._balanceOf(msg.sender) > 0,
            "User doesn't have any gems"
        );
        address account = msg.sender;
        uint256[] memory gemsOwned = getGemIdsOf(account);
        for (uint256 index = 0; index < gemsOwned.length; index++) {
            console.log(gemsOwned[index]);
            uint256 _tokenid = gemsOwned[index];
            _maintenance(_tokenid, _days);
        }
    }
*/
    /// @notice creates a new gem with the given type from unclaimed rewards
    function Compound(uint256 _tokenid, uint8 _gemType) external onlyGemOwner(_tokenid) onlyActive(_tokenid) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];
        require(metads.PaymentToken.balanceOf(msg.sender) > gemType.StablePrice, "Insufficient USD");
        metads.PaymentToken.transferFrom(msg.sender, address(this), gemType.StablePrice);

        _distributePayment(gemType.StablePrice, false);
        _compound(_tokenid, _gemType);
    }

    /*
    /// @notice creates same type gems from all the unclaimed rewards
    function CompoundAll() external returns (uint256[] memory) {
        require(
            LibERC721.balanceOf(msg.sender) > 0,
            "User doesn't have any gems"
        );
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        address account = msg.sender;
        uint256[] memory gemsOwned = getGemIdsOf(account);
        uint256[] memory compounded = new uint256[](gemsOwned.length);
        uint256 counter;
        for (uint256 index = 0; index < gemsOwned.length; index++) {
            Gem memory gem = GemOf[gemsOwned[index]];
            GemTypeMetadata memory gemType = GetGemTypeMetadata[gem.GemType];
            if (
                (PaymentToken.balanceOf(msg.sender) >= gemType.StablePrice) &&
                (checkRawReward(gemsOwned[index]) >= gemType.DefoPrice)
            ) {
                PaymentToken.transferFrom(
                    msg.sender,
                    address(this),
                    gemType.StablePrice
                );
                _distributePayment(gemType.StablePrice, false);
                require(isActive(gemsOwned[index]), "Gem is deactivated");
                _compound(gemsOwned[index], gem.GemType);
                compounded[counter] = gemsOwned[index];
                counter++;
            }
        }
        return compounded;
    }
*/

    /// @dev get the token value from lp

    // View Functions

    function isActive(uint256 _tokenId) public view returns (bool) {
        return LibGem._isActive(_tokenId);
    }

    function isClaimable(uint256 _tokenId) public view returns (bool)  {
        return LibGem._isClaimable(_tokenId);
    }

    /// @notice gives a raw untaxed and untapered reward
    function checkRawReward(uint256 _tokenid) public view returns (uint256) {
        return LibGem._checkRawReward(_tokenid);
    }

    /// @notice gives a tapered reward before tax and charity decuction
    function checkTaperedReward(uint256 _tokenid) public view returns (uint256) {
        return LibGem._taperedReward(_tokenid);
    }

    /// @notice gives a final reward to be recieved by a user - tapered, then taxed and the charity is deducted
    function checkTaxedReward(uint256 _tokenid) public view returns (uint256) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        uint256 _rewardDefo = LibGem._taperedReward(_tokenid);
        uint256 taxRate = LibGem._rewardTax(_tokenid);
        _rewardDefo = _rewardDefo.lessRate(taxRate);

        uint256 charityAmount = _rewardDefo.rate(metads.CharityRate);
        _rewardDefo -= charityAmount;
        return _rewardDefo;
    }

    function checkPendingMaintenance(uint256 _tokenid) public view returns (uint256) {
        return LibGem._getMaintenanceFee(_tokenid);
    }

    function getGemIdsOf(address _user) public view returns (uint256[] memory) {
        uint256 numberOfGems = LibERC721._balanceOf(_user);
        uint256[] memory gemIds = new uint256[](numberOfGems);
        for (uint256 i = 0; i < numberOfGems; i++) {
            uint256 gemId = LibERC721Enumerable._tokenOfOwnerByIndex(_user, i);
            require(LibERC721._exists(gemId), "This gem doesn't exists");
            gemIds[i] = gemId;
        }
        return gemIds;
    }

    ///@dev calling this function from another contract is not clever
    // TODO: please fix
    function getGemIdsOfWithType(address _user, uint8 _type) public view returns (uint256[] memory) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        uint256 numberOfGems = LibERC721._balanceOf(_user);
        uint256[] memory gemIds = new uint256[](numberOfGems);
        uint256 counter;
        for (uint256 i = 0; i < numberOfGems; i++) {
            uint256 gemId = LibERC721Enumerable._tokenOfOwnerByIndex(_user, i);
            require(LibERC721._exists(gemId), "This gem doesn't exists");
            LibGem.Gem memory gem = ds.GemOf[gemId];
            if (gem.GemType == _type) {
                gemIds[counter];
                counter++;
            }
        }

        return gemIds;
    }


    /// @notice get total rewards earned  FOR USER including already claimed, staked, and unclaimed. Returns value before tax.
    function getUserRewardEarned() public view returns (uint256) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        uint256 totalReward = 0;
        uint256[] memory userGemIds = getGemIdsOf(msg.sender);
        for (uint256 i = 0; i < userGemIds.length; i++) {
            LibGem.Gem storage gem = ds.GemOf[userGemIds[i]];
            totalReward += LibGem._taperedReward(userGemIds[i]);
            //.lessRate(LibGem._rewardTax(userGemIds[i]));
            totalReward += gem.claimedReward + gem.stakedReward;
        }
        return totalReward;
    }

    /// @notice get total rewards earned FOR ALL USERS including already claimed, staked, and unclaimed. Returns value before tax.
    function getTotalRewardEarned() public view returns (uint256) {
        console.log("---_getTotalRewardEarned");
        LibERC721Enumerable.DiamondStorage storage dsEnumerable = LibERC721Enumerable.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        uint256 totalReward = 0;
        uint256[] memory userGemIds = getGemIdsOf(msg.sender);
        for (uint256 i = 0; i < dsEnumerable._allTokens.length; i++) {
            LibGem.Gem storage gem = ds.GemOf[i];
            totalReward += LibGem._taperedReward(i);
            totalReward += gem.claimedReward + gem.stakedReward;
            console.log("gem %s, totalReward: %s", i, totalReward);
        }
        return totalReward;
    }
    /* ============ Internal Functions ============ */
    // internal functions

    /// @dev sends the gem payment to other wallets
    // TODO : LP distribution

    function _distributePayment(uint256 _amount, bool _isDefo) internal {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        uint256 amount = _amount;

        IERC20Joe token;
        /// defo : %75 reward , %25 liq
        if (_isDefo) {
            uint256 reward = amount.rate(metads.TreasuryDefoRate);
            uint256 liq = amount.rate(metads.LiquidityDefoRate);
            token = metads.DefoToken;
            token.transfer(metads.RewardPool, reward);
            token.transfer(metads.Liquidity, liq);
        } else {
            /// dai %67.5 tres , %25 liq , %7.5 core team
            uint256 treasury = amount.rate(metads.TreasuryDaiRate);
            uint256 team = amount.rate(metads.TeamDaiRate);
            uint256 liq = amount.rate(metads.LiquidityDaiRate);
            token = metads.PaymentToken;
            token.transfer(metads.Team, team);
            token.transfer(metads.Treasury, treasury);
            token.transfer(metads.Liquidity, liq);
        }
    }

    function _mintGem(uint8 _type, address _to) internal returns (uint256) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        if (LibERC721._balanceOf(LibMeta.msgSender()) == 0) {
            userds.users.push(LibMeta.msgSender());
        }
        if (metads.MaxGems != 0) {
            require(metads._tokenIdCounter.current() < metads.MaxGems, "Sold Out");
        }
        uint256 tokenId = metads._tokenIdCounter.current();
        metads._tokenIdCounter.increment();
        LibERC721._safeMint(_to, tokenId);
        LibGem.Gem memory gem;
        gem.GemType = _type;
        gem.LastReward = block.timestamp;
        gem.LastMaintained = block.timestamp;
        //no free period in one month + ds.GetGemTypeMetadata[_type].maintenancePeriod;
        gem.MintTime = block.timestamp;
        ds.GemOf[tokenId] = gem;
        return tokenId;
    }

    /// @dev main reward calculation and transfer function probably will changed in the future all rates are daily rates
    ///TODO what need of the _offset? it's always 0
    function _sendRewardTokens(uint256 _tokenid, uint256 _offset) internal returns (uint256) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();

        LibUser.UserData storage user = userds.GetUserData[LibMeta.msgSender()];
        console.log("_sendRewardTokens, _tokenid: ", _tokenid);
        uint256 _rewardToClaim = LibGem._taperedReward(_tokenid);
        console.log("_taperedReward:  ", _rewardToClaim);
        uint256 taxRate = LibGem._rewardTax(_tokenid);
        uint256 _rewardDefo = _rewardToClaim.lessRate(taxRate);
        _rewardDefo -= _offset;
        console.log("_rewardDefo less tax:  ", _rewardDefo);
        require(_rewardDefo > metads.MinReward, "Less than min reward");

        LibGem.Gem storage gem = ds.GemOf[_tokenid];
        uint256 charityAmount = _rewardDefo.rate(metads.CharityRate);
        _rewardDefo -= charityAmount;
        console.log("_rewardDefo less charity:  ", _rewardDefo);

        metads.DefoToken.transferFrom(metads.RewardPool, metads.Donation, charityAmount);
        emit DonationEvent(msg.sender, charityAmount);
        metads.TotalCharity += charityAmount;
        user.charityContribution += charityAmount;
        // approve here
        metads.DefoToken.transferFrom(metads.Treasury, msg.sender, _rewardDefo);
        gem.claimedReward += _rewardToClaim;
        emit WithdrawEvent(msg.sender, _rewardDefo);
        gem.LastReward = block.timestamp;
        gem.unclaimedRewardBalance = 0;
        return _rewardDefo;
    }

    // gem compounding function creates a gem from unclaimed rewards , only creates same type of the compounded gem
    function _compound(uint256 _tokenid, uint8 _gemType) internal mintLimit(_gemType) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata storage gemType = ds.GetGemTypeMetadata[_gemType];
        uint256 rewardDefo = LibGem._taperedReward(_tokenid);
        require(rewardDefo >= (gemType.DefoPrice), "not enough rewards");
        gem.claimedReward = gem.claimedReward + gemType.DefoPrice;

        uint256 tokenId = metads._tokenIdCounter.current();
        metads._tokenIdCounter.increment();
        LibERC721._safeMint(msg.sender, tokenId);
        LibGem.Gem memory newGem;
        newGem.GemType = _gemType;
        newGem.LastMaintained = block.timestamp;
        newGem.LastReward = block.timestamp;
        ds.GemOf[tokenId] = newGem;
        if (block.timestamp - gemType.LastMint >= metads.MintLimitPeriod) {
            gemType.LastMint = block.timestamp;
            gemType.MintCount = 1;
        } else {
            gemType.MintCount = gemType.MintCount + 1;
        }
    }

    function _maintenance(uint256 _tokenid, uint256 _time) internal {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[gem.GemType];
        console.log("__maintenance");

        uint256 discountedRate = gem.booster.reduceMaintenanceFee(gemType.MaintenanceFee);
        uint256 _fee = discountedRate;
        console.log("discountedRate: ", discountedRate);

        uint256 _lastTime = gem.LastMaintained;
        console.log("_lastTime: ", _lastTime);
        require(_lastTime < block.timestamp, "upfront is paid already");

        uint256 _sinceLastMaintained = block.timestamp - _lastTime;
        require(_sinceLastMaintained > metads.MaintenancePeriod, "Too soon");
        uint256 _amount = discountedRate.calculatePeriodic(_lastTime - _time, metads.MaintenancePeriod);
        console.log("_amount: ", _amount);
        require(metads.PaymentToken.balanceOf(msg.sender) > _amount, "Not enough funds to pay");

        metads.PaymentToken.transferFrom(msg.sender, metads.Treasury, _amount);
        gem.LastMaintained = block.timestamp + _time;
    }


}
