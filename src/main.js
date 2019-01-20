require(__dirname + "/globals.js")
const fs = require("fs")
const client = new (require("discord.js")).Client( { autoReconnect: true } );

// This is the global commandList that other commands are added to.
const commandList = {
	commands: {
		meta: META_GENERAL,
		execute: (commands, message) => {
			let cmdList = {}
			Object.keys(commandList).forEach(command => {
				let actualCommand = commandList[command]

				if(actualCommand.meta.hidden == true) 
					return
				if(cmdList[actualCommand.meta.category] == undefined) 
					cmdList[actualCommand.meta.category] = []

				cmdList[actualCommand.meta.category].push(command)
			})

			let output = ""

			Object.keys(cmdList).forEach(cat => {
				output += "**" + cat + "**: \n"
				Object.keys(cmdList[cat]).forEach(command => {
					output += cmdList[cat][command] + ", "
				})
				output = output.substring(0, output.length-2) + "\n"
			})
			message.channel.send(output)
		}
	},
	test: {
		meta: META_GENERAL, 
		execute: (commands, message) => {
			let user = message.author

			let channel = message.mentions.channels.first()
			if(channel == undefined) {
				message.channel.send("Channel not found.")
				return
			}
			channel.fetchMessages({limit: 100}).then(all => {
				let t = ""
				all.forEach(i => {
					t += i.content + "\n"
				})
				fs.writeFileSync("output.txt", t)

			}).catch(e => console.log(e))
		}
	}	
}

// Loads from an external file that contains specific commands.
function apply(target) {
	let methods = Object.keys(target)
	methods.forEach(i => {
		commandList[i] = target[i]
	})
}

function getCommand(raw) {
	/*
	if(raw.content.substring(0, 42).toLowerCase() == "i knew you were trouble when you logged in") {
		return commandList["kick"]
	}
	if(raw.content.substring(0, 46).toLowerCase() == "we are never, ever, ever getting back together") {
		return commandList["ban"]
	}
	*/

	let splitCommand = raw.content.substring(1, raw.content.length).split(" ")

	if(isSymbolCommandTrigger(raw.content[0])) {
		if(commandList[splitCommand[0]] != null) {
			return commandList[splitCommand[0]]
		}
	}

	return undefined
}

apply(require(__dirname + "/markov.js"))
apply(require(__dirname + "/responses.js"))
//apply(require(__dirname + "/moderation.js"))

console.write("Connecting... ")

client.login(fs.readFileSync("token.txt", "utf-8").replace(/\r?\n|\r/g, ''))
client.on('error', console.error)
client.on("message", m => {
	// Ignore any bot messages
	if(m.author.id == client.user.id) return

	let command = getCommand(m)

	if(command != null) {
		if(command.meta.permissions <= getPermissionLevel(m.member.id, m.guild)) {
			console.write("Running command by " + getUsername(m) + ": " + m.content + "   ")
			command.execute(m.content.substring(1, m.content.length).split(" ").splice(1), m)
			console.write("\n")
		} else {
			console.write("forbidden.\n")
		}
	}
})

client.on("ready", () => {
	console.log("We are never ever getting back together.")
})

require(__dirname + "/events.js")(client)
