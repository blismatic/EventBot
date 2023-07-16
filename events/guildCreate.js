const fs = require('node:fs');
const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`Just joined the server ${guild.id}`);
        // console.log(guild);
        const configGuildIds = Object.keys(config);
        if (configGuildIds.includes(guild.id)) {
            console.log('That\'s weird, this should never be triggered.');
        } else {
            const defaultGuildConfig = {
                "event": {
                    basePoints: 125,
                    repeatPointsModifier: 0.25,
                    timeBetweenTasks: 14400000,
                    timeBetweenThumbnailSwap: 3000
                },
                "teams": [
                    {
                        name: "Armadyl",
                        color: "#0073e5",
                        logo: "https://oldschool.runescape.wiki/images/Armadyl_symbol.png"
                    },
                    {
                        name: "Bandos",
                        color: "#6c4824",
                        logo: "https://oldschool.runescape.wiki/images/Bandos_symbol.png"
                    },
                    {
                        name: "Saradomin",
                        color: "#e5bb00",
                        logo: "https://oldschool.runescape.wiki/images/Saradomin_symbol.png"
                    },
                    {
                        name: "Zamorak",
                        color: "#e50000",
                        logo: "https://oldschool.runescape.wiki/images/Zamorak_symbol.png"
                    },
                    {
                        name: "Guthix",
                        color: "#009960",
                        logo: "https://oldschool.runescape.wiki/images/Guthix_symbol.png"
                    },
                    {
                        name: "Zaros",
                        color: "#9d4ede",
                        logo: "https://oldschool.runescape.wiki/images/Zaros_symbol.png"
                    },
                    {
                        name: "Seren",
                        color: "#7fffff",
                        logo: "https://oldschool.runescape.wiki/images/Seren_symbol.png"
                    },
                    {
                        name: "Tumeken",
                        color: "#545454",
                        logo: "https://oldschool.runescape.wiki/images/Tumeken_symbol.png"
                    },
                    {
                        name: "Elidinis",
                        color: "#4694a7",
                        logo: "https://oldschool.runescape.wiki/images/Elidinis_symbol.png"
                    },
                    {
                        name: "V",
                        color: "#cb861f",
                        logo: "https://oldschool.runescape.wiki/images/V_symbol.png"
                    }
                ],
                "discord": {
                    eventStaffRole_id: "828137113887047710",
                    eventDescriptionChannel_id: "866530521512149013",
                    sign_upsChannel_id: "866530562310012939",
                    tasksChannel_id: "866530671245000754",
                    resultsChannel_id: "866530648676499486",
                    submissionsChannel_id: "1127384294927638589"
                },
                "recap": {
                    title: "Event Name goes here",
                    subtitle: "Event Subtitle goes here",
                    welcome_message: "Hi <rsn>, let's recap what you accomplished!",
                    exit_message: "We hope to see you again soon!"
                }
            }
            config[guild.id] = defaultGuildConfig;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        }
    }
}