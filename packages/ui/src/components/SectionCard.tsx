import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
};

export function SectionCard({ title }: Props): React.JSX.Element {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}
