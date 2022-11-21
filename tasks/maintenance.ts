import { GEM_TYPES_CONFIG } from "@config";
import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { MaintenanceFacet } from "@contractTypes/contracts/facets";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { BigNumber } from "@ethersproject/bignumber";
import { info } from "@utils/output.helper";
import Excel from "exceljs";
import { task, types } from "hardhat/config";
import moment from "moment";
import path from "path";

import { BOOSTERS } from "../test/testHelpers";

task("maintenance", "Get all the gems with maintenance details.")
  .addOptionalParam("silent", "true for silent output", false, types.boolean)
  .setAction(async ({ silent }, hre) => {
    const {
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet & MaintenanceFacet>(
      "DEFODiamond",
    );

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("gems");
    const columns = [
      { key: "gemId", header: "Gem Id" },
      { key: "minted", header: "Mint Date" },
      { key: "booster", header: "Booster" },
      { key: "presold", header: "Presold?" },
      { key: "maintained", header: "Maintenance Date" },
      { key: "maintenanceFeePending", header: "Pending maintenance fee" },
      { key: "maintenanceFeePaid", header: "Maintenance fee paid" },
      { key: "owner", header: "Gem Owner" },
      { key: "claimedGross", header: "claimedGross" },
      { key: "claimedNet", header: "claimedNet" },
      { key: "stakedGross", header: "stakedGross" },
      { key: "stakedNet", header: "stakedNet" },
      { key: "unStakedGross", header: "unStakedGross" },
      { key: "unStakedGrossUp", header: "unStakedGrossUp" },
      { key: "donated", header: "donated" },
      { key: "claimTaxPaid", header: "claimTaxPaid" },
      { key: "vaultTaxPaid", header: "vaultTaxPaid" },
    ];

    worksheet.columns = columns;

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
          gemId: gemId.toNumber(),
          minted: moment.unix(Number(gemInfo.mintTime)).format("DD.MM.YYYY"),
          booster: gemInfo.booster > 0 ? BOOSTERS[gemInfo.booster - 1].name : "-",
          presold: gemInfo.presold,
          maintained: moment.unix(Number(gemInfo.lastMaintenanceTime)).format("DD.MM.YYYY"),
          maintenanceFeePending: Number(fromWei(await diamondContract.getPendingMaintenanceFee(gemId))),
          maintenanceFeePaid: Number(fromWei(gemInfo.maintenanceFeePaid)),
          owner: await diamondContract.ownerOf(gemId),
          feeAmount: Number(fromWei(GEM_TYPES_CONFIG[gemInfo.gemTypeId].maintenanceFeeDai as BigNumber)),
          claimedGross: Number(Number(fromWei(gemInfo.fi.claimedGross)).toFixed(3)),
          claimedNet: Number(Number(fromWei(gemInfo.fi.claimedNet)).toFixed(3)),
          stakedGross: Number(Number(fromWei(gemInfo.fi.stakedGross)).toFixed(3)),
          stakedNet: Number(Number(fromWei(gemInfo.fi.stakedNet)).toFixed(3)),
          unStakedGross: Number(Number(fromWei(gemInfo.fi.unStakedGross)).toFixed(3)),
          unStakedGrossUp: Number(Number(fromWei(gemInfo.fi.unStakedGrossUp)).toFixed(3)),
          unStakedNet: Number(Number(fromWei(gemInfo.fi.unStakedNet)).toFixed(3)),
          donated: Number(Number(fromWei(gemInfo.fi.donated)).toFixed(3)),
          claimTaxPaid: Number(Number(fromWei(gemInfo.fi.claimTaxPaid)).toFixed(3)),
          vaultTaxPaid: Number(Number(fromWei(gemInfo.fi.vaultTaxPaid)).toFixed(3)),
        };
        worksheet.addRow(data);
        if (!silent) process.stdout.write(`processed gemId ${gemId}\r`);
        return data;
      }),
    );

    // if (!test) {
    //   const gemIdsToMaintain = table
    //     .filter(
    //       gemData =>
    //         gemData.maintenanceFeePending === 0 &&
    //         moment(gemData.maintained, "DD.MM.YYYY").unix() > moment(gemData.minted, "DD.MM.YYYY").unix(),
    //     )
    //     .map(i => i.gemId);
    //   info(`gemIds to maintain length: ${gemIdsToMaintain.length}`);
    //   const chunkSize = 50;
    //   const gemIdsToMaintainChunks = [...Array(Math.ceil(gemIdsToMaintain.length / chunkSize))].map((value, index) => {
    //     return gemIdsToMaintain.slice(index * chunkSize, (index + 1) * chunkSize);
    //   });
    //   for (const chunk of gemIdsToMaintainChunks) {
    //     await (await diamondContract.fixMaintenance(chunk)).wait();
    //   }
    // }

    if (!silent) console.table(table);
    const exportPath = path.resolve(__dirname, "maintenance.xlsx");

    await workbook.xlsx.writeFile(exportPath);
  });
