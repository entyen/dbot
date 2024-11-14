module.exports = {
  apps: [
    {
      name: "@dbot/bot",
      script: "pnpm",
      args: "start",
      cwd: "./packages/bot",
    },
    {
      name: "@dbot/frontend",
      script: "pnpm",
      args: "start",
      cwd: "./packages/frontend",
    },
  ],
};
