# Migration Guide: VSCode to Zed Extension

## Overview

This guide helps you migrate from the VSCode Docter Preview extension to the new Zed extension with CLI-based functionality.

## Key Differences

### VSCode Extension (Original)
- **UI-based**: Commands triggered via editor icons and command palette
- **Webview integration**: Previews shown in embedded webview panels
- **JavaScript/Node.js**: Built using VSCode extension API
- **Real-time preview**: Immediate visual feedback in the editor
- **Interactive sidebar**: Dropdown selection with live preview updates

### Zed Extension (New)
- **CLI-based**: All functionality accessible via command line
- **URL generation**: Generates preview URLs instead of embedded views
- **Rust**: Complete rewrite in Rust for better performance
- **External browser**: Opens previews in your default browser
- **Batch processing**: Better suited for automation and scripting

## Feature Mapping

| VSCode Feature | Zed Equivalent | Notes |
|----------------|----------------|--------|
| MDX Preview button | `docter-preview mdx-preview <file>` | Generates URL instead of embedded view |
| Build Menu Items button | `docter-preview build-menu-items <endpoints>` | Same functionality, CLI interface |
| Sidebar Preview button | `docter-preview sidebar-preview <endpoints>` | Lists categories instead of dropdown |
| Category selection | `docter-preview sidebar-preview-category <path>` | Manual category specification |

## Migration Steps

### 1. Install the Zed Extension

```bash
# Clone and build
git clone https://github.com/SetuHQ/vscode-docter-preview.git
cd vscode-docter-preview/docter-preview-zed
./build.sh
cargo install --path .
```

### 2. Update Your Workflow

#### Before (VSCode)
1. Open MDX file in VSCode
2. Click preview icon in editor title bar
3. View preview in webview panel

#### After (Zed)
1. Open terminal in project directory
2. Run: `docter-preview mdx-preview path/to/file.mdx`
3. Open generated URL in browser

### 3. Automate Common Tasks

Create shell scripts for frequent operations:

**preview.sh**:
```bash
#!/bin/bash
if [ "$1" ]; then
    docter-preview mdx-preview "$1" | grep "https://" | xargs open
else
    echo "Usage: ./preview.sh <mdx-file>"
fi
```

**build-menu.sh**:
```bash
#!/bin/bash
docter-preview build-menu-items content/endpoints.json
echo "Menu items updated!"
```

### 4. Integrate with Zed

Add to your Zed settings.json:

```json
{
  "terminal": {
    "shell": {
      "program": "/bin/zsh"
    }
  },
  "tasks": [
    {
      "label": "Preview MDX",
      "command": "docter-preview",
      "args": ["mdx-preview", "${file}"],
      "group": "build"
    },
    {
      "label": "Build Menu Items",
      "command": "docter-preview", 
      "args": ["build-menu-items", "content/endpoints.json"],
      "group": "build"
    }
  ]
}
```

## Workflow Adaptations

### MDX Previewing

#### VSCode Workflow
```
1. Edit MDX file
2. Click preview icon
3. See live preview in split pane
4. Continue editing with live updates
```

#### Zed Workflow
```
1. Edit MDX file
2. Run CLI command: docter-preview mdx-preview file.mdx
3. Open URL in browser
4. Refresh browser after edits (or re-run command)
```

### Menu Building

#### VSCode Workflow
```
1. Open endpoints.json
2. Click "Build Menu Items" icon
3. See progress notification
4. Check generated menuItems.json
```

#### Zed Workflow
```
1. Run: docter-preview build-menu-items content/endpoints.json
2. See CLI output with status
3. Check generated menuItems.json
```

### Sidebar Preview

#### VSCode Workflow
```
1. Open endpoints.json
2. Click "Sidebar Preview" icon  
3. Select category from dropdown
4. View generated sidebar in webview
```

#### Zed Workflow
```
1. Run: docter-preview sidebar-preview content/endpoints.json
2. View available categories in terminal
3. Run: docter-preview sidebar-preview-category payments/upi content/endpoints.json
4. Open generated URL in browser
```

## Advantages of CLI Approach

### 1. Automation
```bash
# Batch preview multiple files
for file in content/**/*.mdx; do
    echo "Previewing $file"
    docter-preview mdx-preview "$file"
done
```

### 2. CI/CD Integration
```yaml
# GitHub Actions example
- name: Build Menu Items
  run: docter-preview build-menu-items content/endpoints.json
  
- name: Validate Menu Structure  
  run: test -f content/menuItems.json
```

### 3. Scripting
```bash
# Auto-open previews
preview_url=$(docter-preview mdx-preview content/guide.mdx | grep "https://")
open "$preview_url"
```

### 4. Cross-Platform
Works consistently across macOS, Linux, and Windows with same commands.

## Limitations and Workarounds

### No Live Preview
**Limitation**: No real-time preview updates while editing

**Workaround**: 
- Use browser auto-refresh extensions
- Create file watcher script:

```bash
# watch-preview.sh
fswatch -o "$1" | while read; do
    docter-preview mdx-preview "$1" | grep "https://" | xargs open
done
```

### No Interactive UI
**Limitation**: No dropdown menus or interactive elements

**Workaround**:
- Create menu scripts for common operations
- Use shell aliases for frequent commands

```bash
# Add to .zshrc or .bashrc
alias dp-preview='docter-preview mdx-preview'
alias dp-build='docter-preview build-menu-items content/endpoints.json'
alias dp-sidebar='docter-preview sidebar-preview content/endpoints.json'
```

### Manual URL Opening
**Limitation**: URLs not automatically opened in browser

**Workaround**:
```bash
# Auto-open function
dp-open() {
    url=$(docter-preview mdx-preview "$1" | grep -o 'https://[^[:space:]]*')
    if [ "$url" ]; then
        open "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null
    fi
}
```

## Performance Comparison

| Aspect | VSCode Extension | Zed Extension |
|--------|------------------|---------------|
| Startup Time | ~2-3 seconds | ~100ms |
| Memory Usage | ~50-100MB | ~5-10MB |
| File Processing | JavaScript V8 | Native Rust |
| Large Files | May freeze UI | Handles efficiently |
| Batch Operations | Not supported | Native support |

## Troubleshooting Migration Issues

### Path Resolution
VSCode extension automatically resolved workspace paths. With CLI:

```bash
# Ensure you're in the project root
cd /path/to/your/docs-project
docter-preview mdx-preview content/guide.mdx
```

### File Permissions
```bash
# If permission errors occur
chmod +x ~/.cargo/bin/docter-preview
```

### Environment Variables
```bash
# Add to shell profile if needed
export PATH="$HOME/.cargo/bin:$PATH"
```

## Best Practices

### 1. Project Structure
Keep the same structure for compatibility:
```
project/
├── content/
│   ├── endpoints.json
│   └── categories/
└── scripts/ (new)
    ├── preview.sh
    └── build-menu.sh
```

### 2. Workflow Scripts
Create project-specific scripts:

**Makefile**:
```makefile
preview:
	@echo "Available MDX files:"
	@find content -name "*.mdx" | head -10
	@read -p "Enter file path: " file; \
	docter-preview mdx-preview "$$file"

build-menu:
	docter-preview build-menu-items content/endpoints.json

sidebar:
	docter-preview sidebar-preview content/endpoints.json
```

### 3. Documentation Updates
Update your team documentation to reflect new CLI usage patterns.

## Support

For migration assistance:
- Create issues at: https://github.com/SetuHQ/vscode-docter-preview/issues
- Email: aditya.g@setu.co
- Tag issues with "migration" label