var mysql = require('mysql');
var config = require(__dirname + '/../config');
var connection = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.username,
  password: config.mysql.password,
  database: config.mysql.database
});

// interface for user later, but this for now
module.exports = {
  authenticate: function(username, password, cb) {
    console.log('Authenticating.');
    
    
    
    var user = {username: 'slickage'};
    cb(null, user);
  }
}

