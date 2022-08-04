// import { announce, info, success } from "@utils/output.helper";
// import { task, types } from "hardhat/config";

import { RewardsFacet, VaultFacet, YieldGemFacet, MaintenanceFacet, ConfigFacet } from "../types";

// export default task("helper-task", "CALLING SC", async(_, hre) => { 
//     const { deployments } = hre
//     console.log('IN HELPER TASK')
// })

// .setAction(async ({ id, amount }, hre) => {
//     const {
//         ethers,
//         ethers: {
//             utils: { formatEther: fromWei, parseEther: toWei },
//         },
//     } = hre;
//     const diamondContract = await ethers.getContract<
//     YieldGemFacet & RewardsFacet & MaintenanceFacet & ConfigFacet & VaultFacet>(
//         "DEFODiamond_DiamondProxy",
//     )
//     console.log('diamondContract: ', diamondContract.address)
// });


import { announce, error, info, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";


export default task("helper-task", "Distribute DAI from AAVE")
    .addOptionalParam(
        "account",
        "The account name to get DAI, e.g. 'treasury', 'vault', or 'all'",
        "deployer",
        types.string,
    )
    .addOptionalParam("amount", "The amount to transfer to the deployer", 100000, types.int)
    .setAction(async ({ account, amount }, hre) => {
        console.log('HELLO from helper-task')
    });

