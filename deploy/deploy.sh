#!/bin/bash
set -e

cd "$(dirname "$0")/.."

IMAGE_NAME="ataas-fe"
PORT="${PORT:-30028}"

echo "==> 构建镜像 ${IMAGE_NAME} ..."
docker build -f deploy/Dockerfile -t "${IMAGE_NAME}" .

echo "==> 启动容器（端口 ${PORT} -> 80）..."
docker run -d --rm -p "${PORT}:80" --name "${IMAGE_NAME}" "${IMAGE_NAME}"

echo "==> 部署完成，访问 http://localhost:${PORT}"
