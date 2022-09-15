// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../base-facet/BaseFacet.sol";
import "../interfaces/IGetter.sol";
import "../interfaces/IYieldGem.sol";
import "../libraries/LibMintLimiter.sol";

/** @title  BoosterFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Minting functionality including redeeming pre-sold nodes
*/
contract BoosterFacet is BaseFacet, IGetter {

    /* ====================== Modifiers ====================== */

    modifier onlyRedeemContract() {
        require(s.config.wallets[uint(Wallets.RedeemContract)] == _msgSender(), "Unauthorized");
        _;
    }

    /* ============ External and Public Functions ============ */

    function createBooster(address _to, uint8 _gemType, Booster _booster) public onlyRedeemContract {
        s.usersNextGemBooster[_to][_gemType][_booster]++;
    }

    function removeBooster(address _to, uint8 _gemType, Booster _booster) public onlyRedeemContract {
        s.usersNextGemBooster[_to][_gemType][_booster]--;
    }

    function getBooster(address _to, uint8 _gemType, Booster _booster) public view onlyRedeemContract returns (uint256) {
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

}
