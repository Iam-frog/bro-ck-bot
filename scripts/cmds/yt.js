const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "yt",
    category: "YouTube Downloader",
    author: "UPoL 🐔",
    role: 0,
    cooldown: 20,
    description: { en: "Search and download YouTube videos or songs effortlessly!" },
    guide: { en: "{pn} -v <query> | {pn} -a <query>" }
  },

  onStart: async ({ message, args }) => {
    if (args.length < 2) {
      return message.reply(
        "⚠️ Usage: `{pn} -v <query>` (for video) or `{pn} -a <query>` (for audio).\n\n" +
        "Example:\n- `!yt -v fainted`\n- `!yt -a fainted`"
      );
    }

    const formatFlag = args[0];
    const format = formatFlag === "-v" ? "video" : formatFlag === "-a" ? "audio" : null;

    if (!format) {
      return message.reply("❌ Invalid format! Use `-v` for video or `-a` for audio.");
    }

    const query = args.slice(1).join(" ");
    if (!query) {
      return message.reply("❌ Please provide a search query.");
    }

    try {
      const searchUrl = `https://upol-dev-yt.onrender.com/search?query=${encodeURIComponent(query)}`;
      const searchResponse = await axios.get(searchUrl);

      if (!searchResponse.data.result || searchResponse.data.result.length === 0) {
        return message.reply("❌ No results found. Try another keyword!");
      }

      const results = searchResponse.data.result.slice(0, 6); // Limit results to 6

      let body = `🔎 Search Results (${format === "video" ? "Videos" : "Audios"}):\n\n`;
      results.forEach((item, index) => {
        body += `🎉 ${index + 1}. ${item.title}\n` +
                `🔗 Link: ${item.link}\n` +
                `⏱️ Duration: ${item.duration} | 👁️ Views: ${item.views.toLocaleString()}\n\n`;
      });

      const reply = await message.reply({
        body: `${body}⚡ Reply with a number (1-6) to choose a ${format}!`
      });

      global.GoatBot.onReply.set(reply.messageID, {
        commandName: "yt",
        messageID: reply.messageID,
        results,
        format
      });
    } catch (error) {
      console.error(error);
      message.reply(`🚨 Error: Unable to search at the moment. Please try again later.\nDetails: ${error.message}`);
    }
  },

  onReply: async ({ Reply, message, event }) => {
    const { results, format, messageID } = Reply;
    const { body } = event;

    const choice = parseInt(body.trim());
    if (isNaN(choice) || choice < 1 || choice > results.length) {
      return message.reply("⚠️ Invalid Choice! Please pick a number between 1 and 6.");
    }

    const selected = results[choice - 1];
    if (!selected) {
      return message.reply("❌ Invalid selection. Please try again!");
    }

    message.unsend(messageID);

    try {
      const downloadUrl = `https://upol-dev-yt.onrender.com/download/${format}?url=${encodeURIComponent(selected.link)}`;
      const downloadResponse = await axios.get(downloadUrl);

      if (!downloadResponse.data.result || !downloadResponse.data.result.url) {
        return message.reply("❌ Failed to fetch the download link. Try again later!");
      }

      const fileUrl = downloadResponse.data.result.url;
      const fileExtension = format === "video" ? "mp4" : "mp3";
      const fileName = `${selected.title.replace(/[<>:"/\\|?*]+/g, "")}.${fileExtension}`;
      const filePath = path.join(__dirname, "cache", fileName);

      // Download the file
      const fileData = await axios.get(fileUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, fileData.data);

      // Send the file as an attachment
      await message.reply({
        body: `🎉 Your ${format === "video" ? "Video" : "Song"} is Ready! \n\n` +
              `🎥 Title: ${selected.title}\n⏱️ Duration: ${selected.duration} | 👁️ Views: ${selected.views.toLocaleString()}\n\n` +
              `Enjoy! 🎶`,
        attachment: fs.createReadStream(filePath)
      });

      // Delete the file after sending
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(error);
      message.reply(`🚨 Error: Unable to download your ${format}. Please try again later.\nDetails: ${error.message}`);
    }
  }
};
