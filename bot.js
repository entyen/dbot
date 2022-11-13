const Promise = require("bluebird");
const {
  Collection,
  Client,
  REST,
  Routes,
  MessageActionRow,
  MessageButton,
  ActivityType,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteractionOptionResolver,
} = require("discord.js");
const mongoose = require("mongoose");
const steam = require("steam-web");
const CronJob = require("cron").CronJob;

const fs = require("fs");
const config = require("./config.json");
const lang = JSON.parse(fs.readFileSync("en.json", "utf-8"));

const bot = new Client({
  intents: [
    "Guilds",
    "GuildVoiceStates",
    "GuildMessages",
    "GuildMembers",
    GatewayIntentBits.Guilds,
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
} = require("./schema/data.js");
const Web3 = require("web3");
const ether_port =
  "wss://polygon-mainnet.g.alchemy.com/v2/4Aw02n_3OEU1MpVrp6m1TqyYA86CR9ob";
const web3 = new Web3(ether_port);
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

const mintCheck = () => {
  nftUpdate(
    "0x10c4555A15527806Eb54b243f115e31F7aADa466",
    "Fox",
    "Thief Fox",
    "https://thief-fox.grk.pw/logo192.png",
    "987136039804076104",
    0xea623d,
    "Qmds5L5Sg1QLFiC3beb6sMKCH8cVR14hLeSEjsk5atgf1a"
  );

  nftUpdate(
    "0x18c5d5e778FCD9db00B4433697BD1FD01F3C91F7",
    "Dino",
    "Dino Planet-7518P",
    "https://dino.grk.pw/logo192.png",
    "941598098503909397",
    0x004a74,
    "QmXj2SHg1AZ2Fg2DC8ifyVTLSZkGwuArrqUFgYg3q1VZX8"
  );
};

mintCheck();

bot.commands = new Collection();

const dirCmd = async (dir) => {
  fs.readdir(dir, (err, files) => {
    if (err) console.log(`error ${err}`);
    let jsFile = files.filter((f) => f.split(".").pop() === "js");

    jsFile.forEach((f) => {
      const props = require(`${dir}${f}`);
      const cmd = f.split(".").slice(-2, -1).pop();
      bot.commands.set(cmd, props);
    });
  });
};

const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

dirCmd("./commands/scommands/");

const messCoin = require("./jobs/mess_coin.js");
const userdb = mongoose.model("570707745028964353", userSchem);
const roledb = mongoose.model("roles", iconRoleSchem);

const getGO = (gameid) => {
  return new Promise((resolve) => {
    st.getNumberOfCurrentPlayers({
      appid: gameid,
      callback: (err, data) => {
        resolve(!data ? data : data.response.player_count);
      },
    });
  });
};

const job = new CronJob("*/5 * * * *", null, false, "Europe/Moscow");

bot.on("ready", (_) => {
  console.log(`Logged in as ${bot.user.tag}!`);
  const currency = bot.emojis.cache.get(lang[4]);
  setInterval(async (_) => {
    let ubot = await userdb.findOne({ userid: bot.user.id });
    bot.user.setActivity(`${ubot.balance} Aden`, {
      type: ActivityType.Playing,
    });
  }, 30000);

  const commands = [
    new SlashCommandBuilder().setName("balance").setDescription(lang[5]),
    new SlashCommandBuilder().setName("walletset").setDescription(lang[8]),
  ];

  try {
    bot.guilds.cache.forEach(async (i) => {
      const CLIENT_ID = bot.user.id;
      const GUILD_ID = i.id;

      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
    });
  } catch (error) {
    console.error(error);
  }

  job.addCallback(() => {
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
      "/excalibur",
      "/rats_nest",
      "/zero_gravity",
    ];
    ren.setName(arrName[rand(0, arrName.length)]);
  });
});

bot.on("presenceUpdate", (oldPresence, newPresence) => {
  // if (newPresence.userId === "159211173768593408") {
  //   console.log("Test");
  // bot.channels.cache
  //   .get("611568076659490816")
  //   .send("<@!1231> Чебупель ты где!!!");
  // }
  // if (newPresence.activities.applicationId) {
  //   console.log(newPresence.activities);
  // }
  if (newPresence.userId === "230098678558359552") {
    if (newPresence.status === "online") {
      if (newPresence.guild.id === "231855360716046337") {
        bot.channels.cache
          .get("611568076659490816")
          .send("<@!1231> Чебупель ты где!!!");
      }
    }
  }
});

bot.on("guildMemberUpdate", async (oldMember, newMember) => {
  let role = await roledb.find({});
  role.forEach(async (r) => {
    const roleId = r.roleId;
    if (
      newMember._roles.find((x) => x === roleId) &&
      !oldMember._roles.find((x) => x === roleId)
    ) {
      const tk = await newMember.guild.roles.fetch(roleId);
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
      user = await userdb.create({ userid: message.member.user.id });
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

    if (command === "setacc") {
      const ct = +message.content.split(" ")[1];
      if (user.acclvl !== 27) return;
      const userid = message.content.split(" ")[2];
      try {
        await message.guild.members.fetch(userid);
      } catch (e) {
        return message.reply("Not Correct UserID");
      }
      if (ct >= 0 && ct <= 10) {
        user.acclvl = ct;
        await user.save();
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

    // if (command === "象" && message.channel.guild.id === "570707745028964353") {
    //   let button = (gamen, emojid, style, cbid) => {
    //     return new MessageButton()
    //       .setLabel(gamen)
    //       .setEmoji(emojid)
    //       .setStyle(style)
    //       .setCustomId(cbid);
    //   };

    //   const buttonGX = [
    //     button("New World", "921408850253471837", "SECONDARY", "nwr"),
    //     button("Fallut 76", "861748887059693608", "SECONDARY", "fl76"),
    //     button("Black Desert", "861747964552675329", "SECONDARY", "bdo"),
    //   ];
    //   const buttonGY = [
    //     button("TESO", "921418213928083556", "SECONDARY", "teso"),
    //     button("Gta 5 RP", "638135208612200459", "SECONDARY", "gta5rp"),
    //     button("STARBASE", "590188839197212700", "SECONDARY", "strBase"),
    //   ];
    //   const buttonAX = [
    //     button("Archive Key", "🔒", "SECONDARY", "archKey"),
    //     button("Linux User", "695326940617506826", "SECONDARY", "linux"),
    //   ];

    //   let buttonRowG = new MessageActionRow().addComponents(buttonGX);
    //   let buttonRowG1 = new MessageActionRow().addComponents(buttonGY);
    //   let buttonRowA = new MessageActionRow().addComponents(buttonAX);
    //   await message.channel.send({
    //     content: "**Выбор роли для доступа к каналам** \nИгры:",
    //     components: [buttonRowG],
    //   });
    //   await message.channel.send({
    //     files: [
    //       "https://cdn.discordapp.com/attachments/613491096206573597/915024382945001512/separator.gif",
    //     ],
    //     components: [buttonRowG1],
    //   });
    //   await message.channel.send({
    //     content: "Другое:",
    //     components: [buttonRowA],
    //   });
    // }

    if (message.channelId) {
      await messCoin(message, bot, lang, collection, userdb);
    }
  } catch (e) {
    console.log(`error ${e}`);
  }
});

bot.on("interactionCreate", async (inter) => {
  const currency = bot.emojis.cache.get(lang[4]);
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

    if (command === "balance") {
      return await inter.reply({
        content: `${lang[3]} ${user.balance} ${currency}`,
        ephemeral: true,
      });
    }
  } catch (e) {
    console.log(`error: ${e}`);
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
    : button.customId == "strBase"
    ? roleGiver("870960525780058185")
    : button.customId == "nwr"
    ? roleGiver("874578068210085918")
    : button.customId == "archKey"
    ? roleGiver("861743745083244586")
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

stdin.addListener("data", (d) => {
  d = d.toString().trim();
  if (d == "delg") {
    deleteAllGlobalCommands();
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
