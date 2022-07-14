import { increaseTime } from "@utils/chain.helper";
import { announce, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import moment from "moment";

export default task("jump-in-time", "Jump given time ahead or backwards")
  .addParam(
    "time",
    "Time to skip in a human-readable format: '1y', '10d', '20h', etc. Negative value lets jumps in the past",
    "6d",
    types.string,
  )
  .setAction(async ({ time }, hre) => {
    const num = time.match(/-?[0-9]+/g)[0];
    const unit = time.slice(num.length);
    const seconds = moment.duration(num, unit).asSeconds();
    const human = moment.duration(num, unit).humanize();
    announce(`Jumping ${time} (${human}) ${seconds > 0 ? "ahead" : "backwards"} which is ${seconds} seconds`);
    await increaseTime(hre.ethers.provider, seconds);
    success("Done.");
  });
