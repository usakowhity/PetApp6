// diaryStorage.js
// PetApp6
// 日記帳データの保存・取得・更新・追記・削除を担当
//
// PetApp6 v1 の DiaryEntry 互換仕様を維持しながら、
// actionId と編集・削除機能を追加する。
// 保存先：localStorage["petapp6_diaries"]

const STORAGE_KEY = "petapp6_diaries";

/**
 * localStorage から日記一覧を取得する
 *
 * 旧データとの互換性を維持するため、
 * actionId が存在しない日記には null を補う。
 *
 * @returns {Array<Object>}
 */
export function getDiaries() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const diaries = JSON.parse(raw);

        if (!Array.isArray(diaries)) {
            return [];
        }

        return diaries.map(normalizeDiaryEntry);
    } catch (error) {
        console.error("日記データの読み込みに失敗しました:", error);
        return [];
    }
}


/**
 * 日記1件を保存する
 *
 * @param {Object} entry
 * @returns {Object|null}
 */
export function saveDiary(entry) {
    if (!entry || typeof entry !== "object") {
        return null;
    }

    const diaries = getDiaries();

    const normalizedEntry = normalizeDiaryEntry({
        id: entry.id || new Date().toISOString(),
        date: entry.date || getTodayDate(),
        text: entry.text || "",
        emotion: entry.emotion ?? null,
        need: entry.need ?? null,
        actionId: entry.actionId ?? null
    });

    diaries.push(normalizedEntry);

    saveAllDiaries(diaries);

    return normalizedEntry;
}


/**
 * 日記1件をIDで取得する
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function getDiaryById(id) {
    if (!id) {
        return null;
    }

    const diaries = getDiaries();

    return diaries.find(diary => diary.id === id) || null;
}


/**
 * 日記1件を更新する
 *
 * 編集時には元の日記IDを維持する。
 * actionId を指定しなければ、既存の actionId を維持する。
 *
 * @param {string} id
 * @param {Object} changes
 * @returns {Object|null}
 */
export function updateDiary(id, changes = {}) {
    if (!id) {
        return null;
    }

    const diaries = getDiaries();

    const index = diaries.findIndex(diary => diary.id === id);

    if (index === -1) {
        return null;
    }

    const current = diaries[index];

    const updated = normalizeDiaryEntry({
        ...current,
        ...changes,

        // IDは編集しても変更しない
        id: current.id,

        // actionId が changes に含まれていない場合は既存値を維持
        actionId:
            Object.prototype.hasOwnProperty.call(changes, "actionId")
                ? changes.actionId
                : current.actionId
    });

    diaries[index] = updated;

    saveAllDiaries(diaries);

    return updated;
}


/**
 * 日記本文に追記する
 *
 * 現在の本文を残したまま、
 * 新しい文章を末尾に追加する。
 *
 * @param {string} id
 * @param {string} additionalText
 * @returns {Object|null}
 */
export function appendDiaryText(id, additionalText) {
    if (!id) {
        return null;
    }

    if (
        typeof additionalText !== "string" ||
        additionalText.trim() === ""
    ) {
        return null;
    }

    const diary = getDiaryById(id);

    if (!diary) {
        return null;
    }

    const oldText = diary.text || "";
    const newText = additionalText.trim();

    let combinedText;

    if (oldText.trim() === "") {
        combinedText = newText;
    } else {
        combinedText = `${oldText}\n${newText}`;
    }

    return updateDiary(id, {
        text: combinedText
    });
}


/**
 * 日記1件を削除する
 *
 * @param {string} id
 * @returns {boolean}
 */
export function deleteDiary(id) {
    if (!id) {
        return false;
    }

    const diaries = getDiaries();

    const filtered = diaries.filter(diary => diary.id !== id);

    if (filtered.length === diaries.length) {
        return false;
    }

    saveAllDiaries(filtered);

    return true;
}


/**
 * すべての日記を削除する
 *
 * 現時点のUIでは使用しない。
 * 将来の「日記帳を初期化する」機能用として残す。
 */
export function clearAllDiaries() {
    localStorage.removeItem(STORAGE_KEY);
}


/**
 * 日記一覧を保存する内部関数
 *
 * @param {Array<Object>} diaries
 */
function saveAllDiaries(diaries) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(diaries)
        );
    } catch (error) {
        console.error("日記データの保存に失敗しました:", error);
        throw error;
    }
}


/**
 * 日記データを正規化する
 *
 * 旧形式：
 * {
 *   id,
 *   date,
 *   text,
 *   emotion,
 *   need
 * }
 *
 * 新形式：
 * {
 *   id,
 *   date,
 *   text,
 *   emotion,
 *   need,
 *   actionId
 * }
 *
 * actionId が存在しない旧データでも
 * null として扱うことで互換性を維持する。
 *
 * @param {Object} diary
 * @returns {Object}
 */
function normalizeDiaryEntry(diary) {
    return {
        id: diary.id || new Date().toISOString(),

        date:
            typeof diary.date === "string" && diary.date
                ? diary.date
                : getTodayDate(),

        text:
            typeof diary.text === "string"
                ? diary.text
                : "",

        // v1互換のため保持
        emotion:
            diary.emotion !== undefined
                ? diary.emotion
                : null,

        // v1互換のため保持
        need:
            diary.need !== undefined
                ? diary.need
                : null,

        // 新規追加
        // 旧データには存在しないので null
        actionId:
            diary.actionId !== undefined
                ? diary.actionId
                : null
    };
}


/**
 * 今日の日付を YYYY-MM-DD で取得する
 *
 * @returns {string}
 */
function getTodayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}