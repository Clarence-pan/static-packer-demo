@echo off

pushd %CD%

cd %~dp0/node_modules && mklink /d app ..\src

popd
