
Package.describe({
  name: "ihealth:users",
  summary: "Meteor users extended for iHealth.",
  version: "0.1.2",
  git: "https://github.com/iHealthLab/framework-iHealth"
})

Package.onUse(function(api) {
  api.versionsFrom("METEOR@1.2.0.2")

  /**
   * @ @ @ @
   * Server/Client
   * Use & Imply
   * @ @ @ @
   */
  api.use([
    "jag:pince",
    "aldeed:simple-schema@1.3.3",
    "aldeed:collection2@2.3.3",
    "matb33:collection-hooks@0.7.13",

    "accounts-password",

    // Required
    "ihealth:utils",
    "ihealth:framework-engine",
  ], ["client","server"])

  api.use('livedata', [ 'server' ])

  api.imply([
    "ihealth:utils",
    "accounts-password",
    "alanning:roles@1.2.14"
  ], ["client","server"])

  /**
   * @ @ @ @
   * Client - Use & Imply
   * @ @ @ @
   */
  api.use([
    "react"
  ], "client")

  /**
   * @ @ @ @
   * Client - Add Files
   * @ @ @ @
   */
  api.addFiles([
    "lib/ph.js",
    "RC/login.jsx",
    "RC/login.css"
  ], "client")

  api.addFiles([
    "lib/schemas.js",
    // "lib/reviews.js",
  ], ["client", "server"])

  api.addFiles([
    "lib/server/createUser.js",
    "lib/server/publications.js"
  ], "server")
})
