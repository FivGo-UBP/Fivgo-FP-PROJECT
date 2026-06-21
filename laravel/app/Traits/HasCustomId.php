<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait HasCustomId
{
    /**
     * Boot trait — otomatis generate custom ID sebelum record dibuat.
     */
    public static function bootHasCustomId(): void
    {
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = static::generateCustomId($model->idPrefix());
            }
        });
    }

    /**
     * Generate ID dengan format: {PREFIX}-{8 karakter alphanumeric uppercase}
     * Contoh: CUST-A1B2C3D4, ORD-X9Y8Z7W6
     */
    public static function generateCustomId(string $prefix): string
    {
        do {
            $suffix = strtoupper(Str::random(8));
            $id = $prefix . '-' . $suffix;
        } while (static::where((new static)->getKeyName(), $id)->exists());

        return $id;
    }

    /**
     * Prefix default — di-override oleh masing-masing model.
     * Untuk User, override ini dengan logika berdasarkan role.
     */
    public function idPrefix(): string
    {
        return 'ID';
    }

    /**
     * Pastikan key tidak auto-increment.
     */
    public function getIncrementing(): bool
    {
        return false;
    }

    /**
     * Tipe key adalah string.
     */
    public function getKeyType(): string
    {
        return 'string';
    }
}
