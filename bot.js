const Promise = require("bluebird");
const {
  Collection,
  Client,
  REST,
  Routes,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ActivityType,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
  ComponentType,
  PresenceUpdateStatus,
  UserSelectMenuBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const mongoose = require("mongoose");
const steam = require("steam-web");
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// express link web3 and discord bot account
app.post("/webhook", async (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const CronJob = require("cron").CronJob;

const http = require("https");
const fs = require("fs");
const config = require("./config.json");
const lang = JSON.parse(fs.readFileSync("en.json", "utf-8"));
const {
  parseTlServerStatus,
  parseTlServerInfo,
} = require("./module/throneandliberty/TlServerStatus.js");

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
});

const collection = new Collection();
bot.login(config.TOKEN);
const rest = new REST({ version: "10" }).setToken(config.TOKEN);
const st = new steam({
  apiKey: config.STEAM_TOKEN,
  format: "json", //optional ['json', 'xml', 'vdf']
});

//PLAYER DISCORD
const { Player } = require("discord-player");
const player = new Player(bot, {
  enableLive: false,
  ytdlDownloadOptions: {
    filter: "audioonly",
  },
});
const playdl = require("play-dl");
bot.player = player;
//PLAYER

const {
  userSchem,
  iconRoleSchem,
  nftUpdateSchem,
  serverdb,
  serverUserdb,
} = require("./schema/data.js");
const Web3 = require("web3");
const nftdb = mongoose.model("nftBase", nftUpdateSchem);
const nftUpdate = async (
  address,
  colName,
  fullName,
  iconURL,
  chanelId,
  color,
  URI
) => {
  const ether_port =
    "wss://polygon-mainnet.g.alchemy.com/v2/4Aw02n_3OEU1MpVrp6m1TqyYA86CR9ob";
  const web3 = new Web3(ether_port);
  const nft = await nftdb.findOne({ smartContract: address });
  if (!nft) {
    const newNft = new nftdb({
      smartContract: address,
      blockId: 0,
    });
    await newNft.save();
  } else {
    const fromBlock = nft.blockId;
    return new Promise((resolve) => {
      web3.eth
        .subscribe(
          "logs",
          {
            fromBlock,
            address,
            topics: [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x0000000000000000000000000000000000000000000000000000000000000000",
              null,
            ],
          },
          (err, res) => {
            if (!err) {
              return;
            }
          }
        )
        .on("data", async (res) => {
          const mintId = web3.utils.hexToNumber(res.topics[3]);
          const minterId = res.topics[2].slice(26);
          const blockInfo = await web3.eth.getBlock(res.blockNumber);
          const channel = bot.channels.cache.get(chanelId);
          const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${fullName} #${mintId}`)
            .setURL(`https://opensea.io/assets/matic/${res.address}/${mintId}`)
            .setDescription(
              `**${colName} #${mintId} has Minted**\nCollection: ${fullName}\n\nMinter: [${minterId.slice(
                0,
                6
              )}***${minterId.slice(
                -4
              )}](https://polygonscan.com/address/${minterId})`
            )
            .setImage(`https://ipfs.io/ipfs/${URI}/${mintId}.png`)
            .setTimestamp(blockInfo.timestamp * 1000)
            .setFooter({
              text: "Minted",
              iconURL,
            });
          await channel.send({ embeds: [embed] });
          nft.blockId = res.blockNumber + 1;
          await nft.save();
        })
        .on("error", (err) => {
          console.log(err);
        })
        .on("changed", (res) => {
          console.log(res);
        })
        .on("connected", (res) => {
          console.log("Connected: " + res);
        });
    });
  }
};

const mintCheck = async () => {
  await nftUpdate(
    "0x10c4555A15527806Eb54b243f115e31F7aADa466",
    "Fox",
    "Thief Fox",
    "https://thief-fox.grk.pw/logo192.png",
    "987136039804076104",
    0xea623d,
    "Qmds5L5Sg1QLFiC3beb6sMKCH8cVR14hLeSEjsk5atgf1a"
  );

  await nftUpdate(
    "0x18c5d5e778FCD9db00B4433697BD1FD01F3C91F7",
    "Dino",
    "Dino Planet-7518P",
    "https://dino.grk.pw/logo192.png",
    "941598098503909397",
    0x004a74,
    "QmXj2SHg1AZ2Fg2DC8ifyVTLSZkGwuArrqUFgYg3q1VZX8"
  );
};

// mintCheck()

const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const TimeOut = (time) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });

const messCoin = require("./jobs/mess_coin.js");
const userdb = mongoose.model("users", userSchem);
const roledb = mongoose.model("roles", iconRoleSchem);

//MINECRAFT Modules
// const { promisify } = require('util');
// const exec = promisify(require('child_process').exec)
const { Rcon } = require("rcon-client");
const rcon = new Rcon({
  host: "localhost",
  port: 25575,
  password: config.RCON_PASS,
});

const getGO = (gameid) =>
  new Promise((resolve) => {
    st.getNumberOfCurrentPlayers({
      appid: gameid,
      callback: (err, data) => {
        resolve(!data ? data : data.response.player_count);
      },
    });
  });

const job = new CronJob("*/5 * * * *", null, false, "Europe/Moscow");

