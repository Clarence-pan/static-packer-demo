<?php


namespace App\Http\Middleware;


use Closure;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FileCacheMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        /**
         * @var $response \Illuminate\Http\Response
         */
        $response = $next($request);

        if (!env('ENABLE_FILE_CACHE')){
            return $response;
        }

        try {
            // 非OK的不缓存
            if (!$response->isOk()) {
                return $response;
            }

            // 内容不是html的不缓存
            $contentType = $response->headers->get('Content-Type');
            if (!empty($contentType) && !Str::contains($contentType, ['html'])){
                return $response;
            }

            // 解析文件路径
            $requestPath = $request->path();
            $cacheFile = app()->basePath() . '/public/' . $requestPath . '/index.htm';
            $cacheDir = dirname($cacheFile);
            if (!is_dir($cacheDir)){
                mkdir($cacheDir, 0777, true);
            }

            // 写入文件
            file_put_contents($cacheFile, $response->getContent(), LOCK_EX);
        } catch (\Exception $e) {
            Log::warn('Failed to cache response. Request url=' . $request->fullUrl() . '. error=' . $e->getTraceAsString());
        }

        return $response;
    }


}