import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MatchLikeButtons({ 
  match, 
  userId, 
  onLike, 
  onDislike, 
  isLoading,
  size = "default" 
}) {
  const likes = match.likes || [];
  const dislikes = match.dislikes || [];
  const hasLiked = userId && likes.includes(userId);
  const hasDisliked = userId && dislikes.includes(userId);

  const sizeClasses = size === "sm" ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          sizeClasses,
          hasLiked && "bg-green-50 border-green-300 text-green-700"
        )}
        onClick={() => onLike(match)}
        disabled={isLoading}
      >
        <ThumbsUp className={cn(iconSize, "mr-1", hasLiked && "fill-current")} />
        {likes.length}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          sizeClasses,
          hasDisliked && "bg-red-50 border-red-300 text-red-700"
        )}
        onClick={() => onDislike(match)}
        disabled={isLoading}
      >
        <ThumbsDown className={cn(iconSize, "mr-1", hasDisliked && "fill-current")} />
        {dislikes.length}
      </Button>
    </div>
  );
}