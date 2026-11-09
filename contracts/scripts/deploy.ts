import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying GroupTask with account:', deployer.address);

  const GroupTaskFactory = await ethers.getContractFactory('GroupTask');
  const contract = await GroupTaskFactory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('GroupTask deployed to:', contractAddress);

  const agentAddress = process.env.AGENT_ADDRESS;
  if (agentAddress && ethers.isAddress(agentAddress)) {
    const agentRole = await contract.AGENT_ROLE();
    const tx = await contract.grantRole(agentRole, agentAddress);
    await tx.wait();
    console.log(`Granted AGENT_ROLE to ${agentAddress}`);
  } else {
    // TODO: Implement logic here (fallback or validation for AGENT_ADDRESS)
    console.log('AGENT_ADDRESS not provided or invalid, skipping role grant.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
