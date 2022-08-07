import { TypedEvent } from "@contractTypes/common";
import { announce, info, success } from "@utils/output.helper";
import { parseTimeInput } from "@utils/taskParamsInput.helper";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";
import moment from "moment";

import { IDEFODiamond } from "../types";


export default task("history", "get events for the past days")
  .addOptionalParam("time", "Time period in a human-readable format: '1y', '10d', '20h', etc.", "7days", types.string)
  .setAction(async ({ time }, hre) => {
    const {
      getNamedAccounts,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const { deployer } = await getNamedAccounts();
    const { seconds, human } = parseTimeInput(time);
    announce(`Getting events history for ${time} (${human}) ago.`);

    const gemContract = await ethers.getContract<IDEFODiamond>("DEFODiamond_DiamondProxy");
    //event signature to filter
    const donationTopic = await gemContract.filters.Donated();

    ///let's find a right block to start with
    const latestBlock = await ethers.provider.getBlock("latest");
    const toBlockNumber = latestBlock.number;
    info(
      `Till the latest block which is ${toBlockNumber}, time ${latestBlock.timestamp}, ${moment
        .unix(latestBlock.timestamp)
        .format("DD.MM.YYYY")}`,
    );
    let fromBlockNumber = latestBlock.number;
    const startTime = latestBlock.timestamp - seconds < 0 ? 0 : latestBlock.timestamp - seconds;

    let pointerTimestamp = (await ethers.provider.getBlock(fromBlockNumber)).timestamp;
    // there are roughly about 300K blocks for 7 days, let's find the earliest with large steps
    //going with large steps to
    const STEP = 3000;
    while (pointerTimestamp > startTime) {
      fromBlockNumber -= STEP;
      pointerTimestamp = (await ethers.provider.getBlock(fromBlockNumber)).timestamp;
    }
    // now let's go up to the right block by smaller steps
    while (pointerTimestamp < startTime) {
      fromBlockNumber += Math.round(STEP / 10);
      pointerTimestamp = (await ethers.provider.getBlock(fromBlockNumber)).timestamp;
    }
    // finalize and find the right block
    while (pointerTimestamp >= startTime) {
      fromBlockNumber--;
      pointerTimestamp = (await ethers.provider.getBlock(fromBlockNumber)).timestamp;
    }
    info(
      `Starting from block ${fromBlockNumber}, time ${pointerTimestamp}, ${moment
        .unix(pointerTimestamp)
        .format("DD.MM.YYYY")}`,
    );
    //the block is found fromBlockNumber is PREVIOUS block, not including the startTime, now getting events in chunks, this is very related to the provider's api
    const BLOCK_RANGE = 2048;
    let blockTo = fromBlockNumber;
    let blockFrom: number;
    const logs: Array<Promise<Array<TypedEvent>>> = [];
    do {
      blockFrom = blockTo + 1;
      blockTo = blockFrom + BLOCK_RANGE;
      if (blockTo > toBlockNumber) blockTo = toBlockNumber;
      logs.push(gemContract.queryFilter(donationTopic, blockFrom, blockTo));
    } while (blockTo != toBlockNumber);

    //variables to collect data into
    const { userDonations, totalDonations } = (await Promise.all(logs))
      .reduce<Array<TypedEvent>>((prev, flat) => prev.concat(flat), [])
      .reduce<{ userDonations: number; totalDonations: number }>(
        (result, log) => {
          info(`processing event: ${JSON.stringify(log.args)}`);
          const user: string = log.args[0];
          const amountBN: BigNumber = log.args[1];
          const amount = Number(fromWei(amountBN));
          result.totalDonations += amount;
          if (user == deployer) result.userDonations += amount;
          return result;
        },
        { userDonations: 0, totalDonations: 0 },
      );
    success(`Total donations for the period ${totalDonations}, user donations ${userDonations}`);
  });
