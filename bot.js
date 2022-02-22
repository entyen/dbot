const Promise = require("bluebird");
const {
  Discord,
  MessageEmbed,
  Collection,
  Client,
  Intents,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const mongoose = require("mongoose");
const steam = require("steam-web");
const CronJob = require("cron").CronJob;

const fs = require("fs");
const tea = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const lang = JSON.parse(fs.readFileSync("en.json", "utf-8"));

const bot = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});
const embed = new MessageEmbed();
const collection = new Collection();
bot.login(tea.TOKEN);
const st = new steam({
  apiKey: tea.STEAM_TOKEN,
  format: "json", //optional ['json', 'xml', 'vdf']
});

const Web3 = require("web3");
const resp = async () => {
  const ether_port =
    "wss://polygon-mainnet.g.alchemy.com/v2/4Aw02n_3OEU1MpVrp6m1TqyYA86CR9ob";
  const web3 = new Web3(ether_port);
  await web3.eth.subscribe(
    "logs",
    {
      fromBlock: 25010413,
      address: "0x10c4555A15527806Eb54b243f115e31F7aADa466",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        null,
      ],
    },
    async (err, res) => {
      if (!err) {
        const mintId = web3.utils.hexToNumber(res.topics[3]);
        const minterId = res.topics[2].slice(26);
        const blockInfo = await web3.eth.getBlock(res.blockNumber);
        // bot.channels.cache.get("941599308338319380").send({
        //   embeds: [
        //     {
        //       description: `**Fox #${mintId} has Minted**\n[Token ID: ${mintId}](https://opensea.io/assets/matic/${
        //         res.address
        //       }/${mintId})\nCollection: Thief Fox\n\nMinter: [${minterId.slice(
        //         0,
        //         6
        //       )}***${minterId.slice(
        //         -4
        //       )}](https://polygonscan.com/address/${minterId})`,
        //       footer: {
        //         iconURL: `https://thief-fox.grk.pw/logo192.png`,
        //         text: "Minted",
        //       },
        //       timestamp: blockInfo.timestamp * 1000,
        //       color: [234, 98, 61],
        //       image: {
        //         url: `https://ipfs.io/ipfs/Qmds5L5Sg1QLFiC3beb6sMKCH8cVR14hLeSEjsk5atgf1a/${mintId}.png`,
        //       },
        //     },
        //   ],
        // });
      }
    }
  );
  await web3.eth.subscribe(
    "logs",
    {
      fromBlock: 24851569,
      address: "0x18c5d5e778FCD9db00B4433697BD1FD01F3C91F7",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        null,
      ],
    },
    async (err, res) => {
      if (!err) {
        const mintId = web3.utils.hexToNumber(res.topics[3]);
        const minterId = res.topics[2].slice(26);
        const blockInfo = await web3.eth.getBlock(res.blockNumber);
        // bot.channels.cache.get("941598098503909397").send({
        //   embeds: [
        //     {
        //       description: `**Dino #${mintId} has Minted**\n[Token ID: ${mintId}](https://opensea.io/assets/matic/${res.address}/${mintId})\nCollection: Dino Planet-7518P\n\nMinter: [${minterId.slice(0, 6)}***${minterId.slice(-4)}](https://polygonscan.com/address/${minterId})`,
        //       footer: {
        //         iconURL: `https://dino.grk.pw/logo192.png`,
        //         text: 'Minted'
        //       },
        //       timestamp: blockInfo.timestamp * 1000,
        //       color: [0, 74, 115],
        //       image: {
        //         url: `https://ipfs.io/ipfs/QmXj2SHg1AZ2Fg2DC8ifyVTLSZkGwuArrqUFgYg3q1VZX8/${mintId}.png`
        //       },
        //     },
        //   ],
        // });
      }
    }
  );
};

resp();

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

const userSchem = require("./schema/data.js");
const indexCmd = require("./commands/index");
const messCoin = require("./jobs/mess_coin.js");
const userdb = mongoose.model("570707745028964353", userSchem);

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

bot.on("ready", async () => {
  console.log(`Logged in as ${bot.user.tag}!`);
  const currency = bot.emojis.cache.get(lang[4]);
  let ubot = await userdb.findOne({ userid: bot.user.id });
  bot.user.setActivity(`${ubot.balance} Aden`, { type: "PLAYING" });

  indexCmd(bot, lang);

  job.addCallback(async () => {
    //Star Base
    const sb = await getGO(454120);
    const c = bot.channels.resolve("874205752837943337");
    sb >= 2000
      ? await c.setName(`🟢 Online: ${sb}`)
      : await c.setName(`🔴 Offline: ${sb}`);

    //New World
    const nw = await getGO(1063730);
    const n = bot.channels.resolve("874577935565193237");
    nw >= 2000
      ? await n.setName(`🟢 Online: ${nw}`)
      : await n.setName(`🔴 Offline: ${nw}`);

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
    ];
    await ren.setName(arrName[rand(0, arrName.length)]);

    //LOG
    bot.channels.cache
      .get("878075420342374402")
      .send(`Date =${job.nextDates()} SB =${sb} NW =${nw}`);
  });

  bot.ws.on("INTERACTION_CREATE", async (inter) => {
    try {
      if (!inter.guild_id) {
        bot.api.interactions(inter.id, inter.token).callback.post({
          data: {
            type: 4,
            data: {
              content: `Can't work in DM ${inter.user.username}`,
            },
          },
        });
        return;
      }

      const command = inter.data.name;
      const args = inter.data.options;

      let user = await userdb.findOne({ userid: inter.member.user.id });
      if (!user) {
        user = await userdb.create({ userid: inter.member.user.id });
      }

      const ctx = {
        bot,
        inter,
        user,
        lang,
        embed,
        args,
        userdb,
        createAPIMessage,
      };

      let commandfile;

      if (bot.commands.has(command)) {
        commandfile = bot.commands.get(command);
      }

      try {
        commandfile.run(ctx);
      } catch (e) {
        console.log(`error: ${e}`);
      }
    } catch (e) {
      console.log(`error: ${e}`);
    }
  });
});

