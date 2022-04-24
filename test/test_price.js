const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const Table = require("cli-table3");
const {router_abi, factory_abi} = require("../abi/router_abi");
const routerAddress = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"


describe("Price Testing", function(){
    let defoOwner, dai, lpManagerOwner, wAVAX, acc2, routerContract, defoTtAddress, factoryAddress, swapTokensToLiquidityThreshold;
  let defo, lpManager;
  let table = new Table({
    head:['Contracts', 'contract addresses'],
    colWidths:['auto','auto']
  });
  beforeEach(async function()  {
    await ethers.provider.send("hardhat_reset",[{
                forking: {
                    jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                    blockNumber: 2975762,
                },
            },
        ],
    );

    [defoOwner, daiOwner, wAVAXOwner, treasury, lpManagerOwner, acc2] = await ethers.getSigners();
    //initating Router contract
    routerContract = await ethers.getContractAt(router_abi, routerAddress )
    factoryAddress = await routerContract.factory()
    
    // deploying defo contract
    const Defo = await hre.ethers.getContractFactory("Defo");
    defo = await Defo.connect(defoOwner).deploy();

    //deploying dai contract
    const MockDai = await hre.ethers.getContractFactory("MockDai");
    dai = await MockDai.deploy(daiOwner.address);
    
    //deploying Wavax contract
    const WAVAX = await hre.ethers.getContractFactory("MockDai");
    wAVAX = await WAVAX.deploy(wAVAXOwner.address);

    //deploying Lp manager
    const LpManager = await hre.ethers.getContractFactory("LpManager");
    swapTokensToLiquidityThreshold= ethers.utils.parseEther("1000"); //100 tokens
    const bufferThreshold = ethers.utils.parseEther("200");
    lpManager = await LpManager.connect(lpManagerOwner).deploy(routerAddress, [defo.address, dai.address] , bufferThreshold);
    defoTtAddress = await lpManager.getPair();
   
    //set setLiquidityPoolManager with Lp manager address
    await defo.setLiquidityPoolManager(lpManager.address);
    const lpManagerViaDefo = await defo.lpPoolManager();
    
    // Adding LP 
    //transfering and approving defo and Dai token 
    const defoLpAmount = ethers.utils.parseEther("25000"); //25000
    const daiLpAmount = ethers.utils.parseEther("125000"); //125000 tokens
    const daiApproveAmount = ethers.utils.parseEther("130000"); //25000 tokens

    //Transfering and approving defo
    await defo.connect(defoOwner).approve(routerAddress, daiApproveAmount);

    //transfering Dai
    await dai.connect(daiOwner).transfer(defoOwner.address, daiApproveAmount);
    const accOneBalanceDai = ethers.utils.formatUnits (await dai.balanceOf(defoOwner.address), 18);
    expect (accOneBalanceDai.toString()).to.equal(ethers.utils.formatUnits (daiApproveAmount, 18).toString()).to.ok;
    await dai.connect(defoOwner).approve(routerAddress, daiApproveAmount);
    
    //adding liquidity
    const minimumToken =  "0"; //480 tokens
    await routerContract.connect(defoOwner).addLiquidity
    ( defo.address, dai.address,
      defoLpAmount, daiLpAmount,
        minimumToken, minimumToken,
    defoOwner.address, "1649910829447"// update this with current epoch
    )
    console.log("LP balance: ", ethers.utils.formatUnits(await lpManager.getSupply(), 18));
    // console.log("defo balance of owner:", await defo.balanceOf(lpManager.address));
    // console.log("dai balance of owner:", await dai.balanceOf(lpManager.address));
    
    table.push(
        ['Defo token deployed at:', defo.address],
        ["Defo owner is: ", defoOwner.address],
        ["dai deployed at: " , dai.address],
        ["dai Owner: " , daiOwner.address ],
        ["factory address: ", factoryAddress],
        ["LpManager deployed at:", lpManager.address],
        ["Lp address: ", defoTtAddress],
        ["Router address: ", routerAddress],
        ["Lp Manager By defo", lpManagerViaDefo],
        ["reward pool address: ", treasury.address],
      );
    });

  it("Contracts address ", async function(){
    console.log(table.toString());
  })

  it("Testing Price based on reserve", async function(){
    table = new Table({
      head:['Tests', 'Result'],
      colWidths:['auto','auto']
    });

    //Checking total Lp minted
    let lpLiquidityBalance = ethers.utils.formatUnits(await lpManager.getSupply(), 18);
    //defo Reserves
    let reserver0 = ethers.utils.formatUnits (await lpManager.getReserver0(), 18);
    //dai Reserves
    let reserver1 = ethers.utils.formatUnits (await lpManager.getReserver1(), 18);
    // Checking defo price
    let defoDaiPrice = reserver1/reserver0;
    
    //swapping token dai for defo / buying
    const amountToSwap = ethers.utils.parseEther("5000"); //1000
    await routerContract.connect(defoOwner).swapExactTokensForTokens(
      amountToSwap, "0", [ dai.address, defo.address], 
      defoOwner.address, "1649910829447"
    );
    
    // Checking Balance after buying defo
    const ownerDefoBalanceAfter =  ethers.utils.formatUnits(await defo.balanceOf(defoOwner.address), 18);
    const ownerDaiBalanceAfter = ethers.utils.formatUnits(await dai.balanceOf(defoOwner.address), 18); 
    // Checking LP balance after swap
    const lpLiquidityBalanceAfterSwap = ethers.utils.formatUnits(await lpManager.getSupply(), 18);
    // Reserves after buying defo
    const reserver0before = ethers.utils.formatUnits (await lpManager.getReserver0(), 18);
    const reserver1before = ethers.utils.formatUnits (await lpManager.getReserver1(), 18);
    // Checking after buying
    const defoDaiPriceBefore = reserver1before/reserver0before;

    // Selling defo token for dai
    const sellingAmount = ethers.utils.parseEther("1000"); //1000
    await routerContract.connect(defoOwner).swapExactTokensForTokens(
      sellingAmount, "0", [ defo.address, dai.address], 
      defoOwner.address, "1649910829447"
    );

    // Checking Balance after selling defo
    const ownerDefoBalanceSell =  ethers.utils.formatUnits(await defo.balanceOf(defoOwner.address), 18);
    const ownerDaiBalanceSell = ethers.utils.formatUnits(await dai.balanceOf(defoOwner.address), 18); 
    // Checking LP balance after selling
    const lpLiquidityBalanceAfterSell = ethers.utils.formatUnits(await lpManager.getSupply(), 18);
    // Reserves after selling defo
    const reserver0Sell = ethers.utils.formatUnits (await lpManager.getReserver0(), 18);
    const reserver1Sell = ethers.utils.formatUnits (await lpManager.getReserver1(), 18);
    // Checking after selling
    const defoDaiPriceSell = reserver1Sell/reserver0Sell;

    
    table.push(
      ["LP minted :", lpLiquidityBalance],
      ["Defo Reserve :", reserver0],
      ["Dai Reserve :", reserver1],
      ["Defo/Dai Price Before Swap: " , defoDaiPrice],
      ["Owner Defo Balance after swap : " , ownerDefoBalanceAfter],
      ["Owner Dai Balance after swap :" , ownerDaiBalanceAfter ],
      ["LP balance after Swap :", lpLiquidityBalanceAfterSwap],
      ["Defo Reserve After Buying:", reserver0before],
      ["Dai Reserve After Buying:", reserver1before],
      ["Defo/Dai Price Before Swap:", defoDaiPriceBefore],
      ["Owner Defo Balance after Sell : " , ownerDefoBalanceSell],
      ["Owner Dai Balance after Sell :" , ownerDaiBalanceSell ],
      ["LP balance after Selling :", lpLiquidityBalanceAfterSell],
      ["Defo Reserve After Sell:", reserver0Sell],
      ["Dai Reserve After Sell:", reserver1Sell],
      ["Defo/Dai Price after Sell:", defoDaiPriceSell],

    );

    console.log(table.toString());

  });

  it("Testing Buffer system", async function(){
      //Transfering defo and dai to LpManager contract
      const daiApproveAmount = ethers.utils.parseEther("10000");
      const txDefoAmount = ethers.utils.parseEther("1000"); //25000 tokens
      const txDaiAmount = ethers.utils.parseEther("5000");
      await dai.connect(daiOwner).transfer(lpManager.address, txDaiAmount);
      const lpDefoBal = await defo.balanceOf(lpManager.address);
      await dai.connect(lpManagerOwner).approve(routerAddress, lpDefoBal);
      const lpDaiBal = await dai.balanceOf(lpManager.address);
      await defo.connect(defoOwner).transfer(lpManager.address, txDefoAmount);
      await defo.connect(lpManagerOwner).approve(routerAddress, lpDaiBal);
      console.log("Defo balance via lp", await lpManager.getLeftBalance());
      console.log("Dai balance via lp", await lpManager.getRightBalance());
      console.log(ethers.utils.formatUnits(await lpManager.getSupply(), 18));
      console.log("Dai test amount: ",ethers.utils.formatUnits(await dai.balanceOf(lpManager.address), 18));
      console.log("Defo test amount: ", ethers.utils.formatUnits(await defo.balanceOf(lpManager.address), 18))
      await defo.connect(lpManagerOwner).approve(lpManager.address, daiApproveAmount);
      await dai.connect(lpManagerOwner).approve(lpManager.address, daiApproveAmount);
      console.log(await lpManager.bufferThreshold());
      //await lpManager.connect(lpManagerOwner).afterTokenTransfer(acc2.address);
      console.log("LP before buffer",ethers.utils.formatUnits(await lpManager.getSupply(), 18));
      console.log("DAI bal before buffer", ethers.utils.formatUnits(await dai.balanceOf(lpManager.address), 18));
      console.log("Defo bal before buffer", ethers.utils.formatUnits(await defo.balanceOf(lpManager.address), 18))
      await lpManager.connect(lpManagerOwner).buffer(); 
      console.log("LP After buffer", ethers.utils.formatUnits(await lpManager.getSupply(), 18));
      console.log("Defo bal after buffer", ethers.utils.formatUnits(await dai.balanceOf(lpManager.address), 18));
      console.log("Defo bal after buffer", ethers.utils.formatUnits(await defo.balanceOf(lpManager.address), 18))
      // console.log(ethers.utils.formatUnits(await lpManager.getSupply(), 18));
  })
})
