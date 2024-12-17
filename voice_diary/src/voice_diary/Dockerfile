# ベースイメージ
FROM python:3.12-slim

# 作業ディレクトリを設定
WORKDIR /app

#uvのインストール and 仮想環境の作成
RUN pip install --no-cache-dir uv
RUN python -m venv /opt/venv

# requirements.txtをコピー and 依存関係をインストール
COPY requirements.txt /app/requirements.txt
RUN /opt/venv/bin/pip install --no-cache-dir -r /app/requirements.txt

# アプリケーションのソースコードをコンテナにコピー
COPY . /app

# Flaskの環境変数を設定
ENV FLASK_APP=/app/app.py
ENV FLASK_ENV=production

# Flaskアプリケーションを仮想環境内から起動
CMD ["/opt/venv/bin/python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
