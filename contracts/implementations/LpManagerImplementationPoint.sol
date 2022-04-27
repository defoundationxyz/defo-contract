//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/ILpManager.sol";

abstract contract LpManagerImplementationPoint is Ownable {
    ILpManager public lpPoolManager;

    event UpdateLiquidityPoolManager(
        address indexed oldImplementation,
        address indexed newImplementation
    );

    modifier onlyLiquidityPoolManager() {
        require(
            address(lpPoolManager) != address(0),
            "Implementations: LiquidityPoolManager is not set"
        );
        address sender = _msgSender();
        require(
            sender == address(lpPoolManager),
            "Implementations: Not LiquidityPoolManager"
        );
        _;
    }

    function getLiquidityPoolManager() public view returns (address) {
        return address(lpPoolManager);
    }

    function setLiquidityPoolManager(address newImplementation)
        public
        virtual
        onlyOwner
    {
        address oldImplementation = address(lpPoolManager);
        require(
            Address.isContract(newImplementation) ||
                newImplementation == address(0),
            "LiquidityPoolManager: either 0x0 or a contract address"
        );
        lpPoolManager = ILpManager(newImplementation);

        emit UpdateLiquidityPoolManager(oldImplementation, newImplementation);
    }

    uint256[49] private __gap;
}
