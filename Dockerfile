
# 1. ベースイメージに Nginx (Alpine) を指定
FROM nginx:alpine

# 2. 作業ディレクトリ (任意)
WORKDIR /usr/share/nginx/html

# 3. ローカルの静的ファイルをコンテナにコピー
COPY . /usr/share/nginx/html

# 4. Nginx がデフォルトで 80 番ポートを使用する
EXPOSE 80
