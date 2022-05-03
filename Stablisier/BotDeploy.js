/* global ethers */
/* eslint prefer-const: "off" */
const { ethers } = require("hardhat");
const hre = require("hardhat");
const {routerAddress} = require("./helper/addresses");
const {router_abi} = require("./abi/JoeAbis");
const provider = new ethers.providers.JsonRpcProvider("https://rinkeby.infura.io/v3/62f40acd5ec24ddd9405609cdc2dc76f");
const signer = provider.getSigner();
let routerContract, defo, mDai;
let contracts = [];

async function deploy () {
    // const provider = new ethers.providers.JsonRpcProvider();
    // console.log(await provider.getNetwork());
    //initating Router contract
    // const accounts = await ethers.getSigners()
    // const contractOwner = accounts[0]
    [owner] = await ethers.getSigners(); 
    routerContract = await ethers.getContractAt(router_abi, routerAddress )
    const factoryAddress = await routerContract.factory()
    //deploying Defo contract
    const Defo = await hre.ethers.getContractFactory("Defo");
    defo = await Defo.connect(owner).deploy();
    console.log("Defo deployed: ", defo.address);
    //deploying Mock Dai contract
    const MDai = await hre.ethers.getContractFactory("MockDai");
    mDai = await MDai.connect(owner).deploy();
    console.log("Mock Dai deployed: ", mDai.address);
    //deploying lpManager contract.
    const LPManager = await hre.ethers.getContractFactory("LpManager");
    const bufferThreshold= "1000000000000000000000";
    const lpManager = await LPManager.deploy(routerAddress,[ defo.address, mDai.address ], bufferThreshold);
    const pairAddress = await lpManager.getPair();
    //Set lp pool manager
    await defo.setLiquidityPoolManager(lpManager.address);
    console.log("LpManager deployed: ", lpManager.address);
    console.log("Pair Address: ", pairAddress);
    await contracts.push(defo);
    await contracts.push(mDai);
    await contracts.push(lpManager);
    await contracts.push(routerContract);

    return{routerContract, defo, mDai, lpManager, pairAddress}

}

async function transfer(defo, mDai, lpManager, router) {
    [owner, acc1, acc2, acc3, acc4, acc5, acc6, treasury] = await ethers.getSigners(); 
    const defoWithSigner = defo.connect(signer);
    const daiWithSigner = mDai.connect(signer);
    const routerAdd = await lpManager.getRouter();
    const defoAdd = await lpManager.getLeftSide();
    //console.log("left: ", defoAdd)
    const mDaiAdd = await lpManager.getRightSide();
    //console.log("right: ",mDaiAdd)
    const amount = ethers.utils.parseUnits("10000", 18);
    // Send 10000 DAI to All accounts
    await daiWithSigner.connect(owner).transfer(acc1.address, amount);
    await daiWithSigner.connect(owner).transfer(acc2.address, amount);
    await daiWithSigner.connect(owner).transfer(acc3.address, amount);
    await daiWithSigner.connect(owner).transfer(acc4.address, amount);
    await daiWithSigner.connect(owner).transfer(acc5.address, amount);
    await daiWithSigner.connect(owner).transfer(acc6.address, amount);
    await daiWithSigner.connect(owner).transfer(treasury.address, amount);

    // Send 10000 Defo to All accounts
    await defoWithSigner.connect(owner).transfer(acc1.address, amount);
    await defoWithSigner.connect(owner).transfer(acc2.address, amount);
    await defoWithSigner.connect(owner).transfer(acc3.address, amount);
    await defoWithSigner.connect(owner).transfer(acc4.address, amount);
    await defoWithSigner.connect(owner).transfer(acc5.address, amount);
    await defoWithSigner.connect(owner).transfer(acc6.address, amount);
    await defoWithSigner.connect(owner).transfer(treasury.address, amount);

    //Approving router address
    //DAI
    await daiWithSigner.connect(owner).approve(routerAdd, await mDai.balanceOf(owner.address));
    await daiWithSigner.connect(acc1).approve(routerAdd, amount);
    await daiWithSigner.connect(acc2).approve(routerAdd, amount);
    await daiWithSigner.connect(acc3).approve(routerAdd, amount);
    await daiWithSigner.connect(acc4).approve(routerAdd, amount);
    await daiWithSigner.connect(acc5).approve(routerAdd, amount);
    await daiWithSigner.connect(acc6).approve(routerAdd, amount);
    //DEFO
    await defoWithSigner.connect(owner).approve(routerAdd, await defo.balanceOf(owner.address));
    await defoWithSigner.connect(acc1).approve(routerAdd, amount);
    await defoWithSigner.connect(acc2).approve(routerAdd, amount);
    await defoWithSigner.connect(acc3).approve(routerAdd, amount);
    await defoWithSigner.connect(acc4).approve(routerAdd, amount);
    await defoWithSigner.connect(acc5).approve(routerAdd, amount);
    await defoWithSigner.connect(acc6).approve(routerAdd, amount);

    await addingLp(defoAdd, mDaiAdd, router);

}

