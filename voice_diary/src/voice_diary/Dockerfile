FROM python:3.12-slim

# 作業ディレクトリを設定
WORKDIR /app

# 必要なパッケージをインストール
# RUN apt-get update && apt-get install -y alsa-utils espeak-ng

# `uv` をシステムにインストール
RUN pip install --no-cache-dir uv

# 仮想環境の作成
RUN uv venv /app/.venv

# `ensurepip` で仮想環境に `pip` を追加
RUN /app/.venv/bin/python -m ensurepip --upgrade

# `pip` を最新バージョンにアップグレード
RUN /app/.venv/bin/python -m pip install --upgrade pip

# `uv` を仮想環境にインストール
RUN /app/.venv/bin/python -m pip install --no-cache-dir uv

# 環境変数の設定（仮想環境の `bin` ディレクトリを優先）
ENV PATH="/app/.venv/bin:$PATH"

# requirements.txt をコピー
COPY requirements.txt /app/requirements.txt

# 仮想環境内に必要なパッケージをインストール
RUN /app/.venv/bin/pip install --no-cache-dir -r /app/requirements.txt

# アプリケーションのソースコードをコンテナにコピー
COPY . /app

# Flaskの環境変数を設定
ENV FLASK_APP=/app/app.py
ENV FLASK_ENV=production

ENV PULSE_SERVER /dev/null

# RUN apt-get update && apt-get install -y alsa-utils

# PulseAudio の仮想デバイスを設定
# ENV PULSE_SERVER=unix:/mnt/wslg/PulseServer

# `uv` に実行権限を与える
RUN chmod +x /app/.venv/bin/uv

# `uv` を使ってアプリを起動
CMD ["/app/.venv/bin/uv", "run", "/app/app.py"]
