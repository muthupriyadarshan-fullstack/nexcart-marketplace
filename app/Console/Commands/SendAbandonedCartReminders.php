<?php

namespace App\Console\Commands;

use App\Models\Cart;
use App\Notifications\AbandonedCartNotification;
use Illuminate\Console\Command;

class SendAbandonedCartReminders extends Command
{
    protected $signature = 'nexcart:send-abandoned-cart-reminders';

    protected $description = 'Send queued notification reminders to customers with abandoned carts.';

    public function handle(): int
    {
        $this->info('Scanning for abandoned carts...');

        $carts = Cart::whereNotNull('user_id')
            ->whereHas('items')
            ->where('updated_at', '<=', now()->subHours(2))
            ->with(['user', 'items'])
            ->get();

        $count = 0;
        foreach ($carts as $cart) {
            if ($cart->user) {
                $cart->user->notify(new AbandonedCartNotification($cart));
                $count++;
            }
        }

        $this->info("Dispatched {$count} abandoned cart reminders.");

        return Command::SUCCESS;
    }
}
