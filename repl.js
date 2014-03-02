#!/usr/bin/env node
var repl = require('repl');
var db = require('./db');
var payments = require('./payments');

var local = repl.start('adness> ');
local.context.db = db;
local.context.payments = payments;
