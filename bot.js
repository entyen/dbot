const Promise = require("bluebird")
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
} = require("discord.js")
const mongoose = require("mongoose")
const steam = require("steam-web")
const express = require("express")
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// express link web3 and discord bot account
app.post("/webhook", async (req, res) => {
  console.log(req.body)
  res.send("Hello World!")
})

const PORT = process.env.PORT || 2000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const CronJob = require("cron").CronJob

const http = require("https")
const fs = require("fs")
const config = require("./config.json")
const lang = JSON.parse(fs.readFileSync("en.json", "utf-8"))

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
})

const collection = new Collection()
bot.login(config.TOKEN)
const rest = new REST({ version: "10" }).setToken(config.TOKEN)
const st = new steam({
  apiKey: config.STEAM_TOKEN,
  format: "json", //optional ['json', 'xml', 'vdf']
})

//PLAYER DISCORD
const { Player } = require("discord-player")
const player = new Player(bot, {
  enableLive: false,
  ytdlDownloadOptions: {
    filter: "audioonly",
  },
})
const playdl = require("play-dl")
bot.player = player
//PLAYER

const { userSchem, iconRoleSchem, nftUpdateSchem } = require("./schema/data.js")
const Web3 = require("web3")
const nftdb = mongoose.model("nftBase", nftUpdateSchem)
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
    "wss://polygon-mainnet.g.alchemy.com/v2/4Aw02n_3OEU1MpVrp6m1TqyYA86CR9ob"
  const web3 = new Web3(ether_port)
  const nft = await nftdb.findOne({ smartContract: address })
  if (!nft) {
    const newNft = new nftdb({
      smartContract: address,
      blockId: 0,
    })
    await newNft.save()
  } else {
    const fromBlock = nft.blockId
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
              return
            }
          }
        )
        .on("data", async (res) => {
          const mintId = web3.utils.hexToNumber(res.topics[3])
          const minterId = res.topics[2].slice(26)
          const blockInfo = await web3.eth.getBlock(res.blockNumber)
          const channel = bot.channels.cache.get(chanelId)
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
            })
          await channel.send({ embeds: [embed] })
          nft.blockId = res.blockNumber + 1
          await nft.save()
        })
        .on("error", (err) => {
          console.log(err)
        })
        .on("changed", (res) => {
          console.log(res)
        })
        .on("connected", (res) => {
          console.log("Connected: " + res)
        })
    })
  }
}

const mintCheck = async () => {
  await nftUpdate(
    "0x10c4555A15527806Eb54b243f115e31F7aADa466",
    "Fox",
    "Thief Fox",
    "https://thief-fox.grk.pw/logo192.png",
    "987136039804076104",
    0xea623d,
    "Qmds5L5Sg1QLFiC3beb6sMKCH8cVR14hLeSEjsk5atgf1a"
  )

  await nftUpdate(
    "0x18c5d5e778FCD9db00B4433697BD1FD01F3C91F7",
    "Dino",
    "Dino Planet-7518P",
    "https://dino.grk.pw/logo192.png",
    "941598098503909397",
    0x004a74,
    "QmXj2SHg1AZ2Fg2DC8ifyVTLSZkGwuArrqUFgYg3q1VZX8"
  )
}

mintCheck()

const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

const messCoin = require("./jobs/mess_coin.js")
const userdb = mongoose.model("users", userSchem)
const roledb = mongoose.model("roles", iconRoleSchem)

const getGO = (gameid) => {
  return new Promise((resolve) => {
    st.getNumberOfCurrentPlayers({
      appid: gameid,
      callback: (err, data) => {
        resolve(!data ? data : data.response.player_count)
      },
    })
  })
}

const job = new CronJob("*/5 * * * *", null, false, "Europe/Moscow")

