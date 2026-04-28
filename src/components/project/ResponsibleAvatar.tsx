import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitial } from "@/lib/responsible-colors";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  color: string;
  size?: number;
  withTooltip?: boolean;
  className?: string;
};

export function ResponsibleAvatar({ name, color, size = 18, withTooltip = true, className }: Props) {
  const dim = `${size}px`;
  const fontSize = `${Math.max(9, Math.round(size * 0.55))}px`;
  const node = (
    <span
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-white shadow-sm",
        className,
      )}
      style={{
        width: dim,
        height: dim,
        backgroundColor: color,
        fontSize,
      }}
    >
      {getInitial(name)}
    </span>
  );

  if (!withTooltip) return node;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
