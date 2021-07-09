module.exports = async function (bot, lang) {
    
    bot.api.applications(bot.user.id).commands.post({
        data: {
            name: 'balance',
            description: lang[5]
        }
    })

    bot.api.applications(bot.user.id).commands.post({
        data: {
            name: 'mynumber',
            description: lang[7],

            options: [
                {
                    name: 'number',
                    description: 'Content of the embed',
                    type: 4,
                    required: true
                }
            ]
        }
    })

    bot.api.applications(bot.user.id).commands.post({
        data: {
            name: 'number',
            description: 'Search user number by @tag!',

            options: [
                {
                    name: 'tag',
                    description: 'write usertag here',
                    type: 6,
                    required: true
                }
            ]
        }
    })
}