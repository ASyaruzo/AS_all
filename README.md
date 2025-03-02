# 音声起動型AIフィードバック&感情サークルUIの日記アプリ


## 概要
このプロジェクトは ** 感情に焦点を当てながらフィードバックをもらうことができる日記 ** を目的としたアプリケーションです。

主な機能
 - 音声入力対応
    - 「Hey moon」と話しかけることで音声入力が開始され、手を使わずに日記を記録可能。
    - 手動入力にも対応し、自由に日記を記入可能。
- 自動送信機能
    - 音声入力が 5秒間 途切れると、自動で日記が送信される。
    - 何もせずにスムーズに日記を保存可能。
- AIフィードバック
    - AIが日記の内容に前向きなフィードバック を付与。
    - クリックすると音声でフィードバックを読み上げ、ポジティブな気持ちで1日を振り返ることができる。
-  感情分析＆視覚化
    - 日記の内容から感情を推測 し、視覚的に表示。
    - その日の気分や感情の傾向を簡単に把握可能。

## 動作環境
- Python 3.12
- Docker 27.2

## 使い方
1. AS_ALL / voice_diaryに移動
2. docker-compose build
3. docker-compose up
4. localhostで確認
