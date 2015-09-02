
Package.describe({
  name: "ihealth:framework-mobile",
  summary: "Mobile Framework for iHealth.",
  version: "0.3.1",
  git: "https://github.com/iHealthLab/framework-iHealth"
})

Package.onUse(function(api) {
  api.versionsFrom("METEOR@1.1.0.2")

  /**
   * @ @ @ @
   * Use & Imply
   * @ @ @ @
   */
  api.use([
    "react",
    "ihealth:framework-engine",
  ], ["client","server"])

  api.imply([
    "react",
    "ihealth:utils",
    "fastclick"
  ], ["client","server"])

  /**
   * @ @ @ @
   * Add Files
   * @ @ @ @
   */
  api.addFiles([
    "startup.js",
  ], ["client","server"])

  api.addFiles([
    "Mobile/swipe/swipe.jsx",
    "Mobile/leftNav/leftNav.jsx",
  ], "client")

  api.addFiles([
    "Mobile/_mobile.scss",
    "Mobile/leftNav/_leftNav.scss",
  ], "server")

  api.addFiles("_import.scss", "server")

  /**
   * @ @ @ @
   * Export
   * @ @ @ @
   */
  api.export("RC", "client")
})
