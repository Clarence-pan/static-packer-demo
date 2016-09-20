<!DOCTYPE HTML>
<html lang="zh-CN">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" >
    <meta name="renderer" content="webkit">
    <meta name="viewport" id="viewport" content="width=device-width,initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>@yield('title', isset($title) ? $title : 'Demo Page')</title>
    <meta name="keywords" content="@yield('keywords', isset($keywords) ? $keywords : 'Demo Page')">
    <meta name="description" content="@yield('description', isset($description) ? $description : 'Demo Page')" >
    <meta name="HandheldFriendly" content="true">
    <meta name="MobileOptimized" content="width">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="applicable-device" content="mobile">
    @yield('styles')
</head>
<body>@yield('body', isset($content) ? $content : '')@yield('scripts')</body>
</html>