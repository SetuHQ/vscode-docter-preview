#!/bin/bash

# Test script for Docter Preview Zed Extension

set -e

echo "Building the project..."
cargo build --release

echo "Testing CLI functionality..."

# Test help command
echo "=== Testing help command ==="
./target/release/docter-preview

echo ""

# Test MDX preview
echo "=== Testing MDX preview ==="
./target/release/docter-preview mdx-preview examples/sample.mdx

echo ""

# Test sidebar preview
echo "=== Testing sidebar preview ==="
./target/release/docter-preview sidebar-preview examples/endpoints.json

echo ""

# Test sidebar preview category
echo "=== Testing sidebar preview category ==="
./target/release/docter-preview sidebar-preview-category payments/upi examples/endpoints.json

echo ""

# Test build menu items (this will create menuItems.json)
echo "=== Testing build menu items ==="
./target/release/docter-preview build-menu-items examples/endpoints.json

echo ""

# Check if menuItems.json was created
if [ -f "examples/menuItems.json" ]; then
    echo "✅ menuItems.json created successfully"
    echo "Preview of generated menuItems.json:"
    head -20 examples/menuItems.json
else
    echo "❌ menuItems.json was not created"
fi

echo ""
echo "All tests completed!"