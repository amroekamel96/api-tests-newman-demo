// Runs the Newman suite.
//
//   node scripts/run.js            main suite against the bundled local mock API
//   node scripts/run.js --data     data-driven run against the local mock
//   node scripts/run.js --live     main suite against the real JSONPlaceholder
//   node scripts/run.js --live --data
const { spawn } = require("child_process");
const path = require("path");
const { start } = require("../mock/server");

const root = path.join(__dirname, "..");
const args = process.argv.slice(2);
const live = args.includes("--live");
const dataDriven = args.includes("--data");
const port = Number(process.env.MOCK_PORT) || 3456;

const modeName = live ? "live" : "local";
const reportName = `newman-${dataDriven ? "data-driven-" : ""}${modeName}-report.html`;

const newmanArgs = [
  "run",
  "collections/jsonplaceholder-api-tests.postman_collection.json",
  "-e",
  "environments/jsonplaceholder.postman_environment.json",
  "-r",
  "cli,htmlextra",
  "--reporter-htmlextra-export",
  `reports/${reportName}`,
  "--reporter-htmlextra-title",
  `JSONPlaceholder API Tests (${modeName}${dataDriven ? ", data-driven" : ""})`,
];

if (dataDriven) {
  newmanArgs.push("--folder", "Data-driven POST", "-d", "data/posts.csv");
} else {
  for (const folder of ["Posts - Read", "Users", "Posts - Write", "Negative cases"]) {
    newmanArgs.push("--folder", folder);
  }
}

// Newman must run as an asynchronous child process: the mock server lives in this
// process, and a synchronous spawn would block it from answering requests.
function runNewman() {
  const bin = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "newman.cmd" : "newman");
  return new Promise((resolve) => {
    const child = spawn(bin, newmanArgs, { cwd: root, stdio: "inherit" });
    child.on("error", (err) => {
      console.error(err);
      resolve(1);
    });
    child.on("close", (code) => resolve(code === null ? 1 : code));
  });
}

(async () => {
  let server;
  if (!live) {
    server = await start(port);
    newmanArgs.push("--env-var", `baseUrl=http://127.0.0.1:${port}`);
    console.log(`Running against the local mock API on port ${port}\n`);
  } else {
    console.log("Running against the live JSONPlaceholder API\n");
  }

  const code = await runNewman();

  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
  process.exit(code);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
