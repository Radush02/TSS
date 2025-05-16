// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PlanAbonament.sol";

contract RetailerFactory is Ownable {
    mapping(uint256 => address) public abonamente;
    uint256 public nextPlanId;
    
    event PlanCreated(address indexed adresa, string retailer, uint256 pret, uint256 durata, uint256 disponibil, string descriere, string metadataURI);

    constructor() Ownable(msg.sender) {
        nextPlanId = 1;
    }
    function createSubscriptionPlan(
        string memory _retailer,
        uint256 _pret,
        uint256 _durata,
        uint256 _disponibil,
        string memory _descriere,
        string memory _metadataURI
    ) external onlyOwner {
        require(bytes(_retailer).length > 0, "Retailer name cannot be empty");
        require(_pret > 0, "Price cannot be zero");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        
        PlanAbonament plan = new PlanAbonament(
            _retailer,
            _pret,
            _durata,
            _disponibil,
            _descriere,
            _metadataURI,
            msg.sender
        );
        
        abonamente[nextPlanId] = address(plan);
        emit PlanCreated(address(plan), _retailer, _pret, _durata, _disponibil, _descriere, _metadataURI);
        nextPlanId++;
    }
}