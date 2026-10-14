// app.js
// PetApp6
// PetApp5 の既存機能を継承し、日記帳の編集・追記・削除と
// Rabbit Action のサムネール表示を追加する。
//
// v1.2.1
//
// メディアの役割：
//
//   action.image
//       → Direct Talk / Diary Reaction / Idle Layer など、
//          実際のウサギ反応表示に使用するメディア。
//          PNG または MP4 を指定可能。
//
//   action.print_image
//       → 日記一覧・日記詳細のサムネール、
//          日記帳の印刷／PDF保存に使用する代表静止画。
//          MP4 を使用する Action には必ず対応 PNG を指定する。
//
// 例：
//   R08
//       image       = R08.mp4
//       print_image = R08.png

import {
    getDiaries,
    saveDiary,
    getDiaryById,
    updateDiary,
    appendDiaryText,
    deleteDiary
} from "./diaryStorage.js";

import {
    renderRabbit,
    clearRabbit
} from "./uiRenderer.js";

import {
    selectRabbitAction
} from "./rabbitActionSelector.js";

const STORAGE_KEY_PET_NAME = "petapp6_pet_name";

let petName = localStorage.getItem(STORAGE_KEY_PET_NAME) || "レオ";
let currentDiaryId = null;
let currentActionId = null;
let rabbitActions = {};

// --------------------------------------------------
// JSON 読み込み
// --------------------------------------------------

async function loadActions() {
    try {
        const response = await fetch("./data/rabbit_actions.json");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        rabbitActions = await response.json();
        return rabbitActions;
    } catch (error) {
        console.error(
            "rabbit_actions.json の読み込みに失敗しました:",
            error
        );

        return null;
    }
}

// --------------------------------------------------
// 共通ユーティリティ
// --------------------------------------------------

function randomPick(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return "";
    }

    return items[Math.floor(Math.random() * items.length)];
}

function getTodayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDiaryText() {
    const textarea = document.getElementById("diary-input");

    return textarea
        ? textarea.value.trim()
        : "";
}

// --------------------------------------------------
// Rabbit Action メディアパス
// --------------------------------------------------
//
// image:
//   実際のウサギ反応表示用。
//   PNG / MP4 のどちらでもよい。
//
// print_image:
//   日記・印刷用代表画像。
//   MP4 Action には必ず対応する PNG を指定する。
//
// 重要：
//   print_image は「推測」しない。
//   rabbit_actions.json に明示された print_image を使用する。
//   これにより、R19-1.png のようなファイル名にも対応できる。

function normalizeAssetPath(assetPath) {
    if (!assetPath) {
        return null;
    }

    return `./${String(assetPath).replace(/^\.?\//, "")}`;
}

function getActionImagePath(actionId) {
    if (!actionId) {
        return null;
    }

    const action = rabbitActions[actionId];

    if (action && action.image) {
        return normalizeAssetPath(action.image);
    }

    // JSON に画像パスがない場合の互換用フォールバック
    if (/^R\d{2}$/.test(actionId)) {
        return `./assets/rabbit/actions/${actionId}.png`;
    }

    return null;
}

function getActionPrintImagePath(actionId) {
    if (!actionId) {
        return null;
    }

    const action = rabbitActions[actionId];

    if (!action) {
        return null;
    }

    // 印刷用代表画像は JSON の print_image を必ず優先する。
    if (action.print_image) {
        return normalizeAssetPath(action.print_image);
    }

    // MP4 を使用する Action に print_image がない場合は、
    // 「印刷用代表画像が未設定」として扱う。
    //
    // 勝手に image を <img> に渡すと、
    // MP4 を画像として扱う以前の問題が再発するため、
    // MP4 の場合はフォールバックしない。
    if (
        action.image &&
        /\.(mp4|webm|mov|m4v)$/i.test(action.image)
    ) {
        console.warn(
            `Rabbit Action ${actionId} に print_image が設定されていません。`
        );

        return null;
    }

    // 静止画 Action は image をそのまま印刷用代表画像として使用可能。
    if (
        action.image &&
        /\.(png|jpe?g|webp|gif)$/i.test(action.image)
    ) {
        return normalizeAssetPath(action.image);
    }

    return null;
}

// --------------------------------------------------
// ペット名の設定
// --------------------------------------------------

