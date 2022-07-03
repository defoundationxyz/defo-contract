const { ethers } = require("ethers");
const {deploy, priceFeed, swap, reverseSwap} = require('./initStab');
const nodeCron = require("node-cron");

/*Won't sell more than 5% or 100 Defo in single tx*/ 
let sellAmount =  ethers.utils.parseUnits("100", 18);
let buyAmount =  ethers.utils.parseUnits("1000", 18);
async function init(){
    let arr = await deploy();
    await nodeCron.schedule("* * * * *", async function(){
        console.log(" ---------Checking Price--------- ");
        let price = await priceFeed(arr.lpContract);
        if (price > "10"){
            //selling defo for dai once the price is above 10
            console.log(" ---------Selling Defo--------- ");
            const tx = await swap(arr.router, sellAmount);
            console.log(tx.hash)
        } else if(price < "5") {
            //selling dai for defo once the price is below 5
            console.log(" ---------Buying Defo--------- ");
            const tx = await reverseSwap(arr.router, buyAmount);
            console.log(tx.hash)
        }
    })
} 

init()