// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NejiInventory is ERC1155, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    // ID sama dengan label model + 1: Ramuan=1, Senjata=2, Perisai=3.
    struct Item { uint256 quota; uint256 minted; string metadataURI; }
    mapping(uint256 => Item) public items;
    event ItemConfigured(uint256 indexed id, uint256 quota, string metadataURI);

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    function configure(uint256 id, uint256 quota, string calldata metadataURI)
        external onlyRole(ISSUER_ROLE)
    {
        require(id >= 1 && id <= 3, "ID tidak valid");
        require(items[id].quota == 0, "Metadata sudah dibekukan");
        require(quota > 0, "Kuota harus positif");
        require(bytes(metadataURI).length > 7, "URI kosong");
        require(bytes7(bytes(metadataURI)) == bytes7("ipfs://"), "URI harus IPFS");
        items[id] = Item(quota, 0, metadataURI);
        emit ItemConfigured(id, quota, metadataURI);
    }

    function mint(address to, uint256 id, uint256 amount) external onlyRole(ISSUER_ROLE) {
        require(to != address(0), "Penerima nol");
        require(amount > 0, "Jumlah harus positif");
        Item storage item = items[id];
        require(item.quota > 0, "Item belum dikonfigurasi");
        require(amount <= item.quota - item.minted, "Kuota habis");
        item.minted += amount;
        _mint(to, id, amount, "");
    }

    function uri(uint256 id) public view override returns (string memory) {
        require(items[id].quota > 0, "Item belum dikonfigurasi");
        return items[id].metadataURI;
    }

    function supportsInterface(bytes4 id) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(id);
    }
}
