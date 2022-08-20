// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "hardhat/console.sol";
import "./LibAppStorage.sol";

/**
 * @notice Library for Fi financial operations structure
 * @author Decentralized Foundation Team
 */

library FiHelper {
    function updateStorage(Fi memory _add, uint256 _tokenId, address _user) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        Gem storage gem = s.gems[_tokenId];

        console.log("=== updateStorage");
        console.log("_add.claimedGross: ", _add.claimedGross);
        console.log("_add.claimTaxPaid: ", _add.claimTaxPaid);
        console.log("_add.donated: ", _add.donated);
        console.log("_add.claimedNet: ", _add.claimedNet);
        console.log("_add.unStakedGross: ", _add.unStakedGross);
        console.log("_add.vaultTaxPaid: ", _add.vaultTaxPaid);
        console.log("_add.donated: ", _add.donated);
        console.log("_add.unStakedNet: ", _add.unStakedNet);
        console.log("_add.stakedGross: ", _add.stakedGross);
        console.log("_add.donated: ", _add.donated);
        console.log("_add.stakedNet: ", _add.stakedNet);


        ///todo refactor financial consisitency checks into a separate function
        //        require(
        //            (_add.claimedGross - _add.claimTaxPaid - _add.donated == _add.claimedNet) &&
        //            (_add.unStakedGross - _add.vaultTaxPaid - _add.donated == _add.unStakedNet) &&
        //            (_add.stakedGross - _add.donated == _add.stakedNetstakedNet)
        //        , "wrong financial operation structure");

        s.total.claimedGross += _add.claimedGross;
        s.total.claimedNet += _add.claimedNet;
        s.total.stakedGross += _add.stakedGross;
        s.total.stakedNet += _add.stakedNet;
        s.total.unStakedGross += _add.unStakedGross;
        s.total.unStakedNet += _add.unStakedNet;
        s.total.donated += _add.donated;
        s.total.claimTaxPaid += _add.claimTaxPaid;
        s.total.vaultTaxPaid += _add.vaultTaxPaid;

        gem.fi.claimedGross += _add.claimedGross;
        gem.fi.claimedNet += _add.claimedNet;
        gem.fi.stakedGross += _add.stakedGross;
        gem.fi.stakedNet += _add.stakedNet;
        gem.fi.unStakedGross += _add.unStakedGross;
        gem.fi.unStakedNet += _add.unStakedNet;
        gem.fi.donated += _add.donated;
        gem.fi.claimTaxPaid += _add.claimTaxPaid;
        gem.fi.vaultTaxPaid += _add.vaultTaxPaid;

        s.usersFi[_user].claimedGross += _add.claimedGross;
        s.usersFi[_user].claimedNet += _add.claimedNet;
        s.usersFi[_user].stakedGross += _add.stakedGross;
        s.usersFi[_user].stakedNet += _add.stakedNet;
        s.usersFi[_user].unStakedGross += _add.unStakedGross;
        s.usersFi[_user].unStakedNet += _add.unStakedNet;
        s.usersFi[_user].donated += _add.donated;
        s.usersFi[_user].claimTaxPaid += _add.claimTaxPaid;
        s.usersFi[_user].vaultTaxPaid += _add.vaultTaxPaid;

    }

}
