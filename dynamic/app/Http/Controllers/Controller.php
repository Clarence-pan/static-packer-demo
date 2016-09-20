<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;

class Controller extends BaseController
{
    /**
     * @var string 视图的前缀
     */
    protected $viewPrefix;

    const MAX_VIEW_CALL_STACK_DEPTH = 5;

    public function __construct()
    {

    }

    /**
     * 返回一个view -- 如果以'.'打头，则自动加上前缀
     * @note 子类可以重写此函数以实现各种特效
     *
     * @param string $view
     * @param array  $data
     * @param array  $mergeData
     * @return \Illuminate\View\View
     */
    protected function view($view = null, $data = [], $mergeData = [])
    {
        if (empty($view)) { // 如果为空，则自动检测view的路径
            $callStack = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, static::MAX_VIEW_CALL_STACK_DEPTH);
            $lastCaller = null;
            foreach ($callStack as $caller) {
                if ($caller['function'] != 'view') { // 过滤掉重载的情况
                    $lastCaller = $caller;
                    break;
                }
            }

            if (!$lastCaller) {
                throw new \LogicException("Cannot find the view automatically. Please specifiy one!");
            }

            $actualView = $this->getViewPrefix() . '.' . $this->sanitizeViewPath($lastCaller['function']);
        } elseif ($view[0] == '.') {
            $actualView = $this->getViewPrefix() . $view;
        } else {
            $actualView = $view;
        }

        return view($actualView, $data, $mergeData)
            ->with([
                '__view__' => $actualView
            ]);
    }

    /**
     * 获取视图的前缀
     */
    protected function getViewPrefix()
    {
        if (is_null($this->viewPrefix)) {
            $this->viewPrefix = $this->sanitizeViewPath(get_class($this));
        }

        return $this->viewPrefix;
    }

    /**
     * 净化视图的路径，将斜杠等都干掉，替换成laravel/lumen需要的以'.'分隔的形式
     * 如：App\Http\Admin\ProductTagController::updateOrder => admin.product-tag.update-order
     *
     * @param $path
     * @return mixed|string
     */
    protected function sanitizeViewPath($path)
    {
        $path = str_replace(__NAMESPACE__, '', $path);      // 干掉前缀的命名空间
        $path = str_replace('Controller', '', $path);       // 干掉Controller的类名后缀
        $path = ltrim($path, '\\');                         // 去掉多余的“\”
        $path = str_replace('\\', '.', $path);              // 转换为用"."分隔的形式
        $path = strtolower(preg_replace('/([^.])(?=[A-Z])/', '$1-', $path));    // 单词从驼峰转换为"-"分隔的形式

        if (preg_match('/^do-(get|post|put|delete)-/', $path, $matches)){
            return substr($path, strlen($matches[0]));
        }

        return $path;
    }
}
