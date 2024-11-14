module.exports = {
  apps: [
    {
      name: "@dbot/bot",
      script: "pnpm",
      args: "start",
      cwd: "./packages/bot",
    }
  ],
};