bot.on("ready", (_) => {
  console.log(`Logged in as ${bot.user.tag}!`)
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
    new ContextMenuCommandBuilder()
      .setName("User Balance")
      .setNameLocalizations({ ru: "Баланс пользователя" })
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
    new SlashCommandBuilder()
      .setName("awinfo")
      .setDescription("Check info about user")
      .addUserOption((option) =>
        option
          .setName("user")
          .setNameLocalizations({ ru: "пользователь" })
          .setDescription("Select user")
          .setRequired(true)
      ),
  ]

  bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isUserContextMenuCommand()) return
    const user = interaction.targetId
    const iUser = (await userdb.findOne({ userid: user })) || {
      balance: 0,
      fine: 0,
    }
    const currency = bot.emojis.cache.get(lang[4])
    if (interaction.commandName === "User Information") {
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("User Information")
        .setDescription(
          `User: <@${user}>\n\n **Balance**: ${iUser.balance} ${currency}\n **Fine**: ${iUser.fine} ${currency}`
        )
      await interaction.reply({ embeds: [embed] })
    } else if (interaction.commandName === "User Balance") {
      await interaction.reply({
        content: `${iUser.balance} Aden`,
        ephemeral: true,
      })
    }
  })

  const rest = new REST({ version: "9" }).setToken(config.TOKEN)

  try {
      bot.guilds.cache.forEach(async (i) => {
        const CLIENT_ID = bot.user.id
        const GUILD_ID = i.id
        const awcommands = new Array(...commands)

        if (GUILD_ID === "570707745028964353") {
          await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
          })
          return
        }
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
          body: awcommands.splice(9, 11),
        })
      })
  } catch (error) {
    console.error(error)
  }

  job.addCallback(() => {
    const gameScan = async (gameid, voiceChannelId) => {
      const game = await getGO(gameid)
      const channel = bot.channels.resolve(voiceChannelId)
      game >= 2000
        ? await channel.setName(`🟢 Online: ${game}`)
        : await channel.setName(`🔴 Offline: ${game}`)
    }

    gameScan(454120, "874205752837943337")
    gameScan(1063730, "874577935565193237")
    gameScan(306130, "1006092983814332426")

    //Random Channel Name
    const ren = bot.channels.resolve("896791375511687219")
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
    ]
    ren.setName(arrName[rand(0, arrName.length)])
  })
})

bot.on("guildMemberUpdate", async (oldMember, newMember) => {
  let role = await roledb.find({})
  role.forEach(async (r) => {
    const roleId = r.roleId
    if (
      newMember._roles.find((x) => x === roleId) &&
      !oldMember._roles.find((x) => x === roleId)
    ) {
      const tk = await newMember.guild.roles.fetch(roleId)
      if (!newMember.user.username.match(/^[a-zA-Z0-9а-яА-Я]+$/)) {
        await newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname("Dirt")
      }
      const icon = tk.name.replace(/[A-z0-9 _.-]/g, "")
      if (newMember.nickname) {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(
            newMember.nickname.replace(/[^A-z0-9]/g, "") + " " + icon
          )
      } else {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(newMember.user.username + " " + icon)
      }
    } else if (
      oldMember._roles.find((x) => x === roleId) &&
      !newMember._roles.find((x) => x === roleId)
    ) {
      if (newMember.nickname) {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(newMember.nickname.replace(/[^A-z0-9]/g, ""))
      } else {
        newMember.guild.members.cache
          .get(newMember.user.id)
          .setNickname(newMember.user.username)
      }
    }
  })
})

