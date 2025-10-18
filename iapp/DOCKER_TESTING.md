# Docker Testing Guide for Gridfall iApps

This guide explains how to test the Gridfall iApps using Docker containers to simulate the iExec TEE environment.

## Prerequisites

- Docker installed and running
- Built Docker image: `gridfall-iapp`

## Building the Docker Image

```bash
cd iapp
docker build -t gridfall-iapp .
```

## Testing Individual iApps

### 1. Test Role Generator

Create test input:
```bash
mkdir -p test_docker/iexec_in test_docker/iexec_out

cat > test_docker/iexec_in/input.json <<EOF
{
  "players": [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333",
    "0x4444444444444444444444444444444444444444",
    "0x5555555555555555555555555555555555555555",
    "0x6666666666666666666666666666666666666666",
    "0x7777777777777777777777777777777777777777",
    "0x8888888888888888888888888888888888888888",
    "0x9999999999999999999999999999999999999999",
    "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  ]
}
EOF
```

Run container:
```bash
docker run --rm \
  -v "$(pwd)/test_docker/iexec_in:/iexec_in" \
  -v "$(pwd)/test_docker/iexec_out:/iexec_out" \
  gridfall-iapp src/app.js
```

Check output:
```bash
cat test_docker/iexec_out/result.json
```

Expected output: Role assignments for 10 players (2 Sentinels, 8 Echoes)

### 2. Test Scan Executor

Create test input with game state:
```bash
cat > test_docker/iexec_in/input.json <<EOF
{
  "gameState": {
    "roles": {
      "0x1111111111111111111111111111111111111111": "SENTINEL",
      "0x2222222222222222222222222222222222222222": "ECHO"
    },
    "eliminated": {},
    "moveCount": {},
    "pingsRemaining": {},
    "actionHistory": []
  },
  "action": {
    "type": "ping",
    "scanner": "0x1111111111111111111111111111111111111111",
    "target": "0x2222222222222222222222222222222222222222"
  }
}
EOF
```

Run container:
```bash
docker run --rm \
  -v "$(pwd)/test_docker/iexec_in:/iexec_in" \
  -v "$(pwd)/test_docker/iexec_out:/iexec_out" \
  gridfall-iapp src/scan-executor.js
```

Check output:
```bash
cat test_docker/iexec_out/result.json
```

Expected output: Echo eliminated, updated game state

### 3. Test Winner Calculator

Create test input with final game state:
```bash
cat > test_docker/iexec_in/input.json <<EOF
{
  "gameState": {
    "gameId": "test-game-123",
    "roles": {
      "0x1111111111111111111111111111111111111111": "SENTINEL",
      "0x2222222222222222222222222222222222222222": "SENTINEL",
      "0x3333333333333333333333333333333333333333": "ECHO",
      "0x4444444444444444444444444444444444444444": "ECHO"
    },
    "eliminated": {
      "0x2222222222222222222222222222222222222222": true,
      "0x4444444444444444444444444444444444444444": true
    },
    "moveCount": {
      "0x1111111111111111111111111111111111111111": 2,
      "0x2222222222222222222222222222222222222222": 1,
      "0x3333333333333333333333333333333333333333": 1
    },
    "pingsRemaining": {
      "0x1111111111111111111111111111111111111111": 0
    },
    "actionHistory": []
  }
}
EOF
```

Run container:
```bash
docker run --rm \
  -v "$(pwd)/test_docker/iexec_in:/iexec_in" \
  -v "$(pwd)/test_docker/iexec_out:/iexec_out" \
  gridfall-iapp src/winner-calculator.js
```

Check output:
```bash
cat test_docker/iexec_out/result.json
```

Expected output: 2 winners (Sentinel 1 and Echo 3)

## Automated Docker Testing Script

Use the provided `test-docker.sh` script to run all tests:

```bash
chmod +x test/test-docker.sh
./test/test-docker.sh
```

## Troubleshooting

### Container exits immediately
- Check that input.json is properly formatted
- Verify the iexec_in directory is mounted correctly
- Check container logs: `docker logs <container-id>`

### No output files generated
- Ensure iexec_out directory has write permissions
- Verify the application completed successfully
- Check for errors in the container output

### Permission denied errors
- On Linux/Mac, ensure directories are readable: `chmod -R 755 test_docker`
- Use absolute paths for volume mounts if relative paths fail

## iExec Deployment Considerations

When deploying to iExec:
1. The Docker image must be pushed to a public registry (Docker Hub, etc.)
2. The image will run in an Intel SGX or Gramine TEE
3. Input/output directories are managed by iExec infrastructure
4. Results are automatically encrypted before being returned to the blockchain

## Next Steps

After successful Docker testing:
1. Push Docker image to registry
2. Register application with iExec
3. Configure task parameters
4. Test on iExec testnet
5. Integrate with smart contracts
