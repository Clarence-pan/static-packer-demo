<?php


namespace App\Providers;


use Illuminate\Support\ServiceProvider;
use RuntimeException;

class StaticsProvider extends ServiceProvider
{
    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('statics', function () {
            $this->loadConfigure();
            return $this;
        });

        $blade = $this->app['view']->getEngineResolver()->resolve('blade')->getCompiler();

        // @registerStatics(['css'=>'xxx.css', 'js' =>'xxx.js'])
        $blade->directive('registerStatics', function ($expression) {
            return "<?php echo app()->statics->registerStatics$expression; ?>";
        });

        // @registerDefaultStatics()
        $blade->directive('registerDefaultStatics', function ($expression) {
            return "<?php echo app()->statics->registerDefaultStatics(\$__view__); ?>";
        });

        // @loadRegisteredStatics('css')
        $blade->directive('loadRegisteredStatics', function ($expression) {
            return "<?php echo app()->statics->loadRegisteredStatics$expression; ?>";
        });

        // @staticUrlOfFile($type, $file)
        $blade->directive('staticUrlOfFile', function ($expression) {
            return "<?php echo app()->statics->urlOfFile$expression; ?>";
        });

        // @importScripts($scripts)
        $blade->directive('importScripts', function ($expression) {
            return "<?php echo app()->statics->importScripts$expression; ?>";
        });
        
