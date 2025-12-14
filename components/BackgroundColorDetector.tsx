"use client";

import { useBackgroundColor, useAdvancedBackgroundColor } from "@/hooks/use-background-color";

export function BackgroundColorDetector() {
  const basic = useBackgroundColor();
  const advanced = useAdvancedBackgroundColor();

  if (!basic.mounted || !advanced.mounted) {
    return <div>Loading background color detection...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <h3 className="font-semibold">Background Color Detection</h3>

      {/* Basic Detection */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Basic Detection (HSL Lightness)</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>
            Background Color: <span className="text-blue-600">{basic.backgroundColor}</span>
          </div>
          <div>
            Is Light:{" "}
            <span className={basic.isLight ? "text-green-600" : "text-red-600"}>
              {basic.isLight ? "Yes" : "No"}
            </span>
          </div>
          <div>
            Is Dark:{" "}
            <span className={basic.isDark ? "text-red-600" : "text-green-600"}>
              {basic.isDark ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Detection */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Advanced Detection (Perceived Brightness)</h4>
        <div className="text-xs space-y-1 font-mono">
          <div>
            Background Color: <span className="text-blue-600">{advanced.backgroundColor}</span>
          </div>
          <div>
            Brightness: <span className="text-purple-600">{advanced.brightness.toFixed(3)}</span>
          </div>
          <div>
            Is Light:{" "}
            <span className={advanced.isLight ? "text-green-600" : "text-red-600"}>
              {advanced.isLight ? "Yes" : "No"}
            </span>
          </div>
          <div>
            Is Dark:{" "}
            <span className={advanced.isDark ? "text-red-600" : "text-green-600"}>
              {advanced.isDark ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Visual Test</h4>
        <div className="flex gap-2">
          <div
            className="w-8 h-8 border rounded"
            style={{ backgroundColor: `hsl(${basic.backgroundColor})` }}
            title={`Background color: ${basic.backgroundColor}`}
          />
          <div className="text-xs self-center">This should be your current background color</div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Usage Example</h4>
        <div className="text-xs bg-muted p-2 rounded font-mono">
          <div>const {`{ backgroundColor, isLight, isDark }`} = useBackgroundColor();</div>
          <div>{`// backgroundColor: "${basic.backgroundColor}"`}</div>
          <div>{`// isLight: ${basic.isLight.toString()}`}</div>
          <div>{`// isDark: ${basic.isDark.toString()}`}</div>
        </div>
      </div>
    </div>
  );
}
