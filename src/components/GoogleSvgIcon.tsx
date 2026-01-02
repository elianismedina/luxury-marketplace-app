import * as React from "react";
import { SvgProps } from "react-native-svg";
import GoogleIcon from "../../assets/Svg/icons8-google.svg";

const GoogleSvgIcon: React.FC<SvgProps> = (props) => {
  return (
    <GoogleIcon
      width={props.width || 24}
      height={props.height || 24}
      {...props}
    />
  );
};

export default GoogleSvgIcon;
