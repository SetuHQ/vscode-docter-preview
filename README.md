# Docter Preview

VS Code extension to preview documentation using Setu's Docter

This extension is built for [Setu docs repo](https://github.com/SetuHQ/docs) which contains content and API references of Setu documentation.

## Features

All the features mentioned below will work for the Setu docs repo.

### MDX preview

![mdx-preview](https://user-images.githubusercontent.com/9695866/202152076-13c2a93a-7612-4e24-9644-6ec54825d8a5.png)

-   Open any `.mdx` file in VS code, you should this icon to the top right. Click on it to preview the rendered version of MDX file.
-   Make edits to the file, save it and click again to open the updated version. (You can close the previous tab for better visibility)


### Sidebar preview

![sidebar-preview](https://user-images.githubusercontent.com/9695866/202152084-241e2a78-4ed4-4587-bc1c-101c0f6e7701.png)

-   Open `endpoints.json` file and you should this icon to the top right. Click on it to preview how the sidebar would look like for a product.
-   This loads a webview with a dropdown with all the available products, choose to view the sidebar

### Menu Items

![menu-items](https://user-images.githubusercontent.com/9695866/202152080-1af24b5c-cb22-49ab-bf20-cb37d3a959e3.png)

> Very important step

-   If you've added any new content files, once you're done with all the editing of content, before you commit, you should run the `Build Menu Items` step.
-   Open `endpoints.json` file and you should this icon to the top right. Click on it to build all the menu items needed for the sidebar.
-   Once this step is done, you can now commit to your branch and raise a PR.
