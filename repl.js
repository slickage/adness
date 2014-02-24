var repl = require('repl');

var db = require('./db');

var local = repl.start('adness> ');
local.context.db = db;