bot.on("ready", (_) => {
  console.log(`Logged in as ${bot.user.tag}!`);
  bot.user.setPresence({
    activities: [{ name: "activity" }],
    status: PresenceUpdateStatus.Idle,
  });
  //MINECRAFT RCON Connection
  rcon.on("connect", () => console.log("Minecraft RCON: connected"));
  rcon.on("authenticated", () => console.log("Minecraft RCON: authenticated"));
  rcon.on("end", async () => console.log("Minecraft RCON: end"));
  setTimeout(async () => {
    await rcon
      .connect()
      .catch((err) => console.log(`MINECRAFT RCON: ${err.code}`));
  }, 1000);
  //MINECRAFT RCON Connection

  // setInterval(async (_) => {
  //   let ubot = await userdb.findOne({ userid: bot.user.id })
  //   bot.user.setActivity(`${ubot.balance} Aden`, {
  //     type: ActivityType.Playing,
  //   })
  // }, 30000)

  // slash commands register
  const commands = [
    new SlashCommandBuilder().setName("balance").setDescription(lang[5]),
    new SlashCommandBuilder()
      .setName("farm")
      .setDescription(lang[9])
      .addUserOption((option) =>
        option.setName("user").setDescription("User").setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("bumpkin")
      .setDescription(lang[10])
      .addUserOption((option) =>
        option.setName("user").setDescription("User").setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("pay")
      .setDescription("Pay to user")
      .addUserOption((option) =>
        option.setName("user").setDescription("User to pay").setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount to pay")
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("calc")
      .setDescription("Calc cripto cource")
      .addNumberOption((option) =>
        option
          .setName("value")
          .setDescription("Value to calculate")
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("fine")
      .setNameLocalizations({
        ru: "штраф",
      })
      .setDescription("Add fine to user")
      .setDescriptionLocalizations({ ru: "Добавить штраф пользователю" })
      .addUserOption((option) =>
        option
          .setName("user")
          .setNameLocalizations({ ru: "пользователь" })
          .setDescription("Select user")
          .setRequired(true)
      )
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setNameLocalizations({ ru: "сумма" })
          .setDescription("Amount to fine")
          .setDescriptionLocalizations({ ru: "Сумма штрафа" })
          .setRequired(true)
          .setMaxValue(10000)
          .setChoices({
            name: "1000",
            value: 1000,
          })
      ),
    new SlashCommandBuilder()
      .setName("checkfine")
      .setNameLocalizations({ ru: "проверитьштраф" })
      .setDescription("Check user fine")
      .setDescriptionLocalizations({ ru: "Проверить штраф пользователя" })
      .addUserOption((option) =>
        option
          .setName("user")
          .setNameLocalizations({ ru: "пользователь" })
          .setDescription("User")
          .setRequired(true)
      ),
    new ContextMenuCommandBuilder()
      .setName("User Information")
      .setNameLocalizations({ ru: "Информация о пользователе" })
      .setType(ApplicationCommandType.User),
    // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new ContextMenuCommandBuilder()
      .setName("User Balance")
      .setNameLocalizations({ ru: "Баланс пользователя" })
      .setType(ApplicationCommandType.User),
    new ContextMenuCommandBuilder()
      .setName("Donate Aden")
      .setNameLocalizations({ ru: "Задонить Адены" })
      .setType(ApplicationCommandType.User),
    new SlashCommandBuilder()
      .setName("popusk")
      .setNameLocalizations({ ru: "попуск" })
      .setDescription("Set user popusk")
      .setDescriptionLocalizations({ ru: "Установить попуск пользователя" })
      .addStringOption((option) =>
        option
          .setName("name")
          .setNameLocalizations({ ru: "имя" })
          .setDescription("Popusk name")
          .setDescriptionLocalizations({ ru: "Имя попуска" })
          .setRequired(true)
      ),
    new SlashCommandBuilder().setName("walletset").setDescription(lang[8]),
    new ContextMenuCommandBuilder()
      .setName("Activity Point Balance")
      .setNameLocalizations({ ru: "Баланс очков активности" })
      .setType(ApplicationCommandType.User),
  ];

  bot.on("interactionCreate", async (interaction) => {
    if (!interaction || !interaction.isUserContextMenuCommand()) return;
    const iUser = (await userdb.findOne({ userid: interaction.targetId })) || {
      balance: 0,
      fine: 0,
    };
    const uUser = (await userdb.findOne({ userid: interaction.user.id })) || {
      balance: 0,
      fine: 0,
    };

    const currency = bot.emojis.cache.get(lang[4]);
    if (interaction.commandName === "User Information") {
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("User Information")
        .setDescription(
          `User: <@${iUser}>\n\n **Balance**: ${iUser.balance} ${currency}\n **Fine**: ${iUser.fine} ${currency}`
        );
      await interaction.reply({ embeds: [embed] });
    } else if (interaction.commandName === "User Balance") {
      await interaction.reply({
        content: `${iUser.balance} Aden`,
        ephemeral: true,
      });
    } else if (interaction.commandName === "Activity Point Balance") {
      const serverInfo = await serverdb.findOne({ serverId: interaction?.guildId })
      if (!serverInfo) return interaction.reply('Server not supported')
      const pointsEmoji = bot.emojis.cache.get(serverInfo.serverCurrencyEmoji);
      let serverUserInfo = await serverUserdb.findOne({
        serverId: interaction?.guildId,
        userId: interaction.targetId,
      });
      if (!serverUserInfo) {
        serverUserInfo = await serverUserdb.create({
          serverId: interaction?.guildId,
          userId: interaction.targetId,
        });
      }
      await interaction.reply({
        content: `Баланс: ${serverUserInfo?.dkpPoints || 0} ${pointsEmoji}`,
        ephemeral: true,
      });
    } else if (interaction.commandName === "Donate Aden") {
      const modal = new ModalBuilder()
        .setCustomId(`adenaDonate:${iUser.userid}`)
        .setTitle("Adena Donation");

      const adenaDonateInput = new TextInputBuilder()
        .setCustomId("adenaDonateInput")
        .setLabel("How many adena you want to Donate?")
        .setMaxLength(3)
        .setMinLength(1)
        .setValue("3")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const secondActionRow = new ActionRowBuilder().addComponents(
        adenaDonateInput
      );

      modal.addComponents(secondActionRow);
      await interaction.showModal(modal);
    }
  });

  bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    const [modalId, userId] = interaction.customId.split(":");

    if (modalId === "adenaDonate" && userId) {
      const targetUser = await userdb.findOne({
        userid: userId,
      });
      const selfUser = await userdb.findOne({
        userid: interaction.user.id,
      });

      const adenaDonateInput =
        interaction.fields.getTextInputValue("adenaDonateInput");
      if (isNaN(adenaDonateInput) || adenaDonateInput <= 0) {
        return await interaction.reply({
          content: "Ошибка: Введите корректное число!",
          ephemeral: true,
        });
      }

      selfUser.balance -= +adenaDonateInput;
      targetUser.balance += +adenaDonateInput;
      await selfUser.save();
      await targetUser.save();
      await interaction.reply({
        content: `You succecful send ${adenaDonateInput} Adena to <@${targetUser.userid}>`,
        ephemeral: true,
      });
    }
  });

  const rest = new REST({ version: "9" }).setToken(config.TOKEN);

  try {
    bot.guilds.cache.forEach(async (GUILD) => {
      const CLIENT_ID = bot.user.id;
      const GUILD_ID = GUILD.id;

      const commandsToUpload = [
        "570707745028964353",
        "989124079250456617",
      ].includes(GUILD_ID)
        ? commands
        : commands.slice(12, 13);

      const server = await serverdb.findOne({ serverId: GUILD.id });
      if (!server) {
        const newServer = await serverdb.create({
          serverId: GUILD.id,
          serverName: GUILD.name,
          active: true,
        });
        console.log(`Created ${newServer}`);
      }
      GUILD.members.cache.forEach(async (MEMBER) => {
        const { user } = MEMBER;
        const serverUser = await serverUserdb.findOne({
          serverId: GUILD.id,
          userId: user.id,
        });
        if (!serverUser) {
          const newServerUser = await serverUserdb.create({
            serverId: GUILD.id,
            userId: user.id,
          });
          console.log(`Created Server User ${newServerUser}`);
        }
      });

      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commandsToUpload,
      });
    });
  } catch (error) {
    console.error(error);
  }

  job.addCallback(() => {
    const fetchMinecraftStatus = async (voiceChannelId) => {
      const channel = bot.channels.resolve(voiceChannelId);
      if (rcon.authenticated) {
        const resp = await rcon.send("list");
        const onlinecount = resp
          ?.replace("There are ", "")
          .replace(" of a max of 20 players online: ", "\n")
          .split("\n");

        const serverStatus = {
          online: onlinecount[0],
          players: onlinecount[1],
        };

        await channel.setName(`🟢 MC. Online: ${serverStatus.online}`);
      } else {
        await channel.setName(`🔴 MC. Offline`);
        await rcon.connect().catch(() => _);
      }
    };

    fetchMinecraftStatus("1170525641851027506");

    const gameScan = async (gameid, voiceChannelId) => {
      const game = await getGO(gameid);
      const channel = bot.channels.resolve(voiceChannelId);
      game >= 2000
        ? await channel.setName(`🟢 Online: ${game}`)
        : await channel.setName(`🔴 Offline: ${game}`);
    };

    gameScan(454120, "874205752837943337");
    gameScan(1063730, "874577935565193237");
    gameScan(306130, "1006092983814332426");

    //Random Channel Name
    const ren = bot.channels.resolve("896791375511687219");
    const arrName = [
      "/daloran",
      "/druid_olen",
      "/dion",
      "/aegis",
      "/ant_nest",
      "/orokin_tower",
      "/TOI",
      "/crucible",
      "/ban31day",
      "/mamutrahal",
      "/excalibur",
      "/rats_nest",
      "/zero_gravity",
    ];
    ren.setName(arrName[rand(0, arrName.length)]);
  });

  job.addCallback(async () => {
    const fetchTLStatus = async (voiceChannelId) => {
      const channel = bot.channels.resolve(voiceChannelId);
      const statusTL = await parseTlServerStatus("Leonardas");

      await channel.setName(statusTL.status || "error");
      return { statusTL };
    };

    const serverInfo = await fetchTLStatus("1296377397586952214");
    console.log(serverInfo);
  });
});

