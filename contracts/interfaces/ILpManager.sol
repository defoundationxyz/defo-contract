//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import "../interfaces/IJoeFactory.sol";
import "./IJoePair.sol";
//import "../interfaces/IJoeRouter02.sol";
//import "../interfaces/ILpManager.sol";
import "hardhat/console.sol";


interface ILpManager {

    event SwapAndLiquify(uint256 indexed half, uint256 indexed initialBalance, uint256 indexed newRightBalance);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);

    function afterTokenTransfer(address _sender) external returns (bool);

    function swapAndLiquify(uint256 tokens) external returns (uint256);

    function sendLPTokensTo(address to, uint256 tokens) external;

    function createPairWith(address[2] memory path) external returns (IJoePair);

    function swapLeftSideForRightSide(uint256 tokenAmount) external;

    function addLiquidityToken(uint256 leftAmount, uint256 rightAmount) external;

    function setAllowance(bool active) external;

    function shouldLiquify(bool _liquifyEnabled) external;

    function updateSwapTokensToLiquidityThreshold(uint256 _swapTokensToLiquidityThreshold) external;

    function setFeeTo(address _newFeeAddress) external;

    function getRouter() external view returns (address);

    function getPair() external view returns (address);
    
    function getLeftSide() external view returns (address);

    function getRightSide() external view returns (address);

    function isPair(address _pair) external view returns (bool);

    function isRouter(address _router) external view returns (bool);

    function isLiquidityAdded() external view returns(bool);

}