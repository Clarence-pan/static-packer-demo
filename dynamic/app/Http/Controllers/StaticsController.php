<?php


namespace App\Http\Controllers;


use Illuminate\Http\Request;

class StaticsController extends Controller
{
    public function doGetIndex()
    {
        echo "<pre>";
        print_r(app()->statics->getStaticsMap());
    }

    public function doPostUpdate(Request $request)
    {
        try {
            $data = json_decode($request->getContent());
            if (empty($data)) {
                throw new \InvalidArgumentException("Invalid request data!");
            }

            if (!is_array($data) || empty($data['css']) || empty($data['js'])) {
                throw new \InvalidArgumentException("Invalid format of request data!");
            }

            app()->statics->updateStaticsMap($data);

            return response()->json([
                'success' => true,
                'message' => 'success'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }
}