const pointsPerMinute = 1;

const usersInVoice = new Map();

bot.on("voiceStateUpdate", async (oldState, newState) => {
  const userId = newState.id;
  const guildId = newState.guild.id;

  if (!oldState.channelId && newState.channelId) {
    usersInVoice.set(userId, Date.now());
  }

  if (oldState.channelId && !newState.channelId) {
    const joinTime = usersInVoice.get(userId);
    if (joinTime) {
      const timeSpent = (Date.now() - joinTime) / 1000 / 60;
      const pointsEarned = Math.floor(timeSpent * pointsPerMinute);

      await updateUserPoints(guildId, userId, pointsEarned);
      console.log(
        `User ${userId} earned ${pointsEarned} points for ${timeSpent.toFixed(
          2
        )} minutes`
      );

      usersInVoice.delete(userId);
    }
  }
});

async function updateUserPoints(guildId, userId, points) {
  const user = await serverUserdb.findOne({ serverId: guildId, userId });
  if (!user) {
    await serverUserdb.create({
      serverId: guildId,
      userId,
      dkpPoints: points
    });
    return
  }
  user.dkpPoints += points;
  await user.save();
}

bot.on("guildMemberUpdate", async (oldMember, newMember) => {
  let role = await roledb.find({});
  role.forEach(async (r) => {
    const roleId = r.roleId;
    if (
      newMember._roles.find((x) => x === roleId) &&
      !oldMember._roles.find((x) => x === roleId)
    ) {
      const tk = await newMember.guild.roles.fetch(roleId);
      if (!newMember.user.username.match(/^[a-zA-Z0-9а-яА-Я]+$/)) {
        await newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname("Dirt");
      }
      const icon = tk.name.replace(/[A-z0-9 _.-]/g, "");
      if (newMember.nickname) {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(
            newMember.nickname.replace(/[^A-z0-9]/g, "") + " " + icon
          );
      } else {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(newMember.user.username + " " + icon);
      }
    } else if (
      oldMember._roles.find((x) => x === roleId) &&
      !newMember._roles.find((x) => x === roleId)
    ) {
      if (newMember.nickname) {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(newMember.nickname.replace(/[^A-z0-9]/g, ""));
      } else {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(newMember.user.username);
      }
    }
  });
});

