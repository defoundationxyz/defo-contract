import { GEM_TYPES_CONFIG } from "@config";
import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { MaintenanceFacet } from "@contractTypes/contracts/facets";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { BigNumber } from "@ethersproject/bignumber";
import { info } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import Excel from "exceljs";
import { task, types } from "hardhat/config";
import moment from "moment";
import path from "path";

task("maintenance", "Get all the gems with maintenance details.")
  .addOptionalParam("silent", "true for silent output", false, types.boolean)
  .addOptionalParam("test", "default is true to avoid db update", true, types.boolean)
  .setAction(async ({ silent, test }, hre) => {
    const {
      getNamedAccounts,
      deployments,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const namedAccounts = await getNamedAccounts();
    const { dai, forkedDefoToken } = namedAccounts;
    const daiContract = await ethers.getContractAt(DAI_ABI, dai);
    const defoTokenDeployment = (await deployments.getOrNull("DEFOToken"))?.address || "";
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet & MaintenanceFacet>(
      "DEFODiamond",
    );

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("gems");
    const columns = [
      { key: "gemId", header: "Gem Id" },
      { key: "minted", header: "Mint Date" },
      { key: "maintained", header: "Maintenance Date" },
      { key: "maintenanceFeePending", header: "Pending maintenance fee" },
      { key: "maintenanceFeePaid", header: "Maintenance fee paid" },
      { key: "owner", header: "Gem Owner" },
      { key: "feeAmount", header: "Configured fee amount" },
    ];

    worksheet.columns = columns;

    const totalSupply = await diamondContract.totalSupply();
    if (!silent) info(`\n 📡 Total ${totalSupply} gems minted. Querying details...`);
    if (totalSupply.isZero()) throw new Error("No gems minted");

    const gemIds = await Promise.all(
      // [...Array(10).keys()].map(async i => await diamondContract.tokenByIndex(i)),
      [...Array(totalSupply.toNumber()).keys()].map(async i => await diamondContract.tokenByIndex(i)),
    );

    const table = await Promise.all(
      gemIds.map(async gemId => {
        const gemInfo = await diamondContract.getGemInfo(gemId);
        const data = {
          gemId: gemId.toNumber(),
          minted: moment.unix(Number(gemInfo.mintTime)).format("DD.MM.YYYY"),
          maintained: moment.unix(Number(gemInfo.lastMaintenanceTime)).format("DD.MM.YYYY"),
          maintenanceFeePending: Number(fromWei(await diamondContract.getPendingMaintenanceFee(gemId))),
          maintenanceFeePaid: Number(fromWei(gemInfo.maintenanceFeePaid)),
          owner: await diamondContract.ownerOf(gemId),
          feeAmount: Number(fromWei(GEM_TYPES_CONFIG[gemInfo.gemTypeId].maintenanceFeeDai as BigNumber)),
        };
        worksheet.addRow(data);
        if (!silent) process.stdout.write(`processed gemId ${gemId}\r`);
        return data;
      }),
    );

    if (!test) {
      const gemIdsToMaintain = table
        .filter(
          gemData =>
            gemData.maintenanceFeePending === 0 &&
            moment(gemData.maintained, "DD.MM.YYYY").unix() > moment(gemData.minted, "DD.MM.YYYY").unix(),
        )
        .map(i => i.gemId);
      info(`gemIds to maintain length: ${gemIdsToMaintain.length}`);
      const chunkSize = 50;
      const gemIdsToMaintainChunks = [...Array(Math.ceil(gemIdsToMaintain.length / chunkSize))].map((value, index) => {
        return gemIdsToMaintain.slice(index * chunkSize, (index + 1) * chunkSize);
      });
      for (const chunk of gemIdsToMaintainChunks) {
        await (await diamondContract.fixMaintenance(chunk)).wait();
      }
    }

    if (!silent) console.table(table);
    const exportPath = path.resolve(__dirname, "maintenance.xlsx");

    await workbook.xlsx.writeFile(exportPath);
  });
