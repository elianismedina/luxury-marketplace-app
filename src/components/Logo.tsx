import React from "react";
import { View, ViewStyle } from "react-native";
import ZonaPitsLogo from "../../assets/Svg/zonaPitsLogoSVG.svg";

interface LogoProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
}

const Logo: React.FC<LogoProps> = ({ width = 120, height = 120, style }) => {
  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      <ZonaPitsLogo width={width} height={height} />
    </View>
  );
};

export default Logo;
