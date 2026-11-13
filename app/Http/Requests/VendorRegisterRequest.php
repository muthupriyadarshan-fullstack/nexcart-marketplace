<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VendorRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'store_name' => ['required', 'string', 'max:255'],
            'store_description' => ['nullable', 'string'],
            'company_name' => ['required', 'string', 'max:255'],
            'tax_id_gst' => ['required', 'string', 'max:50'],
            'pan_number' => ['required', 'string', 'max:30'],
            'bank_name' => ['required', 'string', 'max:150'],
            'bank_account_number' => ['required', 'string', 'max:60'],
            'bank_ifsc_code' => ['required', 'string', 'max:30'],
        ];
    }
}

