<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'content',
        'mediaURL',
        'mediaType',
        'mediaName',
        'mediaSize',
        'user_id',
        'likes',
    ];

    protected $casts = [
        'likes' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
