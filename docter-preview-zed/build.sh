#!/bin/bash

# Build script for Docter Preview Zed Extension

set -e

echo "🔨 Building Docter Preview Zed Extension..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo/Rust not found. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Please run this script from the docter-preview-zed directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean

# Add WASM target if not present
echo "🎯 Adding WASM target..."
rustup target add wasm32-wasip1

# Build in release mode for native binary
echo "🏗️  Building native binary in release mode..."
cargo build --release

# Build for Zed extension (WASM)
echo "🌐 Building WASM for Zed extension..."
cargo build --release --target wasm32-wasip1

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Native binary: ./target/release/docter-preview"
    echo "🌐 WASM binary: ./target/wasm32-wasip1/release/docter_preview.wasm"
    echo ""
    echo "🚀 To install CLI globally, run:"
    echo "   cargo install --path ."
    echo ""
    echo "🔌 To install as Zed extension:"
    echo "   1. Open Zed"
    echo "   2. Cmd+Shift+P → 'zed: install dev extension'"
    echo "   3. Select this directory"
    echo ""
    echo "🧪 To test the CLI, run:"
    echo "   ./test.sh"
else
    echo "❌ Build failed!"
    exit 1
fi