bot.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || message.channel.type == "dm") return;

    let user = await userdb.findOne({ userid: message.member.user.id });
    if (!user) {
      user = await userdb.create({
        userid: message.member.user.id,
      });
    }

    const args = message.content.trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const currency = bot.emojis.cache.get(lang[4]);
    let ubot = await userdb.findOne({ userid: bot.user.id });

    const updateBalance = async (price) => {
      user.balance = user.balance - price;
      ubot.balance = ubot.balance + price;
      await user.save();
      await ubot.save();
    };

    if (command === "-cash") {
      if (user.acclvl < 10) return;
      await updateBalance(1);
    }
    if (command === "cmd") {
      if (user.acclvl < 10) return;
      if (!rcon.authenticated) return;
      if (args == "stop") {
        await rcon.send("stop");
        message.reply(`Server stoped ${args}`);
      }
      if (args == "reload") {
        await rcon.send("reload");
        message.reply(`Reload resources ${args}`);
      }
      if (args == "tps") {
        await rcon.send("debug start");
        await TimeOut(3000);
        let resp = await rcon.send("debug stop");
        const tps = resp
          .replace("Stopped tick profiling after ", "")
          .replace(" seconds and 60 ticks (", "\n")
          .replace(" ticks per second)", "")
          .split("\n");
        message.reply(`Server TPS: [${tps[1]}]`);
      }
    }

    if (command === "setacc") {
      const ct = +message.content.split(" ")[1];
      if (user.acclvl !== 27) return;
      const userid = message.content.split(" ")[2];
      try {
        await message.guild.members.fetch(userid);
      } catch (e) {
        return message.reply("Not Correct UserID");
      }
      const user1 = await userdb.findOne({ userid });
      if (ct >= 0 && ct <= 10) {
        user1.acclvl = ct;
        await user1.save();
        message.reply(`User: <@!${userid}> acclvl now ${ct}`);
      }
    }

    if (command === "addrole") {
      if (user.acclvl < 10) return;
      const ct = message.content.split(" ")[1];
      const roleCheck = await message.guild.roles.fetch(ct);
      if (roleCheck === null) return message.reply("Not Correct RoleID");
      let role = await roledb.findOne({ roleId: ct });
      if (!role) {
        role = await roledb.create({ roleId: ct });
        message.reply(`Successfully added role: ${roleCheck.name}`);
      } else {
        message.reply(`Already has role: ${roleCheck.name}`);
      }
    }

    if (command === "delrole") {
      if (user.acclvl < 10) return;
      const ct = message.content.split(" ")[1];
      const roleCheck = await message.guild.roles.fetch(ct);
      if (roleCheck === null) return message.reply("Not Correct RoleID");
      let role = await roledb.findOne({ roleId: ct });
      if (role) {
        role = await roledb.deleteOne({ roleId: ct });
        message.reply(`Successfully delete role: ${roleCheck.name}`);
      }
    }

    if (command === "play") {
      message.member.roles.cache.some((role) => ["*"].includes(role.name))
        ? (price = 0)
        : (price = 6);
      if (user.balance > price) {
        const query = args[0];
        const queue = player.createQueue(message.guild, {
          metadata: {
            channel: message.channel,
          },
          async onBeforeCreateStream(track, source, _queue) {
            // only trap youtube source
            if (source === "youtube") {
              // track here would be youtube track
              return (
                await playdl.stream(track.url, {
                  discordPlayerCompatibility: true,
                })
              ).stream;
              // we must return readable stream or void (returning void means telling discord-player to look for default extractor)
            }
          },
        });

        try {
          if (!queue.connection)
            await queue.connect(message.member.voice.channel);
        } catch {
          queue.destroy();
          return await message.reply("Could not join your voice channel!");
        }

        const track = (
          await player.search(query, {
            requestedBy: message.author,
          })
        ).tracks[0];
        if (!track)
          return await message.reply(`❌ | Track **${query}** not found!`);
        queue.play(track);
        await updateBalance(price);
        await message.reply(
          `${message.author.username} оплатил песню ${
            track.title
          } с вас снято ${price} ${currency}, у вас ${
            user.balance - price
          } ${currency}`
        );
        message.delete();
      } else {
        return message.reply(
          `Недостаточно средств, у вас ${user.balance} ${currency}`
        );
      }
    }

    if (command === "skip") {
      message.member.roles.cache.some((role) => ["*"].includes(role.name))
        ? (price = 0)
        : (price = 4);
      if (user.balance > price) {
        const queue = player.getQueue(message.guild);
        if (!queue) return;
        queue.skip();
        await updateBalance(price);
        await message.reply(
          `${
            message.author.username
          } пропустил песню с вас снято ${price} ${currency}, у вас ${
            user.balance - price
          } ${currency}`
        );
        message.delete();
      } else {
        return message.reply(
          `Недостаточно средств, у вас ${user.balance} ${currency}`
        );
      }
    }

    // if (command === "uri") {
    //   const cmt = message.content.split("uri ")[1];
    //   const map = message.stickers;
    //   const sticid = map.map((x) => {
    //     return x.id;
    //   });
    //   if (sticid[0]) {
    //     message.reply(`<https://media.discordapp.net/stickers/${sticid}.png>`);
    //   } else {
    //     message.reply(`Пусто`);
    //   }
    // }

    // if (command === "ping") {
    //   message.reply("Pong");
    // }

    if (command === "top") {
      const top = await userdb.find().sort({ balance: -1 });
      const top10 = top.slice(0, 10);
      const top10map = top10.map((x) => {
        let nickname = "Unknown";
        if (x.userid) {
          if (!message.guild.members.cache.get(x.userid)) {
            nickname = bot.users.cache.get(x.userid).username;
          } else {
            nickname =
              message.guild.members.cache.get(x.userid).nickname ||
              message.guild.members.cache.get(x.userid).user.username;
          }
        }
        return `${nickname} - ${x.balance} ${currency}`;
      });
      message.reply({
        content: top10map.join("\n"),
      });
    }

    if (command === "fib") {
      const cmt = message.content.split("fib ")[1];
      if (!Number(cmt)) return;
      const fibArr = [];
      for (let i = 0; i < cmt; i++) {
        const fomula = Math.floor(
          (((1 + Math.sqrt(5)) / 2) ** i - ((1 - Math.sqrt(5)) / 2) ** i) /
            Math.sqrt(5)
        );
        if (fomula >= Number.MAX_SAFE_INTEGER) break;
        fibArr.push(fomula);
      }
      message.reply(fibArr.join(" "));
    }

    if (command === "gn") {
      const cmt = +message.content.split("gn ")[1] || 1;
      const fi = (Math.sqrt(5) + cmt) / 2;
      const q = await message.reply(`(√5+${cmt})/2`);
      setTimeout(() => q.edit(String(fi)), 1000);
    }

    if (message.content === "multipage") {
      const pages = [
        new EmbedBuilder()
          .setTitle("Page 1")
          .setDescription("This is the first page."),
        new EmbedBuilder()
          .setTitle("Page 2")
          .setDescription("This is the second page."),
        new EmbedBuilder()
          .setTitle("Page 3")
          .setDescription("This is the third page."),
      ];

      let currentPage = 0;

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
        );

      message
        .reply({ embeds: [pages[currentPage]], components: [row] })
        .then((msg) => {
          const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
          });

          collector.on("collect", (interaction) => {
            if (interaction.customId === "previous") {
              if (currentPage > 0) {
                currentPage--;
                interaction.update({ embeds: [pages[currentPage]] });
              }
            } else if (interaction.customId === "next") {
              if (currentPage < pages.length - 1) {
                currentPage++;
                interaction.update({ embeds: [pages[currentPage]] });
              }
            }
          });

          collector.on("end", () => {
            msg.edit({ components: [] });
          });
        });
    }

    if (command === "roll") {
      const cmt = +message.content.split("roll ")[1] || 1;
      if (cmt > 100 || cmt < 0)
        return message.reply("Слишком большое или маленькое число");
      const mrr = await message.reply(`Ролл...`);
      let i = 0;
      const randNumber = setInterval(() => {
        i++;
        let qube = Math.floor(Math.random() * cmt) + 1;
        if (i == 27) {
          clearInterval(randNumber);
          mrr.edit(`Выпало **${qube}**`);
          return;
        }
        mrr.edit(`Выпало ${qube}`);
      }, 500);
    }

    if (command === "roll_gif") {
      const cmt = +message.content.split("roll ")[1] || 1;
      if (cmt > 100 || cmt < 0)
        return message.reply("Слишком большое или маленькое число");
      const { createRollingGif } = require("./module/utills/RollGen.js");
      const buffer = await createRollingGif();
      const attachment = new AttachmentBuilder(buffer, {
        name: "rolling_numbers.gif",
      });

      await message.reply({ content: "Ролл", files: [attachment] });
    }

    if (
      command === "guild_roles" &&
      message.author.id == "159211173768593408"
    ) {
      const buttons = [
        {
          label: "ТАНК",
          emoji: "1296042620773990461",
          style: ButtonStyle.Secondary,
          customId: "tank",
        },
        {
          label: "ДД",
          emoji: "1296042732724424726",
          style: ButtonStyle.Secondary,
          customId: "dd",
        },
        {
          label: "ХИЛ",
          emoji: "1296042598636458017",
          style: ButtonStyle.Secondary,
          customId: "heal",
        },
      ];

      const createButtons = (buttonArray) =>
        buttonArray.map((button) => {
          const newButton = new ButtonBuilder()
            .setLabel(button.label)
            .setStyle(button.style)
            .setCustomId(button.customId);
          if (button.emoji) {
            newButton.setEmoji(button.emoji);
          }

          return newButton;
        });

      const component = new ActionRowBuilder().addComponents(
        createButtons(buttons)
      );

      const content = "**Выбор роли**";

      await message.channel.send({
        content: content,
        components: [component],
      });

      return;
    }

    if (command === "象" && message.channel.guild.id === "570707745028964353") {
      const buttons = {
        buttonGX: [
          {
            label: "New World",
            emoji: "921408850253471837",
            style: ButtonStyle.Secondary,
            customId: "nwr",
          },
          {
            label: "Fallut 76",
            emoji: "861748887059693608",
            style: ButtonStyle.Secondary,
            customId: "fl76",
          },
          {
            label: "Black Desert",
            emoji: "861747964552675329",
            style: ButtonStyle.Secondary,
            customId: "bdo",
          },
          {
            label: "TESO",
            emoji: "921418213928083556",
            style: ButtonStyle.Secondary,
            customId: "teso",
          },
          {
            label: "Gta 5 RP",
            emoji: "638135208612200459",
            style: ButtonStyle.Secondary,
            customId: "gta5rp",
          },
        ],
        buttonGY: [
          {
            label: "Sunflower Land",
            emoji: "🌻",
            style: ButtonStyle.Secondary,
            customId: "sfl",
          },
          {
            label: "ArcheWorld",
            emoji: "1100480951005499392",
            style: ButtonStyle.Secondary,
            customId: "aw",
          },
        ],
        buttonAX: [
          {
            label: "Archive Key",
            emoji: "🔒",
            style: ButtonStyle.Secondary,
            customId: "archKey",
          },
          {
            label: "Linux User",
            emoji: "695326940617506826",
            style: ButtonStyle.Secondary,
            customId: "linux",
          },
        ],
      };

      const createButtons = (buttonArray) =>
        buttonArray.map((button) =>
          new ButtonBuilder()
            .setLabel(button.label)
            .setEmoji(button.emoji)
            .setStyle(button.style)
            .setCustomId(button.customId)
        );

      const components = Object.entries(buttons).map(([key, buttonArray]) =>
        new ActionRowBuilder().addComponents(createButtons(buttonArray))
      );

      const content = [
        "**Выбор роли для доступа к каналам** \nИгры:",
        " ",
        "Другое:",
      ];
      components.forEach(
        async (component, index) =>
          await message.channel.send({
            content: content[index],
            components: [component],
          })
      );
    }

    if (message.channelId) {
      await messCoin(message, bot, lang, collection, userdb);
    }
  } catch (e) {
    console.log(`error ${e}`);
  }
});