        // @importStyles($styles)
        $blade->directive('importStyles', function ($expression) {
            return "<?php echo app()->statics->importStyles$expression; ?>";
        });
    }

    protected $resources = [];
    protected $server = null;
    protected $staticsMap = null;
    protected $staticsMapFile = null;

    /**
     * 加载配置
     */
    protected function loadConfigure()
    {
        $this->app->configure('statics');
        $config = $this->app['config'];
        $this->server = $config['statics.server'];
        $this->staticsMapFile = $config['statics.map-file'];
        $this->staticsMap = (array)@include($this->staticsMapFile);
    }

    /**
     * 注册资源
     * @param array $resources
     */
    public function registerStatics(array $resources)
    {
        foreach ($resources as $type => $files) {
            if (!isset($this->resources[$type])) {
                $this->resources[$type] = $this->toArray($files);
            } else {
                $this->resources[$type] = array_merge($this->resources[$type], $this->toArray($files));
            }
        }
    }

    /**
     * 根据视图名称注册默认的资源
     * @param $viewName
     */
    public function registerDefaultStatics($viewName)
    {
        $viewNameAsFileName = str_replace('.', '/', $viewName);
        $this->registerStatics([
            'css' => $viewNameAsFileName . '.css',
            'js' => $viewNameAsFileName . '.js',
        ]);
    }

    /**
     * 根据类型加载已经注册过的静态资源
     * @param $type
     * @return string
     */
    public function loadRegisteredStatics($type)
    {
        $output = [];
        switch ($type) {
            case 'css':
                foreach ($this->resources[$type] as $resource) {
                    $url = $this->urlOfFile($type, $resource);
                    $output[] = "<link rel=\"stylesheet\" href=\"{$url}\" >";
                }
                break;
            case 'js':
                foreach ($this->resources[$type] as $resource) {
                    $url = $this->urlOfFile($type, $resource);
                    $output[] = "<script src=\"{$url}\" ></script>";
                }
                break;
            default:
                throw new \LogicException("Unknown statics type: $type");
        }
        return implode("\n", $output);
    }

    /**
     * 通过script标签导入脚本资源
     * @param $scripts
     * @return string
     */
    public function importScripts($scripts)
    {
        $scripts = is_array($scripts) ? $scripts : [strval($scripts)];

        $output = [];
        foreach ($scripts as $resource) {
            $url = $this->urlOfFile('js', $resource);
            $output[] = "<script src=\"{$url}\" ></script>";
        }

        return implode("\n", $output);
    }

    /**
     * 通过link标签导入样式资源
     * @param $styles
     * @return string
     */
    public function importStyles($styles)
    {
        $styles = is_array($styles) ? $styles : [strval($styles)];

        $output = [];
        foreach ($styles as $resource) {
            $url = $this->urlOfFile('css', $resource);
            $output[] = "<link rel=\"stylesheet\" href=\"{$url}\" >";
        }

        return implode("\n", $output);
    }

    /**
     * 获取一个文件的URL
     * @param $type
     * @param $file
     * @return string
     */
    public function urlOfFile($type, $file=null)
    {
        if ($file === null){
            list($type, $file) = [null, $type];
        }

        // hash映射查询的时候需要干掉后面的查询字符串
        $queryPos = strpos($file, '?');
        $filePath = ($queryPos === false ? $file : substr($file, 0, $queryPos));

        // 如果没有传类型，则自动根据后缀名识别类型
        if (!$type){
            $extName = strrchr($filePath, '.'); // 文件扩展名
            $type = strtolower(substr($extName, 1));
        }

        // 使用@抑制错误更简洁快速
        $hash = @$this->staticsMap[$type][$filePath] ?: '';

        // 如果没有找到hash，则默认用源文件
        if (empty($hash)) {
            return $this->server . '/' . $file;
        } else {
            // 否则，追加hash到文件路径中去
            $extName = isset($extName) ? $extName : strrchr($filePath, '.'); // 文件扩展名
            return implode([
                $this->server, // http://xxxxx.xx
                '/dist/' . substr($file, 0, strlen($filePath) - strlen($extName)) . '_' . $hash . $extName, // file path
                ($queryPos === false ? '' : substr($file, $queryPos)), // query string
            ]);
        }
    }

    /**
     * 获取静态资源的映射表
     * @return array
     */
    public function getStaticsMap()
    {
        return $this->staticsMap;
    }

    /**
     * 更新静态映射文件
     *
     * @param array $maps
     * @return int|false
     */
    public function updateStaticsMap(array $maps)
    {
        $mapData = $this->staticsMap;

        foreach ($maps as $type => $data) {
            $mapData[$type] = array_merge((array)@$mapData[$type], (array)$data);
        }

        return self::safelyPutPhpFileContents($this->staticsMapFile, "<?php\nreturn " . var_export($mapData, true) . ";\n");
    }

    /**
     * 把一个东东转换成array
     *
     * @param $something
     * @return array
     */
    protected static function toArray($something)
    {
        if (empty($something)) {
            return [];
        } else if (is_array($something)) {
            return $something;
        } else if (is_string($something)) {
            return (array)explode(',', $something);
        } else {
            return collect($something)->toArray();
        }
    }

    /**
     * 安全地写入 PHP 文件的内容 -- 如果文件不是有效的PHP文件内容，则报错/抛出异常。
     *
     * @note 如果目录不存在则会自动创建目录
     *
     * @param string       $filePath
     * @param string|array $content
     * @param array|null   $preloads
     * @return int|false
     * @throws
     */
    protected static function safelyPutPhpFileContents($filePath, $content, $preloads = null)
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'php_file_');
        if (file_put_contents($tmpFile, $content, LOCK_EX) === false) {
            throw new RuntimeException("Unable to create temp file for write: {$tmpFile}");
        }

        // 生成测试代码
        $testCode = [];
        foreach ((array)$preloads as $preloadFile) {
            $testCode[] = sprintf("include('%s');", $preloadFile);
        }

        $testCode[] = sprintf("include('%s');", $tmpFile);
        $testCode = implode("", $testCode);

        // 先测试一下文件能否访问，不能访问的话休提了
        $testResult = self::shellExecSilently("php -r \"{$testCode}\"", $testOutput);

        // 无论结果如何，还是应该把临时文件删掉的
        unlink($tmpFile);

        if ($testResult != 0) {
            throw new RuntimeException("Invalid PHP file! Test failed -- error code: {$testResult}, output: " . implode($testOutput));
        }

        // 自动创建目录
        $fileDir = dirname($filePath);
        if (!is_dir($fileDir)) {
            if (mkdir($fileDir, 0777, true) === false) {
                throw new RuntimeException("Unable to create directory: {$fileDir}");
            }
        }

        // OK 没问题了，写入目标文件
        $putResult = file_put_contents($filePath, $content, LOCK_EX);
        if ($putResult === false) {
            throw new RuntimeException("Unable to write file: {$filePath}");
        }

        return $putResult;
    }

    /**
     * 执行一个shell命令
     *
     * @param $cmd     string 要执行的命令
     * @param $output  array 返回输出的内容的行的数组
     * @return int 返回命令的返回值
     *
     */
    protected static function shellExecSilently($cmd, &$output = null)
    {
        $output = [];

        if (function_exists('popen')) {
            $handle = popen($cmd, 'r');

            while (!feof($handle)) {
                $line = fgets($handle);
                if ($line !== false) {
                    $output[] = rtrim($line, "\n");
                }
            }

            $ret = pclose($handle);
        } elseif (function_exists('exec')) {
            exec($cmd, $output, $ret);
        } else {
            throw new \LogicException("`exec` and `popen` function not exists!");
        }

        return $ret;
    }
}