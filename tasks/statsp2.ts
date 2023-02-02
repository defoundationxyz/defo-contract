import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { ConfigFacet, RewardsFacet } from "@contractTypes/contracts/facets";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { formatAmount, info, networkInfo } from "@utils/output.helper";
import Excel from "exceljs";
import { task, types } from "hardhat/config";
import path from "path";

task("statsp2", "Get all the users with their ROT, DAI ROT, and P2 status.")
  .addOptionalParam("silent", "true for silent output", false, types.boolean)
  .setAction(async ({ silent }, hre) => {
    const { ethers } = hre;
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet & ConfigFacet & RewardsFacet>(
      "DEFODiamond",
    );

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("DeFo Users");
    const columns = [
      { key: "address", header: "User" },
      { key: "rot", header: "ROT value, DEFO" },
      { key: "share", header: "Liquidity share, DAI" },
      { key: "vault", header: "P2 DEFO deposited to vault" },
      { key: "dai", header: "P2 DAI claimed" },
    ];

    worksheet.columns = columns;

    const totalSupply = await diamondContract.totalSupply();
    if (!silent) info(`\n 📡 Total ${totalSupply} gems minted. Querying details...`);
    if (totalSupply.isZero()) throw new Error("No gems minted");

    const gemIds = await Promise.all(
      [...Array(totalSupply.toNumber()).keys()].map(async i => await diamondContract.tokenByIndex(i)),
    );

    const users = new Set<string>();
    for (const id of gemIds) {
      if (!silent) process.stdout.write(`Querying owner of token ${id}\r`);
      users.add(await diamondContract.ownerOf(id));
    }
    const usersArray = Array.from(users);

    if (!silent) info(`Total ${usersArray.length} users.`);

    if (!silent) await networkInfo(hre, info);
    const table = await Promise.all(
      usersArray.map(async accountAddress => {
        const data = {
          address: accountAddress,
          rot: formatAmount(await diamondContract.getP2RotValue(accountAddress)),
          share: formatAmount(await diamondContract.getP2DaiValue(accountAddress)),
          vault: formatAmount(await diamondContract.getP2DepositedToVault(accountAddress)),
          dai: formatAmount(await diamondContract.getP2DaiReceived(accountAddress)),
        };
        worksheet.addRow(data);
        if (!silent) process.stdout.write(`processed ${accountAddress}\r`);
        return data;
      }),
    );
    if (!silent) console.table(table);
    const exportPath = path.resolve(__dirname, "phase2.xlsx");

    await workbook.xlsx.writeFile(exportPath);
  });
