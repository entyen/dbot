const Promise = require('bluebird')
const Discord = require('discord.js')
const mongoose = require('mongoose')
const cron = require('node-cron')
const { Player } = require('discord-player')

const fs = require('fs')
const tea = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
const lang = JSON.parse(fs.readFileSync('en.json', 'utf-8'))

const bot = new Discord.Client()
const collection = new Discord.Collection()
const embed = new Discord.MessageEmbed()
bot.login(tea.TOKEN)
const player = new Player(bot, {
    enableLive: false,
    ytdlDownloadOptions: {
        filter: 'audioonly'
    }
})
bot.player = player

const userSchem = require('./schema/data.js')
const indexCmds = require('./commands/index')
const balanceCmd = require('./commands/balance')
const myNumberCmd = require('./commands/mynumber')
const NumberCmd = require('./commands/number')
const messCoin = require('./jobs/mess_coin.js')
//const userdb = mongoose.model(inter.guild_id, userSchem)
const userdb = mongoose.model('570707745028964353', userSchem)
const disbut = require('discord-buttons');
disbut(bot) 

async function deleteAllGlobalCommands(){
let GCOMMANDS = await bot.api.applications(bot.user.id).commands.get()
for(i = 0; i<GCOMMANDS.length;i++){
  await bot.api.applications(bot.user.id).commands(GCOMMANDS[i].id).delete()
}}

