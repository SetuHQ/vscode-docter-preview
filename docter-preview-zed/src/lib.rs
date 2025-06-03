use anyhow::{anyhow, Result};
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use zed_extension_api::{self as zed, LanguageServerId};

struct DocterPreviewExtension {
    cached_binary_path: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FrontMatter {
    sidebar_title: Option<String>,
    visible_in_sidebar: Option<bool>,
    page_title: Option<String>,
    order: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct MenuItem {
    name: Option<String>,
    visible_in_sidebar: Option<bool>,
    page_title: Option<String>,
    path: String,
    order: Option<i32>,
    children: Option<Vec<MenuItem>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Endpoints {
    home: Vec<MenuItem>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct SidebarOption {
    name: String,
    value: String,
}

impl DocterPreviewExtension {
    fn new() -> Self {
        Self {
            cached_binary_path: None,
        }
    }

    fn mdx_preview(&self, content: &str) -> Result<String> {
        let encoded_mdx = base64::engine::general_purpose::STANDARD.encode(content);
        
        if encoded_mdx.len() > 15000 {
            return Err(anyhow!(
                "MDX file contains more characters than the accepted limit (15000). \
                Please visit https://docs.setu.co/content-preview for manual preview."
            ));
        }

        let preview_url = format!("https://staging.docs.setu.co/preview-query?mdx={}", encoded_mdx);
        
        Ok(format!(
            "MDX Preview URL generated:\n{}\n\nYou can open this URL in your browser to preview the MDX content.",
            preview_url
        ))
    }

    fn parse_frontmatter(&self, content: &str) -> Result<FrontMatter> {
        // Simple frontmatter parser for YAML between --- delimiters
        if !content.starts_with("---") {
            return Ok(FrontMatter {
                sidebar_title: None,
                visible_in_sidebar: None,
                page_title: None,
                order: None,
            });
        }

        let mut lines = content.lines();
        lines.next(); // Skip first ---
        
        let mut yaml_content = String::new();
        for line in lines {
            if line.trim() == "---" {
                break;
            }
            yaml_content.push_str(line);
            yaml_content.push('\n');
        }

        // Parse basic YAML fields manually
        let mut frontmatter = FrontMatter {
            sidebar_title: None,
            visible_in_sidebar: None,
            page_title: None,
            order: None,
        };

        for line in yaml_content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            
            if let Some((key, value)) = line.split_once(':') {
                let key = key.trim();
                let value = value.trim().trim_matches('"').trim_matches('\'');
                
                match key {
                    "sidebar_title" => frontmatter.sidebar_title = Some(value.to_string()),
                    "page_title" => frontmatter.page_title = Some(value.to_string()),
                    "visible_in_sidebar" => frontmatter.visible_in_sidebar = value.parse().ok(),
                    "order" => frontmatter.order = value.parse().ok(),
                    _ => {}
                }
            }
        }

        Ok(frontmatter)
    }

    fn read_mdx_file(&self, file_path: &Path) -> Result<FrontMatter> {
        let content = fs::read_to_string(file_path)?;
        
        // Replace em-dash with regular dash (similar to original implementation)
        let cleaned_content = content.replace("—", "-");
        
        self.parse_frontmatter(&cleaned_content)
    }

    fn traverse_directory(&self, dir_path: &Path, base_path: &Path) -> Result<Vec<MenuItem>> {
        let mut children = Vec::new();
        let entries = fs::read_dir(dir_path)?;
        
        let mut sorted_entries: Vec<_> = entries.collect::<Result<Vec<_>, _>>()?;
        sorted_entries.sort_by(|a, b| a.file_name().cmp(&b.file_name()));

        for entry in sorted_entries {
            let entry_path = entry.path();
            let file_name = entry
                .file_name()
                .to_string_lossy()
                .split('.')
                .next()
                .unwrap_or("")
                .to_string();

            if entry_path.is_dir() {
                // Handle directory
                let mdx_file = entry_path.join(format!("{}.mdx", file_name));
                let frontmatter = if mdx_file.exists() {
                    self.read_mdx_file(&mdx_file)?
                } else {
                    FrontMatter {
                        sidebar_title: Some(file_name.clone()),
                        visible_in_sidebar: Some(true),
                        page_title: Some(file_name.clone()),
                        order: Some(0),
                    }
                };

                let child_items = self.traverse_directory(&entry_path, base_path)?;
                
                children.push(MenuItem {
                    name: frontmatter.sidebar_title,
                    visible_in_sidebar: frontmatter.visible_in_sidebar,
                    page_title: frontmatter.page_title,
                    path: file_name,
                    order: frontmatter.order,
                    children: Some(child_items),
                });
            } else if entry_path.extension().and_then(|s| s.to_str()) == Some("mdx") {
                // Handle MDX file
                if !children.iter().any(|child| child.path == file_name) {
                    let frontmatter = self.read_mdx_file(&entry_path)?;
                    
                    children.push(MenuItem {
                        name: frontmatter.sidebar_title,
                        visible_in_sidebar: frontmatter.visible_in_sidebar,
                        page_title: frontmatter.page_title,
                        path: file_name,
                        order: frontmatter.order,
                        children: None,
                    });
                }
            }
        }

        Ok(children)
    }

    fn build_menu_items(&self, endpoints_content: &str, content_dir: &Path) -> Result<String> {
        let endpoints: Endpoints = serde_json::from_str(endpoints_content)?;
        let mut updated_endpoints = endpoints.clone();

        for endpoint in &mut updated_endpoints.home {
            if let Some(ref mut children) = endpoint.children {
                for child in children {
                    let child_path = content_dir.join(&endpoint.path).join(&child.path);
                    if child_path.exists() {
                        let traversed_children = self.traverse_directory(&child_path, content_dir)?;
                        child.children = Some(traversed_children);
                    }
                }
            }
        }

        let result_json = serde_json::to_string_pretty(&updated_endpoints)?;
        
        // Write to menuItems.json
        let menu_items_path = content_dir.join("menuItems.json");
        fs::write(&menu_items_path, &result_json)?;

        Ok(format!(
            "Menu items successfully built and saved to: {}\n\nGenerated {} top-level categories.",
            menu_items_path.display(),
            updated_endpoints.home.len()
        ))
    }

    fn sidebar_preview(&self, endpoints_content: &str) -> Result<String> {
        let endpoints: Endpoints = serde_json::from_str(endpoints_content)?;
        let mut options = Vec::new();

        for endpoint in &endpoints.home {
            if endpoint.visible_in_sidebar.unwrap_or(false) {
                if let Some(ref children) = endpoint.children {
                    for child in children {
                        options.push(SidebarOption {
                            name: format!("{} - {}", 
                                endpoint.name.as_ref().unwrap_or(&endpoint.path),
                                child.name.as_ref().unwrap_or(&child.path)
                            ),
                            value: format!("{}/{}", endpoint.path, child.path),
                        });
                    }
                }
            }
        }

        let mut result = String::from("Available sidebar categories:\n\n");
        for (i, option) in options.iter().enumerate() {
            result.push_str(&format!("{}. {} ({})\n", i + 1, option.name, option.value));
        }

        if options.is_empty() {
            result.push_str("No visible sidebar categories found.\n");
        } else {
            result.push_str(&format!("\nTo preview a specific category, use: docter-preview sidebar-preview-category <category_path>\n"));
        }

        Ok(result)
    }

    fn sidebar_preview_category(&self, category_path: &str, endpoints_content: &str, content_dir: &Path) -> Result<String> {
        let endpoints: Endpoints = serde_json::from_str(endpoints_content)?;
        let path_parts: Vec<&str> = category_path.split('/').collect();
        
        if path_parts.len() != 2 {
            return Err(anyhow!("Category path must be in format: category/product"));
        }

        let category_path_str = path_parts[0];
        let product_path_str = path_parts[1];

        let category = endpoints.home.iter()
            .find(|e| e.path == category_path_str)
            .ok_or_else(|| anyhow!("Category '{}' not found", category_path_str))?;

        let product = category.children.as_ref()
            .and_then(|children| children.iter().find(|c| c.path == product_path_str))
            .ok_or_else(|| anyhow!("Product '{}' not found in category '{}'", product_path_str, category_path_str))?;

        let product_dir = content_dir.join(category_path_str).join(product_path_str);
        
        if !product_dir.exists() {
            return Err(anyhow!("Directory does not exist: {}", product_dir.display()));
        }

        let children = self.traverse_directory(&product_dir, content_dir)?;
        
        let mut bundled_endpoints = Endpoints { home: vec![] };
        let mut updated_category = category.clone();
        let mut updated_product = product.clone();
        updated_product.children = Some(children);
        updated_category.children = Some(vec![updated_product]);
        bundled_endpoints.home.push(updated_category);

        let encoded_endpoints = base64::engine::general_purpose::STANDARD.encode(serde_json::to_string(&bundled_endpoints)?);
        let preview_url = format!("https://staging.docs.setu.co/sidebar-preview?endpoints={}", encoded_endpoints);

        Ok(format!(
            "Sidebar preview URL for '{}' generated:\n{}\n\nYou can open this URL in your browser to preview the sidebar.",
            category_path, preview_url
        ))
    }
}

impl zed::Extension for DocterPreviewExtension {
    fn new() -> Self {
        Self::new()
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> Result<zed::Command, String> {
        Ok(zed::Command {
            command: "docter-preview".to_string(),
            args: vec!["--help".to_string()],
            env: Default::default(),
        })
    }

    fn language_server_initialization_options(
        &mut self,
        _language_server_id: &LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> Result<Option<serde_json::Value>, String> {
        Ok(None)
    }
}

zed::register_extension!(DocterPreviewExtension);

// CLI module
pub mod cli {
    use super::*;

    pub fn handle_command(args: Vec<String>) -> Result<()> {
        let extension = DocterPreviewExtension::new();
        
        if args.is_empty() {
            println!("Docter Preview CLI Commands:");
            println!("  mdx-preview <file>                    - Generate MDX preview URL");
            println!("  build-menu-items <endpoints_file>     - Build menu items from endpoints.json");
            println!("  sidebar-preview <endpoints_file>      - Show available sidebar categories");
            println!("  sidebar-preview-category <category_path> <endpoints_file> - Preview specific category");
            return Ok(());
        }

        match args[0].as_str() {
            "mdx-preview" => {
                if args.len() < 2 {
                    return Err(anyhow!("Usage: docter-preview mdx-preview <file>"));
                }
                let content = fs::read_to_string(&args[1])?;
                let result = extension.mdx_preview(&content)?;
                println!("{}", result);
            }
            "build-menu-items" => {
                if args.len() < 2 {
                    return Err(anyhow!("Usage: docter-preview build-menu-items <endpoints_file>"));
                }
                let endpoints_content = fs::read_to_string(&args[1])?;
                let endpoints_path = Path::new(&args[1]);
                let content_dir = endpoints_path.parent()
                    .ok_or_else(|| anyhow!("Cannot determine content directory"))?;
                
                let result = extension.build_menu_items(&endpoints_content, content_dir)?;
                println!("{}", result);
            }
            "sidebar-preview" => {
                if args.len() < 2 {
                    return Err(anyhow!("Usage: docter-preview sidebar-preview <endpoints_file>"));
                }
                let endpoints_content = fs::read_to_string(&args[1])?;
                let result = extension.sidebar_preview(&endpoints_content)?;
                println!("{}", result);
            }
            "sidebar-preview-category" => {
                if args.len() < 3 {
                    return Err(anyhow!("Usage: docter-preview sidebar-preview-category <category_path> <endpoints_file>"));
                }
                let category_path = &args[1];
                let endpoints_content = fs::read_to_string(&args[2])?;
                let endpoints_path = Path::new(&args[2]);
                let content_dir = endpoints_path.parent()
                    .ok_or_else(|| anyhow!("Cannot determine content directory"))?;
                
                let result = extension.sidebar_preview_category(category_path, &endpoints_content, content_dir)?;
                println!("{}", result);
            }
            _ => {
                return Err(anyhow!("Unknown command: {}", args[0]));
            }
        }

        Ok(())
    }
}

