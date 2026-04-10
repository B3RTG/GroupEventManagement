import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { colors, fonts, radius, shadow } from "../theme";
import {
  useLoginWithGoogleMutation,
  useLoginWithAppleMutation,
} from "../store/api/authApi";

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_WIDTH * (5 / 4); // aspect 4:5


export default function LoginScreen() {
  const [loginWithGoogle, { isLoading: googleLoading, error: googleError }] =
    useLoginWithGoogleMutation();
  const [loginWithApple, { isLoading: appleLoading, error: appleError }] =
    useLoginWithAppleMutation();

  // ── Google OAuth ────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      if (data?.idToken) {
        loginWithGoogle({ idToken: data.idToken });
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code !== statusCodes.SIGN_IN_CANCELLED) {
        setGoogleNativeError(`[${err?.code}] ${err?.message}`);
      }
    }
  };

  // ── Apple Sign In ───────────────────────────────────────
  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        loginWithApple({ idToken: credential.identityToken });
      }
    } catch (e: unknown) {
      // User cancelled or error — ignore
      const err = e as { code?: string };
      if (err?.code !== "ERR_REQUEST_CANCELED") {
        console.warn("Apple Sign In error", e);
      }
    }
  };

  const [googleNativeError, setGoogleNativeError] = React.useState<string | null>(null);
  const isLoading = googleLoading || appleLoading;
  const error = googleError || appleError;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.brand}>GROUP MANAGEMENT</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero ────────────────────────────────────────── */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={["#1a3a52", colors.primaryContainer, colors.primary]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.hero}
          >
            {/* Bottom gradient for text readability */}
            <LinearGradient
              colors={["transparent", "rgba(0,16,30,0.85)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Bienvenido a {"\n"}GM</Text>
              <Text style={styles.heroSubtitle}>
                The precision curator for high-performance{"\n"}sports and group
                coordination.
              </Text>
            </View>
          </LinearGradient>

          {/* Floating stat card */}
          <View style={styles.floatingCard}>
            <Text style={styles.floatingLabel}>Active Now</Text>
            <View style={styles.floatingRow}>
              <View style={styles.dot} />
              <Text style={styles.floatingNumber}>1,284</Text>
            </View>
          </View>
        </View>

        {/* ── Auth buttons ─────────────────────────────────── */}
        <View style={styles.authSection}>
          {(error || googleNativeError) && (
            <Text style={styles.errorText}>
              {googleNativeError ?? "Error al iniciar sesión. Inténtalo de nuevo."}
            </Text>
          )}

          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <GoogleLogo />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
            {googleLoading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.btnSpinner}
              />
            )}
          </TouchableOpacity>

          {/* Apple — iOS only */}
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={radius.md}
              style={styles.appleBtn}
              onPress={handleAppleLogin}
            />
          )}
        </View>

        {/* ── Footer ──────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our{"\n"}
            <Text style={styles.footerLink}>Terms of Service</Text> and{" "}
            <Text style={styles.footerLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Google logo SVG → simple colored squares approach ────
function GoogleLogo() {
  return (
    <View style={googleLogoStyles.container}>
      {/* Top-left: blue */}
      <View
        style={[
          googleLogoStyles.quad,
          { backgroundColor: "#4285F4", top: 0, left: 0 },
        ]}
      />
      {/* Top-right: red */}
      <View
        style={[
          googleLogoStyles.quad,
          { backgroundColor: "#EA4335", top: 0, right: 0 },
        ]}
      />
      {/* Bottom-left: yellow */}
      <View
        style={[
          googleLogoStyles.quad,
          { backgroundColor: "#FBBC05", bottom: 0, left: 0 },
        ]}
      />
      {/* Bottom-right: green */}
      <View
        style={[
          googleLogoStyles.quad,
          { backgroundColor: "#34A853", bottom: 0, right: 0 },
        ]}
      />
    </View>
  );
}

const googleLogoStyles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    position: "relative",
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 2,
    overflow: "hidden",
  },
  quad: {
    position: "absolute",
    width: 10,
    height: 10,
  },
});

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brand: {
    fontFamily: fonts.headline.extraBold,
    fontSize: 20,
    color: colors.primary,
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // ── Hero
  heroWrapper: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  hero: {
    height: HERO_HEIGHT,
    borderRadius: radius.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 24,
    paddingBottom: 28,
    zIndex: 1,
  },
  heroTitle: {
    fontFamily: fonts.headline.extraBold,
    fontSize: 36,
    lineHeight: 40,
    color: "#ffffff",
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.70)",
    lineHeight: 20,
  },

  // Floating card
  floatingCard: {
    position: "absolute",
    bottom: -24,
    right: -8,
    backgroundColor: "rgba(246,250,254,0.85)",
    borderRadius: radius.md,
    padding: 16,
    maxWidth: 140,
    ...shadow.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  floatingLabel: {
    fontFamily: fonts.body.semiBold,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  floatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  floatingNumber: {
    fontFamily: fonts.headline.bold,
    fontSize: 18,
    color: colors.primary,
  },

  // ── Auth
  authSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 12,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: 13,
    color: colors.error,
    textAlign: "center",
    marginBottom: 4,
  },
  googleBtn: {
    height: 56,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...shadow.soft,
  },
  googleBtnText: {
    fontFamily: fonts.body.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  btnSpinner: {
    marginLeft: 4,
  },
  appleBtn: {
    height: 56,
    width: "100%",
  },

  // ── Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.body.regular,
    fontSize: 11,
    color: "rgba(67,71,76,0.5)",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    textDecorationLine: "underline",
    color: "rgba(67,71,76,0.6)",
  },
});
