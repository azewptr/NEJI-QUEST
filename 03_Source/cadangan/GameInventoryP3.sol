// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title GameInventoryP3 - Inventori kartu Neji Quest (ERC-1155)
/// ID 1 = Senjata, ID 2 = Ramuan, ID 3 = Perisai
contract GameInventoryP3 is ERC1155, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    struct Item {
        string name;
        uint256 maxQuota;
        uint256 mintedCount;
        string metadataURI;
        address creator;
        bool isConfigured;
    }

    mapping(uint256 => Item) public items;

    event ItemConfigured(uint256 indexed itemId, string name, uint256 maxQuota, string metadataURI, address creator);
    event ItemCombined(address indexed player, uint256 indexed sourceItemId, uint256 indexed targetItemId);

    constructor(address creator, address issuer) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, issuer);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(CREATOR_ROLE, creator);
    }

    function configureItem(
        uint256 itemId,
        string calldata name,
        uint256 maxQuota,
        string calldata metadataURI,
        address creator
    ) external {
        require(
            hasRole(CREATOR_ROLE, msg.sender) || hasRole(ISSUER_ROLE, msg.sender),
            "Bukan kreator/kurator"
        );
        require(maxQuota > 0, "Kuota harus > 0");
        require(bytes(metadataURI).length > 0, "URI kosong");
        Item storage it = items[itemId];
        require(maxQuota >= it.mintedCount, "Kuota < jumlah termint");
        it.name = name;
        it.maxQuota = maxQuota;
        it.metadataURI = metadataURI;
        it.creator = creator;
        it.isConfigured = true;
        emit ItemConfigured(itemId, name, maxQuota, metadataURI, creator);
    }

    function mintVerifiedItem(address to, uint256 itemId, uint256 amount) external onlyRole(ISSUER_ROLE) {
        _mintItem(to, itemId, amount);
    }

    /// Bakar 2x item sumber, dapat 1x item tujuan.
    function combineOrExchangeItem(uint256 sourceItemId, uint256 targetItemId) external {
        require(balanceOf(msg.sender, sourceItemId) >= 2, "Saldo sumber < 2");
        _burn(msg.sender, sourceItemId, 2);
        _mintItem(msg.sender, targetItemId, 1);
        emit ItemCombined(msg.sender, sourceItemId, targetItemId);
    }

    function remainingQuota(uint256 id) public view returns (uint256) {
        Item storage it = items[id];
        return it.maxQuota - it.mintedCount;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return items[id].metadataURI;
    }

    function _mintItem(address to, uint256 itemId, uint256 amount) internal {
        Item storage it = items[itemId];
        require(it.isConfigured, "Item belum dikonfigurasi");
        require(amount > 0, "Jumlah 0");
        require(it.mintedCount + amount <= it.maxQuota, "Kuota habis");
        it.mintedCount += amount;
        _mint(to, itemId, amount, "");
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