function setupPetNameControl() {
    const input = document.getElementById("petname-input");
    const saveButton = document.getElementById("petname-save");

    if (!input || !saveButton) {
        return;
    }

    input.value = petName;

    saveButton.addEventListener("click", () => {
        const newName = input.value.trim();

        if (!newName) {
            alert("ウサギの名前を入力してください。");
            return;
        }

        petName = newName;

        localStorage.setItem(
            STORAGE_KEY_PET_NAME,
            petName
        );

        const result =
            document.getElementById("speech-result");

        if (result) {
            result.textContent =
                `名前を「${petName}」に設定しました。`;
        }
    });
}

// --------------------------------------------------
// Direct Talk（音声認識）
// --------------------------------------------------

function setupVoiceButton() {
    const button =
        document.getElementById("start-voice");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        startSpeechRecognition
    );
}

function startSpeechRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert(
            "このブラウザは音声認識に対応していません。"
        );

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang = "ja-JP";
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const recognizedText =
            event.results[0][0].transcript;

        const resultElement =
            document.getElementById("speech-result");

        if (resultElement) {
            resultElement.textContent =
                recognizedText;
        }

        // 名前を呼びかけに含む場合だけ
        // Direct Talk として処理する。
        if (!recognizedText.startsWith(petName)) {
            return;
        }

        const intentText =
            recognizedText
                .slice(petName.length)
                .trim();

        if (!Object.keys(rabbitActions).length) {
            await loadActions();
        }

        const actionId =
            detectDirectTalkAction(intentText);

        if (!actionId) {
            return;
        }

        const action =
            rabbitActions[actionId];

        if (!action) {
            console.warn(
                `Direct Talk: ${actionId} が見つかりません。`
            );

            return;
        }

        const phrase =
            randomPick(action.short_phrases);

        currentActionId =
            actionId;

        // Direct Talk は通常表示用の image を使用。
        // R08なら R08.mp4 が使用される。
        renderRabbit(
            action,
            phrase
        );
    };

    recognition.onerror = (event) => {
        console.error(
            "音声認識エラー:",
            event.error
        );
    };

    try {
        recognition.start();
    } catch (error) {
        console.error(
            "音声認識を開始できませんでした:",
            error
        );
    }
}

function detectDirectTalkAction(text) {
    const normalizedText =
        String(text || "")
            .trim()
            .replace(/^[、,，\s]+/, "")
            .replace(/[。！!？?\s]+$/, "");

    // あいさつ
    if (normalizedText.includes("おはよう")) {
        return "R10";
    }

    if (normalizedText.includes("元気")) {
        return "R11";
    }

    // 喜び・休息
    if (
        /かわいい|可愛い|カワイイ|おりこう|お利口/.test(
            normalizedText
        )
    ) {
        return "R14";
    }

    if (normalizedText.includes("おやすみ")) {
        return "R15";
    }

    if (normalizedText.includes("ねんね")) {
        return "R08";
    }

    // 呼びかけ
    if (normalizedText.includes("おいで")) {
        return "R16";
    }

    // 食べ物
    if (normalizedText.includes("ごはん")) {
        return "R19";
    }

    if (
        normalizedText.includes("牧草") ||
        normalizedText.includes("チモシー")
    ) {
        return "R17";
    }

    // 飲み水
    if (
        normalizedText.includes("水") ||
        normalizedText.includes("お水")
    ) {
        return "R18";
    }

    // お腹が空いた
    if (
        normalizedText.includes("お腹") ||
        normalizedText.includes("すいた")
    ) {
        return "R03";
    }

    // トイレ（R20）
    if (
        normalizedText.includes("トイレ") ||
        normalizedText.includes("おしっこ") ||
        normalizedText.includes("ちっち") ||
        /(^|[\s、,，])シー(?:してね|して|する|だよ)?$/.test(
            normalizedText
        )
    ) {
        return "R20";
    }

    // ハウス（R21）
    if (
        normalizedText.includes("ハウス") ||
        normalizedText.includes("おうち")
    ) {
        return "R21";
    }

    return null;
}

// --------------------------------------------------
// Diary Layer：Emotion × Need → Rabbit Action
// --------------------------------------------------

