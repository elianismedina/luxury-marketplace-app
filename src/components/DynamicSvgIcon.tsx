import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { SvgProps } from "react-native-svg";
import type { DefaultTheme } from "styled-components/native";
import styled, { useTheme } from "styled-components/native";

// Import all SVGs from the assets/Svg directory

import BateriaIcon from "../../assets/Svg/bateria.svg";
import FiltrosIcon from "../../assets/Svg/filtros.svg";
import FrenosIcon from "../../assets/Svg/frenos.svg";
import GoogleIcon from "../../assets/Svg/icons8-google.svg";
import LlantaIcon from "../../assets/Svg/llanta.svg";
import LubricanteIcon from "../../assets/Svg/lubricante.svg";
import SuspensionIcon from "../../assets/Svg/suspension.svg";
// Centered container for icons
const CenteredIconContainer = styled.View`
  justify-content: center;
  align-items: center;
`;

// Spanish label mapping for categories (from constants/categorias.ts)
const spanishLabels: Record<string, string> = {
  // Vector icons
  "clipboard-check": "Revisión tecnomecánica",
  tire: "Llantas",
  battery: "Baterías",
  oil: "Lubricación",
  "car-wash": "Lavado y polichado",
  "file-certificate": "SOAT",
  "tow-truck": "Grúas y desvare",
  "car-back": "Golpes y rayones",
  "car-cog": "Lujos y accesorios",
  wrench: "Mecánica general",
  "car-brake-abs": "Frenos",
  "car-info": "Suspensión",
  "air-conditioner": "Aire acondicionado",
  flash: "Electricidad",
  "axis-arrow": "Alineación y balanceo",
  // SVGs (add .svg variants)
  "llanta.svg": "Llantas",
  "bateria.svg": "Baterías",
  "lubricante.svg": "Lubricación",
  "frenos.svg": "Frenos",
  "filtros.svg": "Filtros",
  "suspension.svg": "Suspensión",
};

// It's important that the keys here match the 'icon' field in your Appwrite documents

type VectorIconProps = { size?: number; color?: string };
type SvgOrVectorProps = SvgProps | VectorIconProps;

interface DynamicSvgIconProps extends SvgProps {
  iconName: string;
  size?: number;
  color?: string;
  label?: string;
}

// Map icon names to SVGs or MaterialCommunityIcons names

const svgIconMap: { [key: string]: React.FC<SvgProps> } = {
  "bateria.svg": BateriaIcon,
  "llanta.svg": LlantaIcon,
  "lubricante.svg": LubricanteIcon,
  "frenos.svg": FrenosIcon,
  "filtros.svg": FiltrosIcon,
  "suspension.svg": SuspensionIcon,
  "icons8-google.svg": GoogleIcon,
};

const vectorIconMap: {
  [key: string]: React.FC<{ size?: number; color?: string }>;
} = {
  "clipboard-check": (props) => (
    <MaterialCommunityIcons
      name="clipboard-check"
      size={props.size}
      color={props.color}
    />
  ),
  tire: (props) => (
    <MaterialCommunityIcons
      name="car-tire-alert"
      size={props.size}
      color={props.color}
    />
  ),
  battery: (props) => (
    <MaterialCommunityIcons
      name="car-battery"
      size={props.size}
      color={props.color}
    />
  ),
  oil: (props) => (
    <MaterialCommunityIcons name="oil" size={props.size} color={props.color} />
  ),
  "car-wash": (props) => (
    <MaterialCommunityIcons
      name="car-wash"
      size={props.size}
      color={props.color}
    />
  ),
  "file-certificate": (props) => (
    <MaterialCommunityIcons
      name="file-certificate"
      size={props.size}
      color={props.color}
    />
  ),
  "tow-truck": (props) => (
    <MaterialCommunityIcons
      name="tow-truck"
      size={props.size}
      color={props.color}
    />
  ),
  "car-back": (props) => (
    <MaterialCommunityIcons
      name="car-back"
      size={props.size}
      color={props.color}
    />
  ),
  "car-cog": (props) => (
    <MaterialCommunityIcons
      name="car-cog"
      size={props.size}
      color={props.color}
    />
  ),
  wrench: (props) => (
    <MaterialCommunityIcons
      name="wrench"
      size={props.size}
      color={props.color}
    />
  ),
  "car-brake-abs": (props) => (
    <MaterialCommunityIcons
      name="car-brake-abs"
      size={props.size}
      color={props.color}
    />
  ),
  "car-info": (props) => (
    <MaterialCommunityIcons
      name="car-info"
      size={props.size}
      color={props.color}
    />
  ),
  "air-conditioner": (props) => (
    <MaterialCommunityIcons
      name="air-conditioner"
      size={props.size}
      color={props.color}
    />
  ),
  flash: (props) => (
    <MaterialCommunityIcons
      name="flash"
      size={props.size}
      color={props.color}
    />
  ),
  "axis-arrow": (props) => (
    <MaterialCommunityIcons
      name="axis-arrow"
      size={props.size}
      color={props.color}
    />
  ),
};

const CircleContainer = styled.View<{ theme: DefaultTheme }>`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.surfaceVariant || "#232323"};
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  elevation: 3;
  margin-bottom: 6px;
  overflow: hidden;
`;

const IconLabel = styled.Text<{ theme: DefaultTheme }>`
  margin-top: 2px;
  text-align: center;
  color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.textSecondary || theme.colors.text};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.xs}px;
  font-weight: 500;
  max-width: 80px;
  align-self: center;
  flex-shrink: 1;
`;

const DynamicSvgIcon: React.FC<DynamicSvgIconProps> = ({
  iconName,
  size = 48,
  color,
  label,
  ...props
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.primary;
  let IconComponent: React.FC<any> | undefined;
  let iconProps: any = {};
  if (svgIconMap[iconName]) {
    IconComponent = svgIconMap[iconName];
    iconProps = {
      width: size * 0.6,
      height: size * 0.6,
      ...props,
    };
  } else if (vectorIconMap[iconName]) {
    IconComponent = vectorIconMap[iconName];
    iconProps = {
      size: size * 0.6,
      color: iconColor,
    };
  }
  const prettify = (name: string): string => {
    let base = name.replace(/\.[^/.]+$/, "");
    base = base.replace(/[-_.]/g, " ");
    return base.replace(/\b\w/g, (c) => c.toUpperCase());
  };
  let displayLabel = label || spanishLabels[iconName];
  if (!displayLabel && iconName.endsWith(".svg")) {
    const base = iconName.replace(/\.svg$/, "");
    displayLabel = spanishLabels[base];
  }
  if (!displayLabel) displayLabel = prettify(iconName);
  return (
    <>
      <CircleContainer>
        {IconComponent ? (
          <IconComponent {...iconProps} />
        ) : (
          <MaterialCommunityIcons
            name="help-circle"
            size={size * 0.6}
            color={iconColor}
          />
        )}
      </CircleContainer>
      <IconLabel>{displayLabel}</IconLabel>
    </>
  );
};

export default DynamicSvgIcon;
