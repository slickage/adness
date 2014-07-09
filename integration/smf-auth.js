/* jshint node: true */
'use strict';

var mysql = require('mysql');
var shacrypt = require('shacrypt');
var _ = require('lodash');
var config = require(__dirname + '/../config');

var pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.username,
  password: config.mysql.password,
  database: config.mysql.database
});

// interface for user later, but this for now
module.exports = {
  authenticate: function(login, password, cb) {
    // get connection to SMF DB
    pool.getConnection(function(err, connection) {
      if (err) { cb(err, undefined); }
      else {
        var username = '';

        // check if username is email
        if (login.indexOf("@") > 0) {
          getUsernameFromEmail(connection, login, function(err, results) {
            if (results) { username = results; }
            else { username = login; }
            callPassOkAll(connection, username, password, cb);
          });
        }
        else {
          username = login;
          callPassOkAll(connection, username, password, cb);
        }
      }
    });
  }
};

function getUsernameFromEmail(connection, email, cb) {
  connection.query(
    "SELECT memberName from smf_members where emailAddress = ? limit 1",
    [email],
    function(err, rows) {
      if (err) { return cb(err, undefined); }
      else {
        // check that email returned a username
        if (rows && rows[0] && rows[0].memberName) {
          var username = rows[0].memberName;
          return cb(null, username);
        }
        else {
          var error = new Error('Email not found.');
          return cb(error, undefined);
        }
      }
    }
  );
}


function callPassOkAll(connection, username, password, cb) {
  // lolwtf -- nasty if statement for stored procedure output
  // 15:59:28 web.1  | [ [ { ID_MEMBER: 241865 } ],
  // 15:59:28 web.1  |   { fieldCount: 0,
  // 15:59:28 web.1  |     affectedRows: 0,
  // 15:59:28 web.1  |     insertId: 0,
  // 15:59:28 web.1  |     serverStatus: 2,
  // 15:59:28 web.1  |     warningCount: 0,
  // 15:59:28 web.1  |     message: '',
  // 15:59:28 web.1  |     protocol41: true,
  // 15:59:28 web.1  |     changedRows: 0 } ]
  connection.query(
    'CALL pass_ok_all(?, ?)',
    [username, password],
    function(err, rows) {
      connection.release();
      if (rows && rows.length === 2 && rows[0] && rows[0].length === 1) {
        // rows[0][0] is the first row from mysql query
        var userRow = rows[0][0];
        var idMember = userRow.ID_MEMBER;
        var isAdmin = _.contains(config.admins, idMember.toString());
        var user = {
          username: username,
          userId: userRow.ID_MEMBER,
          email: userRow.emailAddress,
          admin: isAdmin
        };
        return cb(null, user);
      }
      else {
        return cb(null, false);
      }
    }
  );
}
