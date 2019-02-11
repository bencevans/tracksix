#!/usr/bin/env node

const tracksix = require('.')

const config = tracksix.readConfigSync(process.argv[2])

tracksix(config)
