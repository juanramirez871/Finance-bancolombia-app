import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { api } from "@/utils/api";
import { useRouter } from "expo-router";
import { AuthContext } from "./_layout";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

const PHASES = {
  starting: "Preparando importacion...",
  importing: "Importando movimientos...",
  finalizing: "Finalizando y cargando movimientos...",
} as const;

type Phase = keyof typeof PHASES;

export default function ImportingScreen() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [progress, setProgress] = useState(4);
  const [phase, setPhase] = useState<Phase>("starting");
  const [result, setResult] = useState<{ saved: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const startedAt = useRef(Date.now());
  const hasServerProgressRef = useRef(false);
  const animatedProgress = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/login");
      return;
    }

    let mounted = true;

    const timer = setInterval(() => {
      if (!mounted) {
        return;
      }

      setProgress((current) => {
        if (hasServerProgressRef.current) {
          return current;
        }

        if (current >= 92) {
          return current;
        }

        const elapsed = (Date.now() - startedAt.current) / 1000;
        const boost = elapsed > 8 ? 2 : 1;

        return Math.min(current + boost, 92);
      });
    }, 350);

    const runImport = async () => {
      try {
        const currentYear = new Date().getFullYear();
        setPhase("importing");

        const response = await api.importEmailsStream(currentYear, (serverProgress) => {
          if (!mounted) {
            return;
          }

          hasServerProgressRef.current = true;
          setProcessed(serverProgress.processed);
          setTotal(serverProgress.total);
          setProgress((current) => Math.max(current, Math.min(serverProgress.percent, 99)));
        });
        if (!mounted) {
          return;
        }

        setResult(response);
        setPhase("finalizing");
        setProgress(100);

        setTimeout(() => {
          if (mounted) {
            router.replace("/");
          }
        }, 450);
      }
      catch {
        if (!mounted) {
          return;
        }

        setError("No pudimos importar ahora. Entraremos y cargaremos movimientos.");
        setProgress(100);

        setTimeout(() => {
          if (mounted) {
            router.replace("/");
          }
        }, 1200);
      }
    };

    runImport();

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [auth?.isAuthenticated, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Sincronizando movimientos</Text>
        <Text style={styles.subtitle}>{PHASES[phase]}</Text>

        <View style={styles.track}>
          <Animated.View
            style={[
              styles.bar,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <Text style={styles.percent}>{progress}%</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Image
          style={styles.hero}
          source={require("@/assets/images/app.svg")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  hero: {
    width: 220,
    height: 220,
    marginBottom: 6,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: BCO.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: BCO.muted,
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
  },
  track: {
    width: "100%",
    maxWidth: 360,
    height: 12,
    backgroundColor: "#232325",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BCO.divider,
  },
  bar: {
    height: "100%",
    backgroundColor: Colors.yellow,
  },
  percent: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.white,
    fontWeight: "700",
  },
  meta: {
    marginTop: 16,
    fontSize: 13,
    color: BCO.muted,
    textAlign: "center",
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    color: "#F59E0B",
    textAlign: "center",
  },
});
