import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  const artifactPath = path.resolve(
    __dirname,
    '../artifacts/contracts/GroupTask.sol/GroupTask.json'
  );
  const sharedAbiPath = path.resolve(__dirname, '../../shared/abi/GroupTask.json');
  const sharedAddressesPath = path.resolve(__dirname, '../../shared/addresses.json');

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Run "npm run compile" first.`);
  }

  const artifactRaw = fs.readFileSync(artifactPath, 'utf-8');
  const artifact = JSON.parse(artifactRaw) as { abi: unknown };

  fs.mkdirSync(path.dirname(sharedAbiPath), { recursive: true });
  fs.writeFileSync(sharedAbiPath, JSON.stringify(artifact.abi, null, 2), 'utf-8');
  console.log('Exported ABI to:', sharedAbiPath);

  const deployedAddress =
    process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

  const addressesData = {
    fuji: {
      GroupTask: deployedAddress,
    },
    localhost: {
      GroupTask: deployedAddress,
    },
  };

  fs.writeFileSync(sharedAddressesPath, JSON.stringify(addressesData, null, 2), 'utf-8');
  console.log('Exported addresses to:', sharedAddressesPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
