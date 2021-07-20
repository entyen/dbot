module.exports.run = async ({bot, inter, user, lang, embed, args, userdb, createAPIMessage}) => {
    const description = args.find(arg => arg.name.toLowerCase() == 'tag').value.replace(/[<@!>]/gi, '')
    user = await userdb.findOne({ userid: description })
    embed
        .setDescription(`<@!${description}> = ${user.tel}`)
        .setColor(0x00edff)

    bot.api.interactions(inter.id, inter.token).callback.post({
        data: {
            type: 4,
            data: await createAPIMessage(inter, embed)
        }
    })

}