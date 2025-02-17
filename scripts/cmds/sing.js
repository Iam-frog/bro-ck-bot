const axios = require('axios');

const savedSongs = []; // Stores user-added songs

module.exports = {
  config: {
    name: "sing",
    aliases: ["song"],
    version: "1.0",
    author: "UPoL 🐔",
    role: 0,
    shortDescription: "Search and download songs",
    longDescription: "Search for songs and download them. Manage a saved list of songs.",
    category: "music",
    guide: "{pn} <query>\n{pn} add <query>\n{pn} list\n{pn} del <number>\n{pn} edit <number> <newName>"
  },

  onStart: async function ({ args, message, event, api, globalGoat }) {
    const command = args[0]?.toLowerCase();
    const query = args.slice(1).join(" ");

    if (!command) {
      return api.sendMessage("❌ Please provide a song query or use a valid command.\n\n📌 Commands:\n- sing <query>\n- sing add <query>\n- sing list\n- sing del <number>\n- sing edit <number> <newName>", event.threadID);
    }

    // **Search and download a song**
    if (command !== "add" && command !== "list" && command !== "del" && command !== "edit") {
      try {
        const response = await axios.get(`http://152.70.49.30:6969/api/sing?query=${encodeURIComponent(query)}`);
        const { title, link, duration, filesize } = response.data;

        return api.sendMessage({
          body: `🎵 Song Found: ${title}\nDuration: ${Math.floor(duration)} sec\nSize: ${(filesize / 1024 / 1024).toFixed(2)} MB\n\n Downloading...`,
          attachment: await global.utils.getStreamFromURL(link)
        }, event.threadID);
      } catch (error) {
        return api.sendMessage("❌ Error: Could not fetch song. Try another search query.", event.threadID);
      }
    }

    // **Add song to the list**
    if (command === "add") {
      if (!query) return api.sendMessage("❌ Please provide a song name to add.", event.threadID);
      savedSongs.push(query);
      return api.sendMessage(`✅ Song "${query}" added to the list!`, event.threadID);
    }

    // **View song list**
    if (command === "list") {
      if (savedSongs.length === 0) return api.sendMessage("📂 No songs in the list. Use 'sing add <song>' to add one.", event.threadID);

      let listText = "🎶 Saved Songs:\n\n";
      savedSongs.forEach((song, index) => listText += `${index + 1}. ${song}\n`);

      return api.sendMessage(listText + "\n\n📌 Reply with a song number to search & download it.", event.threadID, (err, info) => {
        globalGoat.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          type: "selectSong"
        });
      });
    }

    // **Delete a song**
    if (command === "del") {
      const songIndex = parseInt(args[1]) - 1;
      if (isNaN(songIndex) || songIndex < 0 || songIndex >= savedSongs.length) {
        return api.sendMessage("❌ Invalid song number. Use 'sing list' to view songs.", event.threadID);
      }

      const removedSong = savedSongs.splice(songIndex, 1);
      return api.sendMessage(`🗑 Removed song: "${removedSong}"`, event.threadID);
    }

    // **Edit a song name**
    if (command === "edit") {
      const songIndex = parseInt(args[1]) - 1;
      const newName = args.slice(2).join(" ");

      if (isNaN(songIndex) || songIndex < 0 || songIndex >= savedSongs.length) {
        return api.sendMessage("❌ Invalid song number. Use 'sing list' to view songs.", event.threadID);
      }

      if (!newName) return api.sendMessage("❌ Please provide a new name for the song.", event.threadID);

      savedSongs[songIndex] = newName;
      return api.sendMessage(`✅ Song name updated to: "${newName}"`, event.threadID);
    }
  },

  onReply: async function ({ event, message, api, globalGoat, Reply }) {
    const { author, type } = Reply;

    if (event.senderID !== author) {
      return api.sendMessage("⚠️ You can only interact with your own song list.", event.threadID);
    }

    if (type === "selectSong") {
      const songIndex = parseInt(event.body.trim()) - 1;
      if (isNaN(songIndex) || songIndex < 0 || songIndex >= savedSongs.length) {
        return api.sendMessage("❌ Invalid song number. Please reply with a valid number from the list.", event.threadID);
      }

      const query = savedSongs[songIndex];
      try {
        const response = await axios.get(`http://152.70.49.30:6969/api/sing?query=${encodeURIComponent(query)}`);
        const { title, link, duration, filesize } = response.data;

        return api.sendMessage({
          body: `🎵 Song Found: ${title}\n⏱ Duration: ${Math.floor(duration)} sec\n📁 Size: ${(filesize / 1024 / 1024).toFixed(2)} MB\n\n📥 Downloading...`,
          attachment: await global.utils.getStreamFromURL(link)
        }, event.threadID);
      } catch (error) {
        return api.sendMessage("❌ Error: Could not fetch song. Try another search query.", event.threadID);
      }
    }

    globalGoat.onReply.delete(Reply.messageID);
  }
};
