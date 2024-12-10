from flask import Flask, render_template, send_from_directory

from pymongo import MongoClient

app = Flask(__name__, 
           static_url_path='/static',
           static_folder='templates/static')

client = MongoClient("mongodb://root:password@localhost:27017/")
db = client["my_mongo_db"]

@app.route("/")
def index():
    collection = db["これコレクション名！"] # 使用するコレクション名

    data = {
    "year_month": "2024-12-03",
    "japanese_text": "今日はいいことがありました。",
    "sad": 20,
    "happy": 100,
    "angry": 10
    }

    collection.insert_one(data)
    data = collection.find_one()
    # return f"Hello, World! Data: {data}"
    return render_template("index.html", data=data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)


