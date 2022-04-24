//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../../interfaces/ILeftSideImplementation.sol";

abstract contract LeftSideImplementation is Ownable{
    ILeftSideImplementation internal defo;

    event UpdateLeftSide( address indexed oldImplementation, address indexed newImplementation);

    modifier onlyLeftSide(){
         require(
            address(defo) != address(0),
            "Implementations: Defo is not set"
        );
        address sender = _msgSender();
        require(
            sender == address(defo),
            "Implementations: Not Defo"
        );
        _;
    }

    function getDefoImplementation() public view returns (address) {
        return address(defo);
    }

    function changeDefoImplementation(address newImplementation)
        public
        virtual
        onlyOwner
    {
        address oldImplementation = address(defo);
        require(
            Address.isContract(newImplementation) ||
                newImplementation == address(0),
            "DEFO: EITHER_0x0_OR_A_CONTRACT_ADDRESS"
        );
        defo = ILeftSideImplementation(newImplementation);
        emit UpdateLeftSide(oldImplementation, newImplementation);
    }
    uint256[49] private __gap;

}