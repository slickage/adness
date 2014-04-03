var parseAdmins = function(adminsStr) {
  var admins = undefined;
  if (adminsStr) {
    admins = adminsStr.split(',');
  }
  return admins;
};

module.exports = {
  port: process.env.PORT || 8080,
  admins: parseAdmins(process.env.ADMINS) || ['admin'],
  sbPrefix: '/sb',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  secret: 'secret string for adness 1234!',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'smf'
  },
  couchdb: {
    url: 'http://localhost:5984'
  },
  bitcoind:  {
    host: process.env.BITCOIND_HOST || 'localhost',
    port: Number(process.env.BITCOIND_PORT) || 18332,
    user: process.env.BITCOIND_USER || 'bitcoinrpc',
    pass: process.env.BITCOIND_PASS || 'asdf1234'
  },
  basicpay: {
    url: 'http://localhost:3000'
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'ed@slickage.com'
  },
  site: {
    url: process.env.SITE_URL || 'http://localhost:8080'
  }
};
