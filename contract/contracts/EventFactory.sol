// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./Event.sol";

contract EventFactory {
    mapping(uint256 => address) public evenimente;
    uint256 public nextEventId;
    event EventCreat(address indexed adresaEvent, string eveniment, uint256 pretBilet, uint256 disponibilitateBilete, string descriere, string urlImagine);
    function createEvent(
        string memory _eveniment, 
        uint256 _pretBilet, 
        uint256 _disponibilitateBilete, 
        string memory _descriere, 
        string memory _urlImagine
    ) external {
        Event e = new Event(_eveniment, _pretBilet, _disponibilitateBilete, _descriere,_urlImagine);
        evenimente[nextEventId] = address(e);
        emit EventCreat(address(e), _eveniment, _pretBilet, _disponibilitateBilete, _descriere,_urlImagine);
        nextEventId++;
    }
}