import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { ConfigFacet, RewardsFacet } from "@contractTypes/contracts/facets";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { announce, formatAmount, info, networkInfo, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import moment from "moment/moment";

import DAI_ABI from "../abi/dai-abi.json";

export default task(
  "startp2",
  "Start Phase 2: pause the contract, set P2 start date to current time, calculate ROT of everyone, load total rot and total LP to the contract",
)
  .addOptionalParam(
    "test",
    "only calculate total ROT and total LP, don't pause the contract and don't set P2 start date",
    true,
    types.boolean,
  )
  .addOptionalParam("date", "Cutover date in format 2023-02-17", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet & ConfigFacet & RewardsFacet>(
      "DEFODiamond",
    );
    const totalSupply = await diamondContract.totalSupply();
    info(`\n 📡 Total ${totalSupply} gems minted. Querying details...`);
    if (totalSupply.isZero()) throw new Error("No gems minted");

    const gemIds = await Promise.all(
      [...Array(totalSupply.toNumber()).keys()].map(async i => await diamondContract.tokenByIndex(i)),
    );

    const users = new Set<string>();
    for (const id of gemIds) {
      process.stdout.write(`Querying owner of token ${id}\r`);
      users.add(await diamondContract.ownerOf(id));
    }
    const usersArray = Array.from(users);

    info(`Total ${usersArray.length} users.`);

    await networkInfo(hre, info);
    const rots = await Promise.all(usersArray.map(accountAddress => diamondContract.getP2RotValue(accountAddress)));
    const totalRot = rots.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));

    info(`total ROT: ${formatAmount(totalRot)}`);

    const { stabilizer, dai: daiAddress } = await hre.getNamedAccounts();
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
    const daiLiquidity = await daiContract.balanceOf(stabilizer);
    info(`dai liquidity: ${formatAmount(daiLiquidity)}`);

    if (!taskArgs.test) {
      announce("Updating contract configuration with total ROT and LP");
      await (await diamondContract.setP2Finance(daiLiquidity, totalRot)).wait();
      if (taskArgs.date) {
        announce("Setting start date to current time");
        await (await diamondContract.setP2CutOverTime(moment(taskArgs.date).unix())).wait();
        announce("Stopping contract");
        await (await diamondContract.pause()).wait();
        await (await diamondContract.lockMint()).wait();
      } else announce("Cutover date not provided, not set");
      success("Done.");
    }

    const cutOverTime = await diamondContract.getP2CutOverTime();
    const p2Finance = await diamondContract.getP2Finance();
    announce("Reading the contract");
    info(`P2 start date: ${moment.unix(cutOverTime.toNumber()).format("DD.MM.YYYY HH:MM")}`);
    info(`Dai total: ${formatAmount(p2Finance[0])}`);
    info(`ROT total: ${formatAmount(p2Finance[1])}`);
  });
