import { GEMS, gemName } from "@config";
import { getTime } from "@utils/chain.helper";
import { CompleteGemData, gemsGroupedByType } from "@utils/gems.helper";
import { announce, info, outputFormatKeyValue } from "@utils/output.helper";
import { parseTimeInput } from "@utils/taskParamsInput.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";
import moment from "moment";

import { ERC721Facet, GemFacet, GemGettersFacet, VaultStakingFacet } from "../types";

export default task("history", "get events for the past days")
  .addOptionalParam("time", "Time period in a human-readable format: '1y', '10d', '20h', etc.", "1year", types.string)
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

    const gemContract = await ethers.getContract<GemFacet & VaultStakingFacet>("DEFODiamond_DiamondProxy");

    const donationTopic = await gemContract.filters.DonationEvent();

    ///let's find a right block to start with
    const latestBlock = await ethers.provider.getBlock("latest");
    const toBlockNumber = latestBlock.number;
    let fromBlockNumber = latestBlock.number;
    const startTime = latestBlock.timestamp - seconds < 0 ? 0 : latestBlock.timestamp - seconds;
    while ((await ethers.provider.getBlock(fromBlockNumber)).timestamp > startTime) fromBlockNumber--;

    const logs = await gemContract.queryFilter(donationTopic, fromBlockNumber, toBlockNumber);
    for (const log of logs) console.log(JSON.stringify(log.args));

    // info(`Total balance ${await gemContract.balanceOf(deployer)} gem(s)`);
  });
