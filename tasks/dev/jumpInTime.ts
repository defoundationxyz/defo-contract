import { increaseTime } from "@utils/chain.helper";
import { announce, success } from "@utils/output.helper";
import { parseTimeInput } from "@utils/taskParamsInput.helper";
import { task, types } from "hardhat/config";


export default task("jump-in-time", "Jump given time ahead or backwards")
  .addParam(
    "time",
    "Time to skip in a human-readable format: '1y', '10d', '20h', etc. Negative value lets jumps in the past",
    "1week",
    types.string,
  )
  .setAction(async ({ time }, hre) => {
    if (hre.network.live) throw new Error("Only local network supports this task");
    const { seconds, human } = parseTimeInput(time);
    announce(`Jumping ${time} (${human}) ${seconds > 0 ? "ahead" : "backwards"} which is ${seconds} seconds`);
    await increaseTime(hre.ethers.provider, seconds);
    success("Done.");
  });
