/* jshint node: true */
'use strict';

var parseAdmins = function(adminsStr) {
  var admins;
  if (adminsStr) {
    admins = adminsStr.split(',');
  }
  return admins;
};

var parseBool = function(value) {
  if (!value) { return false; }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') { return true; }
    else if (value.toLowerCase() === '1') { return true; }
    else { return false; }
  }
  else if (typeof value === 'number') {
    if (Number(value) > 0) { return true; }
    else { return false; }
  }
  else { return Boolean(value); }
};

var parseNumber = function(envVar, defaultVar) {
  if (!isNaN(parseFloat(envVar)) && isFinite(envVar)) {
    return Number(envVar);
  }
  else { return defaultVar; }
};

module.exports = {
  port: Number(process.env.PORT) || 8080,
  trustProxy: process.env.TRUST_PROXY || false,
  admins: parseAdmins(process.env.ADMINS) || ['012345'],
  sbPrefix: '/sb',
  senderEmail: process.env.SENDER_EMAIL || 'admin@bitcointalk.org',
  antiSnipeMinutes: parseNumber(process.env.ANTISNIPE_MINUTES, 30),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379
  },
  sessionSecret: process.env.SESSION_SECRET || 'secret string for adness 1234!',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'smf'
  },
  couchdb: {
    proto: process.env.DB_PROTO || 'http',
    host: process.env.DB_HOST || 'localhost:5984',
    name: process.env.DB_NAME || 'adness',
    user: process.env.DB_USER || null,
    pass: process.env.DB_PASS || null
  },
  baron: {
    url: process.env.BARON_URL || 'http://baron.example.com',
    internalUrl: process.env.BARON_INTERNAL_URL || 'http://localhost:5000',
    key: process.env.BARON_API_KEY || ''
  },
  admin: {
    emails: process.env.ADMIN_EMAILS || ['admin@bitcointalk.org'],
  },
  site: {
    url: process.env.SITE_URL || 'http://example.com',
    internalUrl: process.env.SITE_INTERNAL_URL || 'http://localhost:3000'
  },
  bitcoin: {
    numberOfConfs: parseNumber(process.env.CONFS, 2)
  },
  regions: [
    {
      name: 'US',
      countries: ['US'],
      exclusive: false
    },
    {
      name: 'CN',
      countries: ['CN'],
      exclusive: false
    },
    {
      name: 'RU',
      countries: ['RU'],
      exclusive: false
    },
    {
      name: 'Global'
    },
    {
      name: 'Global Non-US',
      countries: ['US'],
      exclusive: true
    }
  ],
  rounds: {
    maxRounds: 6,
    round1: { timeOffset: 1000 * 60 * 60 * 24, discount: 0 },
    round2: { timeOffset: 1000 * 60 * 60 * 12, discount: 0.075 },
    round3: { timeOffset: 1000 * 60 * 60 * 6, discount: 0.15 },
    round4: { timeOffset: 1000 * 60 * 60 * 3, discount: 0.30 },
    round5: { timeOffset: 1000 * 60 * 60 * 1.5, discount: 0.60},
    round6: { timeOffset: 1000 * 60 * 60 * 1.5, discount: 0.80 }
  },
  fakeAuth: {
    enabled: parseBool(process.env.FAKEAUTH) || false,
    userId: parseNumber(process.env.FAKEAUTH_USERID, 1),
    email: process.env.FAKEAUTH_EMAIL || 'user@example.com',
    admin: parseBool(process.env.FAKEAUTH_ADMIN) || false
  },
  debugMode: parseBool(process.env.DEBUG_MODE) || false,
  registrationFee: parseNumber(process.env.REGISTRATION_FEE, 0.01),
  enableAPI: parseBool(process.env.ENABLE_API) || false
};
