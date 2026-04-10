import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials } from '@gem/utils';
import { colors, fonts, radius } from '../theme';

const PALETTE = [
  { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  { bg: colors.primaryContainer,   fg: colors.onPrimaryContainer },
  { bg: '#1a3a52',                  fg: colors.onPrimary },
];

function avatarColor(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

interface AvatarStackProps {
  names:    string[];
  max?:     number;
  size?:    number;
}

export default function AvatarStack({ names, max = 3, size = 32 }: AvatarStackProps) {
  const shown   = names.slice(0, max);
  const overflow = names.length - shown.length;
  const overlap  = size * 0.35;

  return (
    <View style={[styles.row, { height: size }]}>
      {shown.map((name, i) => {
        const { bg, fg } = avatarColor(name);
        return (
          <View
            key={i}
            style={[
              styles.avatar,
              {
                width:           size,
                height:          size,
                borderRadius:    size / 2,
                backgroundColor: bg,
                marginLeft:      i === 0 ? 0 : -overlap,
                zIndex:          shown.length - i,
              },
            ]}
          >
            <Text style={[styles.initials, { fontSize: size * 0.35, color: fg }]}>
              {getInitials(name)}
            </Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <View
          style={[
            styles.avatar,
            styles.overflow,
            {
              width:        size,
              height:       size,
              borderRadius: size / 2,
              marginLeft:   -overlap,
            },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.3 }]}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  avatar: {
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     colors.surfaceContainerLowest,
  },
  initials: {
    fontFamily: fonts.headline.bold,
  },
  overflow: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  overflowText: {
    fontFamily: fonts.headline.bold,
    color:      colors.onSurfaceVariant,
  },
});
