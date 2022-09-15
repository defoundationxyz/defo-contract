// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../interfaces/IDonations.sol";
import "../base-facet/BaseFacet.sol";

/** @title  DonationsFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Donations Getter
*/
contract DonationsFacet is BaseFacet, IDonations {

    /* ============ External and Public Functions ============ */

    function getTotalDonated() external view returns (uint256) {
        return s.usersFi[_msgSender()].donated;
    }

    function getTotalDonatedOf(address _user) external view returns (uint256) {
        return s.usersFi[_user].donated;
    }

    function getTotalDonatedAllUsers() external view returns (uint256) {
        return s.total.donated;
    }
}
