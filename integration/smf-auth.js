var mysql = require('mysql');
var shacrypt = require('shacrypt');
var _ = require('underscore');
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
  authenticate: function(username, password, cb) {
    var user = {username: username};
    pool.getConnection(function(err, connection) {
      if (err) cb(err, undefined);
      else {
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
              var isAdmin = _.contains(config.admins, username);
              var userRow = rows[0];
              var user = {
                username: username,
                userId: userRow['ID_MEMBER'],
                email: userRow['emailAddress'],
                admin: isAdmin
              };
              cb(null, user);
            }
            else {
              cb(null, false);
            }
          }
        );
      }
    });
  }
};

