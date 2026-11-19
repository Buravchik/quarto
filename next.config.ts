import type { NextConfig } from "next";

/** GitHub Pages project site: https://buravchik.github.io/quarto/ */
const pagesBase = process.env.PAGES_BASE_PATH ?? "/quarto";

const nextConfig: NextConfig = {
  output: "export",
  basePath: pagesBase,
  assetPrefix: pagesBase,
  images: { unoptimized: true },
};

export default nextConfig;
