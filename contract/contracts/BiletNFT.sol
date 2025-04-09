// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BiletNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 public pretBilet;
    uint256 public bileteVandute;
    address public eventContract;

    constructor(
        string memory _numeEvent,
        string memory _simbolEvent,
        uint256 _pretBilet,
        address _eventContract
    ) ERC721(_numeEvent, _simbolEvent) Ownable(_eventContract) { 
        pretBilet = _pretBilet;
        eventContract = _eventContract;
    }

    event BiletCumparat(address indexed cumparator, uint256 indexed idBilet);

    function cumparaBilet(address recipient) external payable {
        require(msg.value == pretBilet, "Suma de ETH incorect trimisa");

        uint256 ticketId = bileteVandute + 1;
        _safeMint(recipient, ticketId);
        emit BiletCumparat(recipient, ticketId);

        (bool success, ) = payable(eventContract).call{value: msg.value}("");
        require(success, "Transfer ETH esuat");

        unchecked { bileteVandute++; }
    }

    function refundTransfer(address from, address to, uint256 ticketId) external {
        require(msg.sender == eventContract, "Acces neautorizat");
        _transfer(from, to, ticketId);
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