// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IGemFacet {

    function getGemIdsOf(address _user) public view returns (uint256[] memory);

    ///@dev calling this function from another contract is not clever
    // TODO: please fix
    function getGemIdsOfWithType(address _user, uint8 _type) public view returns (uint256[] memory);
}