# Installation Guide - Docter Preview Zed Extension

## Prerequisites

1. **Rust and Cargo**: Install Rust toolchain
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Zed Editor**: Install Zed editor from [zed.dev](https://zed.dev)

## Installation Methods

### Method 1: Build from Source (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SetuHQ/vscode-docter-preview.git
   cd vscode-docter-preview/docter-preview-zed
   ```

2. **Build the extension**:
   ```bash
   ./build.sh
   ```

3. **Install the CLI tool globally**:
   ```bash
   cargo install --path .
   ```

4. **Verify installation**:
   ```bash
   docter-preview --help
   ```

### Method 2: Direct Cargo Install

```bash
cargo install --git https://github.com/SetuHQ/vscode-docter-preview.git --root docter-preview-zed
```

## Zed Extension Setup

1. **Create extension directory**:
   ```bash
   mkdir -p ~/.config/zed/extensions/docter-preview
   ```

2. **Copy extension files**:
   ```bash
   cp extension.toml ~/.config/zed/extensions/docter-preview/
   cp target/release/libdocter_preview.* ~/.config/zed/extensions/docter-preview/
   ```

3. **Restart Zed** to load the extension

## Configuration

### Project Structure

Ensure your project follows this structure:

```
your-docs-project/
├── content/
│   ├── endpoints.json          # Main configuration file
│   ├── category1/
│   │   ├── category1.mdx      # Category overview
│   │   ├── product1/
│   │   │   ├── product1.mdx   # Product overview
│   │   │   ├── guide1.mdx     # Documentation files
│   │   │   └── guide2.mdx
│   │   └── product2/
│   └── category2/
└── menuItems.json             # Generated file
```

### endpoints.json Format

```json
{
  "home": [
    {
      "name": "Category Name",
      "path": "category-path",
      "visible_in_sidebar": true,
      "order": 1,
      "children": [
        {
          "name": "Product Name",
          "path": "product-path",
          "order": 1
        }
      ]
    }
  ]
}
```

### MDX Frontmatter Format

```yaml
---
sidebar_title: "Display Title"
page_title: "Page Title"
visible_in_sidebar: true
order: 1
---
```

## Usage Examples

### 1. Preview MDX Files

```bash
# Generate preview URL for an MDX file
docter-preview mdx-preview content/payments/upi/overview.mdx
```

**Output**:
```
MDX Preview URL generated:
https://staging.docs.setu.co/preview-query?mdx=LS0tCnNpZGViYXJfdGl0bGU6...

You can open this URL in your browser to preview the MDX content.
```

### 2. Build Menu Items

```bash
# Build navigation menu from endpoints.json
docter-preview build-menu-items content/endpoints.json
```

**Output**:
```
Menu items successfully built and saved to: content/menuItems.json

Generated 3 top-level categories.
```

### 3. Preview Sidebar Structure

```bash
# List all available sidebar categories
docter-preview sidebar-preview content/endpoints.json
```

**Output**:
```
Available sidebar categories:

1. Payments - UPI (payments/upi)
2. Payments - Cards (payments/cards)
3. Data - Account Aggregator (data/account-aggregator)

To preview a specific category, use: docter-preview sidebar-preview-category <category_path>
```

### 4. Preview Specific Category

```bash
# Generate preview URL for specific category
docter-preview sidebar-preview-category payments/upi content/endpoints.json
```

**Output**:
```
Sidebar preview URL for 'payments/upi' generated:
https://staging.docs.setu.co/sidebar-preview?endpoints=eyJob21lIjpbeyJuYW1l...

You can open this URL in your browser to preview the sidebar.
```

## Integration with Zed

### Command Palette Integration

Once installed, you can access commands through Zed's command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

- `Docter: MDX Preview` - Preview current MDX file
- `Docter: Build Menu Items` - Build menu items from endpoints.json
- `Docter: Sidebar Preview` - Show sidebar structure

### Keyboard Shortcuts

Add to your Zed keymap.json:

```json
[
  {
    "bindings": {
      "cmd-shift-p": "docter_preview::mdx_preview"
    }
  }
]
```

## Troubleshooting

### Common Issues

1. **"Command not found" error**:
   - Ensure `~/.cargo/bin` is in your PATH
   - Restart your terminal after installation

2. **"Cannot determine content directory" error**:
   - Ensure you're running commands from the correct directory
   - Check that endpoints.json exists in the expected location

3. **"MDX file contains more characters than accepted limit"**:
   - File is too large (>15,000 characters)
   - Use the manual preview page at https://docs.setu.co/content-preview

4. **Extension not loading in Zed**:
   - Check extension files are in the correct directory
   - Restart Zed after installation
   - Check Zed's extension logs

### Debug Mode

Enable verbose logging:

```bash
RUST_LOG=debug docter-preview mdx-preview your-file.mdx
```

### File Permissions

Ensure the binary is executable:

```bash
chmod +x ~/.cargo/bin/docter-preview
```

## Uninstallation

### Remove CLI Tool

```bash
cargo uninstall docter-preview
```

### Remove Zed Extension

```bash
rm -rf ~/.config/zed/extensions/docter-preview
```

## Support

- **Issues**: [GitHub Issues](https://github.com/SetuHQ/vscode-docter-preview/issues)
- **Email**: aditya.g@setu.co
- **Documentation**: [Setu Docs](https://docs.setu.co)

## Development

### Building for Development

```bash
cargo build
```

### Running Tests

```bash
./test.sh
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request