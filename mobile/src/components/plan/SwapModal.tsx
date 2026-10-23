import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { IRecipe } from '../../types';
import { mobileApi } from '../../services/api';
import { Button } from '../common/Button';

interface SwapModalProps {
  visible: boolean;
  day: string;
  onClose: () => void;
  onConfirmSwap: (day: string, targetRecipeId?: string) => Promise<void>;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  visible,
  day,
  onClose,
  onConfirmSwap,
}) => {
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [swapping, setSwapping] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      mobileApi
        .getRecipes({ limit: '8' })
        .then((res) => {
          if (res.data) setRecipes(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleAutoSwap = async () => {
    setSwapping(true);
    try {
      await onConfirmSwap(day);
      onClose();
    } finally {
      setSwapping(false);
    }
  };

  const handleSelectRecipe = async (recipeId: string) => {
    setSwapping(true);
    try {
      await onConfirmSwap(day, recipeId);
      onClose();
    } finally {
      setSwapping(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Swap Dinner for {day}</Text>
              <Text style={styles.subtitle}>Choose an alternative or let Mise pick</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Instant Auto-Swap Button */}
          <View style={styles.quickSwapContainer}>
            <Button
              title="🎲 Instant Auto Swap"
              onPress={handleAutoSwap}
              loading={swapping}
              variant="secondary"
              style={styles.autoSwapBtn}
            />
          </View>

          <Text style={styles.sectionTitle}>Or choose a specific dish:</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0D5C3A" />
              <Text style={styles.loadingText}>Loading recipe alternatives...</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {recipes.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.recipeRow}
                  activeOpacity={0.7}
                  onPress={() => handleSelectRecipe(item._id)}
                  disabled={swapping}
                >
                  <Image source={{ uri: item.image }} style={styles.recipeThumb} />
                  <View style={styles.recipeMeta}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.recipeSub}>
                      {item.cuisine} • {item.cookTimeMinutes}m • {item.calories} kcal
                    </Text>
                  </View>
                  <Text style={styles.selectArrow}>Select →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  quickSwapContainer: {
    marginBottom: 16,
  },
  autoSwapBtn: {
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  list: {
    maxHeight: 340,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  recipeThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  recipeMeta: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  recipeSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  selectArrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D5C3A',
  },
});
