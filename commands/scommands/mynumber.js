module.exports.run = async ({ bot, inter, user, lang, userdb }) => {
  const value = inter.options.getInteger("number");
  await userdb.updateOne(
    { userid: inter.member.user.id },
    { $set: { tel: value } }
  );
  await inter.reply({
    content: `📱 Ваш новый номер: ${value}`,
    ephemeral: true,
  });
};
