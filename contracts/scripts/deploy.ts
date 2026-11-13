import { ethers } from "hardhat";
import { exportContractData } from "./export";

async function main() {
    console.log("Đang deploy GroupTask...");
    const GroupTask = await ethers.getContractFactory("GroupTask");
    const groupTask = await GroupTask.deploy();
    await groupTask.waitForDeployment();

    const contractAddress = await groupTask.getAddress();
    console.log(`✅ Deployed tại: ${contractAddress}`);

    const agentAddress = process.env.AGENT_ADDRESS;
    if (agentAddress) {
        const tx = await groupTask.grantAgentRole(agentAddress);
        await tx.wait();
        console.log(`✅ Đã cấp AGENT_ROLE cho ${agentAddress}`);
    }

    exportContractData(contractAddress);
}
main().catch(console.error);