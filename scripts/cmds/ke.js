module.exports = {
  config: {
    name: "ke",
    version: "1.1",
    author: "UPoL 🐔",
    role: 0,
    shortDescription: {
      en: "Get user details"
    },
    longDescription: {
      en: "View name, gender, profile picture, and more of a user"
    },
    category: "info",
    guide: {
      en: "{pn} (use on a reply or alone to get user details)"
    },
  },

  onStart: async function ({ api, event }) {
    const userID = event.type === "message_reply"
      ? event.messageReply.senderID
      : event.senderID;

    try {
      const userInfo = await api.getUserInfo(userID);
      const user = userInfo[userID];

      const name = user.name || "Unknown";
      const gender = user.gender === 2 ? "Male" : user.gender === 1 ? "Female" : "Unknown";
      const vanity = user.vanity || "";
      const profileUrl = vanity
        ? `https://www.facebook.com/${vanity}`
        : `https://www.facebook.com/${userID}`;
      const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;

      const msg = {
        body:
          `• Name: ${name}\n` +
					`• Nicknamd: ${vanity}`+
          `• ID: ${userID}\n` +
          `• Gender: ${gender}\n` +
          `• Visit Link: ${profileUrl}`,
        attachment: await global.utils.getStreamFromURL(avatarUrl)
      };

      return message.reply(msg, event.threadID, event.messageID);
    } catch (err) {
      console.error("Error fetching user details:", err);
      return api.sendMessage("❌ Unable to fetch user details.", event.threadID, event.messageID);
    }
  }
};
