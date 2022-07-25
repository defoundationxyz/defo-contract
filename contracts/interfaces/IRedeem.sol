// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

/** @title  IRedeem, stand-alone contract
  * @author Decentralized Foundation Team
  * @notice Redeem contract responsible for exchange of the pre-sold tokens to a real yield gems with benefits, not part of the Diamond Facet
*/

interface IRedeem {
    /**
    *   @notice this function should be called by a pre-sold gem owner, as a result, yeild gems and boosters should be available in the dapp
    */
    function redeem() external;
}
