# Docter Preview - Zed Extension

A Zed extension that ports the VSCode Docter Preview functionality to Rust with CLI-based commands. This extension helps you preview MDX documentation and build menu items for Setu's Docter documentation system.

## Features

- **MDX Preview**: Generate preview URLs for MDX files
- **Menu Items Builder**: Build navigation menu items from endpoints configuration
- **Sidebar Preview**: Preview documentation sidebar structure
- **CLI-based**: All functionality accessible via command line

## Installation

1. Clone this repository
2. Build the extension:
   ```bash
   cd docter-preview-zed
   cargo build --release
   ```
3. Install the binary:
   ```bash
   cargo install --path .
   ```

## Usage

### MDX Preview

Generate a preview URL for an MDX file:

```bash
docter-preview mdx-preview path/to/your/file.mdx
```

This will output a URL that you can open in your browser to preview the rendered MDX content.

**Note**: Files larger than 15,000 characters will show an error message directing you to the manual preview page.

### Build Menu Items

Build navigation menu items from an endpoints.json file:

```bash
docter-preview build-menu-items path/to/endpoints.json
```

This command:
- Reads the endpoints configuration
- Traverses the content directory structure
- Extracts frontmatter from MDX files
- Generates a complete menu structure
- Saves the result to `content/menuItems.json`

### Sidebar Preview

View available sidebar categories:

```bash
docter-preview sidebar-preview path/to/endpoints.json
```

This shows all available categories that are visible in the sidebar.

### Sidebar Preview Category

Generate a preview URL for a specific category:

```bash
docter-preview sidebar-preview-category category/product path/to/endpoints.json
```

Example:
```bash
docter-preview sidebar-preview-category payments/upi path/to/endpoints.json
```

## File Structure

The extension expects your documentation to follow this structure:

```
project/
├── content/
│   ├── endpoints.json
│   ├── category1/
│   │   ├── category1.mdx
│   │   ├── product1/
│   │   │   ├── product1.mdx
│   │   │   ├── guide1.mdx
│   │   │   └── guide2.mdx
│   │   └── product2/
│   │       └── ...
│   └── category2/
│       └── ...
└── menuItems.json (generated)
```

## MDX Frontmatter

MDX files should include YAML frontmatter with these fields:

```yaml
---
sidebar_title: "Display Title"
page_title: "Page Title"
visible_in_sidebar: true
order: 1
---
```

## Endpoints Configuration

The `endpoints.json` file should follow this structure:

```json
{
  "home": [
    {
      "name": "Category Name",
      "path": "category-path",
      "visible_in_sidebar": true,
      "children": [
        {
          "name": "Product Name",
          "path": "product-path"
        }
      ]
    }
  ]
}
```

## Development

### Building

```bash
cargo build
```

### Testing

```bash
cargo test
```

### Release

```bash
cargo build --release
```

## Differences from VSCode Extension

- **CLI-based**: Uses command line interface instead of editor UI
- **No webview**: Generates URLs instead of embedded previews
- **Rust implementation**: Complete rewrite in Rust for better performance
- **Simplified frontmatter**: Manual YAML parsing for common fields

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please visit: https://github.com/SetuHQ/vscode-docter-preview/issues