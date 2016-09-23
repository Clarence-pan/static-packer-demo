<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$app->get('/', 'HomeController@index');

$app->get('/clear-cache', 'CacheController@clear');


$app->get('/test', 'TestController@index');
$app->get('/test/{action}', 'TestController@runAction');

$app->register(Clarence\LumenDefaultRoutes\DefaultRouteProvider::class);

