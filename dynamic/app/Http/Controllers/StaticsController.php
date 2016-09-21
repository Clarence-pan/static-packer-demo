<?php


namespace App\Http\Controllers;


use Illuminate\Http\Request;

class StaticsController extends Controller
{
    public function doGetIndex()
    {
        echo "<pre>";
        print_r(app()->statics->getManifestData());
    }

    public function doPostUpdateManifest(Request $request)
    {
        $apiKey = env('UPDATE_STATICS_MAP_API_KEY');
        if ($apiKey !== $request->header('x-api-key')){
            abort(404);
        }

        try {
            $data = json_decode($request->getContent(), true);
            if (empty($data)) {
                return response()->json([
                    'success' => true,
                    'message' => 'success with nothing updated.'
                ]);
            }

            if (!is_array($data)) {
                throw new \InvalidArgumentException("Invalid format of request data!");
            }

            app()->statics->updateManifestData($data);

            return response()->json([
                'success' => true,
                'message' => 'success, ' . array_sum(array_map('count', $data)) . ' files updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }
}