<?php


namespace App\Http\Controllers;


use Illuminate\Http\Request;

class CacheController
{
    public function clear(Request $request)
    {
        $file = $request->input('file');
        $file = is_array($file) ? $file : explode(',', $file);

        $cleared = [];
        $basePath = app()->basePath() . DIRECTORY_SEPARATOR . 'public';
        foreach ($file as $f) {
            $caches = glob($basePath . DIRECTORY_SEPARATOR . strtr($f, ['..' => '', '/' => DIRECTORY_SEPARATOR]));
            foreach ($caches as $cache) {
                $basename = basename($cache);
                if ($basename === 'index.php' || $basename === '.htaccess' || $basename === '.gitignore'){
                    continue;
                }

                if (!is_file($cache)){
                    continue;
                }

                if (strlen($cache) <= strlen($basePath)){
                    continue;
                }

                if (substr_compare($basePath, $cache, 0, strlen($basePath)) !== 0){
                    continue;
                }

                unlink($cache);
                $cleared[] = $cache;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'cleared' => $cleared
            ]
        ]);
    }
}