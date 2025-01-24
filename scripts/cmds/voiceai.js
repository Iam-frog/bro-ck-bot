const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = { 
  config: { 
    name: 'vai', 
    aliases: ['voiceai'], 
    version: '1.4', 
    author: 'UPoL 🐔', 
    role: 0, 
    shortDescription: {
      en: 'Ask a question to GPT and get a voice response using different TTS models.' 
    }, 
    longDescription: { 
      en: 'Ask a question to GPT and receive the response in audio format using the available TTS voice models.' 
    }, 
    category: 'Voice ai', 
    guide: { 
      en: '{pn} <voiceModel> <question> - Use one of the available TTS voice models: onyx, nova, alloy, fable, shimmer.' 
    } 
  }, 

  onStart: async function ({ api, event, message, args }) {
    const voiceModels = ['onyx', 'nova', 'alloy', 'fable', 'shimmer']; 
    const selectedModel = args[0]?.toLowerCase(); 
    const input = args.slice(1).join(' '); 

    if (!voiceModels.includes(selectedModel)) {
      return message.reply(`Please specify a valid voice model.\nAvailable models: ${voiceModels.join(', ')}`);
    }
    
    if (!input) {
      return message.reply('Enter a question after the voice model.');
    }

    const waitingMessage = await message.reply('✨ Responding with voice ai, please wait....');

    try { 
      const encodedPrompt = encodeURIComponent(input);
      const gptResponse = await axios.get(`https://upol-piu.onrender.com/gemini?prompt=${encodedPrompt}`);
      const answer = gptResponse.data.answer;

      const ttsResponse = await axios.get(`https://upol-tts2.onrender.com/api/${selectedModel}?text=${encodeURIComponent(answer)}`);
      const audioUrl = ttsResponse.data.audioUrl;

      const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioFilePath = path.join(__dirname, `response_${event.senderID}.mp3`);
      fs.writeFileSync(audioFilePath, audioResponse.data);
      
      api.unsendMessage(waitingMessage.messageID);
 
      message.reply({ 
        body: `✨ Answer: ${answer}\n\nResponded using the "${selectedModel}" voice model.`, 
        attachment: fs.createReadStream(audioFilePath) 
      }, event.threadID, () => {
        fs.unlinkSync(audioFilePath);
      });

    } catch (error) { 
      message.reply(`Error: ${error.message}`); 
    }
  }
};
