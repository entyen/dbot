module.exports.run = async ({ bot, inter, lang, embed, args, userdb }) => {
  const value = inter.options.getMember("tag");
  const userid = value.user.id;
  const localUser = (await userdb.findOne({ userid })) || "NoUser";
  const dicordUser = bot.users.cache.get(userid);
  await inter.reply({
    content: `📱 ${localUser.tel || "No Number"}`,
    ephemeral: true,
  });

  //       embeds: [
  //         {
  //           author: {
  //             name: `${dicordUser.username}#${dicordUser.discriminator}`,
  //             icon_url: dicordUser.avatar
  //               ? `https://cdn.discordapp.com/avatars/${dicordUser.id}/${dicordUser.avatar}.webp`
  //               : "https://grk.pw/tf.gif",
  //           },
  //           description: `📱 ${localUser.tel || "No Number"}`,
  //           color: 8448109,
  //         },
  //       ],
};
