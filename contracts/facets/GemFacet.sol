// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../libraries/LibERC721.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibUser.sol";
import "../libraries/LibERC721Enumerable.sol";
import "hardhat/console.sol";

/// @title Defo Yield Gems
/// @author jvoljvolizka
/// @notice Main yield gem functionality facet

contract GemFacet {
    using Counters for Counters.Counter;
    modifier SaleLock() {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        require(!metads.Lock, "Sale is Locked");
        _;
    }

    modifier onlyMinter() {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        require(
            ds.MinterAddr == LibMeta.msgSender(),
            "Only from Redemption contract"
        );

        _;
    }
    modifier onlyGemOwner(uint256 _tokenId) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        require(
            LibERC721._ownerOf(_tokenId) == LibMeta.msgSender(),
            "You don't own this gem"
        );
        _;
    }

    modifier onlyActive(uint256 _tokenId) {
        require(LibGem._isActive(_tokenId), "Gem is deactivated");
        _;
    }

    modifier mintTimeLimit(uint8 _gemType) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        require(
            (block.timestamp - gemType.LastMint >=
                1 hours * uint256(metads.MintLimitHours)) ||
                (gemType.MintCount + 1 <= gemType.DailyLimit),
            "Gem mint restriction"
        );
        _;
    }

    // internal functions

    /// @dev sends the gem payment to other wallets
    // TODO : LP distribution

    function _distributePayment(uint256 _amount, bool _isDefo) internal {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        uint256 amount = _amount;

        IERC20Joe Token;
        /// defo : %75 reward , %25 liq
        if (_isDefo) {
            uint256 reward = (amount * metads.TreasuryDefoRate) / 10000;
            uint256 liq = (amount * metads.LiquidityDefoRate) / 10000;
            Token = metads.DefoToken;
            Token.transfer(metads.RewardPool, reward);
            Token.transfer(metads.Liquidity, liq);
        } else {
            /// dai %67.5 tres , %25 liq , %7.5 core team
            uint256 treasury = (amount * metads.TreasuryDaiRate) / 10000;
            uint256 team = (amount * metads.TeamDaiRate) / 10000;
            uint256 liq = (amount * metads.LiquidityDaiRate) / 10000;
            Token = metads.PaymentToken;
            Token.transfer(metads.Team, team);
            Token.transfer(metads.Treasury, treasury);
            Token.transfer(metads.Liquidity, liq);
        }

        // TODO : add lp distrubition
    }

    function _mintGem(uint8 _type, address _to) internal returns (uint256) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        if (LibERC721._balanceOf(LibMeta.msgSender()) == 0) {
            userds.users.push(LibMeta.msgSender());
        }
        if (metads.MaxGems != 0) {
            require(
                metads._tokenIdCounter.current() < metads.MaxGems,
                "Sold Out"
            );
        }
        uint256 tokenId = metads._tokenIdCounter.current();
        console.log("minting tokenID: ", tokenId);
        metads._tokenIdCounter.increment();
        LibERC721._safeMint(_to, tokenId);
        LibGem.Gem memory gem;
        gem.GemType = _type;
        gem.LastReward = uint32(block.timestamp);
        gem.LastMaintained = uint32(block.timestamp);
        gem.MintTime = uint32(block.timestamp);
        ds.GemOf[tokenId] = gem;
        return tokenId;
    }

    /// @dev main reward calculation and transfer function probably will changed in the future all rates are daily rates

    function _sendRewardTokens(uint256 _tokenid, uint256 _offset)
        internal
        returns (uint256)
    {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        uint256 _rewardDefo = LibGem._taperCalculate(_tokenid);
        LibUser.UserData storage user = userds.GetUserData[LibMeta.msgSender()];
        uint256 taxRate = LibGem._rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 10000));
        }
        _rewardDefo = _rewardDefo - _offset;
        require(_rewardDefo > metads.MinReward, "Less than min reward");

        LibGem.Gem storage gem = ds.GemOf[_tokenid];
        uint256 charityAmount = (metads.CharityRate * _rewardDefo) / 10000;
        _rewardDefo = _rewardDefo - charityAmount;
        gem.claimedReward = gem.claimedReward + _rewardDefo;
        metads.DefoToken.transferFrom(
            metads.RewardPool,
            metads.Donation,
            charityAmount
        );
        metads.TotalCharity = charityAmount + metads.TotalCharity;
        user.charityContribution = user.charityContribution + charityAmount;

        // approve here
        metads.DefoToken.transferFrom(metads.Treasury, msg.sender, _rewardDefo);
        gem.LastReward = uint32(block.timestamp);
        return _rewardDefo;
    }

    // gem compounding function creates a gem from unclaimed rewards , only creates same type of the compounded gem
        function _compound(uint256 _tokenid, uint8 _gemType)
        internal
        mintTimeLimit(_gemType)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata storage gemType = ds.GetGemTypeMetadata[
            _gemType
        ];
        uint256 rewardDefo = LibGem._taperCalculate(_tokenid);
        require(rewardDefo >= (gemType.DefoPrice), "not enough rewards");
        gem.claimedReward = gem.claimedReward + gemType.DefoPrice;

        uint256 tokenId = metads._tokenIdCounter.current();
        metads._tokenIdCounter.increment();
        LibERC721._safeMint(msg.sender, tokenId);
        LibGem.Gem memory newGem;
        newGem.GemType = _gemType;
        newGem.LastMaintained = uint32(block.timestamp);
        newGem.LastReward = uint32(block.timestamp);
        ds.GemOf[tokenId] = newGem;
        if (
            block.timestamp - gemType.LastMint >=
            1 hours * uint256(metads.MintLimitHours)
        ) {
            gemType.LastMint = uint32(block.timestamp);
            gemType.MintCount = 1;
        } else {
            gemType.MintCount = gemType.MintCount + 1;
        }
    }

    // TODO: Add grace period
    function _maintenance(uint256 _tokenid, uint256 _days) internal {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[
            gem.GemType
        ];

        uint256 _fee = gemType.MaintenanceFee;
        uint256 discountRate = _maintenanceDiscount(_tokenid);
        _fee = _fee - ((discountRate * _fee) / 100);
        uint256 _lastTime = gem.LastMaintained;
        require(_lastTime < block.timestamp, "upfront is paid already");
        // TODO TEST : check for possible calculation errors
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
        require(_passedDays > metads.MaintenanceDays, "Too soon");
        _passedDays = _passedDays + _days;
        uint256 _amount = _passedDays * _fee;
        console.log("passedDays: ", _passedDays);
        console.log('_amount: ', _amount);
        require(
            metads.PaymentToken.balanceOf(msg.sender) > _amount,
            "Not enough funds to pay"
        );
        metads.PaymentToken.transferFrom(msg.sender, metads.Treasury, _amount);
        gem.LastMaintained = uint32(block.timestamp) + uint32((_days * 1 days));
        console.log('gem.LastMaintained: ', gem.LastMaintained);
    }

    function _maintenanceDiscount(uint256 _tokenid)
        internal
        view
        returns (uint256)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];

        if (gem.booster == LibGem.Booster.Omega) {
            return 50;
        } else if (gem.booster == LibGem.Booster.Delta) {
            return 25;
        } else {
            return 0;
        }
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

    function BoostGem(LibGem.Booster _booster, uint256 _tokenid)
        public
        onlyGemOwner(_tokenid)
        onlyActive(_tokenid)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenid];
        require(gem.booster == LibGem.Booster.None, "Gem is already boosted");
        LibUser.UserData storage userData = userds.GetUserData[msg.sender];
        require(
            (userData.OmegaClaims[gem.GemType] > 0) ||
                (userData.DeltaClaims[gem.GemType] > 0),
            "Not enough boost claims"
        );
        if (_booster == LibGem.Booster.Omega) {
            require(
                userData.OmegaClaims[gem.GemType] > 0,
                "Not enough boost claims"
            );
            gem.booster = LibGem.Booster.Omega;
            userData.OmegaClaims[gem.GemType] =
                userData.OmegaClaims[gem.GemType] -
                1;
        } else {
            require(
                userData.DeltaClaims[gem.GemType] > 0,
                "Not enough boost claims"
            );
            gem.booster = LibGem.Booster.Delta;
            userData.DeltaClaims[gem.GemType] =
                userData.DeltaClaims[gem.GemType] -
                1;
        }
    }

    /// @notice mint a new gem
    function MintGem(uint8 _type) external SaleLock mintTimeLimit(_type) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        if (metads.MaxGems != 0) {
            require(
                metads._tokenIdCounter.current() < metads.MaxGems,
                "Sold Out"
            );
        }
        LibGem.GemTypeMetadata storage gemType = ds.GetGemTypeMetadata[_type];
        require(
            metads.DefoToken.balanceOf(msg.sender) > gemType.DefoPrice,
            "Insufficient DEFO"
        );
        require(
            metads.PaymentToken.balanceOf(msg.sender) > gemType.StablePrice,
            "Insufficient DAI"
        );
        metads.DefoToken.transferFrom(
            msg.sender,
            address(this),
            gemType.DefoPrice
        );
        metads.PaymentToken.transferFrom(
            msg.sender,
            address(this),
            gemType.StablePrice
        );
        _distributePayment(gemType.DefoPrice, true);
        _distributePayment(gemType.StablePrice, false);
        _mintGem(_type, msg.sender);
        if (
            block.timestamp - gemType.LastMint >=
            1 hours * uint256(metads.MintLimitHours)
        ) {
            gemType.LastMint = uint32(block.timestamp);
            gemType.MintCount = 1;
        } else {
            gemType.MintCount = gemType.MintCount + 1;
        }
    }

    function ClaimRewards(uint256 _tokenid)
        external
        onlyGemOwner(_tokenid)
        onlyActive(_tokenid)
        returns (uint256)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        uint256 rewardPoints = block.timestamp - gem.LastReward;
        require(rewardPoints > metads.RewardTime, "Too soon");

        return _sendRewardTokens(_tokenid, 0);
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
    function Maintenance(uint256 _tokenid, uint256 _days)
        external
        onlyGemOwner(_tokenid)
    {
        _maintenance(_tokenid, _days);
    }

    function BatchMaintenance(uint256[] calldata _tokenids) external {
        require(
            LibERC721._balanceOf(msg.sender) > 0,
            "User doesn't have any gems"
        );
        for (uint256 index = 0; index < _tokenids.length; index++) {
            require(
                LibERC721._ownerOf(_tokenids[index]) == LibMeta.msgSender(),
                "You don't own this gem"
            );
            _maintenance(_tokenids[index], 0);
        }
    }

    function BatchClaimRewards(uint256[] calldata _tokenids) external {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        require(
            LibERC721._balanceOf(msg.sender) > 0,
            "User doesn't have any gems"
        );
        for (uint256 index = 0; index < _tokenids.length; index++) {
            require(
                LibERC721._ownerOf(_tokenids[index]) == LibMeta.msgSender(),
                "You don't own this gem"
            );
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
    function Compound(uint256 _tokenid, uint8 _gemType)
        external
        onlyGemOwner(_tokenid)
        onlyActive(_tokenid)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];
        require(
            metads.PaymentToken.balanceOf(msg.sender) > gemType.StablePrice,
            "Insufficient USD"
        );
        metads.PaymentToken.transferFrom(
            msg.sender,
            address(this),
            gemType.StablePrice
        );

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

    function isActive(uint256 _tokenid) public view returns (bool) {
        return LibGem._isActive(_tokenid);
    }

    function checkRawReward(uint256 _tokenid) public view returns (uint256) {
        return LibGem._checkRawReward(_tokenid);
    }

    function checkTaperedReward(uint256 _tokenid)
        public
        view
        returns (uint256)
    {
        return LibGem._taperCalculate(_tokenid);
    }

    function checkTaxedReward(uint256 _tokenid) public view returns (uint256) {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        uint256 _rewardDefo = LibGem._taperCalculate(_tokenid);
        console.log("_rewardDefo: ", _rewardDefo);
        uint256 taxRate = LibGem._rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
        }
        _rewardDefo = _rewardDefo;

        uint256 charityAmount = (metads.CharityRate * _rewardDefo) / 1000;

        _rewardDefo = _rewardDefo - charityAmount;

        return _rewardDefo;
    }

    function checkPendingMaintenance(uint256 _tokenid)
        public
        view
        returns (uint256)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[
            gem.GemType
        ];
        uint256 _fee = gemType.MaintenanceFee;
        uint256 _lastTime = gem.LastMaintained;
        uint256 _passedDays;
        if (_lastTime > block.timestamp) {
            return 0;
        } else {
            _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
            uint256 _amount = _passedDays * _fee;
            return _amount;
        }
    }

    function getGemIdsOf(address _user) public view returns (uint256[] memory) {
        uint256 numberOfGems = LibERC721._balanceOf(_user);
        console.log("number of gems: ", numberOfGems);
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
    function getGemIdsOfWithType(address _user, uint8 _type)
        public
        view
        returns (uint256[] memory)
    {
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
}
