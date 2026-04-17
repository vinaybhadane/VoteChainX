// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// 🔐 New Imports for Signature Verification
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract VoteChainX is Ownable, ReentrancyGuard {
    
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Receipt {
        uint256 electionId;
        uint256 candidateId;
        uint256 timestamp;
        bool isValid;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool exists;
        bool isManualStopped; 
        uint256 candidatesCount;
        mapping(uint256 => Candidate) candidates;
        mapping(address => bool) hasVoted;
        mapping(bytes32 => bool) idHasVoted; 
    }

    uint256 public electionCount;
    mapping(uint256 => Election) public elections;
    mapping(address => mapping(uint256 => Receipt)) public voteReceipts;

    event ElectionCreated(uint256 indexed electionId, string title);
    event VoteCasted(uint256 indexed electionId, uint256 indexed candidateId, address voter);
    event ElectionTerminated(uint256 indexed electionId, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    // --- Admin Functions ---

    function createElection(
        string memory _title, 
        string memory _description, 
        uint256 _durationInMinutes,
        string[] memory _candidateNames
    ) external onlyOwner {
        electionCount++;
        
        Election storage newElection = elections[electionCount];
        newElection.id = electionCount;
        newElection.title = _title;
        newElection.description = _description;
        newElection.startTime = block.timestamp;
        newElection.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        newElection.exists = true;
        newElection.isManualStopped = false;

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            newElection.candidatesCount++;
            newElection.candidates[newElection.candidatesCount] = Candidate({
                id: newElection.candidatesCount,
                name: _candidateNames[i],
                voteCount: 0
            });
        }

        emit ElectionCreated(electionCount, _title);
    }

    function endElection(uint256 _electionId) external onlyOwner {
        require(elections[_electionId].exists, "Election missing");
        require(!elections[_electionId].isManualStopped, "Already stopped");
        
        elections[_electionId].isManualStopped = true;
        elections[_electionId].endTime = block.timestamp; 
        
        emit ElectionTerminated(_electionId, block.timestamp);
    }

    // --- Voter Functions ---

    // 1. Standard Vote (Voter pays gas)
    function vote(uint256 _electionId, uint256 _candidateId, bytes32 _hashedId) external nonReentrant {
        _executeVote(_electionId, _candidateId, msg.sender, _hashedId);
    }

    // 2. 🔥 Gasless Vote (Admin/Relayer pays gas using User's Signature)
    function voteWithSignature(
        uint256 _electionId, 
        uint256 _candidateId, 
        address _voter, 
        bytes memory _signature,
        bytes32 _hashedId
    ) external onlyOwner nonReentrant {
        // Create the same hash that was signed on the frontend
        bytes32 messageHash = keccak256(abi.encodePacked(_electionId, _candidateId, _voter, _hashedId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        // Recover the signer address
        address signer = ECDSA.recover(ethSignedMessageHash, _signature);
        
        require(signer == _voter, "Invalid Signature: Voter identity mismatch");

        _executeVote(_electionId, _candidateId, _voter, _hashedId);
    }

    // Internal helper to keep logic DRY (Don't Repeat Yourself)
    function _executeVote(uint256 _electionId, uint256 _candidateId, address _voter, bytes32 _hashedId) internal {
        Election storage election = elections[_electionId];
        
        require(election.exists, "Election does not exist");
        require(block.timestamp <= election.endTime && !election.isManualStopped, "Election inactive");
        require(!election.hasVoted[_voter], "Wallet already voted");
        require(!election.idHasVoted[_hashedId], "Identity already used to vote");
        require(_candidateId > 0 && _candidateId <= election.candidatesCount, "Invalid candidate");

        election.hasVoted[_voter] = true;
        election.idHasVoted[_hashedId] = true; 
        election.candidates[_candidateId].voteCount++;

        voteReceipts[_voter][_electionId] = Receipt({
            electionId: _electionId,
            candidateId: _candidateId,
            timestamp: block.timestamp,
            isValid: true
        });

        emit VoteCasted(_electionId, _candidateId, _voter);
    }

    // --- Advanced Winner Features ---

    function getWinner(uint256 _electionId) external view returns (string memory winnerName, uint256 highestVotes) {
        Election storage e = elections[_electionId];
        require(block.timestamp > e.endTime || e.isManualStopped, "Election still in progress");

        uint256 winningVoteCount = 0;
        uint256 winningCandidateId = 0;

        for (uint256 i = 1; i <= e.candidatesCount; i++) {
            if (e.candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = e.candidates[i].voteCount;
                winningCandidateId = i;
            }
        }
        
        return (e.candidates[winningCandidateId].name, winningVoteCount);
    }

    // --- View Functions ---

    function getElectionDetails(uint256 _electionId) external view returns (
        string memory title, 
        string memory description, 
        uint256 endTime, 
        uint256 totalCandidates,
        bool active
    ) {
        Election storage e = elections[_electionId];
        bool isActive = (block.timestamp <= e.endTime && !e.isManualStopped);
        return (e.title, e.description, e.endTime, e.candidatesCount, isActive);
    }

    function getReceipt(uint256 _electionId, address _voter) external view returns (uint256, uint256, uint256) {
        Receipt storage r = voteReceipts[_voter][_electionId];
        require(r.isValid, "No receipt found");
        return (r.electionId, r.candidateId, r.timestamp);
    }

    function getCandidate(uint256 _electionId, uint256 _candidateId) external view returns (uint256 id, string memory name, uint256 voteCount) {
        Candidate storage c = elections[_electionId].candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }
}