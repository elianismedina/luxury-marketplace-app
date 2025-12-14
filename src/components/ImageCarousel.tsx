import React from "react";
import { Dimensions } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

const { width: screenWidth } = Dimensions.get("window");

const CarouselContainer = styled.View`
  height: 200px;
  margin-vertical: ${({ theme }: { theme: DefaultTheme }) =>
    theme.spacing.md}px;
`;

const PlaceholderImage = styled.View`
  width: ${screenWidth - 40}px;
  height: 200px;
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.lg}px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.surface};
  justify-content: center;
  align-items: center;
  margin-horizontal: 20px;
`;

const PlaceholderText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textSecondary};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.md}px;
  font-weight: 500;
`;

// Placeholder data - later will be replaced with dynamic data from Appwrite
const carouselData = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  placeholder: `Imagen ${index + 1}`,
}));

const ImageCarousel: React.FC = () => {
  const theme = useTheme();

  const renderItem = ({
    item,
  }: {
    item: { id: number; placeholder: string };
  }) => (
    <PlaceholderImage>
      <PlaceholderText>{item.placeholder}</PlaceholderText>
    </PlaceholderImage>
  );

  return (
    <CarouselContainer>
      <Carousel
        width={screenWidth}
        height={200}
        data={carouselData}
        scrollAnimationDuration={1000}
        autoPlay={true}
        autoPlayInterval={3000}
        renderItem={renderItem}
        loop={true}
      />
    </CarouselContainer>
  );
};

export default ImageCarousel;
