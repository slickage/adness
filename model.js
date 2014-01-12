var db = require('riak-js').getClient();


module.exports = {
  getBids: function() {
    console.log('get bids');
    db.save('airlines', 'KLM', {fleet: 111, country: 'NL'}, { links:
      [{ bucket: 'flights', key: 'KLM-8098', tag: 'cargo' },
       { bucket: 'flights', key: 'KLM-1196', tag: 'passenger' }]
    }, function(err, data) {
      console.log('saved');
    });
    // db.query('select * from bids', function(err, rows) {
    //   console.log(JSON.stringify(rows));
    // });
  }
}
