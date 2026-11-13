<?php

namespace App\Notifications;

use App\Models\Cart;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AbandonedCartNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Cart $cart)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $itemsCount = $this->cart->items->sum('quantity');

        return (new MailMessage)
            ->subject('You left items in your NexCart shopping cart!')
            ->greeting("Hello {$notifiable->name},")
            ->line("You still have {$itemsCount} item(s) waiting in your cart.")
            ->action('Complete Your Purchase', url('/cart'))
            ->line('Items in your cart are in high demand and may sell out quickly.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'abandoned_cart_reminder',
            'cart_id' => $this->cart->id,
            'items_count' => $this->cart->items->sum('quantity'),
            'subtotal' => $this->cart->subtotal,
        ];
    }
}

