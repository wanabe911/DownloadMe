window.addEventListener("load", () => {
    const audio = document.getElementById("slashSound");
    let played = false;

    function playSlash() {
        if (played) return;
        played = true;
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.7;
            audio.play().catch(() => {});
        }
    }

    document.addEventListener("click", playSlash, { once: false });
    document.addEventListener("touchstart", playSlash, { once: false });

    setTimeout(() => {
        if (!played) playSlash();
    }, 1100);

    setTimeout(() => {
        document.getElementById("mainApp").style.display = "block";
        document.getElementById("splash").style.display = "none";
    }, 3100);
});

const urlInput = document.getElementById("urlInput");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

async function startDownload() {
    const url = urlInput.value.trim();
    if (!url) return;

    loading.classList.remove("hidden");
    result.classList.add("hidden");

    try {
        const res = await fetch("/api/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });
        const data = await res.json();
        loading.classList.add("hidden");

        if (data.success) {
            showResult(data.data);
        } else {
            showError(data.error || "Gagal memproses");
        }
    } catch (err) {
        loading.classList.add("hidden");
        showError("Jaringan error: " + err.message);
    }
}

function showResult(data) {
    let html = `<h2>${data.title || "Hasil Download"}</h2>`;
    html += `<div class="result-row"><span class="result-label">Platform</span><span class="result-value">${data.platform.toUpperCase()}</span></div>`;
    if (data.author) html += `<div class="result-row"><span class="result-label">Author</span><span class="result-value">${data.author}</span></div>`;
    if (data.music) html += `<div class="result-row"><span class="result-label">Music</span><span class="result-value">${data.music}</span></div>`;
    if (data.video_url) html += `<div class="result-row"><span class="result-label">Download Video</span><span class="result-value"><a href="${data.video_url}" target="_blank" download>Klik Download Video</a></span></div>`;
    if (data.no_watermark) html += `<div class="result-row"><span class="result-label">No Watermark</span><span class="result-value"><a href="${data.no_watermark}" target="_blank" download>Klik Download HD</a></span></div>`;
    if (data.music_url) html += `<div class="result-row"><span class="result-label">Download MP3</span><span class="result-value"><a href="${data.music_url}" target="_blank" download>Klik Download MP3</a></span></div>`;
    if (data.thumbnail) html += `<div style="text-align:center;margin-top:14px;"><img src="${data.thumbnail}" alt="Thumbnail" style="max-width:100%;border-radius:10px;"></div>`;
    if (data.avatar) html += `<div style="text-align:center;margin-top:14px;"><img src="${data.avatar}" alt="Avatar" style="width:100px;height:100px;border-radius:50%;object-fit:cover;"></div>`;
    if (data.posts_count !== undefined) html += `<div class="result-row"><span class="result-label">Posts</span><span class="result-value">${data.posts_count}</span></div>`;
    if (data.photos_count !== undefined) html += `<div class="result-row"><span class="result-label">Photos</span><span class="result-value">${data.photos_count}</span></div>`;
    if (data.videos_count !== undefined) html += `<div class="result-row"><span class="result-label">Videos</span><span class="result-value">${data.videos_count}</span></div>`;
    if (data.note) html += `<div class="result-row" style="color:#c0392b;"><span class="result-label">Note</span><span class="result-value">${data.note}</span></div>`;
    result.innerHTML = html;
    result.classList.remove("hidden");
}

function showError(msg) {
    result.innerHTML = `<p class="error">${msg}</p>`;
    result.classList.remove("hidden");
}

urlInput.addEventListener("keypress", (e) => { if (e.key === "Enter") startDownload(); });