bot.on("messageCreate", async (message) => {
  try {
    if (message.author.bot || message.channel.type == "dm") return

    let user = await userdb.findOne({ userid: message.member.user.id })
    if (!user) {
      user = await userdb.create({
        userid: message.member.user.id,
      })
    }

    const args = message.content.trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    const currency = bot.emojis.cache.get(lang[4])
    let ubot = await userdb.findOne({ userid: bot.user.id })

    const updateBalance = async (price) => {
      user.balance = user.balance - price
      ubot.balance = ubot.balance + price
      await user.save()
      await ubot.save()
    }

    if (command === "-cash") {
      if (user.acclvl < 10) return
      await updateBalance(1)
    }

    if (command === "setacc") {
      const ct = +message.content.split(" ")[1]
      if (user.acclvl !== 27) return
      const userid = message.content.split(" ")[2]
      try {
        await message.guild.members.fetch(userid)
      } catch (e) {
        return message.reply("Not Correct UserID")
      }
      const user1 = await userdb.findOne({ userid })
      if (ct >= 0 && ct <= 10) {
        user1.acclvl = ct
        await user1.save()
        message.reply(`User: <@!${userid}> acclvl now ${ct}`)
      }
    }

    if (command === "addrole") {
      if (user.acclvl < 10) return
      const ct = message.content.split(" ")[1]
      const roleCheck = await message.guild.roles.fetch(ct)
      if (roleCheck === null) return message.reply("Not Correct RoleID")
      let role = await roledb.findOne({ roleId: ct })
      if (!role) {
        role = await roledb.create({ roleId: ct })
        message.reply(`Successfully added role: ${roleCheck.name}`)
      } else {
        message.reply(`Already has role: ${roleCheck.name}`)
      }
    }

    if (command === "delrole") {
      if (user.acclvl < 10) return
      const ct = message.content.split(" ")[1]
      const roleCheck = await message.guild.roles.fetch(ct)
      if (roleCheck === null) return message.reply("Not Correct RoleID")
      let role = await roledb.findOne({ roleId: ct })
      if (role) {
        role = await roledb.deleteOne({ roleId: ct })
        message.reply(`Successfully delete role: ${roleCheck.name}`)
      }
    }

    if (command === "play") {
      message.member.roles.cache.some((role) => ["*"].includes(role.name))
        ? (price = 0)
        : (price = 6)
      if (user.balance > price) {
        const query = args[0]
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
              ).stream
              // we must return readable stream or void (returning void means telling discord-player to look for default extractor)
            }
          },
        })

        try {
          if (!queue.connection)
            await queue.connect(message.member.voice.channel)
        } catch {
          queue.destroy()
          return await message.reply("Could not join your voice channel!")
        }

        const track = (
          await player.search(query, {
            requestedBy: message.author,
          })
        ).tracks[0]
        if (!track)
          return await message.reply(`❌ | Track **${query}** not found!`)
        queue.play(track)
        await updateBalance(price)
        await message.reply(
          `${message.author.username} оплатил песню ${
            track.title
          } с вас снято ${price} ${currency}, у вас ${
            user.balance - price
          } ${currency}`
        )
        message.delete()
      } else {
        return message.reply(
          `Недостаточно средств, у вас ${user.balance} ${currency}`
        )
      }
    }

    if (command === "skip") {
      message.member.roles.cache.some((role) => ["*"].includes(role.name))
        ? (price = 0)
        : (price = 4)
      if (user.balance > price) {
        const queue = player.getQueue(message.guild)
        if (!queue) return
        queue.skip()
        await updateBalance(price)
        await message.reply(
          `${
            message.author.username
          } пропустил песню с вас снято ${price} ${currency}, у вас ${
            user.balance - price
          } ${currency}`
        )
        message.delete()
      } else {
        return message.reply(
          `Недостаточно средств, у вас ${user.balance} ${currency}`
        )
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
      const top = await userdb.find().sort({ balance: -1 })
      const top10 = top.slice(0, 10)
      const top10map = top10.map((x) => {
        let nickname = "Unknown"
        if (x.userid) {
          if (!message.guild.members.cache.get(x.userid)) {
            nickname = bot.users.cache.get(x.userid).username
          } else {
            nickname =
              message.guild.members.cache.get(x.userid).nickname ||
              message.guild.members.cache.get(x.userid).user.username
          }
        }
        return `${nickname} - ${x.balance} ${currency}`
      })
      message.reply({
        content: top10map.join("\n"),
      })
    }

    if (command === "fib") {
      const cmt = message.content.split("fib ")[1]
      if (!Number(cmt)) return
      const fibArr = []
      for (let i = 0; i < cmt; i++) {
        const fomula = Math.floor(
          (((1 + Math.sqrt(5)) / 2) ** i - ((1 - Math.sqrt(5)) / 2) ** i) /
            Math.sqrt(5)
        )
        if (fomula >= Number.MAX_SAFE_INTEGER) break
        fibArr.push(fomula)
      }
      message.reply(fibArr.join(" "))
    }

    if (command === "gn") {
      const cmt = +message.content.split("gn ")[1] || 1
      const fi = (Math.sqrt(5) + cmt) / 2
      const q = await message.reply(`(√5+${cmt})/2`)
      setTimeout(() => q.edit(String(fi)), 1000)
    }

    if (command === "roll") {
      const cmt = +message.content.split("roll ")[1] || 1
      if (cmt > 100 || cmt < 0)
        return message.reply("Слишком большое или маленькое число")
      const mrr = await message.reply(`Ролл...`)
      let i = 0
      const randNumber = setInterval(() => {
        i++
        let qube = Math.floor(Math.random() * cmt) + 1
        if (i == 27) {
          clearInterval(randNumber)
          mrr.edit(`Выпало **${qube}**`)
          return
        }
        mrr.edit(`Выпало ${qube}`)
      }, 500)
    }

    if (command === "象" && message.channel.guild.id === "570707745028964353") {
      let button = (gamen, emojid, style, cbid) =>
        new ButtonBuilder()
          .setLabel(gamen)
          .setEmoji(emojid)
          .setStyle(style)
          .setCustomId(cbid)

      const buttonGX = [
        button("New World", "921408850253471837", ButtonStyle.Secondary, "nwr"),
        button(
          "Fallut 76",
          "861748887059693608",
          ButtonStyle.Secondary,
          "fl76"
        ),
        button(
          "Black Desert",
          "861747964552675329",
          ButtonStyle.Secondary,
          "bdo"
        ),
      ]
      const buttonGY = [
        button("TESO", "921418213928083556", ButtonStyle.Secondary, "teso"),
        button(
          "Gta 5 RP",
          "638135208612200459",
          ButtonStyle.Secondary,
          "gta5rp"
        ),
        button("Sunflower Land", "🌻", ButtonStyle.Secondary, "sfl"),
      ]
      const buttonGZ = [
        button(
          "ArcheWorld",
          "1100480951005499392",
          ButtonStyle.Secondary,
          "aw"
        ),
      ]
      const buttonAX = [
        button("Archive Key", "🔒", ButtonStyle.Secondary, "archKey"),
        button(
          "Linux User",
          "695326940617506826",
          ButtonStyle.Secondary,
          "linux"
        ),
      ]

      let buttonRowG = new ActionRowBuilder().addComponents(buttonGX)
      let buttonRowG1 = new ActionRowBuilder().addComponents(buttonGY)
      let buttonRowG2 = new ActionRowBuilder().addComponents(buttonGZ)
      let buttonRowA = new ActionRowBuilder().addComponents(buttonAX)
      await message.channel.send({
        content: "**Выбор роли для доступа к каналам** \nИгры:",
        components: [buttonRowG],
      })
      await message.channel.send({
        content: " ",
        // files: [
        //   "https://cdn.discordapp.com/attachments/613491096206573597/921660486330757210/separator.gif",
        // ],
        components: [buttonRowG1],
      })
      await message.channel.send({
        content: " ",
        components: [buttonRowG2],
      })
      await message.channel.send({
        content: "Другое:",
        components: [buttonRowA],
      })
    }

    if (message.channelId) {
      await messCoin(message, bot, lang, collection, userdb)
    }
  } catch (e) {
    console.log(`error ${e}`)
  }
})

