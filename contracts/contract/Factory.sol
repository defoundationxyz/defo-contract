//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OwnerRecovery.sol";
import "../interfaces/ILiquidityPoolManager.sol";
import "../interfaces/IFactory.sol";

contract  Factory is IFactory, Ownable{
    address public override owner;
    address public override feeTo;
    address public override router;
    
    mapping(address=>mapping(address => address)) public override getPair;
    address[] public override allPairs;

    constructor() public{
        owner = msg.sender;
    }

    function allPairsLength() external override view returns (uint256){
        return allPairs.length;
    }

    function createPair(address _token0, address _token1) external override onlyOwner returns(address _pair){
        require(_token0 != _token1, "IDENTICAL_ADDRESSES");
        (address tokenA, address tokenB) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
        require(tokenA != address(0), "INVALID_ADDRESS");
        require(getPair[tokenA][tokenB] == address(0), "ALREADY_EXISTS");
        //Need to implement below line in Pair contract yet
        bytes memory bytecode = type(Pair).creationCode;  
        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));
        assembly {
            _pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        //Need to implement below line in Pair contract yet
        Pair(_pair).initialize(tokenA, tokenB);
        getPair[tokenA][tokenB] = _pair;
        getPair[tokenA][tokenB] = _pair; // populate mapping in the reverse direction
        allPairs.push(_pair);
        emit PairCreated(tokenA, tokenB, _pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external override onlyOwner() {
        feeTo = _feeTo;
    }

    function setRouter(address _newRouter) external override onlyOwner(){
        router = _newRouter;
    }

    function setOwner (address _newOwner) external override onlyOwner(){
        owner = _newOwner;
    }

}