# Favicon Generation Instructions

This folder contains a script to generate the Coffee icon SVG for use as a favicon.

## How to Use

1. Run the script to generate the SVG:
   ```
   node scripts/generate-favicon.js > coffee-icon.svg
   ```

2. Open the generated `coffee-icon.svg` file in your browser to verify it looks correct.

3. Go to [favicon.io/favicon-converter](https://favicon.io/favicon-converter/) and upload the SVG file.

4. Download the generated favicon package.

5. Extract the package and copy the following files to your `public` directory:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `favicon-192x192.png` (rename to `logo192.png`)
   - `favicon-512x512.png` (rename to `logo512.png`)

6. Your browser tab title has already been updated to "CafTrack" in the `index.html` file.

## Troubleshooting

If you encounter any issues during deployment:

1. Ensure all favicon files are properly placed in the `public` directory.
2. Check that the file paths in `index.html` and `manifest.json` are correct.
3. Clear your browser cache when testing locally.
4. For Vercel deployments, verify that the `public` directory is included in the deployment. 