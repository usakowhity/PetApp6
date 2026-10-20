# 🐇 PetApp6 v1.3.2 - Healing Rabbit Diary

[🇯🇵 Japanese Version (README.md)](README.md)

> 🖼️ **PetApp6 Home Screen**
>
> [![PetApp6 Home Screen](docs/images/petapp6-main.png)](https://usakowhity.github.io/PetApp6/)
>
> 🎬 **[Watch the PetApp6 demo on YouTube](https://www.youtube.com/shorts/ECOsiTvbqI8)**

PetApp6 is a virtual pet diary application that inherits the functionality, file structure, and world of PetApp5 v3.2.7 while adding a diary notebook system.

It is built on PetApp5's Direct Talk, speech recognition, Diary → Emotion/Need → Rabbit Action, and Idle Layer, and adds diary saving, list/detail views, editing, deletion, and printable/PDF diary output with thumbnails.

PetApp6 also keeps the v1.2.1 design that separates normal Rabbit Action media from static images used for diary records and printing. v1.2.2 refined the print/PDF implementation, v1.3.0 added Direct Talk actions R22 and R23 and expanded Rabbit Actions to R01-R23, and v1.3.1 fixed a problem where Japanese orthographic variations such as “嬉しい / うれしい” and “良かった / よかった” were not consistently recognized as joy, causing different rabbit reactions.

**v1.3.2 is a documentation / presentation update.** It improves the README files, adds a home screen image, a link to the YouTube demo, and cross-links between the Japanese and English READMEs. The application itself is unchanged from v1.3.1.

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

Direct Talk lets users speak to the rabbit by placing the configured pet name at the beginning of the utterance.

For example, if the pet name is “Leo”:

- Leo, good morning
- Leo, how are you?
- Leo, cute
- Leo, good night
- Leo, food
- Leo, water
- Leo, toilet
- Leo, house
- Leo, walk
- Leo, outside
- Leo, congratulations
- Leo, happy birthday

The pet name is fully customizable.

### Direct Talk Dictionary

| Utterance | Action ID | Meaning |
|---|---|---|
| Good morning | R10 | Morning greeting |
| How are you? / 元気 | R11 | Checking condition |
| Cute / good | R14 | Joy reaction |
| Good night | R15 | Rest |
| Sleep / ねんね | R08 | Sleeping reaction |
| Come here / おいで | R16 | Response to calling |
| Food / ごはん | R19 | Eating |
| Hay / timothy | R17 | Eating hay |
| Water / お水 | R18 | Drinking |
| Hungry | R03 | Hungry reaction |
| Toilet / おしっこ etc. | R20 | Toilet reaction |
| House / おうち | R21 | Entering the house |
| Walk / outside | R22 | Going outside |
| Congratulations / happy birthday | R23 | Celebration |

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

### Joy recognition (fixed in v1.3.1)

The following expressions are recognized as `joy` with Need `share_joy`, resulting in **R14 “ぴょんっと喜ぶ”**:

| Expression pattern | Examples |
|---|---|
| 嬉 / うれし | 嬉しい, うれしい, うれしかった |
| 楽し | 楽しい, 楽しかった |
| 良かった / よかった | 良かった, よかったな |
| ご機嫌 | ご機嫌 |
| ラッキー | ラッキー |

The regular expression used by `detectEmotionNeed()` is:

```js
/嬉|うれし|楽し|良かった|よかった|ご機嫌|ラッキー/
```

Thus, kanji and hiragana spelling variations produce the same rabbit reaction.

If no emotion rule matches, the default is `pleasant` with Need `companionship`, resulting in R04 “じっと隣で見守る”.

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

- **Version:** v1.3.2
- **Previous version:** v1.3.1
- **Release type:** Documentation / Presentation Update
- **Main change:** Updated README.md and README_EN.md, and added cross-links between them, the home screen screenshot, and the YouTube demo link. The application itself is unchanged from v1.3.1.
- **Application:** Keeps the v1.3.1 emotion-detection fix and all features up to v1.3.0 (including R22 and R23)
- **Print support:** `print_image` design retained
- **Developer:** usakowhity
- **License:** MIT

### Version History

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
