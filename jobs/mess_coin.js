module.exports = async function (message, bot, lang, collection, userdb) {
  const currency = bot.emojis.cache.get(lang[4]);
  user = await userdb.findOne({ userid: message.member.user.id });

  const randCurr = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
  };

  const randRand = () => {
    if (message.member.roles.cache.has("854246873018910408")) {
      t = 50;
    } else {
      t = 0;
    }
    const rNum = randCurr(0, 1000);
    if (rNum <= 300 - t) {
      return 1; // 30%
    } else if (rNum >= 300 - t && rNum <= 400 - t) {
      return 2; // 10%
    } else if (rNum >= 400 - t && rNum <= 600 - t) {
      return 3; // 20%
    } else if (rNum >= 600 - t && rNum <= 800 - t) {
      return 4; // 20%
    } else if (rNum >= 800 - t && rNum <= 980 - t) {
      return 5; // 18%
    } else if (rNum >= 980 - t / 2 && rNum <= 1000) {
      return 50; // 2%
    }
  };

  const cooldowns = new Map();

  if (!cooldowns.has(message.channel.type)) {
    cooldowns.set(message.channel.type, collection);
  }

  const current_time = Date.now();
  const time_stamp = cooldowns.get(message.channel.type);
  const cooldown_stamp = 60 * 1000;

  if (time_stamp.has(message.author.id)) {
    const expiration_time = time_stamp.get(message.author.id) + cooldown_stamp;

    if (current_time < expiration_time) {
      const time_left = (expiration_time - current_time) / 1000;

      bot.channels.cache
        .get("878075420342374402")
        .send(`Wait ${time_left.toFixed(1)} user: ${message.author.username}`);
    }
    return;
  }

  time_stamp.set(message.member.user.id, current_time);
  setTimeout(() => time_stamp.delete(message.member.user.id), cooldown_stamp);

  const currAdd = user.balance + randRand();
  bot.channels.cache
    .get("878075420342374402")
    .send(
      `Get ${
        currAdd - user.balance
      } ${currency} curr balance ${currAdd} ${currency} user: ${
        message.author.username
      }`
    );
  user.balance = currAdd;
  await user.save();
};
