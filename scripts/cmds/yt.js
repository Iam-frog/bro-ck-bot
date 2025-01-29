const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "yt",
    category: "yt",
    author: "UPoL 🐔",
    role: 0,
    cooldown: 20,
    description: { en: "Search and download YouTube videos or songs effortlessly!" },
    guide:{ en: "{pn} -v <query> | {pn} -a <query>" }
  },

  onStart: async ({ message, args }) => {
    if (args.length < 2) {
      return message.reply("⚠️ Oops! You need to specify a format (`-v` for video or `-a` for audio) and a search query.\n\nExample:\n- `*yts -v fainted`\n- `*yts -a fainted`");
    }

    const formatFlag = args[0];
    const format = formatFlag === "-v" ? "video" : formatFlag === "-a" ? "audio" : null;

    if (!format) {
      return message.reply("❌ Invalid format! Use `-v` for video or `-a` for audio.");
    }

    const query = args.slice(1).join(" ");
    if (!query) {
      return message.reply("❌ Please provide something to search for.");
    }

    try {
      const searchUrl = `https://upol-ytbv2-x.onrender.com/search?query=${encodeURIComponent(query)}&format=${format}`;
      const searchResponse = await axios.get(searchUrl);
      const results = searchResponse.data.slice(0, 6); // Limit results to 6

      if (results.length === 0) {
        return message.reply("❌ Sorry, no results were found for your query. Try another keyword!");
      }

      const thumbnails = await Promise.all(
        results.map((item) => global.utils.getStreamFromUrl(item.thumbnail))
      );

      let body = `🎶 Search Results (${format === "video" ? "Videos" : "Audios"}):\n\n`;
      results.forEach((item, index) => {
        body += `-${index + 1}. ${item.title}\n📡 Channel: ${item.channel}\n\n`;
      });

      const reply = await message.reply({
        body: `${body}⚡ Reply with a number (1-6) to choose a ${format}!`,
        attachment: thumbnails
      });

      global.GoatBot.onReply.set(reply.messageID, {
        commandName: "yt",
        messageID: reply.messageID,
        results,
        format
      });
    } catch (error) {
      console.error(error);
      message.reply(`Error: Unable to search at the moment. Please try again later.\nDetails: ${error.message}`);
    }
  },

  onReply: async ({ Reply, message, event }) => {
    const { results, format, messageID } = Reply;
    const { body } = event;

    const choice = parseInt(body.trim());
    if (isNaN(choice) || choice < 1 || choice > results.length) {
      return message.reply("⚠️ Invalid Choice! Please pick a number between 1 and 6 from the search results.");
    }

    const selected = results[choice - 1];
    if (!selected) {
      return message.reply("❌ That selection is invalid. Please try again!");
    }

    message.unsend(messageID);

    try {
      const downloadUrl = `https://upol-ytbv2-x.onrender.com/download?videoID=${selected.id}&format=${format}`;
      const fileData = await axios.get(downloadUrl, { responseType: "arraybuffer" });

      const extension = format === "video" ? "mp4" : "mp3";
      const fileName = `${selected.title.replace(/[<>:"/\\|?*]+/g, "")}.${extension}`;
      const filePath = path.join(__dirname, "cache", fileName);

      fs.writeFileSync(filePath, fileData.data);

      const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${downloadUrl}`);
      const tinyUrl = tinyUrlResponse.data;

      await message.reply({
        body: `🎉 Your ${format === "video" ? "Video" : "Song"} is Ready!\n\n🎥 Title: ${selected.title}\n📡 Channel: ${selected.channel}\n🔗 Download Link: ${tinyUrl}\n\nEnjoy this song and stay with us! 🎶`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(error);
      message.reply(`Error: Unable to download your ${format}. Please try again later.\nDetails: ${error.message}`);
    }
  }
};
