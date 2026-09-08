import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const backend = new URL(process.argv[2] || "https://missing.invalid");
if (backend.protocol !== "https:" || backend.hostname.endsWith(".invalid") || backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash) {
  throw new Error("Provide the HTTPS origin of your Render service, e.g. https://first-date-api-xxxx.onrender.com");
}
const config = {
  framework: "vite",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  rewrites: [
    { source: "/api/:path*", destination: `${backend.origin}/api/:path*` },
    { source: "/owner", destination: "/index.html" },
    { source: "/owner/", destination: "/index.html" },
    { source: "/invite/:path*", destination: "/index.html" },
  ],
};
writeFileSync(fileURLToPath(new URL("../vercel.json", import.meta.url)), JSON.stringify(config, null, 2) + "\n");
console.log("vercel.json configured for " + backend.origin);
