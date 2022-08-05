module.exports.run = async ({ bot, inter, user, lang, embed }) => {
  const currency = bot.emojis.cache.get(lang[4]);

  await inter.reply({ content: `${lang[3]} ${user.balance} ${currency}`, ephemeral: true });
};
