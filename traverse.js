const vscode = require("vscode");
const matter = require("gray-matter");

// Recursively build sidebar items for documentation
async function endpointHelper(data, mainUri) {
    let children = [];
    for (let item of data) {
        let name = item[0];
        let type = item[1];

        name = name.split(".")[0];

        // type 2 is directory; type 1 is file
        if (type === 2) {
            let markdownwithMeta;
            try {
                let fileUri = vscode.Uri.parse(`${mainUri}/${name}.mdx`);
                let fileContent = await vscode.workspace.fs.readFile(fileUri);
                let byteArray = Array.from(new Uint8Array(fileContent));

                // Replace emdash with `-`; emdash is an extended ASCII character and needs to replaced
                for (let i in byteArray) {
                    if (byteArray[i] === 226) {
                        byteArray[i] = 45;
                    }
                }
                // Filter for 128 characters for Uint8 array of bytes
                byteArray = byteArray.filter((byte) => byte <= 127);
                const bytesString = String.fromCharCode(...byteArray);
                markdownwithMeta = bytesString;
            } catch (e) {
                vscode.window.showErrorMessage(
                    "Endpoints couldn't be found in directory"
                );
                markdownwithMeta = "";
            }
            try {
                const { data: frontMatter, content } = matter(markdownwithMeta);
                let childrenUri = vscode.Uri.parse(`${mainUri}/${name}`);
                let childrenRes = await vscode.workspace.fs.readDirectory(
                    childrenUri
                );
                children.push({
                    name: frontMatter.sidebar_title,
                    visible_in_sidebar: frontMatter.visible_in_sidebar,
                    page_title: frontMatter.page_title,
                    path: name,
                    order: frontMatter.order,
                    children: await endpointHelper(
                        childrenRes,
                        `${mainUri}/${name}`
                    ),
                });
            } catch (e) {
                vscode.window.showErrorMessage(
                    "Endpoints couldn't be found in directory second try" +
                        `${mainUri}/${name}`
                );
            }
        } else {
            if (!children.some((el) => el.path === name)) {
                let markdownwithMeta;
                try {
                    let fileUri = vscode.Uri.parse(mainUri + `/${name}.mdx`);
                    let fileContent = await vscode.workspace.fs.readFile(
                        fileUri
                    );
                    let byteArray = Array.from(new Uint8Array(fileContent));

                    // Replace emdash with `-`; emdash is an extended ASCII character and needs to replaced
                    for (let i in byteArray) {
                        if (byteArray[i] === 226) {
                            byteArray[i] = 45;
                        }
                    }

                    // Filter for 128 characters for Uint8 array of bytes
                    byteArray = byteArray.filter((byte) => byte <= 127);
                    const bytesString = String.fromCharCode(...byteArray);
                    markdownwithMeta = bytesString;
                } catch (e) {
                    vscode.window.showErrorMessage(
                        `Endpoints couldn't be found in file ${mainUri}/${name}.mdx`
                    );
                    markdownwithMeta = "";
                }

                const { data: frontMatter, content } = matter(markdownwithMeta);
                children.push({
                    name: frontMatter.sidebar_title,
                    visible_in_sidebar: frontMatter.visible_in_sidebar,
                    page_title: frontMatter.page_title,
                    path: name,
                    order: frontMatter.order,
                });
            }
        }
    }
    return children;
}

// Traverse through endpoints to build the sidebar JSON
export async function traverse(isVirtualWorkspace) {
    let selectFolder = vscode.workspace.workspaceFolders[0];

    let endpoints = await getEndpoints(isVirtualWorkspace);

    for (let endpoint of endpoints["home"]) {
        for (let child of endpoint.children) {
            // Change uri if virtual workspace
            let uri = "";
            if (!isVirtualWorkspace) {
                uri = `${selectFolder.uri.scheme}:/${selectFolder.uri.path}/${endpoint.path}/${child.path}`;
            } else {
                uri = `${selectFolder.uri.scheme}://github${selectFolder.uri.path}/${endpoint.path}/${child.path}`;
            }

            let res = await vscode.workspace.fs.readDirectory(
                vscode.Uri.parse(uri)
            );
            child["children"] = await endpointHelper(res, uri);
        }
    }
    return endpoints;
}

// Build individual sidebar for preview
export async function customTraverse(path, isVirtualWorkspace) {
    let selectFolder = vscode.workspace.workspaceFolders[0];
    let endpoints = await getEndpoints(isVirtualWorkspace);

    let bundledEndpoints = { home: [] };
    let [categoryPath, productPath] = path.split("/");

    let category = endpoints["home"].filter(
        (endpoint) => endpoint.path === categoryPath
    );
    category = category[0];
    let children = category.children.filter(
        (child) => child.path === productPath
    );

    // Change uri if virtual workspace
    let uri = "";
    if (!isVirtualWorkspace) {
        uri = `${selectFolder.uri.scheme}:/${selectFolder.uri.path}/${categoryPath}/${productPath}`;
    } else {
        uri = `${selectFolder.uri.scheme}://github${selectFolder.uri.path}/${categoryPath}/${productPath}`;
    }
    let res = await vscode.workspace.fs.readDirectory(vscode.Uri.parse(uri));
    children[0]["children"] = await endpointHelper(res, uri);
    category["children"] = children;

    bundledEndpoints["home"].push(category);

    return bundledEndpoints;
}

// Fetch endpoints from endpoints.json file in the repo
export async function getEndpoints(isVirtualWorkspace) {
    let selectFolder = vscode.workspace.workspaceFolders[0];
    let endpointsUri = "";

    // Change uri if virtual workspace
    if (!isVirtualWorkspace) {
        endpointsUri = vscode.Uri.parse(
            `${selectFolder.uri.scheme}:/${selectFolder.uri.path}/endpoints.json`
        );
    } else {
        endpointsUri = vscode.Uri.parse(
            `${selectFolder.uri.scheme}://github${selectFolder.uri.path}/endpoints.json`
        );
    }
    let endpoints = await vscode.workspace.fs.readFile(endpointsUri);
    let byteArray = Array.from(new Uint8Array(endpoints));
    const bytesString = String.fromCharCode(...byteArray);
    let endpointsData = JSON.parse(bytesString);

    return endpointsData;
}