bot.on("interactionCreate", async (inter) => {
  const currency = bot.emojis.cache.get(lang[4]);
  const sflcurr = bot.emojis.cache.get("1073936545280688229");
  const bslt = bot.emojis.cache.get("1102467668310769694");
  if (!inter.isChatInputCommand()) return;

  try {
    if (!inter.guildId) {
      return await inter.reply(`Can't work in DM ${inter.user.username}`);
    }

    const command = inter.commandName;

    let user = await userdb.findOne({ userid: inter.member.user.id });
    if (!user) {
      user = await userdb.create({ userid: inter.member.user.id });
    }

    // slash commands here
    const ether_port =
      "wss://polygon-mainnet.g.alchemy.com/v2/4Aw02n_3OEU1MpVrp6m1TqyYA86CR9ob";
    const web3 = new Web3(ether_port);
    const sflAbi = require("./sfl_abi.json");

    const iUser = inter.options.getUser("user") || 0;
    const userDB = await userdb.findOne({ userid: iUser.id });

    switch (command) {
      case "balance":
        return await inter.reply({
          content: `${lang[3]} ${user.balance} ${currency}`,
          ephemeral: true,
        });
      case "walletset":
        user.nonce = Math.floor(Math.random() * 1000000);
        await user.save();
        const connectButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Connect Wallet")
            .setStyle(ButtonStyle.Link)
            .setURL(
              `https://grk.pw/connect?id=${inter.member.user.id}&nonce=${user.nonce}&sig=dis&guildid=${inter.guildId}`
            )
        );
        await inter.reply({
          content: "You can connect wallet on button below",
          components: [connectButton],
          ephemeral: true,
          fetchReply: true,
        });
        break;
      case "bumpkin":
        if (!userDB.web3)
          return await inter.reply(
            `Пользователь ${iUser.username} не подключил кошелек`
          );
        const bumpContract = new web3.eth.Contract(
          sflAbi,
          "0x624E4fa6980Afcf8EA27BFe08e2fB5979b64DF1C"
        );
        const bumpId = await bumpContract.methods
          .tokenOfOwnerByIndex(userDB.web3, 0)
          .call();
        if (!bumpId) return await inter.reply("Пользователь не имеет бампкин");
        const bumpUri = await bumpContract.methods.tokenURI(bumpId).call();
        const bumpInfo = await fetch(bumpUri).then((res) => res.json());
        const response = await fetch(bumpInfo.image);
        const imageBuffer = await response.buffer();
        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "bumpkin.jpg",
        });
        const bumpEmbed = new EmbedBuilder()
          .setColor(0xea623d)
          .setTitle(bumpInfo.name)
          .setURL(bumpInfo.image)
          .setImage("attachment://bumpkin.jpg")
          .setTimestamp(Date.now())
          .setAuthor({
            name: iUser.username,
            iconURL: `https://cdn.discordapp.com/avatars/${iUser.id}/${iUser.avatar}.png`,
          })
          .setFooter({
            text: "Bumpkin",
            iconURL:
              "https://cdn.discordapp.com/attachments/975967980443795477/1064819066914738206/slf.png",
          });
        return await inter.reply({ embeds: [bumpEmbed], files: [attachment] });
      case "farm":
        if (!userDB.web3)
          return await inter.reply(
            `Пользователь ${iUser.username} не подключил кошелек`
          );
        const sflContract = new web3.eth.Contract(
          sflAbi,
          "0x2B4A66557A79263275826AD31a4cDDc2789334bD"
        );
        try {
          const farmId = await sflContract.methods
            .tokenOfOwnerByIndex(userDB.web3, 0)
            .call();
          if (!farmId) return await inter.reply("Пользователь не имеет ферм");
          const farmInfo = await fetch(
            `https://api.sunflower-land.com/nfts/farm/${farmId}`
          ).then((res) => res.json());
          const inventory = await fetch(
            `https://api.sunflower-land.com/visit/${farmId}`
          )
            .then((res) => res.json())
            .then((inv) => inv.state);
          const farmEmbed = new EmbedBuilder()
            .setColor(0xea623d)
            .setTitle(farmInfo.name)
            .setURL(farmInfo.external_url)
            .setImage(farmInfo.image)
            .setTimestamp(Date.now())
            .setAuthor({
              name: iUser.username,
              iconURL: `https://cdn.discordapp.com/avatars/${iUser.id}/${iUser.avatar}.png`,
            })
            .setDescription(
              `
          **SFL**: ${Math.round(inventory.balance * 100) / 100} ${sflcurr}
          **Coins**: ${inventory.coins.toFixed(2)}
          **Island**: ${inventory.island.type} ⛱
          `
            )
            .setFooter({
              text: `Status: ${farmInfo.attributes[0].value}`,
              iconURL:
                "https://cdn.discordapp.com/attachments/975967980443795477/1064819066914738206/slf.png",
            });
          await inter.reply({ embeds: [farmEmbed] });
        } catch (e) {
          await inter.reply({ content: "Wait 10 second", ephemeral: true });
        }
        return;
      case "calc":
        const cmtq = inter.options.getNumber("value");
        const rubToUsd = await fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
        ).then((resp) => resp.json());
        const rubPrice = rubToUsd.usd["rub"];
        const prBs = 6;
        return await inter.reply(
          `${cmtq} RUB / ${(rubPrice + prBs).toFixed(2)} USD = ${(
            cmtq /
            (rubPrice + prBs)
          ).toFixed(2)} USDT (${Math.floor(
            cmtq / rubPrice - cmtq / (rubPrice + prBs)
          )})`
        );
      case "pay":
        const cmt = inter.options.getNumber("amount");
        if (iUser.id === inter.member.user.id)
          return await inter.reply("Нельзя перевести самому себе");
        if (!Number(cmt)) return await inter.reply("Неверное число");
        if (user.balance < cmt)
          return await inter.reply("Недостаточно средств");
        if (!userDB) {
          await userdb.create({ userid: iUser.id });
        }
        await userdb.findOneAndUpdate(
          { userid: inter.member.user.id },
          { $inc: { balance: -cmt } }
        );
        await userdb.findOneAndUpdate(
          { userid: iUser.id },
          { $inc: { balance: cmt } }
        );
        return await inter.reply(
          `Вы перевели ${cmt} ${currency} пользователю ${iUser.username}`
        );
      case "fine":
        const fine = inter.options.getNumber("amount");
        if (!Number(fine)) return await inter.reply("Неверное число");
        if (user.acclvl < 2) return await inter.reply("Недостаточно прав");
        if (user.acclvl < 27) {
          if (fine < 0 || fine > 1000)
            return await inter.reply("Число должно быть от 0 до 1000");
        }
        if (!userDB) {
          await userdb.create({ userid: iUser.id });
        }
        await userdb.findOneAndUpdate(
          { userid: iUser.id },
          { $inc: { fine: fine } }
        );
        return inter.reply(
          `Вы выставили штраф ${fine} 💰 пользователю <@!${iUser.id}>`
        );
      case "checkfine":
        if (!iUser) return await inter.reply("Пользователь не найден");
        if (!userDB) {
          await userdb.create({ userid: iUser.id });
        }
        return await inter.reply({
          content: `Штраф пользователя ${iUser.username} составляет ${userDB.fine} 💰`,
          ephemeral: true,
        });
      case "popusk":
        if (user.acclvl < 2) return await inter.reply("Недостаточно прав");
        const popusk = inter.options.getString("name");
        const Jimp = require("jimp");
        // Generate a random image using the Jimp library
        const width = 400;
        const height = 100;
        const bgColor = Jimp.rgbaToInt(58, 23, 0, 0);
        const image = new Jimp(width, height, bgColor);
        //load font on path
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const text = `${popusk}\n Now officaly POPUSK`;
        const lines = text.split("\n");

        // Print each line of text to the image
        let y =
          (image.bitmap.height - lines.length * font.common.lineHeight) / 2;
        for (const line of lines) {
          const textWidth = Jimp.measureText(font, line);
          image.print(font, (image.bitmap.width - textWidth) / 2, y, line);
          y += font.common.lineHeight;
        }

        // Convert the image to a buffer and send it as a photo message
        const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
        const file = new AttachmentBuilder(buffer, {
          name: "file.jpg",
          description: "Hui hui hui",
        });
        const popEmbed = new EmbedBuilder()
          .setColor(0xea623d)
          .setTitle("Попуск")
          .setTimestamp(Date.now())
          .setDescription(`Игрок **${popusk}** теперь официально попуск`)
          .setImage("attachment://file.jpg");
        return await inter.reply({ embeds: [popEmbed], files: [file] });
      default:
        return await inter.reply("Команда не найдена");
    }
  } catch (e) {
    console.error(`error: ${e}`);
  }
});

