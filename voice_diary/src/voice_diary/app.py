from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
import pyttsx3
import google.generativeai as genai

# engine = pyttsx3.init()
# voices = engine.getProperty('voices')

# for index, voice in enumerate(voices):
#     print(f"{index}: {voice.id} ({voice.name})")

# engine = pyttsx3.init()
# engine.say("こんにちは、音声テストです")
# engine.runAndWait()

# 音声読み上げ関数(引数は読み上げたい文字列)
def read_pyttsx3(literal):
    engine = pyttsx3.init(driverName='espeak')
    rate = engine.getProperty('rate')
    engine.setProperty('rate', rate-50)
    # engine.setProperty('voice', voices[0].id) # 0:日本語, 1:英語 rate-50
    engine.say(literal)
    engine.runAndWait()


app = Flask(__name__,
        static_url_path='/static',
        static_folder='templates/static')


# MongoDB接続
try:
    client = MongoClient("mongodb://as_all_mongodb:27017/my_mongo_db", serverSelectionTimeoutMS=5000)
    db = client["my_mongo_db"]
    collection = db["voice_diary_db"]
    print("✅ MongoDB に正常に接続できました！")
except Exception as e:
    print(f"❌ MongoDB に接続できませんでした: {e}")

# ホームページ表示
@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/save_diary", methods=["POST"])
def send_diaries():
    try:
        diaries = request.json
        print(f"diaries--->{diaries}")

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
        print(f"result.text ---> {result.text}")
        diaries["response"] = result.text
        print(f"diaries --- >{diaries}")
        collection.insert_one(diaries)
        print("diaries saved")

        # return render_template("index.html")
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
        # MongoDB から最新の日記を取得
        latest_diary = db["voice_diary_db"].find_one({}, {"_id": 0}, sort=[("date", -1), ("time", -1)])

        if latest_diary and "response" in latest_diary:
            response_text = latest_diary["response"]

            # `response_text` に改行がある場合、それを適切に処理
            formatted_text = response_text.replace("\n", " ")

            print(f"🔊 読み上げる内容: {formatted_text}")
            read_pyttsx3(formatted_text)  # 音声で読み上げ

            return jsonify({
                "message": "最新の日記のレスポンスを読み上げました。",
                "diary": latest_diary
            }), 200
        else:
            return jsonify({
                "message": "日記が見つかりませんでした。"
            }), 404

    except Exception as e:
        print(f"データ取得エラー: {e}")
        return jsonify({"message": "データ取得中にエラーが発生しました", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


