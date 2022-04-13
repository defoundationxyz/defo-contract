//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./helpers/OwnerRecovery.sol";
import "../interfaces/IJoeFactory.sol";
import "../interfaces/IJoePair.sol";
import "../interfaces/IJoeRouter02.sol";
import "../interfaces/ILpManager.sol";
import "./Universe.sol";
import "hardhat/console.sol";


contract  LpManager is Ownable, OwnerRecovery, Universe{

    using SafeERC20 for IERC20;

    event SwapAndLiquify(uint256 indexed half, uint256 indexed initialBalance, uint256 indexed newRightBalance);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);

    //Fee and treasury address to add
    address public feeTo;
    address private rewardPool;
    uint256 public feePercentage;// = 3; //0.3%
    uint256 public sellTaxPercentage = 50;//50%

    bool public liquifyEnabled = false;
    bool private isSwapping = false;
    uint256 public swapTokensToLiquidityThreshold;

    uint256 public pairLiquidityTotalSupply;

    IJoeRouter02 private router;
    IJoePair private pair;
    IERC20 private leftSide;
    IERC20 private rightSide;

    uint256 MAX_UINT256 = type(uint).max;

    modifier validAddress(address _one, address _two){
        require(_one != address(0));
        require(_two != address(0));
        _;
    }

    constructor( address _router, address _rewardPool ,address[2] memory path, uint256 _swapTokensToLiquidityThreshold ) validAddress(_router, _rewardPool){
        rewardPool = _rewardPool;
        router = IJoeRouter02(_router);
        pair = createPairWith(path);
        leftSide = IERC20(path[0]);
        rightSide = IERC20(path[1]);
        pairLiquidityTotalSupply = pair.totalSupply();
        updateSwapTokensToLiquidityThreshold(_swapTokensToLiquidityThreshold);
        // Left side should be main contract
        changeUniverseImplementation(address(leftSide));
        shouldLiquify(true);
    
    }

    function calculateSellTax(address spender, address receiver, uint256 amount) external view validAddress(spender, receiver) returns (uint256){
        uint spenderBalance = leftSide.balanceOf(spender);
        require(spenderBalance >= amount, "Insuifficent balance");
        //bool isSell = receiver == address(0) || receiver == pairAddress || receiver == routerAddress;
        uint256 feeAmount = (amount*sellTaxPercentage)/100;
        return feeAmount;
        
    }

    function checkSelling(address receiver) external view returns (bool){
        //saving gas
        address pairAddress = address(pair);
        address routerAddress = address(router);
        bool isSell = receiver == address(0) || receiver == pairAddress || receiver == routerAddress;
        return isSell;
    }


    // function afterTokenTransfer(address _sender) external onlyUniverse returns (bool){
    //     uint256 leftSideBalance = leftSide.balanceOf(address(this));
    //     bool shouldSwap = leftSideBalance >= swapTokensToLiquidityThreshold;
    //     if (shouldSwap && liquifyEnabled && pair.totalSupply() > 0 
    //     && !isSwapping &&!isPair(_sender) && !isRouter(_sender)) 
    //     {
    //         // This prevents inside calls from triggering this function again (infinite loop)
    //         // It's ok for this function to be reentrant since it's protected by this check
    //         isSwapping = true;
    //         // To prevent bigger sell impact we only sell in batches with the threshold as a limit
    //         uint256 totalLP = swapAndLiquify(swapTokensToLiquidityThreshold);
    //         uint256 totalLPRemaining = totalLP;
    //         // address _owner = owner();
    //         // address owner = _owner;

    //         if(feeTo == address(0)){
    //             sendLPTokensTo(treasury, totalLPRemaining);
    //         } else {
    //             uint256 calculatedFee = (totalLPRemaining * feePercentage) / 100;
    //             totalLPRemaining -= calculatedFee;
    //             sendLPTokensTo(feeTo, calculatedFee);
    //             sendLPTokensTo(treasury, totalLPRemaining);
    //         }
    //         // Keep it healthy
    //         pair.sync();
    //         // This prevents inside calls from triggering this function again (infinite loop)
    //         isSwapping = false;
    //     }
    //      // Always update liquidity total supply
    //     pairLiquidityTotalSupply = pair.totalSupply();
    //     return true;
    // }

    // Magical function that adds liquidity effortlessly
    function swapAndLiquify(uint256 tokens) private returns (uint256) {
        uint256 half = tokens / 2;
        uint256 initialRightBalance = rightSide.balanceOf(address(this));

        swapLeftSideForRightSide(half);

        uint256 newRightBalance = rightSide.balanceOf(address(this)) -
            initialRightBalance;

        addLiquidityToken(half, newRightBalance);

        emit SwapAndLiquify(half, initialRightBalance, newRightBalance);

        // Return the number of LP tokens this contract have
        return pair.balanceOf(address(this));
    }

    // Transfer LP tokens conveniently
    function sendLPTokensTo(address to, uint256 tokens) private {
        pair.transfer(to, tokens);
    }

    function createPairWith(address[2] memory path) private returns (IJoePair) {
        IJoeFactory factory = IJoeFactory(router.factory());
       // console.log(factory);
        address _pair;
        address _currentPair = factory.createPair(path[0], path[1]);
        if (_currentPair != address(0)) {
            _pair = _currentPair;
        } else {
            _pair = factory.createPair(path[0], path[1]);
        }
        return IJoePair(_pair);
    }

    function swapLeftSideForRightSide(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(leftSide);
        path[1] = address(rightSide);

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            tokenAmount,
            0, // Accept any amount
            path,
            address(this),
            block.timestamp
        );
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

    function updateSwapTokensToLiquidityThreshold(uint256 _swapTokensToLiquidityThreshold) public onlyOwner {
        require(_swapTokensToLiquidityThreshold > 0,
            "LiquidityPoolManager: Number of coins to swap to liquidity must be defined");
        swapTokensToLiquidityThreshold = _swapTokensToLiquidityThreshold;
    }

    function setRewardAddress(address _newRewardPool) public onlyOwner{
        rewardPool = _newRewardPool;
    }
    function setFeeTo(address _newFeeaddress) public onlyOwner {
        feeTo = _newFeeaddress;
    }

    /*Fee percentage set by owner only. Fee should be in the following pattery as it divide by 100
        3/100 = 0.03,
        30/100 = 0.3,
        300/100 =3  
    */
    function setSellTax (uint256 _newSellPercent) public onlyOwner{
        feePercentage = _newSellPercent;
    }

    //view functions
    function getRouter() external view returns (address) {
        return address(router); 
    }

    function getPair() external view returns (address) {
        return address(pair);
    }

    function getRewardAddress() external view returns(address){
        return rewardPool;
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

    /*@notice Should be TraderJoe's router
    */
    function isRouter(address _router) public view returns (bool) {
        return _router == address(router);
    }

    function getSupply() external view returns (uint256) {
        return pair.totalSupply();
    }

    function setPairAllowance(address _spender, uint _amount) public {
        pair.approve(_spender, _amount);
    }

    function isLiquidityAdded() external view returns (bool) {
        return pairLiquidityTotalSupply > pair.totalSupply();
    }

    function checkBalance() external view returns (uint256){
        uint256 balance = pair.balanceOf(msg.sender);
        return balance;
    }

}
