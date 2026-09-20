import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Font, Type } from '../../constants/theme';

export interface ProgressStep {
  key: string;
  label: string;
  date?: string;
  description?: string;
  state: 'done' | 'current' | 'todo';
  icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
  steps: ProgressStep[];
}

/** Vertical delivery timeline with connector line. */
export default function ProgressSteps({ steps }: Props) {
  return (
    <View>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const done = step.state === 'done';
        const current = step.state === 'current';
        const active = done || current;

        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                ]}
              >
                <Ionicons
                  name={step.icon ?? (done ? 'checkmark' : 'ellipse')}
                  size={done ? 13 : 9}
                  color={active ? Colors.textInverse : Colors.textTertiary}
                />
              </View>
              {!isLast ? (
                <View style={[styles.connector, done && styles.connectorDone]} />
              ) : null}
            </View>

            <View style={[styles.content, !isLast && styles.contentSpaced]}>
              <Text style={[styles.label, !active && styles.labelIdle]}>{step.label}</Text>
              {step.date ? <Text style={styles.date}>{step.date}</Text> : null}
              {step.description ? (
                <Text style={styles.description}>{step.description}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: 30 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dotCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  connectorDone: { backgroundColor: Colors.accentLight },
  content: { flex: 1, paddingLeft: 12, paddingBottom: 4 },
  contentSpaced: { paddingBottom: 22 },
  label: { ...Type.bodyStrong, color: Colors.textPrimary },
  labelIdle: { color: Colors.textTertiary },
  date: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  description: { ...Type.small, color: Colors.textTertiary, marginTop: 2 },
});
