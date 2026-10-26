// uiRenderer.js
// PetApp6 Rendering Layer (PNG + 任意の MP4 動画 + Speech Bubble)
//
// action.image … 常に静止画（PNG）。代表画像・フォールバック・ポスターとして使う。
// action.video … 任意。あれば動画で表示し、再生できなければ image（PNG）を表示する。
// 音声は初期ミュート。右下の 🔇/🔊 ボタンで切り替える。

const SOUND_KEY = "petapp6_sound";

let soundEnabled = false;

try {
    soundEnabled = localStorage.getItem(SOUND_KEY) === "on";
} catch (e) {
    soundEnabled = false;
}

let currentVideo = null;

function saveSoundSetting() {
    try {
        localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    } catch (e) {
        // 保存できなくても動作には影響しない
    }
}

function getSoundButton(area, create) {
    let button = area.querySelector(".rabbit-sound-toggle");

    if (!button && create) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "rabbit-sound-toggle";
        button.style.cssText = [
            "position:absolute",
            "right:10px",
            "bottom:10px",
            "width:34px",
            "height:34px",
            "padding:0",
            "border:1px solid #e6dcd4",
            "border-radius:50%",
            "background:rgb(255 255 255 / 85%)",
            "font-size:16px",
            "line-height:1",
            "cursor:pointer",
            "z-index:2"
        ].join(";");

        button.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            saveSoundSetting();
            applySound(area);

            // ボタン操作は「ユーザー操作」なので、音ありの再生が許可される
            if (currentVideo && soundEnabled) {
                currentVideo.play().catch(() => {
                    soundEnabled = false;
                    applySound(area);
                });
            }
        });

        area.appendChild(button);
    }

    return button;
}

function applySound(area) {
    const button = getSoundButton(area, false);

    if (currentVideo) {
        currentVideo.muted = !soundEnabled;
    }

    if (button) {
        button.textContent = soundEnabled ? "🔊" : "🔇";
        button.setAttribute("aria-label", soundEnabled ? "音を消す" : "音を出す");
        button.title = soundEnabled ? "音を消す" : "音を出す";
    }
}

function hideSoundButton(area) {
    const button = getSoundButton(area, false);

    if (button) {
        button.remove();
    }
}

function createImage(path) {
    const img = document.createElement("img");
    img.src = path;
    img.alt = "rabbit";
    img.style.maxWidth = "480px";
    img.classList.add("rabbit-media");
    return img;
}

export function renderRabbit(action, phrase = "") {
    const area = document.getElementById("rabbit-area");
    const bubble = document.getElementById("speech-bubble");

    if (!area || !bubble) {
        console.error("UI要素が見つかりません: rabbit-area / speech-bubble");
        return;
    }

    // 安全確認：action が未定義の場合は描画しない
    if (!action || !action.image) {
        console.warn("renderRabbit: action または action.image が未定義です");
        return;
    }

    // 既存DOM構造を壊さないため、uiRendererが生成した描画要素だけ削除する
    area.querySelectorAll(".rabbit-media").forEach(el => el.remove());
    currentVideo = null;

    if (action.video) {
        // 動画あり：再生できなければ image（PNG）に切り替える
        const video = document.createElement("video");
        video.src = action.video;
        video.poster = action.image;
        video.autoplay = true;
        video.loop = true;
        video.muted = !soundEnabled;
        video.playsInline = true;
        video.style.maxWidth = "480px";
        video.classList.add("rabbit-media");

        const fallbackToImage = () => {
            console.warn("動画を再生できないため静止画を表示します:", action.video);

            if (video.parentNode === area) {
                video.remove();
            }

            if (currentVideo === video) {
                currentVideo = null;
            }

            hideSoundButton(area);
            area.insertBefore(createImage(action.image), bubble);
        };

        video.onerror = fallbackToImage;

        currentVideo = video;
        area.insertBefore(video, bubble);
        getSoundButton(area, true);
        applySound(area);

        // 音ありの自動再生がブラウザに止められたら、ミュートで再生し直す
        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                if (!video.muted) {
                    soundEnabled = false;
                    applySound(area);
                    video.play().catch(fallbackToImage);
                }
            });
        }
    } else {
        // 静止画（PNG）
        area.insertBefore(createImage(action.image), bubble);
        hideSoundButton(area);
    }

    // phrase（吹き出し）表示
    bubble.textContent = phrase || "";
}

// ウサギの描画要素と吹き出しを消す（DOM構造は維持）
export function clearRabbit() {
    const area = document.getElementById("rabbit-area");
    const bubble = document.getElementById("speech-bubble");

    if (area) {
        area.querySelectorAll(".rabbit-media").forEach(el => el.remove());
        hideSoundButton(area);
    }

    currentVideo = null;

    if (bubble) {
        bubble.textContent = "";
    }
}
