module.exports = {
  apps: [
    {
      name: "urbanbus",
      script: "npm",
      args: "start",
      env: {
        // Next.js reads .env automatically; you can also hardcode or export here if desired.
        NODE_ENV: "production",
      },
      time: true,
      max_restarts: 5,
      restart_delay: 4000,
    },
  ],
};
