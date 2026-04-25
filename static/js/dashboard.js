const ws = new WebSocket(`ws://${window.location.host}/ws`);

function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond > 1024 * 1024) {
        return (bytesPerSecond / (1024 * 1024)).toFixed(1) + " MB/s";
    }
    if (bytesPerSecond > 1024) {
        return (bytesPerSecond / 1024).toFixed(1) + " KB/s";
    }
    return bytesPerSecond.toFixed(1) + " B/s";
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    document.getElementById("cpu").textContent = data.cpu + "%";
    document.getElementById("memory").textContent = data.memory + "%";
    document.getElementById("disk").textContent = data.disk + "%";
    document.getElementById("sent").textContent = formatSpeed(data.sent_speed);
    document.getElementById("recv").textContent = formatSpeed(data.recv_speed);
    document.getElementById("uptime").textContent = data.uptime;

    const loadEl = document.getElementById("load");
    const loadCard = document.getElementById("load-card");
    if (data.load_avg) {
        loadEl.textContent = `${data.load_avg["1m"]} / ${data.load_avg["5m"]} / ${data.load_avg["15m"]}`;
        loadCard.classList.remove("hidden");
    } else {
        loadCard.classList.add("hidden");
    }
};

ws.onclose = () => {
    console.log("WebSocket closed");
};

ws.onerror = (err) => {
    console.error("WebSocket error", err);
};
