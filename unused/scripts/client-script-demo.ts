import "@nomiclabs/hardhat-ethers";
import hre from "hardhat"
import { YieldGemFacet, RewardsFacet, MaintenanceFacet, ConfigFacet } from "../../types"

async function main() {
    const {
        ethers,
        ethers: {
            utils: { formatEther: fromWei, parseEther: toWei },
        },
    } = hre;
    const [deployer, treasury, donations, team, vault, rewardPool, ...restAccounts] = await ethers.getSigners();

    const diamondContract = await ethers.getContract<YieldGemFacet & RewardsFacet & MaintenanceFacet & ConfigFacet>(
        "DEFODiamond_DiamondProxy",
    )
    // const config = await diamondContract.getConfig()
    // console.log('config: ', config)
    const gemConfig = await diamondContract.getGemTypesConfig()
    // console.log('gemConfig: ', gemConfig)

    const deployerGems = await diamondContract.getGemIds()
    // console.log('deployerGems: ', deployerGems)
    const gemsInfo = await diamondContract.getGemsInfo()
    // console.log('gemsInfo: ', gemsInfo);

    const currGem = gemsInfo[1][0]
    console.log('---------------------------');
    // console.log('currGem type id: ', currGem)
    const rewardAmountBefore = await diamondContract.getRewardAmount(0)
    console.log('rewardAmountBefore: ', ethers.utils.formatEther(rewardAmountBefore));

    await diamondContract.maintain(0)
    await diamondContract.claimReward(0)

    const rewardAmountAfter = await diamondContract.getRewardAmount(0)
    console.log('rewardAmountAfter: ', ethers.utils.formatEther(rewardAmountAfter));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