app.post("/dis/connect:user_id", async (req, res) => {
  const user = await userdb.findOne({ userid: req.body.userId });
  // res.header("Access-Control-Allow-Origin", "*");
  if (!user) {
    res.send({ error: "User not found" }).status(404);
  } else {
    const guildArr = [];
    bot.guilds.cache.forEach((o) => {
      return guildArr.push(o.id);
    });
    if (!guildArr.includes(req.body.guildid)) {
      return res.send({ error: "Guild not found in bot" }).status(400);
    }
    if (!req.body.guildid) {
      return res.send({ error: "Guild id not found" }).status(400);
    }
    if (user.nonce.toString() !== req.body.nonce) {
      return res.send({ error: "Nonce not match" }).status(400);
    }
    if (user.web3) {
      return res.send({ error: "User already connected" }).status(400);
    }
    bot.users.cache
      .get(req.body.userId)
      .send(`Wallet connected: ${req.body.address}`);
    bot.guilds.cache
      .get("570707745028964353")
      .members.cache.get(req.body.userId)
      .roles.add("1041269388139057172")
      .catch(null);
    user.guildid = req.body.guildid;
    user.web3 = req.body.address;
    user.nonce = Math.floor(Math.random() * 1000000);
    user.save();
    res
      .send({
        msg: "Wallet connected. Please close this page and check for a message form the Server Dino bot",
      })
      .status(200);
  }
});

