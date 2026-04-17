import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VoteChainModule = buildModule("VoteChainModule", (m) => {
  const voteChain = m.contract("VoteChainX");
  return { voteChain };
});

export default VoteChainModule;