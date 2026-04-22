<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'account',
        'account_to',
        'merchant',
        'person',
        'date',
        'time',
        'debit_credit',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public const TYPE_COMPRA = 'compra';

    public const TYPE_TRANSFERENCIA = 'transferencia';

    public const TYPE_RETIRO = 'retiro';

    public const TYPE_RECIBIDO_QR = 'recibido_qr';

    public const TYPE_AVANCE = 'avance';

    public const TYPE_PAGO_NO_EXITOSO = 'pago_no_exitoso';

    public const TYPE_PAYPAL_RECIBIDO = 'paypal_recibido';
}
