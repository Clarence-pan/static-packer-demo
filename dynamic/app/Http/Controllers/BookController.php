<?php


namespace App\Http\Controllers;


class BookController extends Controller
{
    public function doGetIndex()
    {
        return $this->view();
    }


    public function doGetDetail($id=null)
    {
        return $this->view()->with(['id' => $id]);
    }
}