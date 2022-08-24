// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;
import "./LibAppStorage.sol";

/**
 * @notice Library for Fi financial operations structure
 * @author Decentralized Foundation Team
 */

library FiHelper {
    function updateStorage(Fi memory _add, uint256 _tokenId, address _user) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        Gem storage gem = s.gems[_tokenId];


        ///todo refactor financial consisitency checks into a separate function
        //        require(
        //            (_add.claimedGross - _add.claimTaxPaid - _add.donated == _add.claimedNet) &&
        //            (_add.unStakedGross - _add.vaultTaxPaid - _add.donated == _add.unStakedNet) &&
        //            (_add.stakedGross - _add.donated == _add.stakedNetstakedNet)
        //        , "wrong financial operation structure");

        fiAdd(s.total, _add);
        fiAdd(gem.fi, _add);
        fiAdd(s.usersFi[_user], _add);
    }

    function fiAdd(Fi storage _initial, Fi memory _add) internal {
        _initial.claimedGross += _add.claimedGross;
        _initial.claimedNet += _add.claimedNet;
        _initial.stakedGross += _add.stakedGross;
        _initial.stakedNet += _add.stakedNet;
        _initial.unStakedGross += _add.unStakedGross;
        _initial.unStakedGrossUp += _add.unStakedGrossUp;
        _initial.unStakedNet += _add.unStakedNet;
        _initial.donated += _add.donated;
        _initial.claimTaxPaid += _add.claimTaxPaid;
        _initial.vaultTaxPaid += _add.vaultTaxPaid;
    }

}
