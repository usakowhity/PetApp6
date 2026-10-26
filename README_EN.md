# 🐇 PetApp6 v1.3.5 - Healing Rabbit Diary

[🇯🇵 Japanese Version (README.md)](README.md)

> 🖼️ **PetApp6 Home Screen**
>
> [![PetApp6 Home Screen](docs/images/petapp6-main.png)](https://usakowhity.github.io/PetApp6/)
>
> 🎬 **[Watch the PetApp6 demo on YouTube](https://www.youtube.com/shorts/wOnqnhPHTJA)**

> **Language note:** PetApp6 v1 is a Japanese-language app. The interface, speech recognition, Direct Talk trigger words and diary keyword rules are all in Japanese, so English phrases such as "Leo, good morning" will not trigger reactions. English translations in this document are for reference only.

PetApp6 is a virtual pet diary application that inherits the functionality, file structure, and world of PetApp5 v3.2.7 while adding a diary notebook system.

It is built on PetApp5's Direct Talk, speech recognition, Diary → Emotion/Need → Rabbit Action, and Idle Layer, and adds diary saving, list/detail views, editing, deletion, and printable/PDF diary output with thumbnails.

PetApp6 also keeps the v1.2.1 design that separates normal Rabbit Action media from static images used for diary records and printing. v1.2.2 refined the print/PDF implementation, v1.3.0 added Direct Talk actions R22 and R23 and expanded Rabbit Actions to R01-R23, and v1.3.1 fixed a problem where Japanese orthographic variations such as “嬉しい / うれしい” and “良かった / よかった” were not consistently recognized as joy, causing different rabbit reactions.

v1.3.2 improved the README files (home screen image, YouTube demo link, Japanese/English cross-links) without changing the application.

**v1.3.3 expands the rabbit's reactions to diary entries so that all 23 Rabbit Actions (R01–R23) can appear from the diary, Direct Talk or the idle behavior.** It also fixes video-based actions (such as R08) so that diary thumbnails, diary details and printed/PDF diaries use still images (PNG).

**v1.3.4 reviewed the terms of the tools used for the artwork, stopped using the videos used until then, and made every rabbit a still image (PNG).** It also added alternative images for R08, R15 and R19 (R08-1, R15-1, R19-1) that are shown at random.

**v1.3.5 adds videos with sound for R17 (hay), R18 (drinking water) and R19 (eating).** They play in the idle behavior at meal times and when those actions are triggered. Sound is off by default and can be switched with the small 🔇 / 🔊 button at the bottom right while a video is shown. If a video cannot be played, the still image (PNG) is shown instead.

**The rabbit now follows a natural daily rhythm.** Rabbits are said to be most active around dawn and dusk. The idle behavior in v1.3.5 reflects this: quiet still images at midday and at night, and lively videos with sound at meal times in the morning and evening.

| Time of day | What the rabbit does |
|---|---|
| Morning (6–10) | Eating (video with sound: hay, water, food) |
| Daytime (10–16) | Resting quietly (still image) |
| Evening (16–20) | Eating (video with sound: hay, water, food) |
| Night (20–6) | Sleeping (still image) |

All rabbit images and videos in PetApp6 were created with generative AI (images with ChatGPT; the videos for R17, R18 and R19 with Google Flow / Veo 3.1 Lite). The code (`js/`, `data/`, `css/`, `index.html`) is under the MIT license, but the images and videos in `assets/` are not covered by it. Please do not reuse or redistribute them.

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
- Random display of alternative PNG images (R08, R15, idle behavior)
- Videos with sound for R17, R18 and R19, with a sound on/off button (off by default)
- Static print images for diary list/detail and printing
- Time-based Idle Layer
- Diary reactions chosen at random from several candidates per feeling

---

## 🎙️ 2. Direct Talk

Direct Talk lets users speak to the rabbit by placing the configured pet name at the beginning of the utterance.

Direct Talk is **voice-only**. Speech recognition is set to Japanese (`ja-JP`) and works in browsers that support it, such as Chrome or Edge. The rabbit reacts only when the recognized text starts with the configured pet name, so use a name that speech recognition writes the same way (for example, a katakana name such as レオ).

For example, if the pet name is レオ (Leo):

- レオ、おはよう — "Good morning"
- レオ、元気 — "How are you?"
- レオ、かわいい — "You're cute"
- レオ、おやすみ — "Good night"
- レオ、ごはん — "Food"
- レオ、お水 — "Water"
- レオ、トイレ — "Toilet"
- レオ、ハウス — "House"
- レオ、散歩 / おそと — "Walk / outside"
- レオ、おめでとう — "Congratulations"
- レオ、ハッピーバースデー — "Happy birthday"

The pet name is fully customizable.

### Direct Talk Dictionary

| Say (Japanese) | Meaning | Action ID | Reaction |
|---|---|---|---|
| おはよう | Good morning | R10 | Morning greeting |
| 元気 | How are you? | R11 | Checking condition |
| かわいい / 可愛い / カワイイ / いいこ / おりこう / お利口 | Cute / good bunny | R14 | Joy reaction |
| おやすみ | Good night | R15 | Rest |
| ねんね | Sleepy time | R08 | Sleeping reaction |
| おいで | Come here | R16 | Response to calling |
| ごはん | Food | R19 | Eating |
| 牧草 / チモシー | Hay / timothy | R17 | Eating hay |
| 水 / お水 | Water | R18 | Drinking |
| お腹すいた | I'm hungry | R03 | Hungry reaction |
| トイレ / おしっこ / ちっち / シー | Toilet | R20 | Toilet reaction |
| ハウス / おうち | House | R21 | Entering the house |
| 散歩 / おそと | Walk / outside | R22 | Going outside |
| おめでとう / ハッピーバースデー | Congratulations / happy birthday | R23 | Celebration |

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

### Diary reactions (expanded in v1.3.3)

When a diary is saved, lightweight rule-based processing in `app.js` detects Emotion and Need from Japanese keywords and selects a Rabbit Action. No LLM is used.

| Keywords in the entry (Japanese) | Possible Rabbit Actions |
|---|---|
| tired / exhausted / sleepy (疲, しんどい, きつ, だる, 眠い) | R15 / R05 / R08 (1/3 each) |
| sad / painful / crying (悲, つら, 泣, 涙, ショック …) | R01 / R02 / R06 / R07 (1/4 each) |
| anxious / worried / scared (不安, 心配, 怖, びくびく) | R03 / R09 / R10 / R12 (1/4 each) |
| lonely (寂, 孤独, しゅん) | R01 / R02 / R05 / R06 / R16 (1/5 each) |
| happy / fun / glad (嬉, うれし, 楽し, 良かった, よかった, いいね, ご機嫌, ラッキー) | R14 |
| angry / irritated (怒, おこ, イラ, むか, プンプン) | R11 / R12 (1/2 each) |
| anything else | R04 / R13 (1/2 each) |

- If an entry contains several feeling words, the first matching row is used, in this order: tired → sad → anxious → lonely → happy → angry.
- When several actions are possible, one is chosen at random from all of them with equal probability. The selector was fixed in v1.3.3: previously only the first three candidates were eligible, so later candidates were never chosen.
- Saved entries keep their original reaction (`actionId`).

### Joy recognition (fixed in v1.3.1)

The following expressions are recognized as `joy` with Need `share_joy`, resulting in **R14 “ぴょんっと喜ぶ”**:

| Expression pattern | Examples |
|---|---|
| 嬉 / うれし | 嬉しい, うれしい, うれしかった |
| 楽し | 楽しい, 楽しかった |
| 良かった / よかった | 良かった, よかったな |
| いいね | いいね |
| ご機嫌 | ご機嫌 |
| ラッキー | ラッキー |

The regular expression used by `detectEmotionNeed()` is:

```js
/嬉|うれし|楽し|良かった|よかった|いいね|ご機嫌|ラッキー/
```

Thus, kanji and hiragana spelling variations produce the same rabbit reaction.

If no emotion rule matches, the default is `pleasant` with Need `companionship`, resulting in R04 “じっと隣で見守る” or R13 “そっと励ます（正面座り）”.

Processing flow:

```text
Diary text
   ↓ detectEmotionNeed() (app.js)
Emotion × Need
   ↓ action_mapping.json
Candidate Rabbit Actions
   ↓ rabbitActionSelector.js (equal-probability choice)
Rabbit reaction
```

To add feeling words, edit the regular expressions in `detectEmotionNeed()`. To change which actions are candidates, edit `data/action_mapping.json`. Neither requires changes to `rabbitActionSelector.js`.

---

## 🖼️ 4. Rabbit Action Media Design

Rabbit Actions are based on still images (PNG), and individual actions can add a video (MP4).

### `image`

The representative image (PNG) of an action. It is used when the rabbit is shown, for diary thumbnails, diary details, and printing / PDF export, and as the replacement when a video cannot be played.

### `video` (optional)

The video (MP4) of an action. When an action has `video`, the rabbit is shown as a video. If the video cannot be played, `image` (PNG) is shown instead. Diary thumbnails, diary details and printing / PDF never use videos; they use `image`.

```json
{
  "id": "R18",
  "image": "assets/rabbit/actions/R18.png",
  "video": "assets/rabbit/actions/R18.mp4"
}
```

### `variants` (optional)

An array of alternative still images for the same action. When an action has `variants`, one image is picked at random from `image` and `variants` each time the rabbit is shown. Actions that have a `video` ignore `variants`, because a still image in between videos looks like the rabbit froze.

```json
{
  "id": "R08",
  "image": "assets/rabbit/actions/R08.png",
  "variants": ["assets/rabbit/actions/R08-1.png"]
}
```

### What is shown for each action

| Action | Display |
|---|---|
| R17 (hay), R18 (drinking water), R19 (eating) | Video (R17.mp4 / R18.mp4 / R19.mp4); PNG if the video cannot be played |
| R08 | R08.png or R08-1.png at random |
| R15 | R15.png or R15-1.png at random |
| All others | PNG |

R19-1.png is kept as an alternative image in case the R19 video is not used.

### Idle Layer

The idle display changes every 20 seconds and picks one of the following with equal probability:

| Time of day | Display |
|---|---|
| Morning (6–10) and evening (16–20): meals | Videos of R17, R18, R19 (1/3 each) |
| Daytime (10–16) | R08.png / R08-1.png |
| Night (20–6) | R15.png / R15-1.png |

Direct Talk and diary reactions also show one of the two images at random when R08 or R15 is chosen. R17, R18 and R19 are shown as videos.

### Sound

- The videos contain sound. **Sound is off (muted) by default.**
- While a video is shown, a small button appears at the bottom right of the rabbit area. Press 🔇 to turn the sound on (🔊); press it again to turn it off.
- The sound setting is saved in your browser.
- Because of browser rules, sound may not play until you have interacted with the page at least once.
- With sound on, Direct Talk speech recognition may pick up the video's sound. Turn the sound off if that happens.

### History

- v1.3.4: Stopped using video and unified on still images (PNG); removed `print_image`, added `variants`
- v1.3.5: Added `video` and reintroduced videos with sound for R17, R18 and R19. `image` is always a PNG, used as the replacement when a video fails, for thumbnails and for printing / PDF

---

## 🗂 5. Project Structure

```text
PetApp6/
├─ index.html
├─ js/
│  ├─ app.js
│  ├─ uiRenderer.js
│  ├─ rabbitActionSelector.js
│  ├─ dataLoader.js
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
         ├─ R08-1.png
         ├─ R17.mp4
         ├─ R18.mp4
         ├─ R19.mp4
         ├─ R15-1.png
         └─ R19-1.png
```

---

## 🖨️ 6. Printing and PDF Export

1. Enter a diary entry and press the button to save it to the diary.
2. Open the Diary Notebook.
3. Press **Print / Save PDF**.
4. Use the browser print dialog to print or select **Save as PDF**.

No external PDF library is required. Print output uses the representative `image` (PNG) of each action.

Videos (R17, R18, R19) are not used for printing: diary thumbnails, details and PDF output always use the representative `image` (PNG).

---

## 💾 7. Data Storage

Diary entries are stored in browser `localStorage`.

Storage key:

```text
petapp6_diaries
```

The stored record uses `actionId`, not an image filename. This allows Rabbit Action media to change without rewriting existing diary records.

The v1.3.1 emotion-recognition fix applies to newly saved diary entries; existing saved `actionId` values are not rewritten.

The expanded reactions in v1.3.3 also apply only to newly saved entries.

Diary text and reactions are stored only in your browser. The app's code loads nothing outside its own files and does not send your diary anywhere. Direct Talk uses your browser's built-in speech recognition, which in some browsers may process audio on the browser vendor's servers.

---

## 🚀 8. Live Sites

- **GitHub Pages (Main):** https://usakowhity.github.io/PetApp6/
- **Vercel (Fast Mirror):** https://petapp6.vercel.app/
- **Netlify (Portal):** https://petapp6.netlify.app/
- **GitHub Repository:** https://github.com/usakowhity/PetApp6
- **YouTube Demo:** https://www.youtube.com/shorts/wOnqnhPHTJA

---

## 📦 9. Release Information

- **Version:** v1.3.5
- **Previous version:** v1.3.4
- **Release type:** Feature
- **Main changes:**
  - Added videos with sound for R17 (hay), R18 (water) and R19 (eating)
  - Sound is off by default; switch it with the button at the bottom right while a video is shown (saved in the browser)
  - If a video cannot be played, the still image (PNG) is shown automatically
  - Meal-time idle behavior now picks from the R17 / R18 / R19 videos
  - Clarified that the images and videos in `assets/` are not covered by the MIT license
- **Compatibility:** Existing diary data (`localStorage`, `actionId`) keeps working without migration
- **Images and videos:** All created with generative AI (videos: Google Flow / Veo 3.1 Lite)
- **Developer:** usakowhity
- **License:** Code: MIT. Images and videos: not covered by the MIT license

### Version History

- **v1.3.5:** Added videos with sound (Google Flow) for R17, R18 and R19; sound is off by default with an on/off button; PNG fallback if a video cannot be played
- **v1.3.4:** Stopped using video (MP4); random alternative images for R08, R15 and R19; uniform idle image selection
- **v1.3.3:** Expanded diary reactions, fixed the selector (all candidates are eligible), fixed still-image display for video-based actions, and made all of R01–R23 reachable
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

MIT License. See the `LICENSE` file for details. This applies to the code; the images in `assets/` are not covered by it.

---

## 👨‍💻 Developer

usakowhity

PetApp Series

© 2026 usakowhity
