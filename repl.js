#!/usr/bin/env node
/* jshint node: true */
'use strict';

var repl = require('repl');
var db = require('./db');
var closing = require('./events/auction-close');

var local = repl.start('adness> ');
local.context.db = db;
local.context.closing = closing;
