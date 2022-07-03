const { ethers } = require("ethers");
require('dotenv').config();
const {routerAdd, factory, defo, mDai} = require("./helper/addresses");
//mainnet address only use when on mainnet
//const {traderRouter, traderFactory, dai} = require("./helper/addresses");
const {traderRouter_abi, traderFactory_abi, uni_router, factory_abi, lp_abi, ERC20_abi} = require("./abi/JoeAbis");
const provider = new ethers.providers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
//Mainnet connection only only use when on mainnet
//const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc");
const signer = provider.getSigner();
let wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//Array
let contracts = [];
async function deploy () {
    router = new ethers.Contract(routerAdd, uni_router, provider);
    factoryContract = new ethers.Contract(factory, factory_abi, provider);
    const lpAddress = await factoryContract.getPair(defo, mDai);
    lpContract = new ethers.Contract(lpAddress, lp_abi, provider);
    defoContract = new ethers.Contract(defo, ERC20_abi, provider);
    daiContract = new ethers.Contract(mDai, ERC20_abi, provider);
    const defoAllowance = await defoContract.functions.allowance(wallet.address, routerAdd );  
    const daiAllowance = await daiContract.functions.allowance( wallet.address, routerAdd);
    //Approving if not approved before
    if (defoAllowance == 0){
        await approve(defoContract);
    }
    //Approving if not approved before
    if (daiAllowance == 0){
        await approve(daiContract);
    }

    await contracts.push(factoryContract);
    await contracts.push(lpContract);

    return {router, lpContract};

}

async function approve(tokenContract){
    const tokenSigner = tokenContract.connect(wallet);
    let approveTokenAmount = ((await tokenContract.functions.balanceOf(wallet.address)).toString())
    await tokenSigner.approve(routerAdd, approveTokenAmount);
}

async function addingLp(router) {
    const routerWithSigner = router.connect(wallet);
    //const defoWithSigner = token1.connect(signer);
    const defoAmount = ethers.utils.parseUnits("5000", 18);
    const daiAmount = ethers.utils.parseUnits("25000", 18);
    //adding liquidity
    await routerWithSigner.addLiquidity
    ( defo, mDai, 
        defoAmount, daiAmount, 
      "0", "0",
      wallet.address, Math.floor(Date.now() / 1000) + 5 * 60 // 5 min
    )
}

async function priceFeed(lpContract) {
    reserves = await lpContract.getReserves();
    const reserve0 = reserves[0].toString()
    const reserve1 = reserves[1].toString()
    const price = reserve1/reserve0;
    console.log("Token price: ", price);

    return price; 
}

async function swap( router, amountToSwap){
    const routerWithSigner = router.connect(wallet);

    const swapTxObj = await routerWithSigner.swapExactTokensForTokens(
      amountToSwap, "0", [defo, mDai], 
      wallet.address, Math.floor(Date.now() / 1000) + 5 * 60 // 5 min
    )

    return swapTxObj;
}

async function reverseSwap(router, amountToSwap){
    const routerWithSigner = router.connect(wallet);

    const swapTxObj = await routerWithSigner.swapExactTokensForTokens(
      amountToSwap, "0", [mDai, defo], 
      wallet.address, Math.floor(Date.now() / 1000) + 5 * 60 // 5 min
    )

    return swapTxObj;
}

exports.reverseSwap = reverseSwap;
exports.addingLp = addingLp;
exports.swap = swap;
exports.priceFeed = priceFeed; 
exports.deploy = deploy;

