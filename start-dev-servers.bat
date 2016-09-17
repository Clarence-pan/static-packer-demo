@echo off
cd %~dp0

REM 下面为是调试服务器，请勿在生成环境使用

start php -S localhost:8800 -t dynamic\public
start php -S localhost:8801 -t static\public
