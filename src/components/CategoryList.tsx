import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { Models } from "react-native-appwrite";
import styled, { DefaultTheme, useTheme } from "styled-components/native";

import { categoriesCollectionId, databaseId, databases } from "@/lib/appwrite";
import DynamicSvgIcon from "./DynamicSvgIcon";
import { BodyText, PaddedContainer, Title } from "./styled";

// Define the Category document type from Appwrite
interface Category extends Models.Document {
  name: string;
  icon: string;
}

const CategoryItemContainer = styled.TouchableOpacity`
  align-items: center;
  margin-right: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.lg}px;
  width: 80px;
`;

const CategoryName = styled.Text`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.sm}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  text-align: center;
`;

const CategoryList = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          databaseId,
          categoriesCollectionId
        );
        setCategories(response.documents as Category[]);
      } catch (e) {
        console.error("Failed to fetch categories:", e);
        setError("No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const renderItem = ({ item }: { item: Category }) => (
    <CategoryItemContainer>
      <DynamicSvgIcon
        iconName={item.icon}
        label={item.name}
        size={48}
        color={theme.colors.primary}
      />
    </CategoryItemContainer>
  );

  if (loading) {
    return (
      <PaddedContainer>
        <ActivityIndicator color={theme.colors.primary} />
      </PaddedContainer>
    );
  }

  if (error) {
    return (
      <PaddedContainer>
        <BodyText color={theme.colors.error}>{error}</BodyText>
      </PaddedContainer>
    );
  }

  return (
    <>
      <PaddedContainer>
        <Title>Categorías</Title>
      </PaddedContainer>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
        }}
      />
    </>
  );
};

export default CategoryList;
