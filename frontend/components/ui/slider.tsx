import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: any) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  const handleValueChange = (val: number | number[], event?: any) => {
    if (onValueChange) {
      const arr = typeof val === "number" ? [val] : Array.isArray(val) ? val : [val];
      onValueChange(arr, event);
    }
  };

  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none items-center select-none py-2 cursor-pointer", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none cursor-pointer">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200/80 select-none"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute h-full bg-orange-500 rounded-full select-none"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block size-5 shrink-0 rounded-full border-2 border-orange-500 bg-white shadow-md transition-transform select-none hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 cursor-grab active:cursor-grabbing"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
