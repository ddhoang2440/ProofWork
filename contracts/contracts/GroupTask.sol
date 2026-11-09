// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract GroupTask is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    enum TaskStatus {
        Pending,
        Submitted,
        Confirmed,
        Rejected
    }

    struct Task {
        uint256 id;
        address creator;
        string title;
        bytes32 proofHash;
        TaskStatus status;
    }

    struct Certificate {
        uint256 taskId;
        address recipient;
        uint256 issuedAt;
        bytes32 proofHash;
    }

    mapping(uint256 => Task) private tasks;
    mapping(uint256 => Certificate) private certificates;

    event GroupCreated(uint256 indexed groupId, string name, address indexed creator);
    event TaskCreated(uint256 indexed taskId, address indexed creator, string title);
    event EvidenceSubmitted(uint256 indexed taskId, bytes32 proofHash, address indexed submitter);
    event TaskConfirmed(uint256 indexed taskId, address indexed confirmedBy);
    event TaskRejected(uint256 indexed taskId, address indexed rejectedBy, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createGroup(string calldata name, address[] calldata members) external returns (uint256 groupId) {
        // TODO: Implement logic here
        emit GroupCreated(0, name, msg.sender);
        members;
        return 0;
    }

    function createTask(uint256 groupId, string calldata title) external returns (uint256 taskId) {
        // TODO: Implement logic here
        groupId;
        emit TaskCreated(0, msg.sender, title);
        return 0;
    }

    function submitEvidence(uint256 taskId, bytes32 proofHash) external {
        // TODO: Implement logic here
        emit EvidenceSubmitted(taskId, proofHash, msg.sender);
    }

    function confirmCompletion(uint256 taskId) external {
        // TODO: Implement logic here
        emit TaskConfirmed(taskId, msg.sender);
    }

    function rejectCompletion(uint256 taskId, string calldata reason) external {
        // TODO: Implement logic here
        emit TaskRejected(taskId, msg.sender, reason);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        // TODO: Implement logic here
        return tasks[taskId];
    }

    function getCertificate(uint256 taskId) external view returns (Certificate memory) {
        // TODO: Implement logic here
        return certificates[taskId];
    }
}
