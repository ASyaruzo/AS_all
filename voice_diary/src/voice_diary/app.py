from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
import pyttsx3
import google.generativeai as genai

# 音声読み上げ関数(引数は読み上げたい文字列)
def read_pyttsx3(literal):
    engine = pyttsx3.init()
    rate = engine.getProperty('rate')
    engine.setProperty('rate', rate-50)
    # engine.setProperty('voice', voices[0].id) # 0:日本語, 1:英語 rate-50
    engine.say(literal)
    engine.runAndWait()


app = Flask(__name__,
        static_url_path='/static',
        static_folder='templates/static')

# MongoDB接続
# client = MongoClient("mongodb://root:password@mongodb:27017/my_mongo_db")
client = MongoClient("mongodb://mongodb:27017/my_mongo_db")
db = client["my_mongo_db"]
collection = db["これコレクション名！"] # 使用するコレクション名

# ホームページ表示
@app.route("/")
@app.route("/index")
def index():

    # data = {
    # "year_month": "2024-12-03",
    # "japanese_text": "今日はいいことがありました。",
    # "sad": 20,
    # "happy": 100,
    # "angry": 10
    # }

    # collection.insert_one(data)
    # data = collection.find_one()
    # return f"Hello, World! Data: {data}"
    return render_template("index.html")


@app.route("/save_diary", methods=["POST"])
def get_diaries():
    collection = db["これコレクション名！"] # 使用するコレクション名
    diaries = request.json
    print(f"diaries--->{diaries}")
    print(f"diaries type--->{type(diaries)}")

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
    print(result.text)
    diaries["response"] = result.text
    print(diaries)
    collection.insert_one(diaries)
    # data = collection.find_one()
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