function detectEmotionNeed(text) {
    // v1 の軽量ルールベース判定を維持。
    // LLM による Emotion / Need 判定は追加しない。

    if (/疲|しんど|きつ|だる|眠い|眠た/.test(text)) {
        return {
            emotions: [
                {
                    label: "fatigue_apathy",
                    score: 1.0
                }
            ],
            needs: [
                {
                    label: "quiet_rest",
                    score: 1.0
                }
            ]
        };
    }

    if (/悲|つら|泣|涙|えーん|ガーン|ショック/.test(text)) {
        return {
            emotions: [
                {
                    label: "sadness",
                    score: 1.0
                }
            ],
            needs: [
                {
                    label: "companionship",
                    score: 1.0
                }
            ]
        };
    }

    if (/不安|心配|怖|びくびく/.test(text)) {
        return {
            emotions: [
                {
                    label: "anxiety_fear",
                    score: 1.0
                }
            ],
            needs: [
                {
                    label: "reassurance",
                    score: 1.0
                }
            ]
        };
    }

    if (/寂|孤独|しゅん/.test(text)) {
        return {
            emotions: [
                {
                    label: "loneliness",
                    score: 1.0
                }
            ],
            needs: [
                {
                    label: "companionship",
                    score: 1.0
                }
            ]
        };
    }

    if (/嬉|楽し|よかった|ご機嫌|ラッキー/.test(text)) {
        return {
            emotions: [
                {
                    label: "joy",
                    score: 1.0
                }
            ],
            needs: [
                {
                    label: "share_joy",
                    score: 1.0
                }
            ]
        };
    }

    if (/怒|おこ|イラ|むか|プンプン/.test(text)) {
        return {
            emotions: [
                {
                    label: "anger",
                    score: 1.0
                }
            ],
            needs: [
                {
                    label: "relaxation",
                    score: 1.0
                }
            ]
        };
    }

    return {
        emotions: [
            {
                label: "pleasant",
                score: 0.2
            }
        ],
        needs: [
            {
                label: "companionship",
                score: 1.0
            }
        ]
    };
}

async function processDiary() {
    const diaryText =
        getDiaryText();

    if (!diaryText) {
        alert(
            "日記を書いてから押してね。"
        );

        return;
    }

    if (!Object.keys(rabbitActions).length) {
        const actions =
            await loadActions();

        if (!actions) {
            alert(
                "うさぎのデータを読み込めませんでした。"
            );

            return;
        }
    }

    const {
        emotions,
        needs
    } =
        detectEmotionNeed(
            diaryText
        );

    const result =
        await selectRabbitAction({
            emotions,
            needs
        });

    if (
        !result ||
        !result.action
    ) {
        alert(
            "日記に合ううさぎの反応を選べませんでした。"
        );

        return;
    }

    const actionId =
        result.actionId ||
        result.action.id;

    currentActionId =
        actionId;

    const entry =
        saveDiary({
            date: getTodayDate(),
            text: diaryText,
            emotion: null,
            need: null,
            actionId
        });

    if (!entry) {
        alert(
            "日記を保存できませんでした。"
        );

        return;
    }

    // Diary Reaction は通常表示なので image を使用。
    // R08なら R08.mp4 が表示される。
    renderRabbit(
        result.action,
        result.chosenPhrase || ""
    );

    const textarea =
        document.getElementById(
            "diary-input"
        );

    if (textarea) {
        textarea.value = "";
    }

    renderDiaryList();
}

// --------------------------------------------------
// 日記一覧
// --------------------------------------------------

function renderDiaryList() {
    const list =
        document.getElementById(
            "diary-list"
        );

    if (!list) {
        return;
    }

    list.replaceChildren();

    const diaries =
        getDiaries();

    if (!diaries.length) {
        const emptyMessage =
            document.createElement("p");

        emptyMessage.id =
            "diary-empty-message";

        emptyMessage.textContent =
            "まだ日記はありません。";

        list.appendChild(
            emptyMessage
        );

        return;
    }

    // 新しい日記を先頭に表示
    diaries.sort((a, b) => {
        const dateCompare =
            (b.date || "").localeCompare(
                a.date || ""
            );

        if (dateCompare !== 0) {
            return dateCompare;
        }

        return (b.id || "").localeCompare(
            a.id || ""
        );
    });

    for (const diary of diaries) {
        const item =
            document.createElement(
                "article"
            );

        item.className =
            "diary-list-item";

        const date =
            document.createElement(
                "div"
            );

        date.className =
            "diary-list-date";

        date.textContent =
            diary.date || "";

        const text =
            document.createElement(
                "p"
            );

        text.className =
            "diary-list-text";

        text.textContent =
            getPreviewText(
                diary.text
            );

        const openButton =
            document.createElement(
                "button"
            );

        openButton.type =
            "button";

        openButton.textContent =
            "詳細を見る";

        openButton.addEventListener(
            "click",
            () => {
                showDiaryDetail(
                    diary.id
                );
            }
        );

        item.append(
            date,
            text,
            openButton
        );

        // ----------------------------------------------
        // 日記一覧サムネール
        //
        // ここでは print_image を使用する。
        //
        // R08:
        //   image       → R08.mp4
        //   print_image → R08.png
        // ----------------------------------------------

        const thumbnail =
            createActionThumbnail(
                diary.actionId,
                "うさぎの反応"
            );

        if (thumbnail) {
            item.insertBefore(
                thumbnail,
                text
            );
        }

        list.appendChild(
            item
        );
    }
}

