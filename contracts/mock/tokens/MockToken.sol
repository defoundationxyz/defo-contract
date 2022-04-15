//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

interface Optimiser {
    function transferLog(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

// @title Defo Token Contract
// @notice main token for DeFo new tokens can only minted by node/reward distrubitor contract
contract MockToken is ERC20 {
    address public optimiserAddress;

    constructor(address _optimiser) ERC20("Defo Token", "DEFO") {
        // @dev deployer is admin for now this could be changed when we write the deployment scripts
        optimiserAddress = _optimiser;
    }
    function mint(address account, uint256 amount) public  {
        _mint(account, amount);
    }
    
    // @dev transfer limit enforcer WIP
    // probably just reverting in the limiter contract is a better solution
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        console.log(from);
        if (address(optimiserAddress) != address(0)) {
            Optimiser optimiser = Optimiser(optimiserAddress);
            require(
                optimiser.transferLog(from, to, amount),
                "Transfer forbidden"
            );
        }
    }

    function changeOptimiser(address _optimiser)
        external
    {
        optimiserAddress = _optimiser;
    }

    // @dev pre approve optimiser contract for taxing
    function allowance(address owner, address spender)
        public
        view
        virtual
        override
        returns (uint256)
    {
        if (spender == optimiserAddress) {
            return type(uint256).max;
        } else {
            return super.allowance(owner, spender);
        }
    }

}