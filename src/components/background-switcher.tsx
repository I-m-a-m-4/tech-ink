
"use client";

import { useBackground, type BackgroundType } from "@/contexts/background-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icons } from "./icons";

const backgroundOptions: { value: BackgroundType; label: string }[] = [
  { value: 'starfield', label: 'Starfield' },
  { value: 'grid', label: 'Grid' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'none', label: 'Plain' },
];

export function BackgroundSwitcher() {
  const { background, setBackground } = useBackground();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icons.cog className="h-5 w-5" />
          <span className="sr-only">Change background</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Background</h4>
            <p className="text-sm text-muted-foreground">
              Select a background style.
            </p>
          </div>
          <RadioGroup
            value={background}
            onValueChange={(value) => setBackground(value as BackgroundType)}
            className="grid gap-2"
          >
            {backgroundOptions.map((option) => (
              <Label key={option.value} className="flex items-center gap-2 cursor-pointer font-normal">
                <RadioGroupItem value={option.value} id={option.value} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