function getPreviewText(text) {
    const normalized =
        String(text || "")
            .replace(/\s+/g, " ")
            .trim();

    return normalized.length > 30
        ? `${normalized.slice(0, 30)}…`
        : normalized;
}

// --------------------------------------------------
// 日記詳細
// --------------------------------------------------

function showDiaryDetail(id) {
    const diary =
        getDiaryById(id);

    if (!diary) {
        alert(
            "日記が見つかりませんでした。"
        );

        renderDiaryList();

        return;
    }

    currentDiaryId =
        diary.id;

    const listSection =
        document.getElementById(
            "diary-book-section"
        );

    const detailSection =
        document.getElementById(
            "diary-detail-section"
        );

    const editSection =
        document.getElementById(
            "diary-edit-section"
        );

    if (listSection) {
        listSection.hidden = true;
    }

    if (editSection) {
        editSection.hidden = true;
    }

    if (detailSection) {
        detailSection.hidden = false;
    }

    const dateElement =
        document.getElementById(
            "diary-detail-date"
        );

    const textElement =
        document.getElementById(
            "diary-detail-text"
        );

    const thumbnailContainer =
        document.getElementById(
            "diary-detail-action-thumbnail"
        );

    if (dateElement) {
        dateElement.textContent =
            diary.date || "";
    }

    if (textElement) {
        textElement.textContent =
            diary.text || "";
    }

    if (thumbnailContainer) {
        thumbnailContainer.replaceChildren();

        // 日記詳細も print_image を使用する。
        const thumbnail =
            createActionThumbnail(
                diary.actionId,
                "この日記に対するうさぎの反応"
            );

        if (thumbnail) {
            thumbnailContainer.appendChild(
                thumbnail
            );
        } else {
            const message =
                document.createElement(
                    "p"
                );

            message.className =
                "diary-no-action";

            message.textContent =
                "この日記には反応画像が記録されていません。";

            thumbnailContainer.appendChild(
                message
            );
        }
    }
}

function createActionThumbnail(
    actionId,
    altText
) {
    // 日記一覧・日記詳細では
    // 印刷用代表画像 print_image を使用する。
    const imagePath =
        getActionPrintImagePath(
            actionId
        );

    if (!imagePath) {
        return null;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "diary-action-thumbnail";

    const image =
        document.createElement(
            "img"
        );

    image.src =
        imagePath;

    image.alt =
        altText;

    image.loading =
        "lazy";

    image.addEventListener(
        "error",
        () => {
            wrapper.remove();
        },
        { once: true }
    );

    const action =
        rabbitActions[actionId];

    if (
        action &&
        action.name
    ) {
        const caption =
            document.createElement(
                "div"
            );

        caption.className =
            "diary-action-caption";

        caption.textContent =
            action.name;

        wrapper.append(
            image,
            caption
        );
    } else {
        wrapper.appendChild(
            image
        );
    }

    return wrapper;
}

function hideDiaryDetail() {
    const listSection =
        document.getElementById(
            "diary-book-section"
        );

    const detailSection =
        document.getElementById(
            "diary-detail-section"
        );

    const editSection =
        document.getElementById(
            "diary-edit-section"
        );

    if (detailSection) {
        detailSection.hidden = true;
    }

    if (editSection) {
        editSection.hidden = true;
    }

    if (listSection) {
        listSection.hidden = false;
    }

    currentDiaryId =
        null;

    renderDiaryList();
}

// --------------------------------------------------
// 日記の編集・追記
// --------------------------------------------------

function setupDiaryEditButtons() {
    const editButton =
        document.getElementById(
            "diary-detail-edit"
        );

    const saveButton =
        document.getElementById(
            "diary-edit-save"
        );

    const cancelButton =
        document.getElementById(
            "diary-edit-cancel"
        );

    const backButton =
        document.getElementById(
            "diary-detail-back"
        );

    if (editButton) {
        editButton.addEventListener(
            "click",
            showDiaryEdit
        );
    }

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveDiaryEdit
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            cancelDiaryEdit
        );
    }

    if (backButton) {
        backButton.addEventListener(
            "click",
            hideDiaryDetail
        );
    }
}

