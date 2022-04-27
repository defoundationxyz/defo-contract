// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";

interface INode is IERC721EnumerableUpgradeable {

    enum Booster {None, Delta, Omega }

    function RedeemMint(uint8 _type, address _to) external;

    function RedeemMintBooster(uint8 _type, Booster _booster, address _to) external;

    function BoostNode(Booster _booster, uint256 _tokenid) external;
}