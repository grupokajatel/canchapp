import React, { useState } from "react";
import { Share2, Facebook, Twitter, Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function ShareMatchButton({ match, size = "default" }) {
  const [copied, setCopied] = useState(false);
  
  const matchUrl = `${window.location.origin}/Community?match=${match.id}`;
  const shareText = `¡Únete a mi partido de ${match.sport_type}! "${match.title}" - ${match.date} a las ${match.time}. ¡Faltan ${match.max_players - (match.current_players || 1)} jugadores!`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(matchUrl);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(matchUrl);
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={buttonSize}>
          <Share2 className={iconSize} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copiar enlace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}