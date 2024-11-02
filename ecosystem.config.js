module.exports = {
  apps: [
    {
      name: "@dbot/bot",
      script: "pnpm",
      args: "start:dev",
      cwd: "./packages/bot",
    },
  ],
};
