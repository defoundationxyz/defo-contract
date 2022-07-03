// module.exports = [
//     "0x318067c2d4D001dC4DBA6F914421DB4912Bf5905", 
//     ["0x09D4198B9c75442f8C2Fae18EB5925f310003296",
//     "0xc9183dF3DB6C8FfBAd778AE515e0bbd96c785D56"],
//     "1000000000000000000000"
//   ];
//ignore this file
const hre = require('hardhat')

async function main() {
    await hre.run('verify:verify', {
      address: '0x99818578400254b391C9c6EaCDe7882865D6E08B',
      constructorArguments: [
        "0x318067c2d4D001dC4DBA6F914421DB4912Bf5905", 
        ["0x09D4198B9c75442f8C2Fae18EB5925f310003296",
        "0xc9183dF3DB6C8FfBAd778AE515e0bbd96c785D56"],
        "1000000000000000000000"
      ],
    })
  }

  main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })