import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GroupTask', function () {
  it('Should deploy and grant DEFAULT_ADMIN_ROLE to deployer', async function () {
    const [owner, agent] = await ethers.getSigners();
    const GroupTaskFactory = await ethers.getContractFactory('GroupTask');
    const groupTask = await GroupTaskFactory.deploy();
    await groupTask.waitForDeployment();

    const adminRole = await groupTask.DEFAULT_ADMIN_ROLE();
    expect(await groupTask.hasRole(adminRole, owner.address)).to.equal(true);

    const agentRole = await groupTask.AGENT_ROLE();
    await groupTask.grantRole(agentRole, agent.address);
    expect(await groupTask.hasRole(agentRole, agent.address)).to.equal(true);

    // TODO: Implement logic here (additional unit tests for createGroup, createTask, etc.)
  });
});
