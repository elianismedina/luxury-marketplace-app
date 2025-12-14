import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.surface};
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.lg}px;
  margin: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  border: 1px solid
    ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const SearchInput = styled.TextInput`
  flex: 1;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.md}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

const SearchButton = styled.TouchableOpacity`
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  justify-content: center;
  align-items: center;
`;

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Buscar productos...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
    // For now, just log the search query
    console.log("Searching for:", searchQuery);
  };

  const handleSubmit = () => {
    handleSearch();
  };

  return (
    <SearchContainer>
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.textSecondary}
        style={{ marginLeft: theme.spacing.sm }}
      />
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
      />
      {searchQuery.length > 0 && (
        <SearchButton onPress={() => setSearchQuery("")}>
          <Ionicons
            name="close-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
        </SearchButton>
      )}
    </SearchContainer>
  );
};

export default SearchBar;
