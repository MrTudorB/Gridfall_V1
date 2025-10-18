/**
 * iExec Configuration for Gridfall iApps
 *
 * This file contains configuration for deploying and managing
 * iExec TEE applications for the Gridfall game.
 *
 * Usage:
 * 1. Update DOCKER_REGISTRY with your Docker Hub username
 * 2. Update IEXEC_APP_OWNER with your Ethereum address
 * 3. Deploy apps: node scripts/deploy-iexec-apps.js
 */

module.exports = {
  // Docker Configuration
  DOCKER_REGISTRY: process.env.DOCKER_REGISTRY || 'your-dockerhub-username',
  DOCKER_IMAGE_NAME: 'gridfall-iapp',
  DOCKER_TAG: process.env.DOCKER_TAG || 'latest',

  // iExec Configuration
  IEXEC_APP_OWNER: process.env.IEXEC_APP_OWNER || '0xYourEthereumAddress',
  IEXEC_CHAIN: process.env.IEXEC_CHAIN || 'viviani', // viviani (testnet) or bellecour (mainnet)

  // App Configurations
  apps: {
    roleGenerator: {
      name: 'gridfall-role-generator',
      description: 'Generates confidential player roles for Gridfall game',
      entrypoint: 'node src/app.js',
      heapSize: 1073741824, // 1GB
      framework: 'SCONE',
      version: 'v5',
      mrenclave: {
        // Will be generated after first deployment
        fingerprint: null
      }
    },

    scanExecutor: {
      name: 'gridfall-scan-executor',
      description: 'Processes ping/scan actions confidentially',
      entrypoint: 'node src/scan-executor.js',
      heapSize: 1073741824,
      framework: 'SCONE',
      version: 'v5',
      mrenclave: {
        fingerprint: null
      }
    },

    winnerCalculator: {
      name: 'gridfall-winner-calculator',
      description: 'Calculates game winners based on final state',
      entrypoint: 'node src/winner-calculator.js',
      heapSize: 1073741824,
      framework: 'SCONE',
      version: 'v5',
      mrenclave: {
        fingerprint: null
      }
    }
  },

  // Task Configuration
  task: {
    maxExecutionTime: 300, // 5 minutes
    trust: 1, // Require TEE execution
    tag: '0x0000000000000000000000000000000000000000000000000000000000000001', // TEE tag
    category: 0, // Standard category
    workerpoolMinStake: 0
  },

  // Data Protector Configuration
  dataProtector: {
    enabled: true,
    name: 'Gridfall Game Data',
    schema: {
      roles: 'mapping',
      gameState: 'object',
      results: 'object'
    }
  },

  // Oracle Configuration (for smart contract callbacks)
  oracle: {
    // iExec Oracle Factory address (same on all chains)
    factoryAddress: '0x36dA71ccAd7A67053f0a4d9D5f55b725C9A25A3E',

    // Callback configuration
    callbackGasLimit: 500000,
    minConfirmations: 1
  },

  // Network Configuration
  networks: {
    viviani: {
      chainId: 134,
      rpcUrl: 'https://viviani.iex.ec',
      hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
      explorerUrl: 'https://blockscout-viviani.iex.ec'
    },
    bellecour: {
      chainId: 134,
      rpcUrl: 'https://bellecour.iex.ec',
      hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
      explorerUrl: 'https://blockscout-bellecour.iex.ec'
    }
  },

  // Price Configuration (in nRLC, 1 RLC = 10^9 nRLC)
  pricing: {
    roleGeneration: {
      workerpoolPrice: 0,
      appPrice: 0,
      datasetPrice: 0
    },
    scanExecution: {
      workerpoolPrice: 0,
      appPrice: 0,
      datasetPrice: 0
    },
    winnerCalculation: {
      workerpoolPrice: 0,
      appPrice: 0,
      datasetPrice: 0
    }
  },

  // Testing Configuration
  test: {
    mockMode: true, // Use mock callbacks for testing
    testWallets: 10,
    testDeposit: '0.1' // ETH
  }
};
