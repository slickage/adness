var restify = require('restify');

var server = restify.createServer({
  name: 'adness',
  version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/echo/:name', function (req, res, next) {
  res.send(req.params);
  return next();
});

server.get('/auctions', function (req, res, next) {
  res.send(req.params);
  return next();
});

server.get('/auctions/:auction_id', function (req, res, next) {
  res.send(req.params);
  return next();
});

server.get('/bids', function (req, res, next) {
  // check auction_id
  res.send(req.params);
  return next();
});

// new bid
// new auction
// start/end auction
// request payment auction winner after auction ends

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});