bot.on("interactionCreate", async (inter) => {
  const currency = bot.emojis.cache.get(lang[4])
  const sflcurr = bot.emojis.cache.get("1073936545280688229")
  const bslt = bot.emojis.cache.get("1100983758951301202")
  if (!inter.isChatInputCommand()) return

  try {
    if (!inter.guildId) {
      return await inter.reply(`Can't work in DM ${inter.user.username}`)
    }

    const command = inter.commandName

    let user = await userdb.findOne({ userid: inter.member.user.id })
    if (!user) {
      user = await userdb.create({ userid: inter.member.user.id })
    }

    // slash commands here
    const ether_port =
      "wss://polygon-mainnet.g.alchemy.com/v2/4Aw02n_3OEU1MpVrp6m1TqyYA86CR9ob"
    const web3 = new Web3(ether_port)
    const sflAbi = require("./sfl_abi.json")

    const iUser = inter.options.getUser("user") || 0
    const userDB = await userdb.findOne({ userid: iUser.id })

    switch (command) {
      case "balance":
        return await inter.reply({
          content: `${lang[3]} ${user.balance} ${currency}`,
          ephemeral: true,
        })
      case "walletset":
        user.nonce = Math.floor(Math.random() * 1000000)
        await user.save()
        await inter.reply({
          content: `Connect Wallet: [Connecton URL](https://grk.pw/connect?id=${inter.member.user.id}&nonce=${user.nonce}&sig=dis&guildid=${inter.guildId})`,
          ephemeral: true,
          fetchReply: true,
        })
        break
      case "bumpkin":
        if (!userDB.web3)
          return await inter.reply(
            `Пользователь ${iUser.username} не подключил кошелек`
          )
        const bumpContract = new web3.eth.Contract(
          sflAbi,
          "0x624E4fa6980Afcf8EA27BFe08e2fB5979b64DF1C"
        )
        const bumpId = await bumpContract.methods
          .tokenOfOwnerByIndex(userDB.web3, 0)
          .call()
        if (!bumpId) return await inter.reply("Пользователь не имеет бампкин")
        const bumpUri = await bumpContract.methods.tokenURI(bumpId).call()
        const bumpInfo = await fetch(bumpUri).then((res) => res.json())
        const bumpEmbed = new EmbedBuilder()
          .setColor(0xea623d)
          .setTitle(bumpInfo.name)
          .setURL(bumpInfo.image)
          .setImage(bumpInfo.image)
          .setTimestamp(Date.now())
          .setAuthor({
            name: iUser.username,
            iconURL: `https://cdn.discordapp.com/avatars/${iUser.id}/${iUser.avatar}.png`,
          })
          .setFooter({
            text: "Bumpkin",
            iconURL:
              "https://cdn.discordapp.com/attachments/975967980443795477/1064819066914738206/slf.png",
          })
        return await inter.reply({ embeds: [bumpEmbed] })
      case "farm":
        if (!userDB.web3)
          return await inter.reply(
            `Пользователь ${iUser.username} не подключил кошелек`
          )
        const sflContract = new web3.eth.Contract(
          sflAbi,
          "0x2B4A66557A79263275826AD31a4cDDc2789334bD"
        )
        try {
          const farmId = await sflContract.methods
            .tokenOfOwnerByIndex(userDB.web3, 0)
            .call()
          if (!farmId) return await inter.reply("Пользователь не имеет ферм")
          const farmInfo = await fetch(
            `https://api.sunflower-land.com/nfts/farm/${farmId}`
          ).then((res) => res.json())
          const inventory = await fetch(
            `https://api.sunflower-land.com/visit/${farmId}`
          ).then((res) => res.json())
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
          **Balance**: ${
            Math.round(inventory.state.balance * 100) / 100
          } ${sflcurr}
          **Plots**: X ⛱
          `
            )
            .setFooter({
              text: `Status: ${farmInfo.attributes[0].value}`,
              iconURL:
                "https://cdn.discordapp.com/attachments/975967980443795477/1064819066914738206/slf.png",
            })
          await inter.reply({ embeds: [farmEmbed] })
        } catch (e) {
          await inter.reply({ content: "Wait 10 second", ephemeral: true })
        }
        return
      case "pay":
        const cmt = inter.options.getNumber("amount")
        if (iUser.id === inter.member.user.id)
          return await inter.reply("Нельзя перевести самому себе")
        if (!Number(cmt)) return await inter.reply("Неверное число")
        if (user.balance < cmt) return await inter.reply("Недостаточно средств")
        if (!userDB) {
          await userdb.create({ userid: iUser.id })
        }
        await userdb.findOneAndUpdate(
          { userid: inter.member.user.id },
          { $inc: { balance: -cmt } }
        )
        await userdb.findOneAndUpdate(
          { userid: iUser.id },
          { $inc: { balance: cmt } }
        )
        return await inter.reply(
          `Вы перевели ${cmt} ${currency} пользователю ${iUser.username}`
        )
      case "fine":
        const fine = inter.options.getNumber("amount")
        if (!Number(fine)) return await inter.reply("Неверное число")
        if (user.acclvl < 2) return await inter.reply("Недостаточно прав")
        if (user.acclvl < 27) {
          if (fine < 0 || fine > 1000)
            return await inter.reply("Число должно быть от 0 до 1000")
        }
        if (!userDB) {
          await userdb.create({ userid: iUser.id })
        }
        await userdb.findOneAndUpdate(
          { userid: iUser.id },
          { $inc: { fine: fine } }
        )
        return inter.reply(
          `Вы выставили штраф ${fine} 💰 пользователю <@!${iUser.id}>`
        )
      case "checkfine":
        if (!iUser) return await inter.reply("Пользователь не найден")
        if (!userDB) {
          await userdb.create({ userid: iUser.id })
        }
        return await inter.reply({
          content: `Штраф пользователя ${iUser.username} составляет ${userDB.fine} 💰`,
          ephemeral: true,
        })
      case "popusk":
        if (user.acclvl < 2) return await inter.reply("Недостаточно прав")
        const popusk = inter.options.getString("name")
        const Jimp = require("jimp")
        // Generate a random image using the Jimp library
        const width = 400
        const height = 100
        const bgColor = Jimp.rgbaToInt(58, 23, 0, 0)
        const image = new Jimp(width, height, bgColor)
        //load font on path
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
        const text = `${popusk}\n Now officaly POPUSK`
        const lines = text.split("\n")

        // Print each line of text to the image
        let y =
          (image.bitmap.height - lines.length * font.common.lineHeight) / 2
        for (const line of lines) {
          const textWidth = Jimp.measureText(font, line)
          image.print(font, (image.bitmap.width - textWidth) / 2, y, line)
          y += font.common.lineHeight
        }

        // Convert the image to a buffer and send it as a photo message
        const buffer = await image.getBufferAsync(Jimp.MIME_PNG)
        const file = new AttachmentBuilder(buffer)
        const popEmbed = new EmbedBuilder()
          .setColor(0xea623d)
          .setTitle("Попуск")
          .setTimestamp(Date.now())
          .setDescription(`Игрок **${popusk}** теперь официально попуск`)
          .setImage(
            "https://media.discordapp.net/attachments/1070730397618552932/1085917127644565515/3.png"
          )
        return await inter.reply({ embeds: [popEmbed] })
      case "awinfo":
        const axios = require("axios")
        const { parse } = require("node-html-parser")
        if (!userDB || !userDB.web3)
          return await inter.reply({
            content: `Пользователь ${iUser.username} не подключил кошелек`,
            ephemeral: true,
          })
        const nasaInfo = await axios.get(
          `https://scope.nasa.xbluesalt.io/account/${userDB.web3}`
        )
        const htmlData = parse(nasaInfo.data)
        const balBSLT = htmlData.querySelector(
          ".tx-detail .row .row-value"
        ).innerHTML
        const parsBSLT = balBSLT
          .replace("<span>", " ")
          .replace("</span>", bslt)
          .replace("BSLT", "")
        const infoBslt = (x) =>
          axios
            .post(
              `https://scope.nasa.xbluesalt.io/ScopeListSearchByWallet?pageNo=${x}&hash=${userDB.web3}`,
              {
                baseURL: "https://scope.nasa.xbluesalt.io",
              },
              {
                headers: {
                  Cookie: "XL-REGION=NASA",
                  Referer: `https://scope.nasa.xbluesalt.io/account/${userDB.web3}?pageNo=1`,
                },
              }
            )
            .then((resp) => resp.data.scopes)
            .catch((error) => {
              console.log("create user api error:", error)
            })
        await inter.deferReply() //discord think function

        // parse bslt scope info to 1 array
        const transactArr = []
        for (let i = 1; i; i++) {
          const q = await infoBslt(i)
          if (q.length !== 0) {
            transactArr.push(...q.slice(0, 20))
          } else {
            break
          }
        }

        // add timestamp to bslt array
        for (let i = 0; i < transactArr.length; i++) {
          const o = transactArr[i]
          const dateBL = Date.parse(o.time.replace("/ ", "").replace("+0", ""))
          o.timestamp = dateBL / 1000
        }

        // find today start timestamp
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const timestampStart = Math.floor(todayStart.getTime() / 1000)
        const rentTime = 28 * 24 * 60 * 60

        // make userInfo object on arrays contain infomration on filtered tarsact array
        const userInfo = {
          auction: transactArr.filter((a) => a.txType === "Auction"),
          rent: transactArr.filter((a) => a.txType === "Rental Fee"),
          deposit: transactArr
            .filter((a) => a.txType === "Deposit")
            .reduce((b, c) => +b + +c.amount, 0),
          windraw: transactArr
            .filter((a) => a.txType === "Withdrawal")
            .reduce((b, c) => +b + +c.amount - 10, 0),
          activeRent: transactArr
            .filter((a) => a.txType === "Rental Fee")
            .filter(
              (b) => b.timestamp + rentTime > Math.floor(Date.now() / 1000)
            ),
          aucSell: transactArr
            .filter((a) => a.txType === "Auction")
            .filter((b) => b.to === userDB.web3),
          aucSellBT: transactArr
            .filter((a) => a.txType === "Auction")
            .filter((b) => b.to === userDB.web3)
            .reduce((c, d) => +c + +d.amount - +d.amount * 0.1, 0),
          aucBuy: transactArr
            .filter((a) => a.txType === "Auction")
            .filter((b) => b.from === userDB.web3),
          aucBuyBT: transactArr
            .filter((a) => a.txType === "Auction")
            .filter((b) => b.from === userDB.web3)
            .reduce((c, d) => +c + +d.amount, 0),
          todayTransact: transactArr.filter(
            (a) => a.timestamp > timestampStart
          ),
        }

        const rentInfo = (() => {
          let endRent = ""
          for (let i = 0; i < userInfo.activeRent.length; i++) {
            endRent += `\nТера №${i + 1} = <t:${
              userInfo.activeRent[i].timestamp + rentTime
            }:F>`
          }
          return endRent
        })()

        // main embed message
        const awEmbed = new EmbedBuilder()
          .setColor(0x6fa8dc)
          .setTitle("Инфо")
          .setAuthor({
            name: iUser.username,
            iconURL: `https://cdn.discordapp.com/avatars/${iUser.id}/${iUser.avatar}.png`,
          })
          .setDescription(
            `Баланс: **${parsBSLT}**
            Транзакций: **${transactArr.length}**
            Пополнение: **${userInfo.deposit}** ${bslt}
            Вывод: **${userInfo.windraw}** ${bslt}
            Продаж: **${
              userInfo.aucSell.length
            }** на сумму **${userInfo.aucSellBT.toFixed(2)}** ${bslt}
            Покупок: **${
              userInfo.aucBuy.length
            }** на сумму **${userInfo.aucBuyBT.toFixed(2)}** ${bslt}
            Аренд земли: **${userInfo.rent.length}**
            Активных Аренд: **${userInfo.activeRent.length}**`
          )
          .setFooter({
            text: `ArchWorld`,
            iconURL:
              "https://cdn.discordapp.com/attachments/461187392074940417/1101535065881710713/archworld.png",
          })

        // ternar check user have active rent land or not if not don't send land info
        userInfo.activeRent.length > 0
          ? awEmbed.setFields([
              {
                inline: false,
                name: "Время до конца Аренды",
                value: rentInfo,
              },
            ])
          : null
        return await inter.editReply({ embeds: [awEmbed] })
      default:
        return await inter.reply("Команда не найдена")
    }
  } catch (e) {
    console.log(`error: ${e}`)
  }
})

