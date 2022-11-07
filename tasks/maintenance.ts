import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { info } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import Excel from "exceljs";
import { task, types } from "hardhat/config";
import path from "path";

task("maintenance", "Get all the gems with maintenance details.")
  .addOptionalParam("silent", "true for silent output", false, types.boolean)
  .setAction(async ({ silent }, hre) => {
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
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet>("DEFODiamond");

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("gems");
    const columns = [
      { key: "gemId", header: "Gem Id" },
      { key: "minted", header: "Mint Date" },
      { key: "maintained", header: "Maintenance Date" },
      { key: "maintenanceFeePending", header: "Pending maintenance fee" },
      { key: "maintenanceFeePaid", header: "Maintenance fee paid" },
    ];

    worksheet.columns = columns;

    const totalSupply = await diamondContract.totalSupply();
    if (!silent) info(`\n 📡 Total ${totalSupply} gems minted. Querying details...`);
    if (totalSupply.isZero()) throw new Error("No gems minted");

    const gemIds = await Promise.all(
      [...Array(totalSupply.toNumber()).keys()].map(async i => await diamondContract.tokenByIndex(i)),
    );

    const table = await Promise.all(
      gemIds.map(async gemId => {
        const gemInfo = await diamondContract.getGemInfo(gemId);
        const data = {
          gemId,
          minted: new Date(gemInfo.mintTime),
          maintained: new Date(gemInfo.lastMaintenanceTime),
          vault: Number(fromWei(gemInfo.maintenanceFeePaid)),
          maintenanceFeePending: Number(fromWei(await diamondContract.getPendingMaintenanceFee(gemId))),
          maintenanceFeePaid: Number(fromWei(gemInfo.maintenanceFeePaid)),
        };
        worksheet.addRow(data);
        if (!silent) process.stdout.write(`processed gemId ${gemId}\r`);
        return data;
      }),
    );
    if (!silent) console.table(table);
    const exportPath = path.resolve(__dirname, "maintenance.xlsx");

    await workbook.xlsx.writeFile(exportPath);
  });
