import { Colors } from "@/constants/theme";
import Octicons from "@expo/vector-icons/Octicons";
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
  onSave: (data: {
    amount: number;
    concept: string;
    account: string;
  }) => Promise<void>;
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

    setAmount(
      new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(
        numeric,
      ),
    );
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

    const onKeyboardShow = (event: {
      endCoordinates?: { height?: number };
      duration?: number;
    }) => {
      const height = event.endCoordinates?.height ?? 0;
      animateKeyboardInset(height, event.duration ?? 220);
    };

    const onKeyboardHide = (event?: { duration?: number }) => {
      animateKeyboardInset(0, event?.duration ?? 200);
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

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
      setError(
        saveError instanceof Error ? saveError.message : "No se pudo guardar",
      );
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
            style={[
              modalStyles.card,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <Pressable onPress={() => {}}>
              <View style={modalStyles.handle} />

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={modalStyles.formContent}
              >
                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>{amountLabel}</Text>
                  <View style={modalStyles.inputShell}>
                    <View style={modalStyles.inputPrefix}>
                      <Text style={modalStyles.prefixText}>$</Text>
                    </View>
                    <TextInput
                      value={amount}
                      onChangeText={handleAmountChange}
                      placeholder="Ej: 200.000"
                      keyboardType="numeric"
                      placeholderTextColor="#8a8a8a"
                      style={modalStyles.input}
                    />
                  </View>
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Cuenta</Text>
                  <View style={modalStyles.inputShell}>
                    <View style={modalStyles.inputPrefix}>
                      <Octicons name="credit-card" size={14} color="#a9a9b4" />
                    </View>
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
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>
                    {kind === "income" ? "Origen" : "Comercio"}
                  </Text>
                  <View style={modalStyles.inputShell}>
                    <View style={modalStyles.inputPrefix}>
                      <Octicons
                        name={kind === "income" ? "person" : "briefcase"}
                        size={14}
                        color="#a9a9b4"
                      />
                    </View>
                    <TextInput
                      value={concept}
                      onChangeText={setConcept}
                      placeholder={
                        kind === "income" ? "Ej: Freelance" : "Ej: Mercado"
                      }
                      placeholderTextColor="#8a8a8a"
                      style={modalStyles.input}
                    />
                  </View>
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
                    style={[
                      modalStyles.primaryButton,
                      { backgroundColor: accentColor },
                    ]}
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
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheetHost: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#17181f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: "#2f3240",
    gap: 12,
    paddingBottom: 26,
    maxHeight: "85%",
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "#5f6375",
    marginBottom: 8,
  },
  formContent: {
    gap: 14,
    paddingTop: 4,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9aa0b3",
    fontSize: 13,
    marginTop: -4,
  },
  field: {
    gap: 7,
  },
  label: {
    color: "#b8bece",
    fontSize: 13,
    fontWeight: "600",
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#232533",
    borderWidth: 1,
    borderColor: "#363a4f",
    borderRadius: 12,
    overflow: "hidden",
  },
  inputPrefix: {
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#363a4f",
    paddingVertical: 12,
  },
  prefixText: {
    color: "#d8dcef",
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    color: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    flex: 1,
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
    marginTop: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#4f556c",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "#232533",
  },
  secondaryText: {
    color: "#dde2f2",
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minWidth: 140,
    alignItems: "center",
  },
  primaryText: {
    color: Colors.white,
    fontWeight: "800",
  },
});
