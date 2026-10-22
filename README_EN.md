# 🐇 PetApp6 v1.3.3 - Healing Rabbit Diary

[🇯🇵 Japanese Version (README.md)](README.md)

> 🖼️ **PetApp6 Home Screen**
>
> [![PetApp6 Home Screen](docs/images/petapp6-main.png)](https://usakowhity.github.io/PetApp6/)
>
> 🎬 **[Watch the PetApp6 demo on YouTube](https://www.youtube.com/shorts/ECOsiTvbqI8)**

PetApp6 is a virtual pet diary application that inherits the functionality, file structure, and world of PetApp5 v3.2.7 while adding a diary notebook system.

It is built on PetApp5's Direct Talk, speech recognition, Diary → Emotion/Need → Rabbit Action, and Idle Layer, and adds diary saving, list/detail views, editing, deletion, and printable/PDF diary output with thumbnails.

PetApp6 also keeps the v1.2.1 design that separates normal Rabbit Action media from static images used for diary records and printing. v1.2.2 refined the print/PDF implementation, v1.3.0 added Direct Talk actions R22 and R23 and expanded Rabbit Actions to R01-R23, and v1.3.1 fixed a problem where Japanese orthographic variations such as “嬉しい / うれしい” and “良かった / よかった” were not consistently recognized as joy, causing different rabbit reactions.

> **Language note:** PetApp6 v1 is a Japanese-language app. The interface, speech recognition, Direct Talk trigger words and diary keyword rules are all in Japanese, so English phrases such as "Leo, good morning" will not trigger reactions. English translations below are for reference only.

**v1.3.3** expands the rabbit's reactions to diary entries so that all 23 Rabbit Actions can appear (from the diary, Direct Talk or the idle behavior). It also fixes video-based actions (such as R08) so that diary thumbnails and printed/PDF diaries use still images.

All rabbit images and videos were created with generative AI.

---

## ✨ 1. Overview

PetApp6 extends PetApp5 rather than replacing it. Existing functionality, modules, and image assets are preserved while new diary features are added.

### Main Features

- Customizable pet name
- Direct Talk using the configured pet name
- SpeechRecognition support
- Diary saving, list, and detail views
- Rabbit Action reactions associated with diary entries
- Diary editing and deletion
- Printable diary book with thumbnails / PDF saving
- Rabbit Action R01-R23
- MP4-based Rabbit Action playback
- Static print images for diary list/detail and printing
- Time-based Idle Layer

---

## 🎙️ 2. Direct Talk

Direct Talk is **voice-only** (Japanese speech recognition, `ja-JP`). Use a browser that supports speech recognition (for example Chrome or Edge). Keep the default name レオ (Leo), press the talk button and say, for example:

- レオ、おはよう — "Good morning"
- レオ、元気 — "How are you?"
- レオ、かわいい — "You're cute"
- レオ、おやすみ — "Good night"
- レオ、ごはん — "Food"
- レオ、お水 — "Water"
- レオ、散歩 / おそと — "Walk / outside"
- レオ、おめでとう — "Congratulations"

The pet name is fully customizable.

### Direct Talk Dictionary

| Say (Japanese) | Meaning | Action ID | Reaction |
|---|---|---|---|
| おはよう | Good morning | R10 | Morning greeting |
| 元気 | How are you? | R11 | Checking condition |
| かわいい / 可愛い / カワイイ / いいこ / おりこう / お利口 | Cute / good bunny | R14 | Joy |
| おやすみ | Good night | R15 | Rest |
| ねんね | Sleepy time | R08 | Sleeping |
| おいで | Come here | R16 | Response to call |
| ごはん | Food | R19 | Eating |
| 牧草 / チモシー | Hay / timothy | R17 | Eating hay |
| 水 / お水 | Water | R18 | Drinking |
| お腹すいた | I'm hungry | R03 | Hungry reaction |
| トイレ / おしっこ / ちっち / シー | Toilet | R20 | Toilet reaction |
| ハウス / おうち | House | R21 | Entering the house |
| 散歩 / おそと | Walk / outside | R22 | Going outside |
| おめでとう / ハッピーバースデー | Congratulations / HBD | R23 | Celebration |

---

## 📖 3. Diary Notebook

PetApp6 stores diary text and date information in the browser's `localStorage`. No account registration is required.

The diary notebook supports:

- Save diary entries
- View the diary list
- View diary details
- Edit and append diary entries
- Delete entries
- Associate Rabbit Actions with entries
- Display representative print images
- Print the diary book
- Save as PDF using the browser's print dialog

### Diary reaction processing

When a diary is saved, lightweight rule-based processing in `app.js` detects Emotion and Need from keywords and selects a Rabbit Action. No LLM is required for this v1 implementation.

### Diary reactions (expanded in v1.3.3)

When a diary entry is saved, lightweight rule-based processing in `app.js` detects a feeling from Japanese keywords and picks one Rabbit Action at random from the candidates below. No LLM is used.

| Keywords in the entry (Japanese) | Possible Rabbit Actions |
|---|---|
| tired / exhausted / sleepy (疲, しんどい, 眠い …) | R15 / R05 / R08 (1/3 each) |
| sad / painful / crying (悲, つら, 泣, 涙 …) | R01 / R02 / R06 / R07 (1/4 each) |
| anxious / worried / scared (不安, 心配, 怖 …) | R03 / R09 / R10 / R12 (1/4 each) |
| lonely (寂, 孤独, しゅん) | R01 / R02 / R05 / R06 / R16 (1/5 each) |
| happy / fun / glad (嬉, 楽し, 良かった …) | R14 |
| angry / irritated (怒, イラ, むか …) | R11 / R12 (1/2 each) |
| anything else | R04 / R13 (1/2 each) |

If an entry contains several feeling words, the first matching row (from the top of this table down to "angry") is used. If several candidates are available, the selector chooses evenly from all candidates (fixed in v1.3.3). Saved entries keep their original reaction (`actionId`).

Processing flow:

```text
Diary text
   ↓ detectEmotionNeed() (app.js)
Emotion × Need
   ↓ action_mapping.json
Rabbit Action ID
   ↓ rabbitActionSelector.js
Rabbit reaction
```

---

## 🖼️ 4. Rabbit Action Media Design

Rabbit Actions use two media roles.

### `image`

The normal interaction media used by Direct Talk, Diary Reaction, and Idle Layer. It can be PNG or MP4.

### `print_image`

The static representative image used for:

- Diary thumbnails
- Diary details
- Printed diary books
- PDF output

MP4-based actions therefore have a corresponding PNG for printing.

Example:

```json
{
  "id": "R08",
  "name": "ごろんと安心する",
  "image": "assets/rabbit/actions/R08.mp4",
  "print_image": "assets/rabbit/actions/R08.png"
}
```

Current MP4 actions with print images:

- R08 → R08.mp4 / R08.png
- R17 → R17.mp4 / R17.png
- R18 → R18.mp4 / R18.png
- R19 → R19.mp4 / R19.png

---

## 🗂 5. Project Structure

```text
PetApp6/
├─ index.html
├─ js/
│  ├─ app.js
│  ├─ uiRenderer.js
│  ├─ rabbitActionSelector.js
│  └─ diaryStorage.js
├─ data/
│  ├─ rabbit_actions.json
│  └─ action_mapping.json
├─ css/
│  └─ style.css
├─ docs/
│  └─ images/
│     └─ petapp6-main.png    # home screen screenshot
└─ assets/
   └─ rabbit/
      └─ actions/
         ├─ R01.png ... R23.png
         ├─ R08.mp4
         ├─ R17.mp4
         ├─ R18.mp4
         └─ R19.mp4
```

---

## 🖨️ 6. Printing and PDF Export

1. Enter a diary entry and press the button to save it to the diary.
2. Open the Diary Notebook.
3. Press **Print / Save PDF**.
4. Use the browser print dialog to print or select **Save as PDF**.

No external PDF library is required. Print output uses `print_image` rather than MP4 media.

---

## 💾 7. Data Storage

Diary entries are stored in browser `localStorage`.

Storage key:

```text
petapp6_diaries
```

The stored record uses `actionId`, not an image filename. This allows Rabbit Action media to change without rewriting existing diary records.

The v1.3.1 emotion-recognition fix applies to newly saved diary entries; existing saved `actionId` values are not rewritten.

---

## 🚀 8. Live Sites

- **GitHub Pages:** https://usakowhity.github.io/PetApp6/
- **Vercel:** https://petapp6.vercel.app/
- **Netlify:** https://petapp6.netlify.app/
- **GitHub Repository:** https://github.com/usakowhity/PetApp6
- **YouTube Demo:** https://www.youtube.com/shorts/ECOsiTvbqI8

---

## 📦 9. Release Information

- **Version:** v1.3.3
- **Previous version:** v1.3.2
- **Release type:** Feature / Fix
- **Main changes:** Expanded diary reactions; the selector now chooses from all candidates; video-based actions (e.g. R08) now use still images in diary thumbnails, details and printing/PDF.
- **Behavior:** All 23 Rabbit Actions can now appear from the diary, Direct Talk, or idle behavior.
- **Artwork:** All rabbit images and videos were created with generative AI.
- **Developer:** usakowhity
- **License:** MIT

### Version History

- **v1.3.3:** Expanded diary reactions for tiredness, sadness, anxiety, loneliness, anger and the default case, so all 23 Rabbit Actions can now appear. The selector now chooses from all candidates. Video-based actions (e.g. R08) now use their still images for diary thumbnails and printing.
- **v1.3.2:** Improved README files, home screen image, YouTube demo link, and Japanese/English README cross-links (Documentation / Presentation Update)
- **v1.3.1:** Fixed Japanese spelling variations such as “うれしい” and “良かった” in joy detection
- **v1.3.0:** Added Direct Talk R22 “Walk / Outside” and R23 “Congratulations / Happy Birthday”
- **v1.2.2:** Refined diary printing / PDF display
- **v1.2.1:** Separated `image` and `print_image` for Rabbit Actions

---

## 🛠 Development Policy

PetApp6 follows an additive development policy:

- Preserve existing PetApp5 functionality
- Reuse existing JavaScript modules and image assets
- Keep diary functionality modular
- Extend Direct Talk using the existing mechanism
- Maintain compatibility and future extensibility
- Keep media roles clearly separated

**A feature may remain unused, but the foundation needed for future extensions should not be removed.**

---

## 📄 License

MIT License. See the `LICENSE` file for details.

---

## 👨‍💻 Developer

usakowhity

PetApp Series

© 2026 usakowhity
