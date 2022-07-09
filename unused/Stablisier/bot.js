 const { ethers } = require("hardhat");
 const {routerAddress, lpAddress, factoryAddress, defoAddress, mDaiAddress} = require("./helper/addresses");
 const {router_abi, lpManager_abi, factory_abi, defo_abi} = require("./abi/JoeAbis");
 const {deploy, transfer, priceFeed, swap, increasePrice, decreasePrice} = require("./BotDeploy");
 const BigNumber = require('bignumber.js');
 const nodeCron = require("node-cron");
 //const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
 //const web3 = createAlchemyWeb3("https://eth-rinkeby.alchemyapi.io/v2/z163QaOupx5PMHBn1qDyutfl0XAvc34J");
let router, lpManager, launchPrice;
launchprice = "5";
let lp = [];
/*@notice @dev We will notr sell more than 5% of treasury amount in one tx.
  We can surely change when suitable.*/
const sellPercentThreshold = "5";
const buyPercentThreshold = "5";
async function initContractsTx(){
    [owner, acc1, acc2, acc3, acc4, acc5, acc6, treasury] = await ethers.getSigners(); 
    let deployContract = await deploy();
    let router = deployContract.routerContract; 
    let defo = deployContract.defo;
    let mDai = deployContract.mDai;
    let lpManager = deployContract.lpManager;
    let pairddress = deployContract.pairAddress;
    await lp.push(lpManager);
    //This is for testing only
    await transfer( defo, mDai, lpManager, router);
    /* @notice Rinkeby(Joe's) Contracts showing token0 == rightSide. 
    Should be token0 == rightSide. When deploying on mainnet, need to adjust the
    price calculation to reserve1/reserve0
     */
    price = await priceFeed(lpManager);
    const threasuryBalance = (await defo.balanceOf(treasury.address));
    /*Won't sell more than 5% or 100 Defo in single tx*/ 
    let sellAmount =  ethers.utils.parseUnits("100", 18);
    let buyAmount =  ethers.utils.parseUnits("100", 18);
    console.log(threasuryBalance);
    console.log(sellAmount);
    console.log(price);
    await decreasePrice() 
    //await increasePrice();
    price = await priceFeed(lpManager);
    if (price > "6"){
        console.log(" ---------Selling Defo--------- ")
        await defo.connect(treasury).approve(routerAddress, sellAmount);
        const tx = await swap(treasury, router, defo.address, mDai.address, sellAmount);
        // console.log(threasuryBalance);
        // console.log(ethers.utils.formatUnits(await defo.balanceOf(treasury.address), 18));
        // console.log(ethers.utils.formatUnits(await mDai.balanceOf(treasury.address), 18))
        console.log("Swap tx hash: ", tx.hash)
    }
    else if(price <"5") {
        console.log("---------Buying Defo--------- ")
        await mDai.connect(treasury).approve(routerAddress, buyAmount);
        const tx = await swap(treasury, router, mDai.address, defo.address, sellAmount);
        // console.log(threasuryBalance);
        // console.log(ethers.utils.formatUnits(await defo.balanceOf(treasury.address), 18));
        // console.log(ethers.utils.formatUnits(await mDai.balanceOf(treasury.address), 18))
        console.log("Swap tx hash: ", tx.hash)

    }
   // await priceFeed(lpManager);
    
   
}

async function main() {
    let priceState;
    nodeCron.schedule("* * * * *", async function () {
      try{ //priceState =  await priceFeed(lp[0]);
      console.log("(---------Initializing Bot ---------)")
        await initContractsTx();
        } catch (error) {
      console.error(error);
    }
   })
   //console.log(await router.WAVAX())

 
}
main();   