#!/bin/bash

echo "🔍 Checking if the Docter Preview extension builds correctly..."

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Please run this script from the docter-preview-zed directory"
    exit 1
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo/Rust not found. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

echo "✅ Rust/Cargo found"

# Check syntax and dependencies
echo "📦 Checking dependencies and syntax..."
cargo check

if [ $? -eq 0 ]; then
    echo "✅ Code compiles successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Build the project: cargo build --release"
    echo "   2. Install globally: cargo install --path ."
    echo "   3. Test the CLI: ./test.sh"
else
    echo "❌ Build check failed!"
    exit 1
fi