#!/usr/bin/env bash

export SOURCE=$PWD/../source
export IHEALTH_ROOT=$SOURCE/_packages_/ihealth-framework-ui/library
export MOBILE_BASE_PACKAGES=$SOURCE/mobile-base/src/packages
export PACKAGE_DIRS=$MOBILE_BASE_PACKAGES:$IHEALTH_ROOT/both:$IHEALTH_ROOT/mobile:$IHEALTH_ROOT/webapp:$PWD/../_packages_/module
PORT=4000
export MONGO_URL=mongodb://localhost:27017/EdminForce

#=====================
#transfer data
cd transfer
#Step 1: install node packages
npm install
#Step 2: start transfer process
node index.js

#=====================
#Update MongoDB
cd ../update
meteor run --port $PORT