bot.on('ready', async () => {
    console.log(`Logged in as ${bot.user.tag}!`)
    const currency = bot.emojis.cache.get(lang[4])
    let ubot = await userdb.findOne({ userid: bot.user.id })
    bot.user.setActivity(`${ubot.balance} Aden`, {
        type: 'PLAYING'
    }).catch(console.error)
    //deleteAllGlobalCommands()
    indexCmds(bot, lang)

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
            lang
        }

        if(command == 'balance') {
            balanceCmd(ctx)
            return
        }

        if(command == 'mynumber') {
            myNumberCmd(ctx, embed, args, userdb, createAPIMessage)
            return
        }

        if(command == 'number') {
            NumberCmd(ctx, embed, args, userdb, createAPIMessage)
            return
        }

    } catch (e) {
        console.log(e)
    }
    })

    bot.player.on('trackStart', async (message, track) => {
        message.channel.send(
        embed
            .setDescription(`Сейчас играет [${track.title}](${track.url})`)
            .setColor(0x2AB400)
        )
        .then((message) => {
            message.react('👍')
            message.react('👎')
        })
        .catch(console.error)

        bot.on('messageReactionAdd', async (reaction, user) => {
    	if (reaction.partial) {
    		try {
    			await reaction.fetch();
    		} catch (error) {
    			console.error('Something went wrong when fetching the message: ', error);
    			return;
    		}
    	}

        if (reaction.count == 4 && reaction.emoji.name == '👎') {
            //await bot.player.skip(message)
            await message.channel.send(`3 человека проголосовали за пропуск песня пропущена.`)
        }

        })

    })

    bot.player.on('queueEnd', async () => {
        bot.user.setPresence({ activity: { name: `${ubot.balance} Aden`, type: 'PLAYING' }, status: 'online' })
        .catch(console.error)
    })

    bot.on('message', async (message) => { 
        try {

        if (message.author.bot) return
        if (message.channel.type == 'dm') return

        let user = await userdb.findOne({ userid: message.member.user.id })
        if (!user){
          user = await userdb.create({ userid: message.member.user.id, balance: 0, tel: null, bl: 0})  
        }

        const args = message.content.trim().split(/ +/g)
        const command = args.shift().toLowerCase()
        const currency = bot.emojis.cache.get(lang[4])

        if(command === 'play'){
            message.member.roles.cache.some(role =>['*'].includes(role.name)) ? price = 0 : price = 6 - 6
            message.delete()
            .catch(console.error)
            if (user.balance > price){
                //await bot.player.play(message, args[0])
                await userdb.updateOne({userid: message.author.id}, {$set: {balance: user.balance - price}}) 
                await userdb.updateOne({userid: 806351729750573106}, {$set: {balance: ubot.balance + price}}) 
                await message.reply(`Вы оплатили песню с вас снято ${price} ${currency}, у вас ${user.balance - price} ${currency}`)
            } else {
                return message.reply(`Недостаточно средств, у вас ${user.balance} ${currency}`)
            }
        }

        if(command === 'skip'){
            message.member.roles.cache.some(role =>['*'].includes(role.name)) ? price = 0 : price = 4 - 4
            message.delete()
            if (user.balance > price){
                //await bot.player.skip(message)
                await userdb.updateOne({userid: message.author.id}, {$set: {balance: user.balance - price}}) 
                await userdb.updateOne({userid: 806351729750573106}, {$set: {balance: ubot.balance + price}}) 
                await message.reply(`Вы пропустили песню с вас снято ${price} ${currency}, у вас ${user.balance - price} ${currency}`)
            } else {
                return message.reply(`Недостаточно средств, у вас ${user.balance} ${currency}`)
            }
        }

        if(command === 'balanc') {
                //user = await userdb.findOne({ userid: message.content.split(' ')[1] })
                //message.reply(`${user.balance}`)
                console.log(message.mentions.members.first())
        }

        if(command === '象' && message.channel.guild.id === '570707745028964353') {
            let buttonG0 = new disbut.MessageButton()
                .setLabel('Black Desert')
                .setEmoji('861747964552675329')
                .setStyle('grey')
                .setID('bdo');
            let buttonG1 = new disbut.MessageButton()
                .setLabel('Fallout 76')
                .setEmoji('861748887059693608')
                .setStyle('grey')
                .setID('fl76')
            let buttonG2 = new disbut.MessageButton()
                .setLabel('Gta 5 RP')
                .setEmoji('638135208612200459')
                .setStyle('grey')
                .setID('gta5rp')
            let buttonA0 = new disbut.MessageButton()
                .setLabel('Archive Key')
                .setEmoji('🔒')
                .setStyle('grey')
                .setID('archKey')
            let buttonA1 = new disbut.MessageButton()
                .setLabel('Linux User')
                .setEmoji('695326940617506826')
                .setStyle('grey')
                .setID('linux')
            let buttonRowG = new disbut.MessageActionRow()
                .addComponent(buttonG0)
                .addComponent(buttonG1)
                .addComponent(buttonG2)
            let buttonRowA = new disbut.MessageActionRow()
                .addComponent(buttonA0)
                .addComponent(buttonA1)
            message.channel.send('**Выбор роли для доступа к каналам** \nИгры:', { component: buttonRowG })
            message.channel.send('Другое:', { component: buttonRowA })
        }

        if(command === 'contracts') {
            let button = new disbut.MessageButton()
                .setLabel('Мясо')
                .setEmoji('855374018546368522')
                .setStyle('blurple')
                .setID('meat');
            let button2 = new disbut.MessageButton()
                .setLabel('Рыба')
                .setEmoji('855374018546368522')
                .setStyle('blurple')
                .setID('fish')
            let buttonRow = new disbut.MessageActionRow()
                .addComponent(button)
                .addComponent(button2)
            message.channel.send('Hey', { component: buttonRow })
        }

        if (message.channel.type == 'text') {
            messCoin(message, bot, user, lang, collection, userdb)
        }

        } catch (e) {
        console.log(e)
        }
    })

    bot.on('clickButton', async (button) => {

        const roleGiver = async (gRole) => {
            const member = button.clicker.member
            if (member.roles.cache.has(gRole.id)) {
            member.roles.remove(gRole)
            await button.reply.send(`Удалена роль <@&${gRole.id}>`, { ephemeral: true })
            } else {
            member.roles.add(gRole)
            await button.reply.send(`Добавлена роль <@&${gRole.id}>`, { ephemeral: true })
            }
        }

        if (button.id == 'bdo') {
            const gRole = button.message.guild.roles.cache.find(role => role.id == "796756163135930389")
            roleGiver(gRole)
        }

        if (button.id == 'gta5rp') {
            const gRole = button.message.guild.roles.cache.find(role => role.id == "862521544944386058")
            roleGiver(gRole)
        }

        if (button.id == 'fl76') {
            const gRole = button.message.guild.roles.cache.find(role => role.id == "797892063830999080")
            roleGiver(gRole)
        }

        if (button.id == 'archKey') {
            const gRole = button.message.guild.roles.cache.find(role => role.id == "861743745083244586")
            roleGiver(gRole)
        }

        if (button.id == 'linux') {
            const gRole = button.message.guild.roles.cache.find(role => role.id == "862531032376148018")
            roleGiver(gRole)
        }

        if (button.id == 'meat') {
            await button.reply.send(`${button.clicker.user.username} = ${button.clicker.user.flags.bitfield}`)
            console.log(button.clicker.user.flags)
        }

        if (button.id == 'fish') {
            const gRole = button.message.guild.roles.cache.find(role => role.name == '*')
            console.log(gRole.id)
        }

    })

    bot.on('guildMemberAdd', member => {
        try {
        clonsole.log(`Cheeze!`)
        } catch(e) {
            console.log(e)
        }
    })

})

async function createAPIMessage(inter, content) {
    const apiMessage = await Discord.APIMessage.create(bot.channels.resolve(inter.channel_id), content)
        .resolveData()
        .resolveFiles()
    
    return { ...apiMessage.data, files: apiMessage.files }
}

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