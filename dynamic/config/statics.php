<?php

return [
    'server' => env('STATICS_SERVER'), // 指定静态资源服务器的地址，如: http://localhost:8100

    'basePath' => '/dist', // 指定静态资源服务器的基础路径(除了lib之外的) -- 会追加到路径前面
    'libPath' => '/lib', // 指定lib的基础目录

    'debug' => env('APP_DEBUG'), // 是否调试模式 -- 如果指定，则对于xxx.min.js会替换为xxx.js (一定要保证有对应的xxx.js哦）

    'manifest' => __DIR__.'/../bootstrap/cache/statics-manifest.v{version}.php', // 指定静态文件的维护信息，必须是一个有效的可以读写的PHP配置文件
    'version' => 1, // 当前的静态资源版本号
];

