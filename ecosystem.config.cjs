// PM2 process manifest for production (Ubuntu VPS).
// See DEPLOY.md for context.
module.exports = {
  apps: [
    {
      name: "dentacore",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 9000",
      instances: 2,                // keep small — shared VPS with other PM2 apps
      exec_mode: "cluster",        // rolling zero-downtime reload
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 9000,
      },
      error_file: "/var/log/dentacore/err.log",
      out_file:   "/var/log/dentacore/out.log",
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
};