function showDiaryEdit() {
    if (!currentDiaryId) {
        return;
    }

    const diary =
        getDiaryById(
            currentDiaryId
        );

    if (!diary) {
        alert(
            "編集する日記が見つかりませんでした。"
        );

        hideDiaryDetail();

        return;
    }

    const detailSection =
        document.getElementById(
            "diary-detail-section"
        );

    const editSection =
        document.getElementById(
            "diary-edit-section"
        );

    const dateInput =
        document.getElementById(
            "diary-edit-date"
        );

    const textInput =
        document.getElementById(
            "diary-edit-text"
        );

    if (dateInput) {
        dateInput.value =
            diary.date ||
            getTodayDate();
    }

    if (textInput) {
        textInput.value =
            diary.text || "";
    }

    if (detailSection) {
        detailSection.hidden = true;
    }

    if (editSection) {
        editSection.hidden = false;
    }
}

function saveDiaryEdit() {
    if (!currentDiaryId) {
        return;
    }

    const dateInput =
        document.getElementById(
            "diary-edit-date"
        );

    const textInput =
        document.getElementById(
            "diary-edit-text"
        );

    const date =
        dateInput
            ? dateInput.value
            : "";

    const text =
        textInput
            ? textInput.value.trim()
            : "";

    if (!date) {
        alert(
            "日付を入力してください。"
        );

        return;
    }

    if (!text) {
        alert(
            "本文が空です。"
        );

        return;
    }

    const updated =
        updateDiary(
            currentDiaryId,
            {
                date,
                text
            }
        );

    if (!updated) {
        alert(
            "日記を更新できませんでした。"
        );

        return;
    }

    // 編集時は元の actionId を維持する。
    showDiaryDetail(
        currentDiaryId
    );

    renderDiaryList();
}

function cancelDiaryEdit() {
    if (currentDiaryId) {
        showDiaryDetail(
            currentDiaryId
        );

        return;
    }

    const editSection =
        document.getElementById(
            "diary-edit-section"
        );

    const listSection =
        document.getElementById(
            "diary-book-section"
        );

    if (editSection) {
        editSection.hidden = true;
    }

    if (listSection) {
        listSection.hidden = false;
    }
}

// --------------------------------------------------
// 日記の削除
// --------------------------------------------------

function setupDiaryDeleteButton() {
    const deleteButton =
        document.getElementById(
            "diary-detail-delete"
        );

    if (!deleteButton) {
        return;
    }

    deleteButton.addEventListener(
        "click",
        () => {
            if (!currentDiaryId) {
                return;
            }

            const diary =
                getDiaryById(
                    currentDiaryId
                );

            if (!diary) {
                alert(
                    "削除する日記が見つかりませんでした。"
                );

                hideDiaryDetail();

                return;
            }

            const confirmed =
                window.confirm(
                    `${diary.date || ""} の日記を削除しますか？\nこの操作は取り消せません。`
                );

            if (!confirmed) {
                return;
            }

            const deleted =
                deleteDiary(
                    currentDiaryId
                );

            if (!deleted) {
                alert(
                    "日記を削除できませんでした。"
                );

                return;
            }

            hideDiaryDetail();
        }
    );
}

// --------------------------------------------------
// 日記帳の印刷／PDF保存
// --------------------------------------------------

function setupDiaryPrintButton() {
    const button =
        document.getElementById(
            "diary-print-button"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        printDiaryBook
    );
}

