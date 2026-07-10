module.exports = {
  apps: [{
    name: 'ecole-api',
    script: 'src/index.js',
    cwd: './server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
}
