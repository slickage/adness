var moment = require('moment');
var db = require('../db');

module.exports = {
  showFacts: function(req, res) {
    // admin check
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('factoids', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log('No Factoids Found, creating new factoids object.');
        models.factoids = {};
      }

      // factoids 
      var factoids = models.factoids;

      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

      res.render('factoids', {
        factoids: factoids,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  },
  updateFacts: function(req, res) {
    // admin check
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('factoids', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log('Factoids not found, inserting new Factoids');
        models.factoids = {};
      }
      
      var facts = models.factoids;

      if (req.body.html) { facts.html = req.body.html; }
      if (req.body.css) { facts.css = req.body.css; }
      if (req.body.list) { facts.list = req.body.list; }

      db.upsertFactoid(facts, function(err) {
        if (err) {
          console.log(err);
          return res.send(500, 'Could not update factoids.');
        }
        return res.json({ok: true});
      });
    });
  }
};
