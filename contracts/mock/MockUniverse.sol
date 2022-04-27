//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";
import "./interfaces/IUniverse.sol";

abstract contract Universe is Ownable{
    IUniverse internal universe;

    event UpdateUniverse(address indexed oldImplementation, address indexed newImplementation);

    modifier onlyUniverse() {
        require(address(universe) != address(0),"Implementations: Universe is not set");
        address sender = _msgSender();
        require(
            sender == address(universe),
            "Implementations: Not Universe"
        );
        _;
    }

    function getUniverseImplementation() public view returns (address) {
        return address(universe);
    }

    function changeUniverseImplementation(address newImplementation) public virtual onlyOwner {
        address oldImplementation = address(universe);
        require(
            Address.isContract(newImplementation) ||
                newImplementation == address(0),
            "Universe: You can only set 0x0 or a contract address as a new implementation"
        );
        universe = IUniverse(newImplementation);
        emit UpdateUniverse(oldImplementation, newImplementation);
    }
}