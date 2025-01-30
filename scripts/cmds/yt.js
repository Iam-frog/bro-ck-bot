const axios = require("axios");

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
        " YouTube Search & Downloader\n\n" +
        " Usage: `{pn} -v <query>` (for video) or `{pn} -a <query>` (for audio)\n" +
        " Example:\n- `yt -v faded`\n- `yt -a faded`"
      );
    }

    const formatFlag = args[0];
    const format = formatFlag === "-v" ? "video" : formatFlag === "-a" ? "audio" : null;

    if (!format) {
      return message.reply("❌ Invalid format! Use `-v` for video or `-a` for audio.");
    }

    const query = args.slice(1).join(" ");
    if (!query) {
      return message.reply("❌ Please enter a search query.");
    }

    const waitingMsg = await message.reply("🔍 Searching for results... Please wait!");

    try {
      const searchUrl = `https://upol-dev-yt.onrender.com/search?query=${encodeURIComponent(query)}`;
      const searchResponse = await axios.get(searchUrl);

      if (!searchResponse.data.result || searchResponse.data.result.length === 0) {
        message.unsend(waitingMsg.messageID);
        return message.reply("🚫 No results found. Try searching with another keyword.");
      }

      const results = searchResponse.data.result.slice(0, 6); 

      let body = `🔍 Search Results for: \`${query}\`\n\n`;
      results.forEach((item, index) => {
        body += `${index + 1}. ${item.title}\n` +
                `  [Watch on YouTube](${item.link})\n` +
                `  Duration: ${item.duration}  |  Views: ${item.views.toLocaleString()}\n\n`;
      });

      message.unsend(waitingMsg.messageID);
      const reply = await message.reply({
        body: `${body}⚡ Reply with a number (1-6) to download the ${format}!`
      });

      global.GoatBot.onReply.set(reply.messageID, {
        commandName: "yt",
        messageID: reply.messageID,
        results,
        format
      });
    } catch (error) {
      message.unsend(waitingMsg.messageID);
      console.error(error);
      message.reply(`🚨 Error: Unable to search at the moment. Please try again later.\n🔍 Details: ${error.message}`);
    }
  },

  onReply: async ({ Reply, message, event }) => {
    const { results, format, messageID } = Reply;
    const { body } = event;

    const choice = parseInt(body.trim());
    if (isNaN(choice) || choice < 1 || choice > results.length) {
      return message.reply("⚠️ Invalid choice! Please select a number between 1 and 6.");
    }

    const selected = results[choice - 1];
    if (!selected) {
      return message.reply("❌ Invalid selection. Please try again.");
    }

    message.unsend(messageID);
    const waitingMsg = await message.reply("📥 Preparing your download... Please wait!");

    try {
      const downloadUrl = `https://upol-dev-yt.onrender.com/download/${format}?url=${encodeURIComponent(selected.link)}`;
      const downloadResponse = await axios.get(downloadUrl);

      if (!downloadResponse.data.result || !downloadResponse.data.result.url) {
        message.unsend(waitingMsg.messageID);
        return message.reply("🚫 Failed to fetch the download link. Try again later.");
      }

      const fileUrl = downloadResponse.data.result.url;
      const fileStream = await global.utils.getStreamFromURL(fileUrl);

      message.unsend(waitingMsg.messageID);
      await message.reply({
        body: `🎉 Download Ready!\n\n` +
              `Title: ${selected.title}\n` +
              `Duration: ${selected.duration} | Views: ${selected.views.toLocaleString()}\n` +
              `[Watch on YouTube](${selected.link})\n\n` +
              `Enjoy your ${format === "video" ? "video" : "song"}!`,
        attachment: fileStream
      });

    } catch (error) {
      message.unsend(waitingMsg.messageID);
      console.error(error);
      message.reply(`🚨 Error: Unable to download. Please try again later.\n🔍 Details: ${error.message}`);
    }
  }
};
