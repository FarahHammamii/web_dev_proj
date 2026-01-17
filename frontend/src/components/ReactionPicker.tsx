import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThumbsUp, Heart, ThumbsDown, Sparkles, Laugh } from "lucide-react";
import { ReactionType } from "@/lib/api";

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  reactionStats?: {
    total: number;
    like: number;
    love: number;
    dislike: number;
    encourage: number;
    haha: number;
  };
  onReact: (type: ReactionType) => void;
  onRemoveReaction: () => void;
  disabled?: boolean;
}

const reactions: { type: ReactionType; icon: React.ElementType; label: string; color: string; bgColor: string }[] = [
  { type: "like", icon: ThumbsUp, label: "Like", color: "text-primary", bgColor: "bg-primary/10" },
  { type: "love", icon: Heart, label: "Love", color: "text-destructive", bgColor: "bg-destructive/10" },
  { type: "encourage", icon: Sparkles, label: "Encourage", color: "text-success", bgColor: "bg-success/10" },
  { type: "haha", icon: Laugh, label: "Haha", color: "text-warning", bgColor: "bg-warning/10" },
  { type: "dislike", icon: ThumbsDown, label: "Dislike", color: "text-muted-foreground", bgColor: "bg-muted" },
];

export function ReactionPicker({
  currentReaction,
  reactionStats,
  onReact,
  onRemoveReaction,
  disabled = false,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentReactionData = currentReaction
    ? reactions.find((r) => r.type === currentReaction)
    : null;

  const handleReaction = (type: ReactionType) => {
    if (currentReaction === type) {
      onRemoveReaction();
    } else {
      onReact(type);
    }
    setIsOpen(false);
  };

  const handleQuickReaction = () => {
    if (currentReaction) {
      onRemoveReaction();
    } else {
      onReact("like");
    }
  };

  const topReactions = reactionStats
    ? reactions
        .filter((r) => reactionStats[r.type] > 0)
        .sort((a, b) => reactionStats[b.type] - reactionStats[a.type])
        .slice(0, 3)
    : [];

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "gap-1",
              currentReactionData ? currentReactionData.color : "text-muted-foreground"
            )}
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              handleQuickReaction();
            }}
          >
            {currentReactionData ? (
              <>
                <currentReactionData.icon
                  className={cn("h-4 w-4", currentReaction && "fill-current")}
                />
                {currentReactionData.label}
              </>
            ) : (
              <>
                <ThumbsUp className="h-4 w-4" />
                Like
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          side="top"
          align="start"
          sideOffset={8}
        >
          <div className="flex gap-1">
            {reactions.map((reaction) => {
              const Icon = reaction.icon;
              const isSelected = currentReaction === reaction.type;
              return (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-110",
                    isSelected ? reaction.bgColor : "hover:bg-muted"
                  )}
                  title={reaction.label}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-transform",
                      reaction.color,
                      isSelected && "fill-current scale-110"
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {reaction.label}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {reactionStats && reactionStats.total > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            {topReactions.map((reaction) => (
              <div
                key={reaction.type}
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center",
                  reaction.bgColor
                )}
              >
                <reaction.icon className={cn("h-3 w-3", reaction.color)} />
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {reactionStats.total}
          </span>
        </div>
      )}
    </div>
  );
}

export function ReactionPickerCompact({
  currentReaction,
  onReact,
  onRemoveReaction,
  disabled = false,
}: Omit<ReactionPickerProps, "reactionStats">) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = (type: ReactionType) => {
    if (currentReaction === type) {
      onRemoveReaction();
    } else {
      onReact(type);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "text-xs hover:underline",
            currentReaction ? "text-primary font-medium" : "text-muted-foreground"
          )}
        >
          {currentReaction
            ? reactions.find((r) => r.type === currentReaction)?.label || "Like"
            : "Like"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-1"
        side="top"
        align="start"
        sideOffset={4}
      >
        <div className="flex gap-0.5">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            const isSelected = currentReaction === reaction.type;
            return (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className={cn(
                  "p-1.5 rounded transition-all hover:scale-110",
                  isSelected ? reaction.bgColor : "hover:bg-muted"
                )}
                title={reaction.label}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    reaction.color,
                    isSelected && "fill-current"
                  )}
                />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
