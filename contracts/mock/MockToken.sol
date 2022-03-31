//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "hardhat/console.sol";

interface Optimiser {
    function transferLog(
        address to,
        address from,
        uint256 amount
    ) external returns (bool);
}

// @title Defo Token Contract
// @notice main token for DeFo new tokens can only minted by node/reward distrubitor contract
contract MockToken is ERC20, AccessControl, ERC20Burnable {
    address public optimiserAddress;

    constructor(address _optimiser) ERC20("Defo Token", "DEFO") {
        // @dev deployer is admin for now this could be changed when we write the deployment scripts
        optimiserAddress = _optimiser;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // only for test
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // @dev only node contracts should have this role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // @dev probably we will need a more complex role system in the future
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // @dev the tokens must be approved before calling this function
    // @notice burner function for deflationary mechanics only callable from an address with BURNER_ROLE
    function burnFrom(address account, uint256 amount)
        public
        override
        onlyRole(BURNER_ROLE)
    {
        _burn(account, amount);
    }

    // @notice this will burn the tokens that owned by this contract similar to uniswap pair contracts mostly for delayed burn mechanics
    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(address(this), amount);
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
                optimiser.transferLog(to, from, amount),
                "Transfer forbidden"
            );
        }
    }

    function changeOptimiser(address _optimiser)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
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