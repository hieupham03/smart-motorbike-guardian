import Svg, { Path, Circle } from "react-native-svg";
import type { ColorValue } from "react-native";

const paths = {
  home: "M3 10 12 3l9 7v10H3V10Zm6 10v-7h6v7",
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16",
  control: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6",
  alert: "M12 3 2 21h20L12 3Zm0 6v5m0 3v1",
  bike: "m5 16 5-8 5 8H5Zm5-8h6l3 8M9 5h4m3 0h3",
  shield: "M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6",
  wrench: "M21 3a6 6 0 0 1-8 8l-8 9-3-3 9-8a6 6 0 0 1 8-8l-4 4 4 2 2-4",
} as const;
export type GuardianIconName = keyof typeof paths;
export function GuardianIcon({
  name,
  color,
  size = 24,
}: {
  name: GuardianIconName;
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "#0F172A"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      <Path d={paths[name]} />
      {name === "bike" && (
        <>
          <Circle cx={5} cy={17} r={4} />
          <Circle cx={19} cy={17} r={4} />
        </>
      )}
    </Svg>
  );
}
