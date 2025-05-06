// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AbonamentNFT.sol";

contract PlanAbonament is Ownable, IERC721Receiver, ReentrancyGuard {
    string public retailer;
    uint256 public pretSubscriptie;
    uint256 public durata;
    uint256 public abonamenteDisp;
    string public descriere;
    string public metadataURI;
    bool public cancelled;
    AbonamentNFT public abonamentNFT;
    mapping(address => uint256) public retrageri;
  
    event RefundRequested(address indexed subscriber, uint256 indexed subscriptieId);
    event AbonamentCumparat(address indexed subscriber);

    constructor(
        string memory _retailer,
        uint256 _pretSubscriptie,
        uint256 _durata,
        uint256 _abonamenteDisp,
        string memory _descriere,
        string memory _metadataURI,
        address _owner
    ) Ownable(_owner) {
        require(bytes(_retailer).length > 0, "Retailer name cannot be empty");
        require(_pretSubscriptie > 0, "Price cannot be zero");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        
        retailer = _retailer;
        pretSubscriptie = _pretSubscriptie;
        durata = _durata;
        abonamenteDisp = _abonamenteDisp;
        descriere = _descriere;
        metadataURI = _metadataURI;
        
        abonamentNFT = new AbonamentNFT(
            _retailer,
            "SUBS",
            _pretSubscriptie,
            address(this),
            _metadataURI,
            _owner
        );
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function cumparaSubscriptie() external payable nonReentrant {
        require(!cancelled, "Abonament anulat");
        require(msg.value == pretSubscriptie, "Incorrect ETH amount");
        require(abonamenteDisp > 0, "No subscriptii available");
        
        abonamentNFT.cumparaAbonament{value: msg.value}(msg.sender);
        abonamenteDisp--;
        emit AbonamentCumparat(msg.sender);
    }

    function cancelPlan() external onlyOwner {
        cancelled = true;
    }

    function refundSubscriptie(uint256 subscriptieId) external nonReentrant {
        require(cancelled, "Plan is not cancelled");
        require(abonamentNFT.ownerOf(subscriptieId) == msg.sender, "Not the owner");
        
        abonamentNFT.refundTransfer(msg.sender, address(this), subscriptieId);
        retrageri[msg.sender] += pretSubscriptie;
        emit RefundRequested(msg.sender, subscriptieId);
    }

    function withdraw() external nonReentrant {
        uint256 amount = retrageri[msg.sender];
        require(amount > 0, "No funds to withdraw");
        retrageri[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    function testCallRefund(
        address nft,
        address from,
        address to,
        uint tokenId
    ) public {
        AbonamentNFT(nft).refundTransfer(from, to, tokenId);
    }
    receive() external payable {}
}