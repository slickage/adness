var mysql = require('mysql');
var shacrypt = require('shacrypt');
var config = require(__dirname + '/../config');

var pool = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.username,
  password: config.mysql.password,
  database: config.mysql.database
});

// interface for user later, but this for now
module.exports = {
  authenticate: function(username, password, cb) {
    var user = {username: username};
    cb(null, user);

    // pool.getConnection(function(err, connection) {
      // connected! (unless `err` is set)
      // if (err) cb(err, undefined);
      // else {
        // connection.query(
        //   'SELECT passwd FROM smf_members WHERE memberName = ? LIMIT 1',
        //   username,
        //   function(err, rows) {
        //     connection.release();
        //     if (rows.length > 0) {
        //       var hash = rows[0].passwd;
        //       if (hash == shacrypt.sha256crypt(password, hash)) { 
        //         var user = {username: username};
        //         cb(null, user);
        //       }
        //       else {
        //         cb(null, false);
        //       }
        //     }
        //     else {
        //       cb(null, false);
        //     }
        //   }
        // );
    //   }
    // });
  }
};

