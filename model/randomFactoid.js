var db = require(__dirname + '/../db');
var _ = require('lodash');

module.exports = function(req, cb) {
  db.getFactoids(function(err, facts) {
    if (err) {
      console.log('There were no Factoids found. Returning error Factoid.');
      var emptyFact = {};
      emptyFact.css = '';
      emptyFact.html = '<div style="text-align:center">There are no Factoids.</div>';
      return cb(null, emptyFact);
    }
    
    if (facts) {
      // pick a fact at random
      var randomFact = _.sample(facts.list);

      // edit html with fact
      facts.html = facts.html.replace('&lt;%- text %&gt;', randomFact.text);

      // return random fact
      delete facts.list;
      return cb(null, facts);
    }
  });
};