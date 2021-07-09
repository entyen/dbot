module.exports = async function ({bot, inter, user, lang}, embed, args, userdb, createAPIMessage){
    const description = args.find(arg => arg.name.toLowerCase() == 'number').value
    embed
        .setDescription(description)
        .setColor(0x2ab400)
    user = await userdb.updateOne({userid: inter.member.user.id}, {$set: {tel: description}})  

    bot.api.interactions(inter.id, inter.token).callback.post({
        data: {
            type: 4,
            data: await createAPIMessage(inter, embed)
        }
    })
}