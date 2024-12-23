from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient

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


    collection.insert_one(diaries)
    # data = collection.find_one()
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


