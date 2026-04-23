import { Colors } from "@/constants/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ManualTransactionModalProps = {
  visible: boolean;
  title: string;
  amountLabel: string;
  ctaLabel: string;
  accentColor: string;
  kind: "income" | "expense";
  onClose: () => void;
  onSave: (data: { amount: number; concept: string; account: string }) => Promise<void>;
};

export function ManualTransactionModal({
  visible,
  title,
  amountLabel,
  ctaLabel,
  accentColor,
  kind,
  onClose,
  onSave,
}: ManualTransactionModalProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(36)).current;
  const keyboardInset = useRef(new Animated.Value(0)).current;

  const amountNumber = useMemo(() => {
    const digits = amount.replace(/\D/g, "");
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setAmount("");
      return;
    }

    const numeric = Number(digits);
    if (!Number.isFinite(numeric)) {
      return;
    }

    setAmount(new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(numeric));
  };

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 36,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [backdropOpacity, sheetTranslateY, visible]);

  useEffect(() => {
    const animateKeyboardInset = (toValue: number, duration = 220) => {
      Animated.timing(keyboardInset, {
        toValue,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    const onKeyboardShow = (event: { endCoordinates?: { height?: number }; duration?: number }) => {
      const height = event.endCoordinates?.height ?? 0;
      animateKeyboardInset(height, event.duration ?? 220);
    };

    const onKeyboardHide = (event?: { duration?: number }) => {
      animateKeyboardInset(0, event?.duration ?? 200);
    };

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardInset]);

  if (!shouldRender) {
    return null;
  }

  const reset = () => {
    setAmount("");
    setConcept("");
    setAccount("");
    setError("");
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) {
      return;
    }
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (amountNumber <= 0) {
      setError("Ingresa un monto valido");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSave({
        amount: amountNumber,
        concept: concept.trim(),
        account: account.trim(),
      });
      reset();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar");
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.container}>
        <Pressable style={modalStyles.backdropPressable} onPress={handleClose}>
          <Animated.View
            style={[modalStyles.overlay, { opacity: backdropOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={[modalStyles.sheetHost, { paddingBottom: keyboardInset }]}
        >
          <Animated.View
            style={[modalStyles.card, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            <Pressable onPress={() => {}}>
              <Text style={modalStyles.title}>{title}</Text>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={modalStyles.formContent}
              >
                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>{amountLabel}</Text>
                  <TextInput
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="Ej: 200.000"
                    keyboardType="numeric"
                    placeholderTextColor="#8a8a8a"
                    style={modalStyles.input}
                  />
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>{kind === "income" ? "Origen" : "Comercio"}</Text>
                  <TextInput
                    value={concept}
                    onChangeText={setConcept}
                    placeholder={kind === "income" ? "Ej: Freelance" : "Ej: Mercado"}
                    placeholderTextColor="#8a8a8a"
                    style={modalStyles.input}
                  />
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Cuenta (ultimos 4)</Text>
                  <TextInput
                    value={account}
                    onChangeText={setAccount}
                    placeholder="Ej: 9095"
                    keyboardType="number-pad"
                    placeholderTextColor="#8a8a8a"
                    style={modalStyles.input}
                    maxLength={8}
                  />
                </View>

                {error ? <Text style={modalStyles.error}>{error}</Text> : null}

                <View style={modalStyles.actions}>
                  <TouchableOpacity
                    style={modalStyles.secondaryButton}
                    onPress={handleClose}
                    disabled={saving}
                  >
                    <Text style={modalStyles.secondaryText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[modalStyles.primaryButton, { backgroundColor: accentColor }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={modalStyles.primaryText}>{ctaLabel}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheetHost: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#1f1f24",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2b2b33",
    gap: 12,
    paddingBottom: 24,
    maxHeight: "85%",
  },
  formContent: {
    gap: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#c4c4cd",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#2a2a31",
    borderWidth: 1,
    borderColor: "#3a3a44",
    borderRadius: 10,
    color: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: {
    color: Colors.red,
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#4a4a56",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryText: {
    color: "#d3d3dc",
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: "center",
  },
  primaryText: {
    color: Colors.white,
    fontWeight: "700",
  },
});
