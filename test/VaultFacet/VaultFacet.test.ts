// import { GemFacet, GemGettersFacet, VaultStakingFacet } from "@contractTypes/contracts/facets";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { CompleteGemData, gemsIdsWithData } from "@utils/gems.helper";
// import { expect } from "chai";
// import newDebug from "debug";
// import { BigNumber } from "ethers";
// import { deployments, ethers, run } from "hardhat";
//
//
// const debug = newDebug("defo:VaultFacet.test.ts");
//
// describe("VaultFacet", () => {
//   let contract: VaultStakingFacet & GemFacet & GemGettersFacet;
//   let wallet: SignerWithAddress;
//   let getGemsIds: () => Promise<Array<CompleteGemData>>;
//
//   beforeEach(async () => {
//     await deployments.fixture();
//     await run("fork:get-some-dai");
//     await run("get-some-defo");
//     await run("permit");
//     await run("get-some-gems");
//     await run("jump-in-time", { time: "7d" });
//
//     contract = await ethers.getContract("DEFODiamond_DiamondProxy");
//     getGemsIds = gemsIdsWithData(contract);
//   });
//
//   describe(`addToVault()`, () => {
//     let gem: CompleteGemData;
//     let amountToClaim: BigNumber;
//
//     beforeEach(async () => {
//       const gems = await getGemsIds();
//       gem = gems.filter(gem => gem.isClaimable && gem.taxedReward.gt(0))[0];
//       amountToClaim = await contract.checkTaxedReward(gem.gemId);
//     });
//
//     it("should add gem taxedReward to vault", async () => {
//       await contract.addToVault(gem.gemId, gem.taxedReward);
//     });
//
//     it("should deduct claimable amount from checkTaxedReward()", async () => {
//       await contract.addToVault(gem.gemId, gem.taxedReward);
//       const unclaimed = await contract.checkTaxedReward(gem.gemId);
//       expect(unclaimed).to.equal(0);
//     });
//
//     it("should contribute to charity", async () => {
//       await contract.addToVault(gem.gemId, gem.taxedReward);
//       const unclaimed = await contract.checkTaxedReward(gem.gemId);
//       expect(unclaimed).to.equal(0);
//     });
//
//     it("should increase total staked amount", async () => {
//       await contract.addToVault(gem.gemId, gem.taxedReward);
//       const staked = await contract.showStakedAmount();
//       expect(staked.eq(gem.taxedReward)).true;
//     });
//
//     it("Should emit AddedToVault", async () => {
//       await expect(contract.addToVault(gem.gemId, gem.taxedReward))
//         .to.emit(contract, "AddedToVault")
//         .withArgs(gem.taxedReward, wallet.address);
//     });
//   });
// });
