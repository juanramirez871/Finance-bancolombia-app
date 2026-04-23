import { Colors } from "@/constants/theme";
import { BCO } from "@/constants/expense";
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
  conceptOptions?: string[];
  accountOptions?: string[];
  onClose: () => void;
  onSave: (data: {
    amount: number;
    concept: string;
    account: string;
  }) => Promise<void>;
};

type PickerTarget = "concept" | "account" | null;

const MODAL_COLORS = {
  overlay: "rgba(48, 45, 43, 0.55)",
  sheet: BCO.card,
  border: BCO.divider,
  muted: BCO.muted,
  text: BCO.text,
  inputBg: BCO.bg,
  link: Colors.yellow,
};

export function ManualTransactionModal({
  visible,
  title,
  amountLabel,
  ctaLabel,
  accentColor,
  kind,
  conceptOptions = [],
  accountOptions = [],
  onClose,
  onSave,
}: ManualTransactionModalProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [isCustomConcept, setIsCustomConcept] = useState(conceptOptions.length === 0);
  const [isCustomAccount, setIsCustomAccount] = useState(accountOptions.length === 0);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(36)).current;
  const keyboardInset = useRef(new Animated.Value(0)).current;

  const cleanConceptOptions = useMemo(
    () => Array.from(new Set(conceptOptions.map((item) => item.trim()).filter(Boolean))),
    [conceptOptions],
  );

  const cleanAccountOptions = useMemo(
    () => Array.from(new Set(accountOptions.map((item) => item.trim()).filter(Boolean))),
    [accountOptions],
  );

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

  const pickerOptions = pickerTarget === "concept" ? cleanConceptOptions : cleanAccountOptions;
  const pickerTitle = pickerTarget === "concept"
    ? kind === "income"
      ? "Selecciona un origen"
      : "Selecciona un comercio"
    : "Selecciona una cuenta";

  const isCustomActive = pickerTarget === "concept" ? isCustomConcept : isCustomAccount;
  const selectedValue = pickerTarget === "concept" ? concept : account;

  const openPicker = (target: Exclude<PickerTarget, null>) => {
    Keyboard.dismiss();
    setPickerTarget(target);
  };

  const toggleAccountInputMode = () => {
    if (cleanAccountOptions.length === 0) {
      return;
    }

    if (isCustomAccount) {
      if (account && !cleanAccountOptions.includes(account)) {
        setAccount("");
      }
      setIsCustomAccount(false);
      return;
    }

    setPickerTarget(null);
    setIsCustomAccount(true);
    setAccount("");
  };

  const toggleConceptInputMode = () => {
    if (cleanConceptOptions.length === 0) {
      return;
    }

    if (isCustomConcept) {
      if (concept && !cleanConceptOptions.includes(concept)) {
        setConcept("");
      }
      setIsCustomConcept(false);
      return;
    }

    setPickerTarget(null);
    setIsCustomConcept(true);
    setConcept("");
  };

  const selectValueFromPicker = (value: string) => {
    if (pickerTarget === "concept") {
      setIsCustomConcept(false);
      setConcept(value);
    } else if (pickerTarget === "account") {
      setIsCustomAccount(false);
      setAccount(value);
    }

    setPickerTarget(null);
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
    setPickerTarget(null);
    setIsCustomConcept(cleanConceptOptions.length === 0);
    setIsCustomAccount(cleanAccountOptions.length === 0);
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
                      placeholderTextColor={MODAL_COLORS.muted}
                      style={modalStyles.input}
                    />
                  </View>
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Cuenta</Text>
                  {!isCustomAccount && cleanAccountOptions.length > 0 ? (
                    <Pressable
                      style={modalStyles.selectShell}
                      onPress={() => openPicker("account")}
                    >
                      <Pressable
                        style={modalStyles.inputPrefix}
                        onPress={(event) => {
                          event.stopPropagation();
                          toggleAccountInputMode();
                        }}
                      >
                        <Octicons name="credit-card" size={14} color={MODAL_COLORS.muted} />
                      </Pressable>
                      <Text
                        style={[modalStyles.selectText, !account && modalStyles.selectPlaceholder]}
                      >
                        {account || "Seleccionar cuenta"}
                      </Text>
                      <Octicons name="chevron-down" size={14} color={MODAL_COLORS.muted} />
                    </Pressable>
                  ) : (
                    <View style={modalStyles.inputShell}>
                      <Pressable
                        style={modalStyles.inputPrefix}
                        onPress={toggleAccountInputMode}
                      >
                        <Octicons name="credit-card" size={14} color={MODAL_COLORS.muted} />
                      </Pressable>
                      <TextInput
                        value={account}
                        onChangeText={setAccount}
                        placeholder="Ej: 9095"
                        keyboardType="number-pad"
                        placeholderTextColor={MODAL_COLORS.muted}
                        style={modalStyles.input}
                        maxLength={8}
                      />
                    </View>
                  )}
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>
                    {kind === "income" ? "Origen" : "Comercio"}
                  </Text>
                  {!isCustomConcept && cleanConceptOptions.length > 0 ? (
                    <Pressable
                      style={modalStyles.selectShell}
                      onPress={() => openPicker("concept")}
                    >
                      <Pressable
                        style={modalStyles.inputPrefix}
                        onPress={(event) => {
                          event.stopPropagation();
                          toggleConceptInputMode();
                        }}
                      >
                        <Octicons
                          name={kind === "income" ? "person" : "briefcase"}
                          size={14}
                          color={MODAL_COLORS.muted}
                        />
                      </Pressable>
                      <Text
                        style={[modalStyles.selectText, !concept && modalStyles.selectPlaceholder]}
                      >
                        {concept || (kind === "income" ? "Seleccionar origen" : "Seleccionar comercio")}
                      </Text>
                      <Octicons name="chevron-down" size={14} color={MODAL_COLORS.muted} />
                    </Pressable>
                  ) : (
                    <View style={modalStyles.inputShell}>
                      <Pressable
                        style={modalStyles.inputPrefix}
                        onPress={toggleConceptInputMode}
                      >
                        <Octicons
                          name={kind === "income" ? "person" : "briefcase"}
                          size={14}
                          color={MODAL_COLORS.muted}
                        />
                      </Pressable>
                      <TextInput
                        value={concept}
                        onChangeText={setConcept}
                        placeholder={kind === "income" ? "Ej: Freelance" : "Ej: Mercado"}
                        placeholderTextColor={MODAL_COLORS.muted}
                        style={modalStyles.input}
                      />
                    </View>
                  )}
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

        <Modal
          visible={pickerTarget !== null}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          onRequestClose={() => setPickerTarget(null)}
        >
          <Pressable
            style={modalStyles.pickerOverlay}
            onPress={() => setPickerTarget(null)}
          >
            <Pressable style={modalStyles.pickerCard} onPress={() => {}}>
              <Text style={modalStyles.pickerTitle}>{pickerTitle}</Text>

              {pickerOptions.length > 0 ? (
                <ScrollView
                  style={modalStyles.pickerList}
                  keyboardShouldPersistTaps="handled"
                >
                  {pickerOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={modalStyles.pickerOption}
                      onPress={() => selectValueFromPicker(option)}
                    >
                      <Text
                        style={[
                          modalStyles.pickerOptionText,
                          selectedValue === option && modalStyles.pickerOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                      {selectedValue === option && !isCustomActive ? (
                        <Octicons name="check" size={16} color={accentColor} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
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
    backgroundColor: MODAL_COLORS.overlay,
  },
  sheetHost: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: MODAL_COLORS.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    gap: 12,
    paddingBottom: 26,
    maxHeight: "85%",
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: MODAL_COLORS.muted,
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
    color: MODAL_COLORS.muted,
    fontSize: 13,
    marginTop: -4,
  },
  field: {
    gap: 7,
  },
  label: {
    color: MODAL_COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MODAL_COLORS.inputBg,
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  selectShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: MODAL_COLORS.inputBg,
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    borderRadius: 12,
    paddingRight: 12,
  },
  selectText: {
    color: Colors.white,
    fontSize: 15,
    flex: 1,
  },
  selectPlaceholder: {
    color: MODAL_COLORS.muted,
  },
  inputPrefix: {
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: MODAL_COLORS.border,
    paddingVertical: 12,
  },
  prefixText: {
    color: MODAL_COLORS.text,
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
  linkText: {
    marginTop: 4,
    color: MODAL_COLORS.link,
    fontSize: 12,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: MODAL_COLORS.inputBg,
  },
  secondaryText: {
    color: MODAL_COLORS.text,
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
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: MODAL_COLORS.overlay,
  },
  pickerCard: {
    backgroundColor: MODAL_COLORS.sheet,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
    maxHeight: "55%",
  },
  pickerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickerList: {
    maxHeight: 280,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MODAL_COLORS.border,
  },
  pickerOptionText: {
    color: MODAL_COLORS.text,
    fontSize: 14,
    flex: 1,
    paddingRight: 12,
  },
  pickerOptionTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
});
