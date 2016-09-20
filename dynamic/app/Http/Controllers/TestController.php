<?php


namespace App\Http\Controllers;


use Illuminate\Support\Str;

class TestController extends Controller
{
    public function index()
    {
        $class = new \ReflectionClass($this);
        $pages = collect($class->getMethods(\ReflectionMethod::IS_PUBLIC))
            ->map(function(\ReflectionMethod $method) use ($class){
                if ($method->getDeclaringClass()->getName() != $class->getName()){
                    return null;
                }

                if ($method->getName() === 'runAction'){
                    return null;
                }

                $name =  Str::snake($method->getName());
                return [
                    'link' => '/test/' . $name,
                    'title' => ucwords(str_replace(['-', '_'], ' ', $name)),
                ];
            })
            ->filter();

        return $this->view()->with(get_defined_vars());
    }

    public function preloadedReact()
    {
        return $this->view();
    }

    public function runAction($action = null)
    {
        if (!$action) {
            return $this->index();
        }

        $method = str_replace(['_', '-'], '', $action);
        if (method_exists($this, $method)
            && strcasecmp($method, __FUNCTION__) !== 0
            && with(new \ReflectionMethod($this, $method))->isPublic()){
            return $this->{$method}();
        }

        return $this->view('test.run')->with(['__view__' => "test.$action"]);
    }
}