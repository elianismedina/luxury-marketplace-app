import React from "react";
import { SvgProps } from "react-native-svg";

// Import all SVGs from the assets/Svg directory
import BateriaIcon from "../../assets/Svg/bateria.svg";
import FiltrosIcon from "../../assets/Svg/filtros.svg";
import FrenosIcon from "../../assets/Svg/frenos.svg";
import LlantaIcon from "../../assets/Svg/llanta.svg";
import LubricanteIcon from "../../assets/Svg/lubricante.svg";
import SuspensionIcon from "../../assets/Svg/suspension.svg";

// It's important that the keys here match the 'icon' field in your Appwrite documents
const iconMap: { [key: string]: React.FC<SvgProps> } = {
  "bateria.svg": BateriaIcon,
  "llanta.svg": LlantaIcon,
  "lubricante.svg": LubricanteIcon,
  "frenos.svg": FrenosIcon,
  "filtros.svg": FiltrosIcon,
  "suspension.svg": SuspensionIcon,
};

interface DynamicSvgIconProps extends SvgProps {
  iconName?: string;
}

const DynamicSvgIcon: React.FC<DynamicSvgIconProps> = ({
  iconName,
  ...props
}) => {
  if (!iconName) {
    return null;
  }

  const IconComponent = iconMap[iconName];

  if (!IconComponent) {
    console.warn(`[DynamicSvgIcon] Icon not found for name: ${iconName}`);
    return null; // Or return a placeholder/default icon
  }

  return <IconComponent {...props} />;
};

export default DynamicSvgIcon;
