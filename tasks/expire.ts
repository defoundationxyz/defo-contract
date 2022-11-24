import { PROTOCOL_CONFIG } from "@config";
import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { MaintenanceFacet, YieldGemFacet } from "@contractTypes/contracts/facets";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { info } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import moment from "moment";

task("expire", "Check expirations and run expire function")
  .addOptionalParam("silent", "true for silent output", false, types.boolean)
  .addOptionalParam("test", "true for expiration run", true, types.boolean)
  .setAction(async ({ silent, test }, hre) => {
    const { ethers, getNamedAccounts } = hre;
    const diamondContract = await ethers.getContract<
      IDEFODiamond & ERC721EnumerableFacet & MaintenanceFacet & YieldGemFacet
    >("DEFODiamond");
    const { stabilizer } = await getNamedAccounts();
    const totalSupply = await diamondContract.totalSupply();
    if (!silent) info(`\n 📡 Total ${totalSupply} gems minted. Querying details...`);
    if (totalSupply.isZero()) throw new Error("No gems minted");

    const gemIds = await Promise.all(
      // that line is for quick tests
      // [...Array(10).keys()].map(async i => await diamondContract.tokenByIndex(i)),
      [...Array(totalSupply.toNumber()).keys()].map(async i => await diamondContract.tokenByIndex(i)),
    );

    const table = await Promise.all(
      gemIds.map(async gemId => {
        const gemInfo = await diamondContract.getGemInfo(gemId);
        const data = {
          gemId: gemId.toString(),
          owner: await diamondContract.ownerOf(gemId),
          maintained: moment.unix(gemInfo.lastMaintenanceTime).format("DD.MM.YYYY"),
          maintainedInSeconds: gemInfo.lastMaintenanceTime,
        };
        if (!silent) process.stdout.write(`processed gemId ${gemId.toString()}\r`);
        return data;
      }),
    );

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const threshold = now - (PROTOCOL_CONFIG.maintenancePeriod as number) * 2;
    if (!silent) {
      info(`now is: ${now}, ${moment.unix(now).format("DD.MM.YYYY")}`);
      info(`the earliest non-expiration date is: ${threshold}, ${moment.unix(threshold).format("DD.MM.YYYY")}`);
    }
    const gemsToExpire = table.filter(
      gemData => threshold > gemData.maintainedInSeconds && gemData.owner !== stabilizer,
    );
    const gemIdsToExpire = gemsToExpire.map(i => i.gemId);
    info(`gemIds to expire length: ${gemIdsToExpire.length}`);
    const chunkSize = 50;
    const gemIdsToMaintainChunks = [...Array(Math.ceil(gemIdsToExpire.length / chunkSize))].map((value, index) => {
      return gemIdsToExpire.slice(index * chunkSize, (index + 1) * chunkSize);
    });
    if (!test) {
      for (const chunk of gemIdsToMaintainChunks) {
        await (await diamondContract.batchExpire(chunk)).wait();
      }
    }

    if (!silent) console.table(gemsToExpire);
  });
