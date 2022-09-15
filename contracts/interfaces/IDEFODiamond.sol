// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./IConfig.sol";
import "./IYieldGem.sol";
import "./IDonations.sol";
import "./IMaintenance.sol";
import "./IRedeem.sol";
import "./IRewards.sol";
import "./ITransferLimiter.sol";
import "./IVault.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IGetter.sol";

/** @title EIP-2535 Diamond Interface
  * @author Decentralized Foundation Team
  * @notice Combines all facets, used to generate single abi and a Typechain type for easy import
*/
interface IDEFODiamond is IConfig, IGetter, IYieldGem, IDonations, IMaintenance, IRedeem, IRewards, ITransferLimiter, IVault, IERC721 {
}
