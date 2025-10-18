#!/bin/bash
# Docker Testing Script for Gridfall iApps
# Tests all three iApps in Docker containers

set -e  # Exit on error

echo "==================================="
echo "Gridfall iApp Docker Testing Suite"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create test directories
TEST_DIR="test_docker"
IN_DIR="$TEST_DIR/iexec_in"
OUT_DIR="$TEST_DIR/iexec_out"

echo "Setting up test directories..."
mkdir -p "$IN_DIR" "$OUT_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    echo "Please install Docker and try again."
    exit 1
fi

# Check if image exists, build if not
IMAGE_NAME="gridfall-iapp"
if ! docker image inspect "$IMAGE_NAME" &> /dev/null; then
    echo -e "${YELLOW}Building Docker image...${NC}"
    cd ..
    docker build -t "$IMAGE_NAME" .
    cd test
    echo -e "${GREEN}✅ Image built successfully${NC}"
else
    echo -e "${GREEN}✅ Docker image found${NC}"
fi

echo ""
echo "==================================="
echo "Test 1: Role Generator"
echo "==================================="

# Clean output directory
rm -f "$OUT_DIR"/*

# Create input for role generator
cat > "$IN_DIR/input.json" <<EOF
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

echo "Running role generator in Docker..."
docker run --rm \
  -v "$(pwd)/$IN_DIR:/iexec_in" \
  -v "$(pwd)/$OUT_DIR:/iexec_out" \
  "$IMAGE_NAME" src/app.js

# Verify output
if [ -f "$OUT_DIR/result.json" ]; then
    echo -e "${GREEN}✅ Role generator test PASSED${NC}"
    echo "Output preview:"
    cat "$OUT_DIR/result.json" | head -20
else
    echo -e "${RED}❌ Role generator test FAILED - No output file${NC}"
    exit 1
fi

echo ""
echo "==================================="
echo "Test 2: Scan Executor"
echo "==================================="

# Clean output directory
rm -f "$OUT_DIR"/*

# Create input for scan executor
cat > "$IN_DIR/input.json" <<EOF
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

echo "Running scan executor in Docker..."
docker run --rm \
  -v "$(pwd)/$IN_DIR:/iexec_in" \
  -v "$(pwd)/$OUT_DIR:/iexec_out" \
  "$IMAGE_NAME" src/scan-executor.js

# Verify output
if [ -f "$OUT_DIR/result.json" ]; then
    # Check if elimination occurred
    if grep -q "eliminated" "$OUT_DIR/result.json"; then
        echo -e "${GREEN}✅ Scan executor test PASSED${NC}"
        echo "Output preview:"
        cat "$OUT_DIR/result.json" | head -20
    else
        echo -e "${RED}❌ Scan executor test FAILED - Unexpected output${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Scan executor test FAILED - No output file${NC}"
    exit 1
fi

echo ""
echo "==================================="
echo "Test 3: Winner Calculator"
echo "==================================="

# Clean output directory
rm -f "$OUT_DIR"/*

# Create input for winner calculator
cat > "$IN_DIR/input.json" <<EOF
{
  "gameState": {
    "gameId": "docker-test-game",
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

echo "Running winner calculator in Docker..."
docker run --rm \
  -v "$(pwd)/$IN_DIR:/iexec_in" \
  -v "$(pwd)/$OUT_DIR:/iexec_out" \
  "$IMAGE_NAME" src/winner-calculator.js

# Verify output
if [ -f "$OUT_DIR/result.json" ]; then
    # Check if winners were calculated
    WINNER_COUNT=$(cat "$OUT_DIR/result.json" | grep -o '"winnerCount":[0-9]*' | grep -o '[0-9]*')
    if [ "$WINNER_COUNT" == "2" ]; then
        echo -e "${GREEN}✅ Winner calculator test PASSED${NC}"
        echo "Output preview:"
        cat "$OUT_DIR/result.json"
    else
        echo -e "${RED}❌ Winner calculator test FAILED - Expected 2 winners, got $WINNER_COUNT${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Winner calculator test FAILED - No output file${NC}"
    exit 1
fi

echo ""
echo "==================================="
echo -e "${GREEN}🎉 ALL DOCKER TESTS PASSED!${NC}"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Push Docker image to registry: docker push <registry>/$IMAGE_NAME"
echo "2. Register with iExec protocol"
echo "3. Test on iExec testnet"
echo ""
