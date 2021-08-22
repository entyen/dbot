const Promise = require('bluebird')
const Discord = require('discord.js')
const mongoose = require('mongoose')
const steam = require('steam-web')
const CronJob = require('cron').CronJob;

const fs = require('fs')
const tea = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
const lang = JSON.parse(fs.readFileSync('en.json', 'utf-8'))

const bot = new Discord.Client()
const collection = new Discord.Collection()
const embed = new Discord.MessageEmbed()
bot.login(tea.TOKEN)
const disbut = require('discord-buttons')
disbut(bot) 
const st = new steam({
  apiKey: tea.STEAM_TOKEN,
  format: 'json' //optional ['json', 'xml', 'vdf']
})

bot.commands = new Discord.Collection()

const dirCmd = async (dir) => {
    fs.readdir(dir, (err, files) => {

        if(err) console.log(`error ${err}`)
        let jsFile = files.filter(f => f.split('.').pop() === 'js')

        jsFile.forEach((f) => {
            const props = require(`${dir}${f}`)
            const cmd = f.split('.').slice(-2, -1).pop()
            bot.commands.set(cmd, props)
        })
    })
}

dirCmd('./commands/scommands/')

const userSchem = require('./schema/data.js')
const indexCmd = require('./commands/index')
const messCoin = require('./jobs/mess_coin.js')
const userdb = mongoose.model('570707745028964353', userSchem)

const getGO = (gameid) => {
    return new Promise(resolve => {
        st.getNumberOfCurrentPlayers({
        appid: gameid,
        callback: (err, data) => {
            resolve(!data ? data : data.response.player_count)
            }
        })
    })
}

const job = new CronJob('*/5 * * * *', null, false, 'Europe/Moscow')
let isRunning = false

bot.on('ready', async () => {
    console.log(`Logged in as ${bot.user.tag}!`)
    const currency = bot.emojis.cache.get(lang[4])
    let ubot = await userdb.findOne({ userid: bot.user.id })
    bot.user.setActivity(`${ubot.balance} Aden`, {
        type: 'PLAYING'
    }).catch(console.error)
    indexCmd(bot, lang)

    bot.ws.on('INTERACTION_CREATE', async inter => {
        try {
        if (!inter.guild_id) {
          bot.api.interactions(inter.id, inter.token).callback.post({
              data: {
                  type: 4,
                  data: {
                      content: `Can't work in DM ${inter.user.username}`
                  }
              }
          })
          return
        }

        const command = inter.data.name
        const args = inter.data.options

        let user = await userdb.findOne({ userid: inter.member.user.id })
        if (!user){
          user = await userdb.create({ userid: inter.member.user.id, balance: 0, tel: null, bl: 0})  
        }

        const ctx = {
            bot,
            inter,
            user,
            lang,
            embed,
            args,
            userdb,
            createAPIMessage
        }

        let commandfile

        if(bot.commands.has(command)) { 
            commandfile = bot.commands.get(command) 
        }

        try { 
            commandfile.run(ctx) 
        } catch (e) { console.log(`error: ${e}`) }

    } catch (e) {
        console.log(`error: ${e}`)
    }
    })
})

