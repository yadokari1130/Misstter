# Misstter

MisstterはXに以下の機能を追加するブラウザ拡張機能です。

- Misskeyへの投稿ボタンの追加
- Misskeyへの引用リノートボタンの追加
- 絵文字ピッカーの追加、X上での絵文字の表示

# インストール方法

## Chromeの場合

1. `Misstter_Chrome_x.x.x.zip` を[ここからダウンロード](https://github.com/yadokari1130/Misstter/releases/latest) & 展開
2. [chrome://extensions/](chrome://extensions/) を開く
3. 「デベロッパーモード」を有効にする。
4. 「パッケージ化されていない拡張機能を読み込む」から展開したフォルダを開く
5. MisskeyのトークンをPopupに入力
6. (必要があれば) Popup に Misskey サーバーを入力

## Firefoxの場合

準備中です。



> PopupはChrome/Firefoxの右上の拡張機能ボタンからアクセスできます。
> 
> Misskey APIの発行は `Settings > API > アクセストークンの発行` から行ってください。
> 「ドライブを操作する」「ノートを作成・削除する」の権限が必須です。
> 「セルフリプライに対応する。」機能を利用するためには「アカウントの情報を見る」の権限も必要です。

##### 注意

Chromeへのインストールは開発者モードを用います。
作者が確認していますので、マルウェアが入ることはほとんどないはずですが、リスクをご承知の上でご使用ください。

---

# Misstter 

Misstter is Chrome addon to add misskey button on Twitter.

## How to Install

1. Go to the [release page](https://github.com/AranoYuki1/Misstter/releases) and download the latest version.
2. Download `Misstter.zip`. 
3. Unzip `Misstter.zip`
4. Open [chrome://extensions/](chrome://extensions/)
5. Activate "Developer Mode"
6. Load extension from "Load Unpacked"
7. Enter misskey token in Extension Popup

---

## 開発者へ / For Developers

## Prerequisites

* [node + npm](https://nodejs.org/) (Current Version)

## Setup

```
npm install
```

## Build

```
# chrome
npm run build_chrome

# firefox
npm run build_firefox

# safari
npm run build_safari
```

## Build in watch mode

### terminal

```
# chrome
npm run watch_chrome

# firefox
npm run watch_firefox

# safari
npm run watch_safari
```

## Load extension to browser

### Chrome

Open [chrome://extensions/](chrome://extensions/) and load `dist/chrome` directory.

### Firefox

Open about:addons and load `dist/firefox/manifest.json` file. 

### Safari

Open `browser/safari/Misstter/Misstter.xcodeproj` in Xcode and build.

## Test

`npx jest` or `npm run test`

