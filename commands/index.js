module.exports = async function (rest, SlashCommandBuilder, Routes, bot, lang) {
  const commands = [
    new SlashCommandBuilder().setName("balance").setDescription(lang[5]),
    new SlashCommandBuilder()
      .setName("number")
      .setDescription("Search user number by @tag!")
      .addUserOption((option) => option.setName("tag").setDescription('Write usertag here').setRequired(true)),
    new SlashCommandBuilder()
      .setName("mynumber")
      .setDescription(lang[7])
      .addIntegerOption((option) => option.setName("number").setDescription('Write Number').setRequired(true)),
  ];

  try {
    // console.log("Started refreshing application (/) commands.");

    bot.guilds.cache.forEach(async (i) => {
      const CLIENT_ID = bot.user.id;
      const GUILD_ID = i.id;

      // await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      //   body: commands,
      // });
    });

    // console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
};
