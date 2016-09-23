#/bin/bash

cd "`dirname $0`"
if [ "$?" != "0" ]; then
    echo "Cannot automatically switch to project root directory. Please switch by yourself and rerunt this script."
    exit 1;
fi;

PROJECT_BASE="`pwd`"

echo Node version: `node --version`
if [ "$?" != "0" ]; then
    echo "You must install node.js."
    exit 1;
fi;

echo NPM version: `npm --version`
if [ "$?" != "0" ]; then
    echo "You must install npm."
    exit 1;
fi;

echo PHP version: `php --version`
if [ "$?" != "0" ]; then
    echo "You must install php."
    exit 1;
fi;

echo Composer version: `composer --version`
if [ "$?" != "0" ]; then
    echo "You must install composer."
    exit 1;
fi;

echo ===============================================================================
echo Setting up dynamic project and installing composer packages...
cd "$PROJECT_BASE/dynamic" && cp .env.example .env && composer self-update && composer install
if [ "$?" != "0" ]; then
    echo "Something wrong...."
    exit 1;
fi;

echo ===============================================================================
echo Setting up static project and installing node.js packages..

cd "$PROJECT_BASE/static" && cp .env.example .env && npm install
if [ "$?" != "0" ]; then
    echo "Something wrong...."
    exit 1;
fi;

if [ ! -e node_modules/app ]; then
    ln -s `pwd`/src node_modules/app
fi;


if [ "$1" == "--build" ] || [ "$1" == "-b" ]; then

    echo ===============================================================================
    echo building...

    cd "$PROJECT_BASE/static" && npm run build
    if [ "$?" != "0" ]; then
        echo "Failed to build."
        exit 1;
    fi;

    echo "Build result:"
    cd "$PROJECT_BASE"
    cat dynamic/bootstrap/cache/*.php
    cat static/public/*.json
    cat static/public/*.js
    cat static/*.log
    exit 0

else

    echo ===============================================================================
    echo installation compeleted.
    echo You can use \"npm run build\" to build this project.

fi;
