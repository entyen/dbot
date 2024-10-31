const Redis = require("ioredis");
const redis = new Redis();
const { serverUserdb } = require("../../schema/data");

const pointsPerMinute = 1;

async function updateUserPoints(guildId, userId, points) {
  const user = await serverUserdb.findOne({ serverId: guildId, userId });
  if (!user) {
    await serverUserdb.create({
      serverId: guildId,
      userId,
      activityPoints: points,
    });
    return;
  }
  user.activityPoints += points;
  await user.save();
}

const acvititySystem = (bot) => {
  bot.on("voiceStateUpdate", async (oldState, newState) => {
    const userId = newState.id;
    const guildId = newState.guild.id;

    if (!oldState.channelId && newState.channelId) {
      await redis.hset(`voice:${guildId}:${userId}`, "joinTime", Date.now());
    }

    if (oldState.channelId && !newState.channelId) {
      const joinTime = await redis.hget(
        `voice:${guildId}:${userId}`,
        "joinTime"
      );

      if (joinTime) {
        const timeSpent = (Date.now() - joinTime) / 1000 / 60;
        const pointsEarned = Math.floor(timeSpent * pointsPerMinute);

        await updateUserPoints(guildId, userId, pointsEarned);
        console.log(
          `User ${userId} earned ${pointsEarned} points for ${timeSpent.toFixed(
            2
          )} minutes`
        );

        await redis.del(`voice:${guildId}:${userId}`);
      }
    }
  });
};

module.exports = { acvititySystem };
