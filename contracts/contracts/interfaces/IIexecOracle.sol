// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIexecOracle
 * @notice Interface for iExec oracle integration
 * @dev Based on iExec Oracle Factory pattern
 */
interface IIexecOracle {
    /**
     * @notice Get raw bytes data from oracle
     * @param _oracleId The identifier for the oracle query
     * @return The raw bytes data
     */
    function getRaw(bytes32 _oracleId) external view returns (bytes memory);

    /**
     * @notice Get string data from oracle
     * @param _oracleId The identifier for the oracle query
     * @return The string data
     */
    function getString(bytes32 _oracleId) external view returns (string memory);

    /**
     * @notice Get integer data from oracle
     * @param _oracleId The identifier for the oracle query
     * @return The integer data
     */
    function getInt(bytes32 _oracleId) external view returns (int256);

    /**
     * @notice Get boolean data from oracle
     * @param _oracleId The identifier for the oracle query
     * @return The boolean data
     */
    function getBool(bytes32 _oracleId) external view returns (bool);
}

/**
 * @title IIexecCallback
 * @notice Interface for contracts that receive callbacks from iExec TEE apps
 */
interface IIexecCallback {
    /**
     * @notice Callback function called by iExec when computation is complete
     * @param _taskId The ID of the completed task
     * @param _results The results from the TEE computation
     */
    function receiveResult(bytes32 _taskId, bytes calldata _results) external;
}
