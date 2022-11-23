const vscode = require("vscode");
const os = require("os");
import base64url from "base64url";
import { traverse, customTraverse } from "./traverse";

const is_web_ext = os.homedir === undefined; // Runs as web extension in browser.

let client_html_template_web = null; // Query history does not replace this structure, it is also used to store partially entered queries for preview window switch.
let client_html_template = null;

let sidebar_html_template_web = null; // Query history does not replace this structure, it is also used to store partially entered queries for preview window switch.
let sidebar_html_template = null;

let preview_panel = null;
let sidebar_preview_panel = null;

let productEndpoints = null;

let isVirtualWorkspace = false;

let absolute_path_map = {};

// MDX Preview
const docterMDXPreview = async () => {
    let active_window = vscode.window;
    if (!active_window) return;
    let active_editor = active_window.activeTextEditor;
    if (!active_editor) return;
    let active_doc = active_editor.document;
    if (!active_doc) return;
    let orig_uri = active_doc.uri;
    if (!orig_uri) return;

    preview_panel = vscode.window.createWebviewPanel(
        "docter-preview",
        `${active_doc.uri.path.split("/").slice(-1)} - MDX Preview`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );
    if (!client_html_template) {
        if (is_web_ext) {
            client_html_template = client_html_template_web;
        } else {
            client_html_template = readFileSync(
                absolute_path_map["preview.html"],
                "utf8"
            );
        }
    }
    let client_html = client_html_template;
    preview_panel.webview.html = client_html;
    let encodedMDX = base64url(active_doc.getText());
    let result = [];

    // Max header value when sending as query parameter
    // TODO: Find a better way to solve this
    result.push(encodedMDX.slice(0, 15000));
    if (encodedMDX.length > 15000) {
        result.push(encodedMDX.slice(-(encodedMDX.length - 15000)));
    }
    preview_panel.webview.postMessage({
        value: result,
        type: "MDX_PREVIEW",
    });
    return;
};

// Sidebar Preview
const docterSidebarPreview = async () => {
    let active_window = vscode.window;
    if (!active_window) return;
    let active_editor = active_window.activeTextEditor;
    if (!active_editor) return;
    let active_doc = active_editor.document;
    if (!active_doc) return;
    let orig_uri = active_doc.uri;
    if (!orig_uri) return;

    let endpoints = JSON.parse(active_doc.getText());
    let options = [];
    for (let endpoint of endpoints["home"]) {
        if (endpoint.visible_in_sidebar) {
            for (let child of endpoint["children"]) {
                options.push({
                    name: `${endpoint.name} - ${child.name}`,
                    value: `${endpoint.path}/${child.path}`,
                });
            }
        }
    }

    sidebar_preview_panel = vscode.window.createWebviewPanel(
        "docter-preview",
        `Sidebar Preview`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );
    if (!sidebar_html_template) {
        if (is_web_ext) {
            sidebar_html_template = sidebar_html_template_web;
        } else {
            sidebar_html_template = readFileSync(
                absolute_path_map["sidebar.html"],
                "utf8"
            );
        }
    }
    let sidebar_html = sidebar_html_template;
    sidebar_preview_panel.webview.html = sidebar_html;
    sidebar_preview_panel.webview.postMessage({
        value: options,
        type: "SIDEBAR_PREVIEW",
    });

    sidebar_preview_panel.webview.onDidReceiveMessage(async (data) => {
        switch (data.type) {
            case "CATEGORY_SELECTED": {
                productEndpoints = await customTraverse(
                    data.value,
                    JSON.parse(active_doc.getText())
                );
                let encodedEndoints = base64url(
                    JSON.stringify(productEndpoints)
                );
                sidebar_preview_panel.webview.postMessage({
                    value: encodedEndoints,
                    type: "RELOAD_SIDEBAR_PREVIEW",
                });
                break;
            }
        }
    });
};

// Building Menu items
const buildMenuItems = async () => {
    // Notification with progress
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Please wait while the menu items are updated",
            cancellable: false,
        },
        async () => {
            let data = await buildMenuItemsLogic();

            if (data) {
                vscode.window.showInformationMessage(
                    "Menu items have been updated!"
                );
                return;
            } else {
                vscode.window.showErrorMessage("Please try again!");
                return;
            }
        }
    );
};

// Logic to build menu items
const buildMenuItemsLogic = async () => {
    let active_window = vscode.window;
    if (!active_window) return;
    let active_editor = active_window.activeTextEditor;
    if (!active_editor) return;
    let active_doc = active_editor.document;
    if (!active_doc) return;
    let orig_uri = active_doc.uri;
    if (!orig_uri) return;

    let selectFolder = vscode.workspace.workspaceFolders[0];

    let endpoints = JSON.parse(active_doc.getText());
    let result = await traverse(endpoints);
    let utf8Encode = new TextEncoder();
    let uri = `${selectFolder.uri.scheme}://${selectFolder.uri.authority}${selectFolder.uri.path}/content/menuItems.json`;
    try {
        await vscode.workspace.fs.writeFile(
            vscode.Uri.parse(uri),
            utf8Encode.encode(JSON.stringify(result))
        );
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};

const activate = async (context) => {
    if (is_web_ext) {
        let client_uri = vscode.Uri.joinPath(
            context.extensionUri,
            "preview.html"
        );
        let sidebar_uri = vscode.Uri.joinPath(
            context.extensionUri,
            "sidebar.html"
        );
        let bytes = await vscode.workspace.fs.readFile(client_uri);
        client_html_template_web = new TextDecoder().decode(bytes);

        let sidebar_bytes = await vscode.workspace.fs.readFile(sidebar_uri);
        sidebar_html_template_web = new TextDecoder().decode(sidebar_bytes);
    }

    for (let local_path in absolute_path_map) {
        if (absolute_path_map.hasOwnProperty(local_path)) {
            if (is_web_ext) {
                absolute_path_map[local_path] = vscode.Uri.joinPath(
                    context.extensionUri,
                    local_path
                );
            } else {
                absolute_path_map[local_path] =
                    context.asAbsolutePath(local_path);
            }
        }
    }

    let previewCommand = vscode.commands.registerCommand(
        "docter-preview.commands.openPreview",
        docterMDXPreview
    );

    let sidebarPreviewCommand = vscode.commands.registerCommand(
        "docter-preview.commands.openSidebarPreview",
        docterSidebarPreview
    );

    let buildMenuCommand = vscode.commands.registerCommand(
        "docter-preview.commands.buildMenuItems",
        buildMenuItems
    );

    // The only purpose to add the entries to context.subscriptions is to guarantee their disposal during extension deactivation
    context.subscriptions.push(previewCommand);
    context.subscriptions.push(sidebarPreviewCommand);
    context.subscriptions.push(buildMenuCommand);
};

function deactivate() {
    // This method is called when extension is deactivated.
}

exports.activate = activate;
exports.deactivate = deactivate;
