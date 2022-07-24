//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/ILimiter.sol";

/// To do: Finish limiter so I can make interface

contract LimiterImplementationPointer is Ownable {
    ILimiter public DefoLimiter;

    event UpdatedLimiterImplementation(address indexed oldImplementation, address indexed newImplementation);

    modifier onlyLiquidityPoolManager() {
        require(address(DefoLimiter) != address(0), "Implementations: Limiter is not set");
        address sender = _msgSender();
        require(sender == address(DefoLimiter), "Implementations: Not Limiter");
        _;
    }

    function setLimiter(address newImplementation) public onlyOwner {
        address oldImplementation = address(DefoLimiter);
        require(
            Address.isContract(newImplementation) || newImplementation == address(0),
            "Limiter: You can only set 0x0 or a contract address as a new implementation"
        );
        DefoLimiter = ILimiter(newImplementation);

        emit UpdatedLimiterImplementation(oldImplementation, newImplementation);
    }

    function getLimiter() public view returns (address) {}

    uint256[49] private __gap;
}
