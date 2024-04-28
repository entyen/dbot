module.exports = async function (message, bot, lang, collection, userdb) {
  const currency = bot.emojis.cache.get(lang[4]);
  user = await userdb.findOne({ userid: message.member.user.id });

  const randCurr = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
  };

  const chance = (chance) => {
    return randCurr(0, 10000) <= chance * 100
  }

  const randRand = (chances = [30, 10, 20, 20, 18, 2], mults = [1, 2, 3, 4, 5, 50]) => {
    if (chances.length !== mults.length) return 0

    if (message.member.roles.cache.has("1001954579300229291")) { // TODO
      luck = 2;
    } else {
      luck = 1;
    }

    const rnd = randCurr(0, 10000);

    const chancesInc = chances.map(x => x * 100);

    const chancesLuck = chancesInc.map(x => x * luck);

    const distrib = chancesLuck.map(x => x / rnd);

    const distribBinary = distrib.map(x => Math.round(x) > 0 ? 1 : 0);

    const resMapping = {};
    for (let i = 0; i < distribBinary.length; i++) {
      const choice = distribBinary[i];
      resMapping[chances[i]] = choice * mults[i];
    }

    const cInd = Object.values(resMapping).reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);

    return Object.values(resMapping)[cInd];
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
      `Get ${currAdd - user.balance
      } ${currency} curr balance ${currAdd} ${currency} user: ${message.author.username
      }`
    );
  user.balance = currAdd;
  await user.save();
};
