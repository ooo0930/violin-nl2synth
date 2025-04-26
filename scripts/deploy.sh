#!/bin/bash
npm --prefix ../violin-nl2synth-frontend run build
cp -r ../violin-nl2synth-frontend/dist ./frontend-dist
# 這裡可加上自動部署後端/重啟服務等指令
