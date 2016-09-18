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
        $blade->directive('registerStatics', function($expression){
            return "<?php echo app()->statics->registerStatics$expression; ?>";
        });

        // @registerDefaultStatics()
        $blade->directive('registerDefaultStatics', function($expression){
            return "<?php echo app()->statics->registerDefaultStatics(\$__view__); ?>";
        });

        // @loadStatics('css')
        $blade->directive('loadStatics', function($expression){
            return "<?php echo app()->statics->loadStatics$expression; ?>";
        });

        // @staticUrlOfFile($type, $file)
        $blade->directive('staticUrlOfFile', function($expression){
            return "<?php echo app()->statics->urlOfFile$expression; ?>";
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

    public function registerDefaultStatics($viewName)
    {
        $viewNameAsFileName = str_replace('.', '/', $viewName);
        $this->registerStatics([
            'css' => $viewNameAsFileName . '.css',
            'js' => $viewNameAsFileName . '.js',
        ]);
    }

    public function loadStatics($type)
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

    public function urlOfFile($type, $file)
    {
        // 使用@抑制错误更简洁快速
        $hash = @$this->staticsMap[$type][$file] ?: '';
        if (empty($hash)) {
            return $this->server . '/' . $file;
        } else {
            $extName = strrchr($file, '.');
            return $this->server . '/dist/' . substr($file, 0, strlen($file) - strlen($extName)) . '_' . $hash . $extName;
        }
    }

    public function getStaticsMap()
    {
        return $this->staticsMap;
    }

    /**
     * 更新静态映射文件
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
        if (!is_dir($fileDir)){
            if (mkdir($fileDir, 0777, true) === false){
                throw new RuntimeException("Unable to create directory: {$fileDir}");
            }
        }

        // OK 没问题了，写入目标文件
        $putResult = file_put_contents($filePath, $content, LOCK_EX);
        if ($putResult === false){
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
                if ($line !== false){
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