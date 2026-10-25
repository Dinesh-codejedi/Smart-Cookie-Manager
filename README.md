# Smart Cookie Manager

Chrome Manifest V3 extension for saving a cookie-consent preference and viewing cookie size for the active site.

## Build and load

1. Run `npm install`.
2. Run `npm run build`.
3. In Chrome, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
4. Select the generated `dist` folder.

The popup uses React and a small custom stylesheet in `src/index.css`. On a page, the extension looks for a visible button matching the saved cookie preference. The on/off switch controls this behavior.
