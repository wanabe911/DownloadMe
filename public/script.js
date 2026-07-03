let currentTab = "telegram";
const urlInput = document.getElementById("urlInput");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const hintText = document.getElementById("hintText");

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.tab.${tab}`)?.classList.add("active");
    if (tab === "telegram") {
        hintText.textContent = "Contoh: https://t.me/username/123";
        urlInput.placeholder = "https://t.me/username/123";
    } else {
        hintText.textContent = "Contoh: https://onlyfans.com/username";
        urlInput.placeholder = "https://onlyfans.com/username";
    }
    result.classList.add("hidden");
    urlInput.value = "";
}

async function startDownload() {
    const url = urlInput.value.trim();
    if (!url) return;

    loading.classList.remove("hidden");
    result.classList.add("hidden");

    const endpoint = currentTab === "telegram" ? "/api/telegram" : "/api/onlyfans";

    try {
        const res = await fetch(endpoint, {
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
    let html = `<h2>Hasil Download</h2>`;

    if (data.platform === "telegram") {
        html += `<div class="result-row"><span class="result-label">Platform</span><span class="result-value">Telegram</span></div>`;
        html += `<div class="result-row"><span class="result-label">Channel</span><span class="result-value">${data.channel}</span></div>`;
        html += `<div class="result-row"><span class="result-label">Message ID</span><span class="result-value">${data.message_id}</span></div>`;
        html += `<div class="result-row"><span class="result-label">Download</span><span class="result-value"><a href="${data.video_url}" target="_blank" download>Klik untuk Download Video</a></span></div>`;
    } else if (data.platform === "onlyfans") {
        html += `<div class="result-row"><span class="result-label">Platform</span><span class="result-value">OnlyFans</span></div>`;
        html += `<div class="result-row"><span class="result-label">Username</span><span class="result-value">@${data.username}</span></div>`;
        html += `<div class="result-row"><span class="result-label">Nama</span><span class="result-value">${data.name || '-'}</span></div>`;
        html += `<div class="result-row"><span class="result-label">Posts</span><span class="result-value">${data.posts_count}</span></div>`;
        html += `<div class="result-row"><span class="result-label">Photos</span><span class="result-value">${data.photos_count}</span></div>`;
        html += `<div class="result-row"><span class="result-label">Videos</span><span class="result-value">${data.videos_count}</span></div>`;
        if (data.avatar) {
            html += `<div style="text-align:center;margin-top:14px;"><img src="${data.avatar}" alt="Avatar" style="width:100px;height:100px;border-radius:50%;object-fit:cover;"></div>`;
        }
    }

    result.innerHTML = html;
    result.classList.remove("hidden");
}

function showError(msg) {
    result.innerHTML = `<p class="error">${msg}</p>`;
    result.classList.remove("hidden");
}

urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startDownload();
});

switchTab("telegram");
