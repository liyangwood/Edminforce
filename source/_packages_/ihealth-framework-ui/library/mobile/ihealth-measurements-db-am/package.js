
Package.describe({
  name: "ihealth:measurements-db-am",
  summary: "AM Measurements Package.",
  version: "0.1.1",
  git: "https://github.com/iHealthLab/framework-iHealth",
  documentation: "README.md"
});

Package.onUse(function(api) {
  api.versionsFrom("METEOR@1.2.0.2")

  api.use([
    "ihealth:utils",
    "ihealth:measurements-db-engine",
  ], ["client","server"])

  api.addFiles([
    "server/am.jsx",
  ],"server")

  api.addFiles([
    "lib/schema.js",
  ],["client","server"])
})