async function printDiaryBook() {
    const button =
        document.getElementById(
            "diary-print-button"
        );

    const printArea =
        document.getElementById(
            "diary-print-area"
        );

    if (!printArea) {
        alert(
            "印刷用の表示領域が見つかりませんでした。"
        );

        return;
    }

    if (button) {
        button.disabled = true;
    }

    try {
        if (!Object.keys(rabbitActions).length) {
            const actions =
                await loadActions();

            if (!actions) {
                alert(
                    "ウサギの画像データを読み込めませんでした。"
                );

                return;
            }
        }

        // 保存データは変更せず、
        // 印刷時だけ古い日記から順に並べる。
        const diaries =
            getDiaries().sort(
                (a, b) => {
                    const dateCompare =
                        (a.date || "")
                            .localeCompare(
                                b.date || ""
                            );

                    if (dateCompare !== 0) {
                        return dateCompare;
                    }

                    return (a.id || "")
                        .localeCompare(
                            b.id || ""
                        );
                }
            );

        if (diaries.length === 0) {
            alert(
                "日記がまだありません。日記を保存してから書き出してください。"
            );

            return;
        }

        renderDiaryPrintDocument(
            diaries,
            printArea
        );

        // 印刷用代表画像の読み込みを待つ。
        await waitForPrintImages(
            printArea
        );

        if (
            document.fonts &&
            document.fonts.ready
        ) {
            await document.fonts.ready;
        }

        // ブラウザ標準の印刷ダイアログ。
        // 「PDFとして保存」またはプリンターを選択する。
        window.print();

    } catch (error) {
        console.error(
            "日記帳の印刷準備に失敗しました:",
            error
        );

        alert(
            "日記帳の印刷準備に失敗しました。もう一度お試しください。"
        );

    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

function renderDiaryPrintDocument(
    diaries,
    container
) {
    container.replaceChildren();

    const header =
        document.createElement(
            "header"
        );

    header.className =
        "print-book-header";

    const title =
        document.createElement(
            "h1"
        );

    title.textContent =
        "🐇 癒しウサギの日記帳";

    const summary =
        document.createElement(
            "p"
        );

    summary.className =
        "print-book-summary";

    summary.textContent =
        `全 ${diaries.length} 件の日記`;

    const generatedAt =
        document.createElement(
            "p"
        );

    generatedAt.className =
        "print-generated-at";

    generatedAt.textContent =
        `書き出し日：${getTodayDate()}`;

    header.append(
        title,
        summary,
        generatedAt
    );

    container.appendChild(
        header
    );

    const entriesContainer =
        document.createElement(
            "div"
        );

    entriesContainer.className =
        "print-diary-entries";

    diaries.forEach(
        (diary, index) => {
            const entry =
                document.createElement(
                    "article"
                );

            entry.className =
                "print-diary-entry";

            const entryHeader =
                document.createElement(
                    "header"
                );

            entryHeader.className =
                "print-entry-header";

            const date =
                document.createElement(
                    "h2"
                );

            date.className =
                "print-diary-date";

            date.textContent =
                diary.date ||
                "日付未設定";

            const number =
                document.createElement(
                    "span"
                );

            number.className =
                "print-diary-number";

            number.textContent =
                `${index + 1} / ${diaries.length}`;

            entryHeader.append(
                date,
                number
            );

            const text =
                document.createElement(
                    "div"
                );

            text.className =
                "print-diary-text";

            // HTMLとして解釈せず、本文の改行を保持する。
            text.textContent =
                diary.text ||
                "（本文なし）";

            const reaction =
                document.createElement(
                    "div"
                );

            reaction.className =
                "print-diary-reaction";

            // ------------------------------------------
            // ここが今回の重要部分
            //
            // 印刷では image ではなく
            // print_image を使用する。
            //
            // R08:
            //   image       → R08.mp4
            //   print_image → R08.png
            // ------------------------------------------

            const imagePath =
                getActionPrintImagePath(
                    diary.actionId
                );

            if (
                diary.actionId &&
                imagePath
            ) {
                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    imagePath;

                image.alt =
                    "この日記に対応するウサギの反応";

                image.loading =
                    "eager";

                image.decoding =
                    "sync";

                const action =
                    rabbitActions[
                        diary.actionId
                    ];

                const caption =
                    document.createElement(
                        "p"
                    );

                caption.className =
                    "print-diary-caption";

                caption.textContent =
                    action &&
                    action.name
                        ? action.name
                        : `ウサギの反応（${diary.actionId}）`;

                image.addEventListener(
                    "error",
                    () => {
                        const fallback =
                            document.createElement(
                                "p"
                            );

                        fallback.className =
                            "print-no-action";

                        fallback.textContent =
                            `反応画像を読み込めませんでした（${diary.actionId}）。`;

                        reaction.replaceChildren(
                            fallback
                        );
                    },
                    { once: true }
                );

                reaction.append(
                    image,
                    caption
                );

            } else {
                const noAction =
                    document.createElement(
                        "p"
                    );

                noAction.className =
                    "print-no-action";

                noAction.textContent =
                    diary.actionId
                        ? `印刷用代表画像が設定されていません（${diary.actionId}）。`
                        : "この日記にはウサギの反応画像が記録されていません。";

                reaction.appendChild(
                    noAction
                );
            }

            entry.append(
                entryHeader,
                text,
                reaction
            );

            entriesContainer.appendChild(
                entry
            );
        }
    );

    container.appendChild(
        entriesContainer
    );

    const footer =
        document.createElement(
            "footer"
        );

    footer.className =
        "print-book-footer";

    footer.textContent =
        "PetApp6 v1.2.1 – 癒しウサギの日記帳";

    container.appendChild(
        footer
    );
}

async function waitForPrintImages(
    container
) {
    const images =
        Array.from(
            container.querySelectorAll(
                "img"
            )
        );

    await Promise.all(
        images.map(
            image => {
                if (image.complete) {
                    return Promise.resolve();
                }

                return new Promise(
                    resolve => {
                        image.addEventListener(
                            "load",
                            resolve,
                            { once: true }
                        );

                        image.addEventListener(
                            "error",
                            resolve,
                            { once: true }
                        );
                    }
                );
            }
        )
    );

    await Promise.all(
        images.map(
            image => {
                if (
                    typeof image.decode !==
                    "function"
                ) {
                    return Promise.resolve();
                }

                return image
                    .decode()
                    .catch(
                        () => undefined
                    );
            }
        )
    );
}

// --------------------------------------------------
// Idle Layer（時間帯に応じた既存動作）
// --------------------------------------------------

async function startIdleLoop() {
    if (
        !Object.keys(
            rabbitActions
        ).length
    ) {
        const actions =
            await loadActions();

        if (!actions) {
            return;
        }
    }

    function getTimeSlot() {
        const hour =
            new Date().getHours();

        if (
            hour >= 6 &&
            hour < 10
        ) {
            return "morning";
        }

        if (
            hour >= 10 &&
            hour < 16
        ) {
            return "noon";
        }

        if (
            hour >= 16 &&
            hour < 20
        ) {
            return "evening";
        }

        return "night";
    }

    function chooseIdleAction() {
        const slot =
            getTimeSlot();

        let candidates = [];

        if (slot === "morning") {
            candidates = [
                "R17",
                "R18",
                "R19"
            ];

        } else if (slot === "noon") {
            candidates = [
                "R08"
            ];

        } else if (slot === "evening") {
            candidates = [
                "R17",
                "R18",
                "R19"
            ];

        } else {
            candidates = [
                "R15"
            ];
        }

        return rabbitActions[
            randomPick(
                candidates
            )
        ];
    }

    function showIdle() {
        const action =
            chooseIdleAction();

        if (!action) {
            return;
        }

        const phrase =
            randomPick(
                action.short_phrases
            );

        currentActionId =
            action.id;

        // Idle Layer は通常表示なので image を使用。
        // MP4なら動画が表示される。
        renderRabbit(
            action,
            phrase
        );
    }

    showIdle();

    // 既存の Idle Layer の定期表示を維持。
    window.setInterval(
        showIdle,
        20000
    );
}

// --------------------------------------------------
// 初期化
// --------------------------------------------------

window.addEventListener(
    "DOMContentLoaded",
    async () => {
        setupPetNameControl();
        setupVoiceButton();
        setupDiaryEditButtons();
        setupDiaryDeleteButton();
        setupDiaryPrintButton();

        const analyzeButton =
            document.getElementById(
                "analyze-button"
            );

        if (analyzeButton) {
            analyzeButton.addEventListener(
                "click",
                processDiary
            );
        }

        const actions =
            await loadActions();

        if (!actions) {
            return;
        }

        // 一覧の初期表示
        renderDiaryList();

        // うさぎの初期表示
        clearRabbit();

        await startIdleLoop();
    }
);