app.post("/dis/connect:user_id", async (req, res) => {
  const user = await userdb.findOne({ userid: req.body.userId })
  // res.header("Access-Control-Allow-Origin", "*");
  if (!user) {
    res.send({ error: "User not found" }).status(404)
  } else {
    const guildArr = []
    bot.guilds.cache.forEach((o) => {
      return guildArr.push(o.id)
    })
    if (!guildArr.includes(req.body.guildid)) {
      return res.send({ error: "Guild not found in bot" }).status(400)
    }
    if (!req.body.guildid) {
      return res.send({ error: "Guild id not found" }).status(400)
    }
    if (user.nonce.toString() !== req.body.nonce) {
      return res.send({ error: "Nonce not match" }).status(400)
    }
    if (user.web3) {
      return res.send({ error: "User already connected" }).status(400)
    }
    bot.users.cache
      .get(req.body.userId)
      .send(`Wallet connected: ${req.body.address}`)
    bot.guilds.cache
      .get("570707745028964353")
      .members.cache.get(req.body.userId)
      .roles.add("1041269388139057172")
      .catch(null)
    user.guildid = req.body.guildid
    user.web3 = req.body.address
    user.nonce = Math.floor(Math.random() * 1000000)
    user.save()
    res
      .send({
        msg: "Wallet connected. Please close this page and check for a message form the Server Dino bot",
      })
      .status(200)
  }
})

bot.on("interactionCreate", async (button) => {
  if (!button.isButton()) return

  const roleGiver = async (rid) => {
    const gRole = button.member.guild.roles.cache.find((role) => role.id == rid)
    const member = button.member
    if (member.roles.cache.has(gRole.id)) {
      member.roles.remove(gRole)
      await button.reply({
        content: `Удалена роль <@&${gRole.id}>`,
        ephemeral: true,
      })
    } else {
      member.roles.add(gRole)
      await button.reply({
        content: `Добавлена роль <@&${gRole.id}>`,
        ephemeral: true,
      })
    }
  }

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
    : button.customId == "linux" && roleGiver("862531032376148018")
})

const deleteAllGlobalCommands = async () => {
  try {
    await rest.put(Routes.applicationCommands(bot.user.id), { body: [] })
    console.log("Successfully deleted all application commands.")
  } catch (e) {
    console.log(e)
  }
}

const stdin = process.openStdin()

stdin.addListener("data", (d) => {
  d = d.toString().trim()
  if (d == "delg") {
    deleteAllGlobalCommands()
  }
})

process.on("uncaughtException", function (err) {
  console.error(err)
})

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
    console.log("MongoDB connected!!")
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err)
  })
