module.exports = async function ({bot, inter, user, lang}) {
    const currency = bot.emojis.cache.get(lang[4])

    bot.api.interactions(inter.id, inter.token).callback.post({
        data: {
            type: 4,
            data: {
                content: `${lang[3]} ${user.balance} ${currency}`,
                flags: 64
            }
        }
    })
}