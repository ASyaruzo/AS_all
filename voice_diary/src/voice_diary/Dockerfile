# ベースイメージ
FROM python:3.12-slim

# 作業ディレクトリを設定
WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのソースコードをコンテナにコピー
COPY . .

# アプリケーションを起動
CMD ["python", "app.py"]

