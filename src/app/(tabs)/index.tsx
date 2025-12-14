import { ActivityIndicator } from "react-native-paper";
import { useTheme } from "styled-components/native";

import CategoryList from "@/components/CategoryList";
import ImageCarousel from "@/components/ImageCarousel";
import SearchBar from "@/components/SearchBar";
import { CenterContainer, ScrollContainer } from "@/components/styled";
import { useAuth } from "@/context/AuthContext";

export default function TabOneScreen() {
  const { initializing } = useAuth();
  const theme = useTheme();

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality
    console.log("Searching for:", query);
  };

  if (initializing) {
    return (
      <CenterContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CenterContainer>
    );
  }

  return (
    <ScrollContainer>
      <SearchBar onSearch={handleSearch} />
      <ImageCarousel />
      <CategoryList />
    </ScrollContainer>
  );
}
