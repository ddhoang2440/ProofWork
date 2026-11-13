import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("GroupTask", function () {
  async function deployFixture() {
    const [owner, agent, member1, member2] = await ethers.getSigners();
    const GroupTask = await ethers.getContractFactory("GroupTask");
    const contract = await GroupTask.deploy();
    await contract.grantAgentRole(agent.address);
    
    await contract.createGroup("Test Group", [owner.address, member1.address, member2.address]);
    await contract.createTask(1, "Test Task", member1.address);
    
    return { contract, owner, agent, member1, member2 };
  }

  it("1. createGroup thành công", async function () {
    const { contract } = await loadFixture(deployFixture);
    const task = await contract.getTasksByGroup(1);
    expect(task.length).to.equal(1); // Task ID 1 was created in fixture
  });

  it("2. createTask thành công", async function () {
    const { contract, member2 } = await loadFixture(deployFixture);
    await contract.createTask(1, "Task 2", member2.address);
    const task = await contract.getTask(2);
    expect(task.title).to.equal("Task 2");
  });

  it("3. submitEvidence thành công", async function () {
    const { contract, member1 } = await loadFixture(deployFixture);
    const hash = ethers.id("proof");
    await contract.connect(member1).submitEvidence(1, hash);
    const task = await contract.getTask(1);
    expect(task.status).to.equal(1); // Submitted
  });

  it("4. confirmCompletion bởi agent -> thành công", async function () {
    const { contract, member1, agent } = await loadFixture(deployFixture);
    await contract.connect(member1).submitEvidence(1, ethers.id("proof"));
    await contract.connect(agent).confirmCompletion(1);
    const task = await contract.getTask(1);
    expect(task.confirmCount).to.equal(1);
  });

  it("5. confirmCompletion bởi người không có quyền -> revert (Nội quy: thành viên nhóm được confirm)", async function () {
    const { contract, member1 } = await loadFixture(deployFixture);
    await contract.connect(member1).submitEvidence(1, ethers.id("proof"));
    await expect(contract.connect(member1).confirmCompletion(1)).to.be.revertedWith("Assignee cannot confirm");
  });

  it("6. confirmCompletion khi task chưa Submitted -> revert", async function () {
    const { contract, agent } = await loadFixture(deployFixture);
    await expect(contract.connect(agent).confirmCompletion(1)).to.be.revertedWith("Not Submitted");
  });

  it("7. rejectCompletion với reason -> thành công", async function () {
    const { contract, member1, agent, member2 } = await loadFixture(deployFixture);
    await contract.connect(member1).submitEvidence(1, ethers.id("proof"));
    await contract.connect(agent).rejectCompletion(1, "Bad proof");
    await contract.connect(member2).rejectCompletion(1, "I agree, bad");
    const task = await contract.getTask(1);
    expect(task.status).to.equal(3); // Rejected
  });

  it("8. getCertificate khi chưa Confirmed -> revert", async function () {
    const { contract } = await loadFixture(deployFixture);
    await expect(contract.getCertificate(1)).to.be.revertedWith("Not Confirmed");
  });
});