bot.on('message', async (message) => { 
    try {

    if (message.author.bot || message.channel.type == 'dm') return

    let user = await userdb.findOne({ userid: message.member.user.id })
    if (!user){
      user = await userdb.create({ userid: message.member.user.id, balance: 0, tel: null, bl: 0})  
    }

    const args = message.content.trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    const currency = bot.emojis.cache.get(lang[4])
   
    if(command === 'sb' && message.author.id == '159211173768593408') {            
        if (!isRunning) {
            job.start()
            job.addCallback(async () => {
            const sb = await getGO(454120)
            const c = message.guild.channels.resolve('874205752837943337')
            const nw = await getGO(1205550)
            const n = message.guild.channels.resolve('874577935565193237')
            sb >=2000 ? await c.setName(`🟢 Online: ${sb}`) : await c.setName(`🔴 Offline: ${sb}`)
            nw >=2000 ? await n.setName(`🟢 Online: ${nw}`) : await n.setName(`🔴 Offline: ${nw}`)
            bot.channels.cache.get('878075420342374402').send(`Date =${job.nextDates()} SB =${sb} NW =${nw}`)
        }) 
        isRunning = true
        bot.channels.cache.get('878075420342374402').send(`${Object.keys(job)} | ${job.nextDates()}`)
        message.channel.send(`Online counter turned on ${Object.keys(job._callbacks)}`)
        } else {
            message.channel.send(`Online counter still running ${Object.keys(job._callbacks)}`)
        }
    }

    if(command === '象' && message.channel.guild.id === '570707745028964353') {
        let button = (gamen, emojid, style, cbid) => {
            return new disbut.MessageButton()
            .setLabel(gamen)
            .setEmoji(emojid)
            .setStyle(style)
            .setID(cbid)

        }

        let buttonG0 = button('Black Desert', '861747964552675329', 'grey', 'bdo')
        let buttonG1 = button('Fallut 76', '861748887059693608', 'grey', 'fl76')
        let buttonG2 = button('TESO', '861382147666477096', 'grey', 'teso')
        let buttonG3 = button('Gta 5 RP', '638135208612200459', 'grey', 'gta5rp')
        let buttonG4 = button('STARBASE', '590188839197212700', 'grey', 'strBase')
        let buttonA0 = button('Archive Key', '🔒', 'grey', 'archKey')
        let buttonA1 = button('Linux User', '695326940617506826', 'grey', 'linux')

        let buttonRowG = new disbut.MessageActionRow()
            .addComponent(buttonG0)
            .addComponent(buttonG1)
            .addComponent(buttonG2)
            .addComponent(buttonG3)
            .addComponent(buttonG4)
        let buttonRowA = new disbut.MessageActionRow()
            .addComponent(buttonA0)
            .addComponent(buttonA1)
        message.channel.send('**Выбор роли для доступа к каналам** \nИгры:', { component: buttonRowG })
        message.channel.send('Другое:', { component: buttonRowA })
    }

    if (message.channel.type == 'text') {
        messCoin(message, bot, user, lang, collection, userdb)
    }

    } catch (e) {
    console.log(`error ${e}`)
    }
})

bot.on('clickButton', async (button) => {

    const roleGiver = async (rid) => {
        const gRole = button.message.guild.roles.cache.find(role => role.id == rid)
        const member = button.clicker.member
        if (member.roles.cache.has(gRole.id)) {
        member.roles.remove(gRole)
        await button.reply.send(`Удалена роль <@&${gRole.id}>`, { ephemeral: true })
        } else {
        member.roles.add(gRole)
        await button.reply.send(`Добавлена роль <@&${gRole.id}>`, { ephemeral: true })
        }
    }

    button.id == 'bdo' ? roleGiver('796756163135930389')
    : button.id == 'gta5rp' ? roleGiver('862521544944386058')
    : button.id == 'teso' ? roleGiver('863851712472154113')
    : button.id == 'fl76' ? roleGiver('797892063830999080')
    : button.id == 'strBase' ? roleGiver('870960525780058185')
    : button.id == 'archKey' ? roleGiver('861743745083244586')
    : button.id == 'linux' ? roleGiver('862531032376148018')
    : null

})

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
    const apiMessage = await Discord.APIMessage.create(bot.channels.resolve(inter.channel_id), content)
        .resolveData()
        .resolveFiles()
    
    return { ...apiMessage.data, files: apiMessage.files }
}

const deleteAllGlobalCommands = async () => {
    let GCOMMANDS = await bot.api.applications(bot.user.id).commands.get()
    GCOMMANDS.forEach(async c => {
    await bot.api.applications(bot.user.id).commands(c.id).delete()  
    })
}

const stdin = process.openStdin()

stdin.addListener("data", (d) => {
    d = d.toString().trim() 
    if (d == 'delg') { 
        deleteAllGlobalCommands()
        console.log('U delete all global commands')
     }
})

//DataBase
mongoose.connect(`mongodb://${tea.DBUSER}:${tea.DBPASS}@${tea.SERVER}/${tea.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(() => {
    console.log('MongoDB connected!!')
}).catch(err => {
    console.log('Failed to connect to MongoDB', err)
})