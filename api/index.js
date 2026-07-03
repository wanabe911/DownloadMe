import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/api/telegram", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL Telegram diperlukan" });

  try {
    const match = url.match(/t\.me\/([^/]+)\/(\d+)/);
    if (!match) return res.status(400).json({ error: "Format URL salah. Contoh: https://t.me/username/123" });

    const channel = match[1];
    const messageId = match[2];
    const embedUrl = `https://t.me/${channel}/${messageId}?embed=1`;

    const response = await axios.get(embedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const html = response.data;

    const videoMatch = html.match(/<video[^>]+src="([^"]+)"/);
    if (!videoMatch) return res.status(404).json({ error: "Video tidak ditemukan. Pastikan channel public." });

    res.json({
      success: true,
      data: {
        platform: "telegram",
        video_url: videoMatch[1],
        channel: channel,
        message_id: messageId
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil video. Pastikan channel public dan link benar." });
  }
});

app.post("/api/onlyfans", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL OnlyFans diperlukan" });

  try {
    const username = url.match(/onlyfans\.com\/([^/?]+)/)?.[1];
    if (!username) return res.status(400).json({ error: "Format URL salah" });

    const apiUrl = `https://onlyfans.com/api2/v2/users/${username}`;
    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      }
    });

    const user = response.data;
    res.json({
      success: true,
      data: {
        platform: "onlyfans",
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        posts_count: user.postsCount || 0,
        photos_count: user.photosCount || 0,
        videos_count: user.videosCount || 0
      }
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Akun tidak ditemukan" });
    }
    res.status(500).json({ error: "Gagal mengambil data. Akun mungkin private." });
  }
});

app.get("/", (req, res) => res.sendFile("public/index.html", { root: "." }));
export default app;