async function addingLp(defoAdd, mDaiAdd, router) {
    [owner] = await ethers.getSigners();
    const routerWithSigner = router.connect(signer);
    //const defoWithSigner = token1.connect(signer);
    const defoAmount = ethers.utils.parseUnits("25000", 18);
    const daiAmount = ethers.utils.parseUnits("125000", 18);
    //adding liquidity
    await routerWithSigner.connect(owner).addLiquidity
    ( defoAdd, mDaiAdd, 
        defoAmount, daiAmount, 
      "0", "0",
      owner.address, Math.floor(Date.now() / 1000) + 5 * 60 // 5 min
    )
}

async function priceFeed(lpManager) {
    const token0Reserve = await lpManager.getReserver0();
    const token1Reserve = await lpManager.getReserver1();
    //console.log("token0: ",await lpManager.token0())
    //console.log("token1: ",await lpManager.token1())
    const price = token1Reserve/token0Reserve;
    console.log("Token price: ", price);
    // console.log("Defo reserve", token0Reserve);
    // console.log("Dai reserve",token1Reserve);
    return price; 
}

async function swap(treasury, router, fromToken, toToken, amountToSwap){
    const routerWithSigner = router.connect(signer);

    const swapTxObj = await routerWithSigner.connect(treasury).swapExactTokensForTokens(
      amountToSwap, "0", [ fromToken, toToken], 
      treasury.address, Math.floor(Date.now() / 1000) + 5 * 60 // 5 min
    )

    return swapTxObj;
}

//Price Manipulation - Buying
async function increasePrice(){
    let sellAmount =  ethers.utils.parseUnits("1000", 18);
    [owner, acc1, acc2, acc3, acc4, acc5, acc6, treasury] = await ethers.getSigners(); 
    swap(acc1, contracts[03],  contracts[1].address, contracts[0].address, sellAmount)
    swap(acc2, contracts[03],  contracts[1].address, contracts[0].address, sellAmount)
    swap(acc3, contracts[03],  contracts[1].address, contracts[0].address, sellAmount)
    swap(acc4, contracts[03],  contracts[1].address, contracts[0].address, sellAmount)
    swap(acc5, contracts[03],  contracts[1].address, contracts[0].address, sellAmount)
    swap(acc6, contracts[03],  contracts[1].address, contracts[0].address, sellAmount)
    //console.log(arr[3].address);
}


async function decreasePrice(){
    let sellAmount =  ethers.utils.parseUnits("1000", 18);
    [owner, acc1, acc2, acc3, acc4, acc5, acc6, treasury] = await ethers.getSigners(); 
    swap(acc1, contracts[03],  contracts[0].address, contracts[1].address,  sellAmount)
    swap(acc2, contracts[03],  contracts[0].address, contracts[1].address,  sellAmount)
    swap(acc3, contracts[03],  contracts[0].address, contracts[1].address,  sellAmount)
    swap(acc4, contracts[03],  contracts[0].address, contracts[1].address,  sellAmount)
    swap(acc5, contracts[03],  contracts[0].address, contracts[1].address,  sellAmount)
    swap(acc6, contracts[03],  contracts[0].address, contracts[1].address,  sellAmount)
    //console.log(arr[3].address);
}

exports.decreasePrice = decreasePrice;
exports.increasePrice = increasePrice;
exports.swap = swap;
exports.priceFeed = priceFeed; 
exports.transfer = transfer;
exports.deploy = deploy;
