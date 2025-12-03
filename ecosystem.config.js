module.exports = {
  apps: [
    {
      name: 'table-booking-server',
      script: './server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
