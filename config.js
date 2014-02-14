module.exports = {
  port: process.env.PORT || 8080,
  redis: { host: '127.0.0.1', port: 6379 },
  elasticsearch: {
    url: 'http://127.0.0.1:9200/tng',
    pageSize: 20
  },
  secret: 'secret string for adness 1234!'
};

