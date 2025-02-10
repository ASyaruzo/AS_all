#!/usr/bin/env python3

from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
import pyttsx3
import google.generativeai as genai

# engine = pyttsx3.init()

# def read_pyttsx3(literal):
#     try:
#         global engine
#         engine.say(literal)
#         engine.runAndWait()
#     except Exception as e:
#         print(f"音声読み上げエラー: {e}")


app = Flask(__name__,
        static_url_path='/static',
        static_folder='templates/static')


# MongoDB接続
try:
    client = MongoClient("mongodb://as_all_mongodb:27017/my_mongo_db", serverSelectionTimeoutMS=5000)
    db = client["my_mongo_db"]
    collection = db["voice_diary_db"]
    print("MongoDB に正常に接続できました！")
except Exception as e:
    print(f"MongoDB に接続できませんでした: {e}")

# ホームページ表示
@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/save_diary", methods=["POST"])
def send_diaries():
    try:
        diaries = request.json

        genai.configure(api_key="AIzaSyBUAulI3ERarPw11x_dlIbOiZ3sKt2f0-w")
        model = genai.GenerativeModel("gemini-1.5-flash")

        result = (f"""
                以下のルールを必ず守ってください。
                あなたは世界各国の言語が分かる言語学者兼世界一のカウンセラー兼世界一の心理学者兼世界一の格言者として振舞ってください。
                以下の日記を読んで、返答形式に沿ってアドバイスを返してください。
                それ以外の条件は条件に沿ってください。
                絶対厳守の条件は必ず守ってください。ガイドラインです。
                ###日記###
                {list(diaries.values())[2]}
                ###

                ###返答形式###
                1行間隔を空ける
                example. )
                今日も一日お疲れ様です

                明日は明日の風が吹く

                明日はもっと素晴らしい一日になることを願っています
                ###

                ###絶対厳守###
                返答時の文章は日記の言語と必ず同じになるようにする。
                example. )
                日記: Bonjour → 返答: Bonjour
                日記: hello → 返答: hello
                日記: 下午好 → 返答: 下午好
                ###

                ###条件###
                1. よりユーザーに寄り添ってあげる
                2. 自然な返答を心がける、敬語を使う
                3. これは日記です。つまり、ユーザーが"明日も頑張ろう" 等とやる気が出るような、士気が上るようなおしゃれな言葉を返す
                4. 最後は詩を詠うような言葉と挨拶で締める
                5. なるべくコンパクトでスマートな返答を心がける
                6. 決めつけない、否定しない、共感する
                ###

                """)

        result = model.generate_content(result)
        diaries["response"] = result.text
        collection.insert_one(diaries)
        print("diaries saved")

        return jsonify({
        "message": "日記を保存しました！",
        "diary": {
            "date": diaries.get("date"),
            "time": diaries.get("time"),
            "content": diaries.get("content"),
            "response": diaries.get("response")
            }
        }), 200
    except Exception as e:
        print(f"データ取得エラー: {e}")
        return jsonify({"message": "データ取得中にエラーが発生しました", "error": str(e)}), 500


@app.route("/get_diaries", methods=["GET"])
def get_diaries():
    try:
        # クエリパラメータから日付を取得
        date_query = request.args.get("date")

        # 日付が指定された場合は、その日付の日記のみ取得
        query = {"date": date_query} if date_query else {}

        # MongoDB から最新の日記を取得
        latest_diaries = db["voice_diary_db"].find(query, {"_id": 0}).sort([("date", -1), ("time", -1)])

        diaries_list = list(latest_diaries)

        if diaries_list:
            return jsonify({
                "message": "日記を取得しました。",
                "diaries": diaries_list  # ← 配列として返す
            }), 200
        else:
            return jsonify({
                "message": "日記が見つかりませんでした。",
                "diaries": []
            }), 404

    except Exception as e:
        print(f"データ取得エラー: {e}")
        return jsonify({"message": "データ取得中にエラーが発生しました", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


