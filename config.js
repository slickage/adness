var parseAdmins = function(adminsStr) {
  var admins;
  if (adminsStr) {
    admins = adminsStr.split(',');
  }
  return admins;
};

module.exports = {
  port: process.env.PORT || 8080,
  admins: parseAdmins(process.env.ADMINS) || ['012345'],
  sbPrefix: '/sb',
  senderEmail: process.env.SENDER_EMAIL || 'admin@bitcointalk.org',
  antiSnipeMinutes: process.env.ANTISNIPE_MINUTES || 30,
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
    url: process.env.DB_URL || 'http://localhost:5984',
    name: process.env.DB_NAME || 'adness'
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
    numberOfConfs: process.env.CONFS || 2
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
  ads: {
    reservedSlots: process.env.RESERVED_SLOTS || 2
  }
};
