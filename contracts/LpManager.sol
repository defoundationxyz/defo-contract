//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./helpers/OwnerRecovery.sol";
import "./interfaces/IJoeFactory.sol";
import "./interfaces/IJoePair.sol";
import "./interfaces/IJoeRouter02.sol";
import "./interfaces/ILpManager.sol";
import "hardhat/console.sol";

contract LpManager is Ownable, OwnerRecovery {
    using SafeERC20 for IERC20;

    event SwapAndLiquify(uint256 indexed half, uint256 indexed initialBalance, uint256 indexed newRightBalance);
    event BufferLpSupply(uint256 indexed amount, uint256 indexed newRightBalance);

    uint256 public bufferThreshold;

    bool public liquifyEnabled = false;
    uint256 public swapTokensToLiquidityThreshold;

    //For testing purpose
    uint256 public pairLiquidityTotalSupply;

    IJoeRouter02 private router;
    IJoePair private pair;
    IERC20 private leftSide;
    IERC20 private rightSide;

    uint256 MAX_UINT256 = type(uint256).max;

    modifier validAddress(address _one) {
        require(_one != address(0));
        _;
    }

    constructor(
        address _router,
        address[2] memory path,
        uint256 _bufferThreshold
    ) validAddress(_router) {
        router = IJoeRouter02(_router);
        pair = createPairWith(path);
        leftSide = IERC20(path[0]);
        rightSide = IERC20(path[1]);
        pairLiquidityTotalSupply = pair.totalSupply();
        setBufferThreshHold(_bufferThreshold);
        shouldLiquify(true);
    }

    // Buffer system
    function buffer() external onlyOwner returns (bool) {
        uint256 tokenBal;
        uint256 defoBal = leftSide.balanceOf(address(this));
        uint256 daiBal = rightSide.balanceOf(address(this));
        (uint256 tokenA, uint256 tokenB, uint256 time) = pair.getReserves();
        uint256 bufferAmount = bufferThreshold;
        require(defoBal >= bufferAmount, "INSUFFICENT_DEFO_BAL");
        unchecked {
            tokenBal = tokenB / tokenA;
            uint256 bufferT = bufferAmount * tokenBal;
            require(daiBal >= bufferT, "INSUFFICENT_DAI_BAL");
        }
        uint256 daiSwapBal = bufferDefo(bufferAmount, daiBal, tokenBal);
        uint256 rightBalanceAfter;
        unchecked {
            rightBalanceAfter = daiBal - daiSwapBal;
        }
        addLiquidityToken(defoBal, daiSwapBal);
        emit BufferLpSupply(bufferAmount, rightBalanceAfter);
        // Keeping reserve healthy
        pair.sync();
        // Always update liquidity total supply
        pairLiquidityTotalSupply = pair.totalSupply();

        return true;
    }

    // Buffer defo/dai. Lp added will be depend on
    function bufferDefo(
        uint256 _bufferThreshold,
        uint256 _daiBal,
        uint256 _tokenPrice
    ) internal pure returns (uint256) {
        uint256 defoSupplyInDai;
        uint256 daiBalanceAfter;
        uint256 netDaiAmount;
        unchecked {
            defoSupplyInDai = _bufferThreshold * _tokenPrice;
            // Checking left over Dai amount
            daiBalanceAfter = _daiBal - defoSupplyInDai;
            //Getting the net amount we want to keep 1:1 in term of price
            netDaiAmount = _daiBal - daiBalanceAfter;
        }
        return netDaiAmount;
    }

    function addLiquidityToken(uint256 leftAmount, uint256 rightAmount) private {
        router.addLiquidity(
            address(leftSide),
            address(rightSide),
            leftAmount,
            rightAmount,
            0, // Slippage is unavoidable
            0, // Slippage is unavoidable
            address(this),
            block.timestamp
        );
    }

    function createPairWith(address[2] memory path) private returns (IJoePair) {
        IJoeFactory factory = IJoeFactory(router.factory());
        address _pair;
        address _currentPair = factory.createPair(path[0], path[1]);
        if (_currentPair != address(0)) {
            _pair = _currentPair;
        } else {
            _pair = factory.createPair(path[0], path[1]);
        }
        return IJoePair(_pair);
    }

    //owner function
    function setAllowance(bool active) public onlyOwner {
        // Gas optimization - Approval
        // There is no risk in giving unlimited allowance to the router
        // As long as it's a trusted one
        leftSide.safeApprove(address(router), (active ? MAX_UINT256 : 0));
        rightSide.safeApprove(address(router), (active ? MAX_UINT256 : 0));
    }

    function shouldLiquify(bool _liquifyEnabled) public onlyOwner {
        liquifyEnabled = _liquifyEnabled;
        setAllowance(_liquifyEnabled);
    }

    function setBufferThreshHold(uint256 _threshHold) public onlyOwner {
        require(_threshHold > 0, "MUST_BE_GREATER_THAN_ZERO");
        bufferThreshold = _threshHold;
    }

    //view functions
    function getRouter() external view returns (address) {
        return address(router);
    }

    function getPair() external view returns (address) {
        return address(pair);
    }

    /*@notice Should be DEFO
     */
    function getLeftSide() external view returns (address) {
        return address(leftSide);
    }

    /*@notice Should be DAI
     */
    function getRightSide() external view returns (address) {
        return address(rightSide);
    }

    function isPair(address _pair) public view returns (bool) {
        return _pair == address(pair);
    }

    function getLeftBalance() public view returns (uint256) {
        return leftSide.balanceOf(address(this));
    }

    function getRightBalance() public view returns (uint256) {
        return rightSide.balanceOf(address(this));
    }

    function isLiquidityAdded() external view returns (bool) {
        return pairLiquidityTotalSupply > pair.totalSupply();
    }

    /*@notice Should be TraderJoe's router
    /*These function are mainly for testing purposes
    */
    function isRouter(address _router) public view returns (bool) {
        return _router == address(router);
    }

    function getSupply() external view returns (uint256) {
        return pair.totalSupply();
    }

    function setPairAllowance(address _spender, uint256 _amount) public {
        pair.approve(_spender, _amount);
    }

    //@notice Below functions are to test the price action
    function getReserver0() external view returns (uint112 reserve0) {
        uint112 reserve1;
        uint256 time;
        (reserve0, reserve1, time) = pair.getReserves();
    }

    function getReserver1() external view returns (uint112 reserve1) {
        uint112 reserve0;
        uint256 time;
        (reserve0, reserve1, time) = pair.getReserves();
    }

    function checkBalance() external view returns (uint256) {
        uint256 balance = pair.balanceOf(msg.sender);
        return balance;
    }

    function token0() external view returns (address) {
        return pair.token0();
    }

    function token1() external view returns (address) {
        return pair.token1();
    }
}
