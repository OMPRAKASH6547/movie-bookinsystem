module.exports = {
  apps: [
    {
      name: "cinepass",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
    },
  ],
};
