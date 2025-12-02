import { Text, TextInput } from "react-native";
import { fonts } from "./theme/fonts";

export function applyGlobalFont() {
  const defaultTextStyle = {
    fontFamily: fonts.regular
  };

  if (!Text.defaultProps) Text.defaultProps = {};
  if (!TextInput.defaultProps) TextInput.defaultProps = {};

  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.allowFontScaling = false;

  Text.defaultProps.style = [
    defaultTextStyle,
    Text.defaultProps.style
  ];

  TextInput.defaultProps.style = [
    defaultTextStyle,
    TextInput.defaultProps.style
  ];
}
