/// TODO revise these addresses once contracts with EIP-2612 permit are updated & deployed. Addresses will be different for fuji (DEFO, probably DAI) and for mainnet (DEFO)

// fork only
export const FUJI_DAI_DEFO_WHALE_ADDRESS = "0x83c4c6F0Ac462481786b8325f1e291c8f456CB00";
export const MAINNET_DAI_WHALE_ADDRESS = "0x075e72a5edf65f0a5f44699c7654c1a76941ddc8";

export const FUJI_DAI_ADDRESS = "0x3362FE2f7E17A5a9F90DaBE12E4A6E16E146F19a";
export const FUJI_DEFO_ADDRESS = "0xA9D3adb2B5c7d89c56d74584E98ABcea1E4e6a4D";
export const FUJI_DEPLOYED_DIAMOND_ADDRESS = "0xf0d26dD82f6beE798cB677ee17E5466d009193Eb";
export const FUJI_JOE_ROUTER_ADDRESS = "0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901";

export const MAINNET_DAI_ADDRESS = "0xd586e7f844cea2f87f50152665bcbc2c279d8d70";
export const MAINNET_DEFO_ADDRESS = "0xbb6ffeCE837a525A2eAE033ff0161a7CDC60B693"; //not deployed yet
export const MAINNET_DEPLOYED_DIAMOND_ADDRESS = "0xa47f856CD11513DB4E723c03990292f6c2FAC6b7"; //not deployed yet
export const MAINNET_SWAPSICLE_ROUTER_ADDRESS = "0xC7f372c62238f6a5b79136A9e5D16A2FD7A3f0F5";

export const MAINNET_DEFO_GNOSIS_MULTISIG = "0xAEf6Bd49e374C067672bABC554A7AEe36fb71267";

//presale nodes
//1st presale - regular ones, 21 March 2022
export const MAINNET_DEFO_SAPPHIRE_NODE = "0xA7Fa128FA70AB30f8314DB59D7677434B838f116";
export const MAINNET_DEFO_RUBY_NODE = "0xDf8F0ABb914068A50c610083D0706D4D7F5f3508";
export const MAINNET_DEFO_DIAMOND_NODE = "0x31D7739F96C566eDdd55fFD318ea22082E80D2f5";

//2nd presale - boosted ones, 31 March 2022
export const MAINNET_DEFO_RUBY_OMEGA_NODE = "0x99B29003a73575571AF3921bcc0FaF7Dbfd0A123";
export const MAINNET_DEFO_RUBY_DELTA_NODE = "0x22CcbC7D801d680ECf47D0650dE9b05DE7F609Ac";
export const MAINNET_DEFO_SAPPHIRE_OMEGA_NODE = "0x52bd885E4F7059634f3dbcf226F8903c0ee886B1";
export const MAINNET_DEFO_SAPPHIRE_DELTA_NODE = "0x5DeF78995748e2cfF42F36DA0CC7625e4B19cDB2";
export const MAINNET_DEFO_DIAMOND_OMEGA_NODE = "0x947c90eCC60C2ae9a61dE29fB799e7B9c58b52Ea";
export const MAINNET_DEFO_DIAMOND_DELTA_NODE = "0x1fF38cA054215aE6AF4D7cCadc44d871fDA5A82b";

export const presaleNodes = [
  "SapphireNode",
  "SapphireNodeOmega",
  "SapphireNodeDelta",
  "RubyNode",
  "RubyNodeOmega",
  "RubyNodeDelta",
  "DiamondNode",
  "DiamondNodeOmega",
  "DiamondNodeDelta",
] as const;

export const PRESALE_NODES: Record<typeof presaleNodes[number], { address: string; type: number; boost: number }> = {
  SapphireNode: { address: "0xA7Fa128FA70AB30f8314DB59D7677434B838f116", type: 0, boost: 0 },
  RubyNode: { address: "0xDf8F0ABb914068A50c610083D0706D4D7F5f3508", type: 1, boost: 0 },
  DiamondNode: { address: "0x31D7739F96C566eDdd55fFD318ea22082E80D2f5", type: 2, boost: 0 },
  SapphireNodeOmega: { address: "0x52bd885E4F7059634f3dbcf226F8903c0ee886B1", type: 0, boost: 2 },
  RubyNodeOmega: { address: "0x99B29003a73575571AF3921bcc0FaF7Dbfd0A123", type: 1, boost: 2 },
  DiamondNodeOmega: { address: "0x947c90eCC60C2ae9a61dE29fB799e7B9c58b52Ea", type: 2, boost: 2 },
  SapphireNodeDelta: { address: "0x5DeF78995748e2cfF42F36DA0CC7625e4B19cDB2", type: 0, boost: 1 },
  RubyNodeDelta: { address: "0x22CcbC7D801d680ECf47D0650dE9b05DE7F609Ac", type: 1, boost: 1 },
  DiamondNodeDelta: { address: "0x1fF38cA054215aE6AF4D7cCadc44d871fDA5A82b", type: 2, boost: 1 },
};
