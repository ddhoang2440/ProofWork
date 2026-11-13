// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract GroupTask is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    enum TaskStatus { Pending, Submitted, Confirmed, Rejected }

    struct Task {
        uint256 id;
        uint256 groupId;
        string title;
        TaskStatus status;
        address creator; // Lưu người tạo task để chặn quyền nộp bằng chứng
        bytes32 proofHash;
        uint256 confirmCount;
        uint256 rejectCount;
    }

    struct Certificate {
        uint256 taskId;
        string title;
        address assignee;
        uint256 completedAt;
    }

    uint256 public nextGroupId = 1;
    uint256 public nextTaskId = 1;
    
    mapping(uint256 => address) public groupCreators;
    mapping(uint256 => Task) private tasks;
    mapping(uint256 => mapping(address => bool)) public hasVoted; 
    mapping(uint256 => Certificate) private certificates;
    mapping(uint256 => uint256[]) private groupTasks;

    // Tên event khớp 100% yêu cầu
    event GroupCreated(uint256 indexed groupId, string name);
    event TaskCreated(uint256 indexed taskId, uint256 indexed groupId, string title);
    event TaskSubmitted(uint256 indexed taskId, bytes32 proofHash);
    event TaskConfirmed(uint256 indexed taskId);
    event TaskRejected(uint256 indexed taskId, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // 1. Tạo nhóm (Chỉ nhận name)
    function createGroup(string calldata name) external returns (uint256) {
        uint256 groupId = nextGroupId++;
        groupCreators[groupId] = msg.sender;
        emit GroupCreated(groupId, name);
        return groupId;
    }

    // 2. Tạo task (Chỉ nhận groupId, title)
    function createTask(uint256 groupId, string calldata title) external returns (uint256) {
        require(groupCreators[groupId] != address(0), "Group does not exist");
        
        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            groupId: groupId,
            title: title,
            status: TaskStatus.Pending,
            creator: msg.sender,
            proofHash: bytes32(0),
            confirmCount: 0,
            rejectCount: 0
        });
        
        groupTasks[groupId].push(taskId);
        emit TaskCreated(taskId, groupId, title);
        return taskId;
    }

    // 3. Nộp bằng chứng (Chỉ creator task)
    function submitEvidence(uint256 taskId, bytes32 proofHash) external {
        Task storage t = tasks[taskId];
        require(msg.sender == t.creator, "Only task creator can submit");
        require(t.status == TaskStatus.Pending, "Task not Pending");

        t.proofHash = proofHash;
        t.status = TaskStatus.Submitted;
        emit TaskSubmitted(taskId, proofHash);
    }

    // 4. Xác nhận hoàn thành
    function confirmCompletion(uint256 taskId) external {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.Submitted, "Task not Submitted");
        require(!hasVoted[taskId][msg.sender], "Already voted");
        require(msg.sender != t.creator, "Creator cannot confirm own task"); // Không tính người nộp bằng chứng

        hasVoted[taskId][msg.sender] = true;
        t.confirmCount++;

        if (t.confirmCount >= 2 && t.status != TaskStatus.Rejected) {
            t.status = TaskStatus.Confirmed;
            certificates[taskId] = Certificate(taskId, t.title, t.creator, block.timestamp);
            emit TaskConfirmed(taskId);
        }
    }

    // 5. Từ chối hoàn thành
    function rejectCompletion(uint256 taskId, string calldata reason) external {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.Submitted || t.status == TaskStatus.Confirmed, "Invalid task status");
        require(!hasVoted[taskId][msg.sender], "Already voted");
        require(msg.sender != t.creator, "Creator cannot reject own task");

        hasVoted[taskId][msg.sender] = true;
        t.rejectCount++;

        if (t.rejectCount >= 2) {
            t.status = TaskStatus.Rejected;
            emit TaskRejected(taskId, reason);
        }
    }

    // 6. Lấy Task
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    // 7. Lấy danh sách Task theo Group
    function getTasksByGroup(uint256 groupId) external view returns (uint256[] memory) {
        return groupTasks[groupId];
    }

    // 8. Lấy Certificate
    function getCertificate(uint256 taskId) external view returns (Certificate memory) {
        require(tasks[taskId].status == TaskStatus.Confirmed, "Task not Confirmed");
        return certificates[taskId];
    }

    // 9. Cấp quyền Agent
    function grantAgentRole(address agent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(AGENT_ROLE, agent);
    }
}