bot.on("guildMemberUpdate", async (oldMember, newMember) => {
  // console.log(newMember.guild.roles.fetch('613424726236332042'))
  // console.log(newMember.nickname.split(/[A-z]/g, '').join())
  const roleIcon = async (roleId) => {
    if (
      newMember._roles.find((x) => x === roleId) &&
      !oldMember._roles.find((x) => x === roleId)
    ) {
      const tk = await newMember.guild.roles.fetch(roleId);
      const icon = tk.name.replace(/[A-z0-9 ]/g, "");
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
  };

  roleIcon("613424726236332042");
  roleIcon("571480170146431014");
  roleIcon("571480054799007749");
  roleIcon("571481578367352863");
  roleIcon("733085551896428554");
  roleIcon("571480366947237959");
  roleIcon("571480696514805760");
  roleIcon("615262649546047496");
  roleIcon("709474064510746665");
  roleIcon("641865041192419368");
  roleIcon("761356018659622923");
  roleIcon("571480372282392588");
  roleIcon("620706899796426812");
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

    if (command === "uri") {
      const cmt = message.content.split("uri ")[1];
      const map = message.stickers;
      const sticid = map.map((x) => {
        return x.id;
      });
      if (sticid[0]) {
        message.reply(`<https://media.discordapp.net/stickers/${sticid}.png>`);
      } else {
        message.reply(`Пусто`);
      }
    }

    if (command === "ping") {
      message.reply("Pong");
    }

    if (command === "象" && message.channel.guild.id === "570707745028964353") {
      let button = (gamen, emojid, style, cbid) => {
        return new MessageButton()
          .setLabel(gamen)
          .setEmoji(emojid)
          .setStyle(style)
          .setCustomId(cbid);
      };

      const buttonGX = [
        button("New World", "921408850253471837", "SECONDARY", "nwr"),
        button("Fallut 76", "861748887059693608", "SECONDARY", "fl76"),
        button("Black Desert", "861747964552675329", "SECONDARY", "bdo"),
      ];
      const buttonGY = [
        button("TESO", "921418213928083556", "SECONDARY", "teso"),
        button("Gta 5 RP", "638135208612200459", "SECONDARY", "gta5rp"),
        button("STARBASE", "590188839197212700", "SECONDARY", "strBase"),
      ];
      const buttonAX = [
        button("Archive Key", "🔒", "SECONDARY", "archKey"),
        button("Linux User", "695326940617506826", "SECONDARY", "linux"),
      ];

      let buttonRowG = new MessageActionRow().addComponents(buttonGX);
      let buttonRowG1 = new MessageActionRow().addComponents(buttonGY);
      let buttonRowA = new MessageActionRow().addComponents(buttonAX);
      await message.channel.send({
        content: "**Выбор роли для доступа к каналам** \nИгры:",
        components: [buttonRowG],
      });
      await message.channel.send({
        files: [
          "https://cdn.discordapp.com/attachments/613491096206573597/915024382945001512/separator.gif",
        ],
        components: [buttonRowG1],
      });
      await message.channel.send({
        content: "Другое:",
        components: [buttonRowA],
      });
    }

    if (message.channel.type == "GUILD_TEXT") {
      messCoin(message, bot, user, lang, collection, userdb);
    }
  } catch (e) {
    console.log(`error ${e}`);
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

/* bot.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.channel
  let oldUserChannel = oldMember.channel
  try {
  if(!!newUserChannel) {
    let usr = uid => newUserChannel.members.find(user => user.id === uid)    
    const rg2 = usr('230098678558359552')

    if (newMember.id === '229673855470272512' && rg2 === '230098678558359552'){
        newUserChannel.guild.member(newMember.id).setNickname(`${rg2.username} 🐀`)
    }
    console.log(newMember)
    // User Joins a voice channel

  } else {

    if (oldMember.id === '229673855470272512'){
        oldUserChannel.guild.member(oldMember.id).setNickname(``)
    }
    if (oldMember.id === '230098678558359552'){
        oldUserChannel.guild.member(oldMember.id).setNickname(``)
    }
    // User leaves a voice channel

  }
  } catch (e) { console.log(e) }
}) */

async function createAPIMessage(inter, content) {
  const apiMessage = await Discord.APIMessage.create(
    bot.channels.resolve(inter.channel_id),
    content
  )
    .resolveData()
    .resolveFiles();

  return { ...apiMessage.data, files: apiMessage.files };
}

const deleteAllGlobalCommands = async () => {
  let GCOMMANDS = await bot.api.applications(bot.user.id).commands.get();
  GCOMMANDS.forEach(async (c) => {
    await bot.api.applications(bot.user.id).commands(c.id).delete();
  });
};

const stdin = process.openStdin();

stdin.addListener("data", (d) => {
  d = d.toString().trim();
  if (d == "delg") {
    deleteAllGlobalCommands();
    console.log("U delete all global commands");
  }
});

process.on("uncaughtException", function (err) {
  console.error(err);
});

//DataBase
mongoose
  .connect(`mongodb://${tea.DBUSER}:${tea.DBPASS}@${tea.SERVER}/${tea.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("MongoDB connected!!");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });
