import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  const [signer] = await ethers.getSigners();
  console.log('Seeding data using account:', signer.address);

  // TODO: Implement logic here (seed initial groups and tasks on network)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
