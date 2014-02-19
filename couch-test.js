var nano = require('nano')('http://localhost:5984');

nano.db.destroy('foo', function() {
  nano.db.create('foo', function() {
    var foo = nano.use('foo');
    foo.insert({ mundane: true }, 'bar', function(err, body, header) {
      if (err) {
        console.log('[foo.insert] ', err.message);
        return;
      }
      console.log(body);
    });
  });
});

