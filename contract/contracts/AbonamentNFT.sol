// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AbonamentNFT is ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    uint256 public pretAbonament;
    uint256 public abonamenteVandute;
    address public abonamentPlanContract;
    string public metadataURI;

    event AbonamentCumparat(address indexed abonat, uint256 indexed abonamentId);

    constructor(
        string memory _retailer,
        string memory _symbol,
        uint256 _pretAbonament,
        address _abonamentPlanContract,
        string memory _metadataURI,
        address _owner
    ) ERC721(_retailer, _symbol) Ownable(_owner) {
        require(_pretAbonament > 0, "Price cannot be zero");
        require(_abonamentPlanContract != address(0), "Invalid contract address");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        
        pretAbonament = _pretAbonament;
        abonamentPlanContract = _abonamentPlanContract;
        metadataURI = _metadataURI;
    }

    function cumparaAbonament(address cumparator) external payable nonReentrant {
        require(msg.value == pretAbonament, "Suma ETH gresita");
        abonamenteVandute++;
        uint256 abonamentId = abonamenteVandute;
        _safeMint(cumparator, abonamentId);
        _setTokenURI(abonamentId, metadataURI);
        emit AbonamentCumparat(cumparator, abonamentId);
        
        (bool success, ) = payable(abonamentPlanContract).call{value: msg.value}("");
        require(success, "ETH transfer failed");
    }

    function refundTransfer(address from, address to, uint256 abonamentId) external {
        require(msg.sender == abonamentPlanContract, "Neautorizat");
        _transfer(from, to, abonamentId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}