bot.on("interactionCreate", async (button) => {
  if (!button.isButton()) return;

  const roleGiver = async (rid) => {
    const gRole = button.member.guild.roles.cache.find(
      (role) => role.id == rid
    );
    const member = button.member;
    if (member.roles.cache.has(gRole.id)) {
      member.roles.remove(gRole);
      await button.reply({
        content: `Удалена роль <@&${gRole.id}>`,
        ephemeral: true,
      });
    } else {
      member.roles.add(gRole);
      await button.reply({
        content: `Добавлена роль <@&${gRole.id}>`,
        ephemeral: true,
      });
    }
  };

  button.customId == "bdo"
    ? roleGiver("796756163135930389")
    : button.customId == "gta5rp"
    ? roleGiver("862521544944386058")
    : button.customId == "teso"
    ? roleGiver("863851712472154113")
    : button.customId == "fl76"
    ? roleGiver("797892063830999080")
    : button.customId == "nwr"
    ? roleGiver("874578068210085918")
    : button.customId == "aw"
    ? roleGiver("1100477620178653205")
    : button.customId == "archKey"
    ? roleGiver("861743745083244586")
    : button.customId == "sfl"
    ? roleGiver("1065272659824353402")
    : button.customId == "tank"
    ? roleGiver("1295813800766734417")
    : button.customId == "heal"
    ? roleGiver("1295813830273798286")
    : button.customId == "dd"
    ? roleGiver("1295813854877581393")
    : button.customId == "linux" && roleGiver("862531032376148018");
});

const deleteAllGlobalCommands = async () => {
  try {
    await rest.put(Routes.applicationCommands(bot.user.id), { body: [] });
    console.log("Successfully deleted all application commands.");
  } catch (e) {
    console.log(e);
  }
};

const stdin = process.openStdin();

stdin.addListener("data", async (d) => {
  d = d.toString().trim();
  if (d == "delg") {
    deleteAllGlobalCommands();
  } else if (d == "qq") {
    const status = await parseTlServerInfo("Leonardas");
    console.log(status);
  }
});

process.on("uncaughtException", function (err) {
  console.error(err);
});

//DataBase
mongoose
  .connect(
    `mongodb://${config.DBUSER}:${config.DBPASS}@${config.SERVER}/${config.DB}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected!!");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });
